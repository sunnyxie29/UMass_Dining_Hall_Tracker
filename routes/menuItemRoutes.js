import { Router } from "express";
import * as controller from "../controllers/menuItemController.js";
import { requireLogin } from "../middleware/requireLogin.js";

const router = Router();

router.get("/", controller.list);
router.post("/", requireLogin, controller.create);
router.put("/:id", requireLogin, controller.update);
router.delete("/:id", requireLogin, controller.remove);

export default router;
