import express from "express";
import { login, signup,logout, becomeInstructor, updateProfile } from "../controllers/authController.js";
import { loginValidation, signupValidation,validate } from "../validators/authValidator.js";
import { protect } from "../middleware/protectRoute.js";

const router = express.Router();

router.post("/signup", signupValidation, validate, signup);

router.post("/login", loginValidation, validate, login);

router.post("/logout",logout);

router.get("/profile", protect, (req,res)=> {
    res.json({user: req.user})
})


router.post("/become-instructor", protect, becomeInstructor)
router.post("/updateProfile", protect, updateProfile)

export default router