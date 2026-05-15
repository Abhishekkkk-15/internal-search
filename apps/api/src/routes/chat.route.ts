import { Router } from "express";
import { ChatController } from "../controllers/chat/chat.controller";
import { getInvdiaClient } from "../config/invdia-client";
const openai = getInvdiaClient();

const chat = new ChatController(openai);
const router: Router = Router();
router.post("/chat", (req, res) => chat.handleChat(req, res));

export default router;
