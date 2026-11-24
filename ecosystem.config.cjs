// PM2 process file — `pm2 start ecosystem.config.cjs --env production`
module.exports = {
  apps: [
    {
      name: "axios-station",
      cwd: __dirname,
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3000 -H 127.0.0.1",
      instances: process.env.PM2_INSTANCES || 2,
      exec_mode: "cluster",
      max_memory_restart: "768M",
      kill_timeout: 10000,
      listen_timeout: 15000,
      env_production: { NODE_ENV: "production" },
      out_file: "/var/log/axios-station/out.log",
      error_file: "/var/log/axios-station/error.log",
      merge_logs: true,
      time: true,
    },
  ],
};
