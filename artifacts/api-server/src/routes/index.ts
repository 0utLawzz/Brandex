import { Router, type IRouter } from "express";
import healthRouter from "./health";
import trademarksRouter from "./trademarks";
import { agentsRouter } from "./agents";

const router: IRouter = Router();

router.use(healthRouter);
router.use(trademarksRouter);
router.use(agentsRouter);

export default router;

