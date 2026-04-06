import express from "express";
import { protect, authorize } from "../middleware/protectRoute.js";
import {createChannel,getChannels,getChannelsById,updateChannel,deleteChannel,joinChannel,approveJoinRequest} from "../controllers/channelController.js";
import messageRoutes from "../routes/messageRoute.js";

const router = express.Router({ mergeParams: true });
router.post("/", protect, authorize("admin", "instructor"), createChannel);
router.get("/", protect, getChannels);
router.get("/:id", protect, getChannelsById);
router.put("/:id", protect, authorize("admin", "instructor"), updateChannel);
router.delete("/:id", protect, authorize("admin", "instructor"), deleteChannel);
router.post("/:id/join", protect, joinChannel);
router.post("/:id/approve", protect, authorize("admin", "instructor"), approveJoinRequest);

router.use("/:id/messages", messageRoutes);

export default router;