import { prisma } from "@/lib/db/prisma";
import { getRedis } from "@/lib/redis/client";
import { requirePagePermission } from "@/lib/auth/guard";
import { AdminPageHeader, Panel } from "@/components/admin/ui";
import { MaintenanceButtons } from "@/components/admin/module-forms";
import { Badge } from "@/components/ui/primitives";
import { isEmailConfigured } from "@/lib/email";
import { env } from "@/lib/env";

export const metadata = { title: "Backup & Maintenance" };

export default async function MaintenancePage() {
  await requirePagePermission("maintenance.manage");
  let dbOk = false;
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbOk = true;
  } catch {
    dbOk = false;
  }
  const redis = getRedis();
  let redisInfo = "unavailable";
  if (redis) {
    try {
      redisInfo = `connected · ${await redis.dbsize()} keys`;
    } catch {
      redisInfo = "error";
    }
  }
  const scheduledDue = await prisma.blogPost.count({ where: { status: "SCHEDULED", scheduledFor: { lte: new Date() }, deletedAt: null } });

  const rows: [string, React.ReactNode][] = [
    ["MySQL", <Badge key="db" tone={dbOk ? "success" : "danger"}>{dbOk ? "connected" : "down"}</Badge>],
    ["Redis", <Badge key="r" tone={redis ? "success" : "warning"}>{redisInfo}</Badge>],
    ["Email (SMTP)", <Badge key="e" tone={isEmailConfigured() ? "success" : "warning"}>{isEmailConfigured() ? "configured" : "not configured"}</Badge>],
    ["Media storage", <Badge key="s" tone="muted">{env.STORAGE_DRIVER}</Badge>],
    ["Scheduled posts past due", <Badge key="p" tone={scheduledDue ? "warning" : "muted"}>{scheduledDue}</Badge>],
  ];

  return (
    <>
      <AdminPageHeader title="Backup & Maintenance" description="System health and housekeeping tools." />
      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="System health">
          <dl className="space-y-3">{rows.map(([k, v]) => <div key={k} className="flex items-center justify-between text-sm"><dt className="text-muted">{k}</dt><dd>{v}</dd></div>)}</dl>
        </Panel>
        <Panel title="Maintenance actions">
          <MaintenanceButtons />
        </Panel>
        <div className="xl:col-span-2">
          <Panel title="Backups" description="Database and media backups run on the server (cron), not from the browser — so backups keep working even if the app is down.">
            <ul className="list-disc space-y-1.5 pl-5 text-sm text-muted">
              <li><code className="text-fg">scripts/backup-db.sh</code> — compressed <code>mysqldump</code> with rotation (default 14 daily copies).</li>
              <li><code className="text-fg">scripts/backup-media.sh</code> — archives <code>public/uploads</code> (skip when using S3 with versioning).</li>
              <li>Schedule both with cron and copy archives off-server (e.g. S3, rsync). See <code className="text-fg">docs/DEPLOYMENT.md</code> → Backups.</li>
              <li>Restore: <code className="text-fg">gunzip -c backup.sql.gz | mysql axios_station</code>, then click “Clear cache” above.</li>
            </ul>
          </Panel>
        </div>
      </div>
    </>
  );
}
