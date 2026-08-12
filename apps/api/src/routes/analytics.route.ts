import { Router } from "express";
import { AnalyticsController } from "../controllers/analytics/analytics.controller";
import { authmiddleware } from "../middleware/auth";

const analyticsRouter: Router = Router();
const controller = new AnalyticsController();

analyticsRouter.get("/dashboard", authmiddleware, controller.getDashboardStats.bind(controller));

export default analyticsRouter;
