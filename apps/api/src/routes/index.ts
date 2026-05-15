import { Router } from "express";
import chatRouter from "./chat.route";
import integrationRouter from "./integration.route";

const router: Router = Router();

router.use("/chat", chatRouter);
router.use("/integrations", integrationRouter);

export default router;
