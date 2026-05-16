import { Router } from "express";
import chatRouter from "./chat.route";
import integrationRouter from "./integration.route";
import organizationRouter from "./organization.route";

const router: Router = Router();

router.use("/chat", chatRouter);
router.use("/integrations", integrationRouter);
router.use("/organization", organizationRouter);

export default router;
