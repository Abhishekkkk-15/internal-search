import { Router } from "express";
import { OrganizationController } from "../controllers/organization/organization.controller";
import { authmiddleware } from "../middleware/auth";

const org = new OrganizationController();
const router: Router = Router();

router.use(authmiddleware);

router.get("/settings", (req, res) => org.getSettings(req, res));
router.patch("/settings", (req, res) => org.updateSettings(req, res));

export default router;
