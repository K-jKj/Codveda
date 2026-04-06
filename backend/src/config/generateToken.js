import jwt from "jsonwebtoken"

const sendToken = (user, res) => {
    const token = jwt.sign({id:user._id, role: user.role}, process.env.JWT_SECRET, {
        expiresIn: "5d",
    });

    const tokenOptions = {
        maxAge: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "None": "Lax"
    }

    return res.cookie('jwt',token,tokenOptions).json({success: true, user: {_id: user._id, name: user.name, email:user.email, role: user.role}});
}

export default sendToken;
