import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname),
      // `server-only` throws outside the React server runtime; stub it for unit tests.
      "server-only": path.resolve(import.meta.dirname, "tests/stubs/server-only.ts"),
    },
  },
  test: {
    environment: "node",
    include: ["tests/unit/**/*.test.ts", "tests/integration/**/*.test.ts"],
    env: { NODE_ENV: "test", DATABASE_URL: process.env.DATABASE_URL ?? "mysql://root@127.0.0.1:3306/axios_station_test" },
  },
});
