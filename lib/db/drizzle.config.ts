import { defineConfig } from "drizzle-kit";
import path from "path";

// Use Neon database connection
const migrationUrl = "postgresql://neondb_owner:npg_U8s1CpqmklcS@ep-snowy-sound-axm3t610-pooler.c-4.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

export default defineConfig({
  schema: "./src/schema/index.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: migrationUrl,
  },
});
