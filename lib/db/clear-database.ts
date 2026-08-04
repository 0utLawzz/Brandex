import { drizzle } from "drizzle-orm/node-postgres";
import { Client } from "pg";
import { trademarksTable, changeLogTable } from "./src/schema";

const connectionString = "postgresql://neondb_owner:npg_U8s1CpqmklcS@ep-snowy-sound-axm3t610-pooler.c-4.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

async function clearDatabase() {
  const client = new Client({ connectionString });
  await client.connect();
  
  const db = drizzle(client);
  
  console.log("Deleting existing entries from change_log...");
  await db.delete(changeLogTable);
  
  console.log("Deleting existing entries from trademarks...");
  await db.delete(trademarksTable);
  
  console.log("Database cleared successfully!");
  
  await client.end();
}

clearDatabase().catch(console.error);
