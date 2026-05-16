import { Router } from "express";
import { ChatController } from "../controllers/chat/chat.controller";
import { authmiddleware } from "../middleware/auth";

const chat = new ChatController();
const router: Router = Router();

router.use(authmiddleware);

router.get("/conversations", (req, res) => chat.getConversations(req, res));
router.post("/search", (req, res) => chat.handleSearch(req, res));
router.post("/", (req, res) => chat.handleChat(req, res));

export default router;
