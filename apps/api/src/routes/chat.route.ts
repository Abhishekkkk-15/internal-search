import { Router } from "express";
import { ChatController } from "../controllers/chat/chat.controller";

const chat = new ChatController();
const router: Router = Router();
router.post("/chat", (req, res) => chat.handleChat(req, res));

export default router;
