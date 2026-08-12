import { Router } from "express";
import chatRouter from "./chat.route";
import integrationRouter from "./integration.route";
import organizationRouter from "./organization.route";
import analyticsRouter from "./analytics.route";

const router: Router = Router();

router.use("/chat", chatRouter);
router.use("/integrations", integrationRouter);
router.use("/organization", organizationRouter);
router.use("/analytics", analyticsRouter);

export default router;
