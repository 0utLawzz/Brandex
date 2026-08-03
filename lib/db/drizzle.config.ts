import { defineConfig } from "drizzle-kit";
import path from "path";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL, ensure the database is provisioned");
}

// Neon requires a direct (unpooled) connection for drizzle-kit migrations.
// Set DIRECT_URL to the Neon "Direct connection" string; falls back to DATABASE_URL.
const migrationUrl = process.env.DIRECT_URL ?? process.env.DATABASE_URL;

export default defineConfig({
  schema: path.join(__dirname, "./src/schema/index.ts"),
  dialect: "postgresql",
  dbCredentials: {
    url: migrationUrl,
  },
});
