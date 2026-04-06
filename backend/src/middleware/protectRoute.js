import jwt from "jsonwebtoken";
import User from "../models/userModel.js";

export const protect = async(req,res,next)=> {    
    const token = req.cookies.jwt;
    
    if(!token){
        return res.status(401).json({message: "You are not logged In!"});
    }

    try{
        const decoded = jwt.verify(token,process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select("-password"); 
        if(!user) {
            return res.status(401).json({message:"User not found"});
        }
        req.user =user;
        next();
    }
    catch(error){
        return res.status(401).json({message: "Invalid token"});
    }

};

export const authorize = (...roles) => 
    {
        return (req,res,next) => {
            if(!roles.includes(req.user.role)){
                return res.status(403).json({message: `User role ${req.user.role} is not authorized`});
            }
            next();
        };
    };