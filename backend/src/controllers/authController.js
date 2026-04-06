import User from "../models/userModel.js";
import bcrypt from "bcrypt"
import sendToken from "../config/generateToken.js";

export const signup = async(req, res) => {
    const {firstName, lastName, email, password} = req.body;
    try{
        if(!firstName || !lastName || !email || !password) {
            return res.status(400).json({message: "Missing details"})
        }
        const existingUser = await User.findOne({email});
        if(existingUser) {
            return res.status(400).json({message: "User already exists"})
        }


        const fullName = firstName + " " + lastName;
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = new User({
            name: fullName,
            email,
            password: hashedPassword
        })

        await user.save()
        return sendToken(user,res);

    }
    catch(error) {
        return res.status(500).json({message: "Server Error", Error: error.message});
    }

}

export const login = async(req,res)=> {
    const {email, password} = req.body;
    try{
        if(!email || !password) {
            return res.status(400).json({message:"Invalid Credentials"});
        }
        const user = await User.findOne({email}).select("+password");
        if(!user) {
            return res.status(400).json({message:"Invalid Credentials"});
        }

        const isPassword = await bcrypt.compare(password, user.password);
        if(!isPassword) {
            return res.status(400).json({message: "Invalid Credentials"});
        }


        return sendToken(user,res);

    }
    catch(error){
        res.status(500).json({message: "Server Error", Error: error.message});
    }
}

export const logout = async(req,res)=> {
    try{
        res.clearCookie("jwt", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "None": "Lax",
            path: "/"
        });
        return res.status(200).json({message: "Logged Out Successfully "})
    }
    catch(error) {
        return res.status(500).json({message: "Server Error", Error: error.message});
    }

};

export const becomeInstructor = async(req,res) => {
    try{
        const user = await User.findById(req.user._id);
        if(user.role !== "student") {
            return res.status(400).json({message: "You are already an instructor or admin"});
        }
        
        user.role = "instructor";

        await user.save();
        sendToken(user,res);
    }
    catch(error){
        return res.status(500).json({error:error.message});
    }
}

export const updateProfile = async (req, res) => {
    try {
        const { name, email, oldPassword, newPassword, confirmPassword } = req.body;
        const user = await User.findById(req.user._id).select("+password");

        if (name) user.name = name;
        if (email) user.email = email;

        if (oldPassword || newPassword) {
            if (!oldPassword || !newPassword || !confirmPassword) {
                return res.status(400).json({ message: "Please fill all password fields" });
            }

            const isMatch = await bcrypt.compare(oldPassword, user.password);
            if (!isMatch) {
                return res.status(400).json({ message: "Password does not match" });
            }

            if (newPassword !== confirmPassword) {
                return res.status(400).json({ message: "New passwords do not match" });
            }

            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(newPassword, salt);
        }

        await user.save();
        return sendToken(user, res);
    } catch (error) {
        if (error.code === 11000) return res.status(400).json({ message: "Email already in use" });
        return res.status(500).json({ message: "Server Error", error: error.message });
    }
};
