import express from "express";
import { authorize, protect } from "../middleware/protectRoute.js";
import { createCourse, getCourseById, getAllCourses, updateCourse, deleteCourse,getMyEnrolledCourses } from "../controllers/courseController.js";

const router = express.Router();

router.post("/", protect, authorize("admin","instructor"), createCourse);
router.get("/", protect,getAllCourses);
router.get("/my-courses", protect, getMyEnrolledCourses)
router.get("/:id", protect, getCourseById);
router.put("/:id", protect,updateCourse);
router.delete("/:id", protect, deleteCourse)



export default router;