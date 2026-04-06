import express from "express";
import { protect } from "../middleware/protectRoute.js";
import { canPost } from "../middleware/postAuthRoute.js";
import { postMessage, getMessages, editMessage, deleteMessage } from "../controllers/messageController.js";

const router = express.Router({ mergeParams: true });

router.get("/", protect, getMessages);
router.post("/", protect, canPost, postMessage);
router.put("/:messageId", protect, editMessage);
router.delete("/:messageId", protect, deleteMessage);

export default router;