import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db } from "@workspace/db";
import { agentsTable } from "@workspace/db";
import { logger } from "../lib/logger";

const router: IRouter = Router();

// GET /agents
router.get("/agents", async (_req, res): Promise<void> => {
  try {
    const agents = await db.select().from(agentsTable).orderBy(agentsTable.name);
    res.json(agents);
  } catch (err) {
    logger.error(`Failed to list agents: ${err}`);
    res.status(500).json({ error: "Failed to list agents" });
  }
});

// POST /agents
router.post("/agents", async (req, res): Promise<void> => {
  const { key, name, city } = req.body;
  if (!key || !name || !city) {
    res.status(400).json({ error: "key, name and city are required" });
    return;
  }
  try {
    const [agent] = await db
      .insert(agentsTable)
      .values({ key: String(key).toUpperCase().trim(), name: String(name).trim(), city: String(city).trim() })
      .returning();
    res.status(201).json(agent);
  } catch (err: any) {
    if (err?.code === "23505") {
      res.status(409).json({ error: "Agent key already exists" });
    } else {
      logger.error("Failed to create agent", err);
      res.status(500).json({ error: "Failed to create agent" });
    }
  }
});

// PUT /agents/:id
router.put("/agents/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  const { key, name, city } = req.body;
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  try {
    const updates: Record<string, string> = {};
    if (key)  updates.key  = String(key).toUpperCase().trim();
    if (name) updates.name = String(name).trim();
    if (city) updates.city = String(city).trim();

    const [agent] = await db
      .update(agentsTable)
      .set(updates)
      .where(eq(agentsTable.id, id))
      .returning();
    if (!agent) { res.status(404).json({ error: "Agent not found" }); return; }
    res.json(agent);
  } catch (err) {
    logger.error(`Failed to update agent: ${err}`);
    res.status(500).json({ error: "Failed to update agent" });
  }
});

// DELETE /agents/:id
router.delete("/agents/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  try {
    await db.delete(agentsTable).where(eq(agentsTable.id, id));
    res.status(204).end();
  } catch (err) {
    logger.error(`Failed to delete agent: ${err}`);
    res.status(500).json({ error: "Failed to delete agent" });
  }
});

export { router as agentsRouter };
