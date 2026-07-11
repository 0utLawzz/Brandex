/**
 * Vercel serverless entry point.
 * Vercel's @vercel/node runtime accepts an Express app directly as the handler.
 */
import app from "../artifacts/api-server/src/app";

export default app;
