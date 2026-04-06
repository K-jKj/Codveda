import express from "express";
import { protect, authorize } from "../middleware/protectRoute.js";
import { enrollCourse, getCourseEnrollments, unenrollCourse} from "../controllers/enrollmentController.js";

const router = express.Router({ mergeParams: true });

router.post("/", protect, enrollCourse);
router.delete("/", protect, unenrollCourse);
router.get("/", protect,authorize("admin","instructor"),getCourseEnrollments);


export default router;