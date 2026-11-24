# Axios Station — Linux Production Deployment (no Docker)

Target: Ubuntu 24.04 LTS (or Debian 12) VPS / dedicated server, 2 vCPU / 4 GB RAM minimum.

```
Internet ─▶ Nginx (TLS, rate limits, static uploads)
              │
              ▼
        Next.js app (PM2 cluster, 127.0.0.1:3000)
              ├── MySQL 8      (127.0.0.1:3306)
              ├── Redis 7      (127.0.0.1:6379, optional but recommended)
              ├── Media        (public/uploads  or  S3-compatible bucket)
              ├── SMTP provider
              └── AI APIs      (server-side only, optional)
```

## 1. Base system

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git build-essential ufw nginx certbot python3-certbot-nginx
sudo adduser --disabled-password --gecos "" axios        # app user (no sudo)
sudo mkdir -p /var/www/axios-station /var/log/axios-station
sudo chown -R axios:axios /var/www/axios-station /var/log/axios-station
```

## 2. Node.js (LTS) and PM2

```bash
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm i -g pm2
node -v   # must be ≥ 20.9 (Next.js 16 requirement)
```

## 3. MySQL 8

```bash
sudo apt install -y mysql-server
sudo mysql_secure_installation
sudo mysql
```
```sql
CREATE DATABASE axios_station CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'axios'@'127.0.0.1' IDENTIFIED BY '<strong-random-password>';
GRANT ALL PRIVILEGES ON axios_station.* TO 'axios'@'127.0.0.1';
FLUSH PRIVILEGES;
```
Keep MySQL bound to localhost (`bind-address = 127.0.0.1` in `/etc/mysql/mysql.conf.d/mysqld.cnf`).
Recommended: `innodb_buffer_pool_size` ≈ 50–60% of RAM on a dedicated DB host.

## 4. Redis 7

```bash
sudo apt install -y redis-server
```
In `/etc/redis/redis.conf`:
```
bind 127.0.0.1 ::1
protected-mode yes
requirepass <strong-random-password>
maxmemory 256mb
maxmemory-policy allkeys-lru
appendonly yes            # AOF persistence (rate-limit counters survive restarts)
appendfsync everysec
```
`sudo systemctl restart redis-server`. Redis holds only cache and rate-limit data — losing it is safe;
the site falls back to MySQL automatically.

## 5. Application

```bash
sudo -iu axios
cd /var/www/axios-station
git clone <your-repo-url> .
cp .env.example .env && chmod 600 .env
nano .env        # fill in values — see table below
npm ci
npx prisma migrate deploy
npm run db:seed  # first install only: creates Super Admin, roles, default content
npm run build
```

| Variable | Production value |
|---|---|
| `NODE_ENV` | `production` |
| `NEXT_PUBLIC_SITE_URL` | `https://example.com` |
| `DATABASE_URL` | `mysql://axios:<pw>@127.0.0.1:3306/axios_station` |
| `REDIS_URL` | `redis://:<pw>@127.0.0.1:6379` |
| `AUTH_SECRET` | `openssl rand -base64 32` |
| `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` | used once by the seed; **remove the password from .env afterwards** |
| `STORAGE_DRIVER` | `local` or `s3` (+ `S3_*`) |
| `SMTP_*`, `MAIL_FROM`, `LEAD_NOTIFICATION_EMAIL` | your email provider |

## 6. PM2

```bash
pm2 start ecosystem.config.cjs --env production
pm2 save
pm2 startup systemd -u axios --hp /home/axios   # run the printed sudo command
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 50M && pm2 set pm2-logrotate:retain 14
```

## 7. Nginx + SSL

```bash
sudo cp deploy/nginx/axs-proxy.conf /etc/nginx/snippets/
sudo cp deploy/nginx/axios-station.conf /etc/nginx/sites-available/
sudo sed -i 's/example.com/yourdomain.com/g' /etc/nginx/sites-available/axios-station.conf
sudo ln -s /etc/nginx/sites-available/axios-station.conf /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
# Obtain certificates first (temporarily comment the 443 blocks or use --nginx):
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
sudo nginx -t && sudo systemctl reload nginx
```
Certbot installs a renewal timer automatically (`systemctl list-timers | grep certbot`).

## 8. Firewall

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```
Never expose 3000 (Next.js), 3306 (MySQL) or 6379 (Redis) publicly. Consider `fail2ban` for SSH and
key-only SSH login (`PasswordAuthentication no`).

## 9. Cron jobs (user `axios`)

```cron
*/5 * * * *  cd /var/www/axios-station && npx tsx scripts/publish-scheduled.ts >> /var/log/axios-station/cron.log 2>&1
30 2 * * *   /var/www/axios-station/scripts/backup-db.sh    >> /var/log/axios-station/backup.log 2>&1
45 2 * * *   /var/www/axios-station/scripts/backup-media.sh >> /var/log/axios-station/backup.log 2>&1
```
For `backup-db.sh`, create `~/.my.cnf` (mode 600):
```ini
[mysqldump]
user=axios
password=<pw>
host=127.0.0.1
```

## 10. Backup strategy

* **Database:** nightly compressed dumps kept 14 days locally **and** copied off-server (S3/Backblaze/rsync).
  For stricter RPO enable MySQL binary logs and keep 7 days for point-in-time recovery.
* **Media:** nightly tarball of `public/uploads` (or S3 bucket versioning + lifecycle rules).
* **Config:** keep an encrypted copy of `.env` in your password manager.
* **Test restores monthly** on a staging server:
  `gunzip -c axios_station-YYYYMMDD.sql.gz | mysql axios_station_restore_test`

## 11. Logs

* App: `pm2 logs axios-station` (rotated by pm2-logrotate) and `/var/log/axios-station/*.log`
* Nginx: `/var/log/nginx/axios-station.*.log` (logrotate is preconfigured on Ubuntu)
* Audit trail: Admin → Activity Logs (DB table `ActivityLog`)
* Health check: `curl -fsS https://yourdomain.com/api/health` (wire into UptimeRobot / Better Stack)

## 12. Deploy & rollback

```bash
# deploy
cd /var/www/axios-station
git fetch --tags && git checkout <release-tag>
npm ci
/var/www/axios-station/scripts/backup-db.sh       # always back up before migrating
npx prisma migrate deploy
npm run build
pm2 reload axios-station                           # zero-downtime cluster reload

# rollback (code)
git checkout <previous-tag> && npm ci && npm run build && pm2 reload axios-station
# rollback (data) — only if a migration was destructive:
gunzip -c /var/backups/axios-station/db/<pre-deploy-dump>.sql.gz | mysql axios_station
```
Prisma migrations are forward-only; write additive migrations (add columns, backfill, then drop in a
later release) so code rollbacks don't require data rollbacks.
