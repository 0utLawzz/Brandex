import { Router, type IRouter } from "express";
import healthRouter from "./health";
import trademarksRouter from "./trademarks";

const router: IRouter = Router();

router.use(healthRouter);
router.use(trademarksRouter);

export default router;
