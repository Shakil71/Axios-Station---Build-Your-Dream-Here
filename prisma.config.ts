import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // `prisma generate` (run on every install, e.g. on Vercel) does not connect to the database,
    // so it must not fail when DATABASE_URL is missing. Migrations and the seed still need the real value.
    url: process.env.DATABASE_URL ?? "mysql://placeholder@localhost:3306/placeholder",
  },
});
