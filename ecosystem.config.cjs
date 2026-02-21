module.exports = {
  apps: [
    {
      name: "social-scheduler",
      script: ".next/standalone/server.js",
      cwd: "/Users/renefichtmueller/Desktop/Claude Code/social-scheduler",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
        HOSTNAME: "0.0.0.0",
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      error_file: "/Users/renefichtmueller/Desktop/Claude Code/social-scheduler/logs/pm2-error.log",
      out_file: "/Users/renefichtmueller/Desktop/Claude Code/social-scheduler/logs/pm2-out.log",
      merge_logs: true,
    },
  ],
};
