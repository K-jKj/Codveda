import { body, validationResult } from "express-validator"

export const signupValidation = [
    body("firstName").notEmpty().withMessage("First Name is required"),
    body("lastName").notEmpty().withMessage("Last Name is required"),
    body("email").notEmpty().withMessage("Email is required").isEmail().withMessage("Please Provide a valid email").normalizeEmail(),
    body("password").notEmpty().withMessage("Password is required").isStrongPassword({ minLength: 8, minLowercase: 1, minUppercase: 1, minNumbers: 1, minSymbols: 1 }).withMessage("Password must contain at least 8 characters and be strong")


];

export const loginValidation = [
    body("email").notEmpty().withMessage("Email is required").isEmail().withMessage("Please Provide a valid email"),
    body("password").notEmpty().withMessage("Password is required")
];

export const validate = (req,res,next) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        return res.status(400).json({errors:errors.array()});
    }
    next();
};
