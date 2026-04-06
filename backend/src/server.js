import express from "express"
import dotenv from "dotenv";
import auth from "./routes/auth.js"
import connectDB from "./config/db.js";
import cookieParser from "cookie-parser";
import courseRoutes from "./routes/courseRoutes.js";
import enrollRoute from "./routes/enrollRoute.js";
import channelRoutes from "./routes/channelRoutes.js";
import {Server} from "socket.io";
import http from "http";
import jwt from "jsonwebtoken";
import User from "./models/userModel.js";
import cors from "cors";
import cookie from "cookie"
dotenv.config();

const app = express();

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"],
        credentials: true,
    }
});
app.set("io", io);

app.use(cors({
    origin: "http://localhost:5173",
    credentials:true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders:["Content-Type", "Authorization"]
}));

app.use(express.json());
app.use(cookieParser());
app.use("/api/auth", auth);
app.use("/api/courses", courseRoutes);
app.use("/api/courses/:courseId/channels", channelRoutes);
app.use("/api/courses/:courseId/enroll", enrollRoute);



io.use(async (socket, next) => {
    try {
        const cookies = cookie.parse(socket.handshake.headers.cookie || "");
        const token = socket.handshake.auth.token || cookies.jwt;

        if (!token) {
            return next(new Error("Authentication error: No token provided"));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select("-password");

        if (!user) {
            return next(new Error("Authentication error: User not found"));
        }
        socket.user = user;
        next(); 
    } catch (error) {
        return next(new Error("Authentication error: Invalid or expired token"));
    }
});


io.on("connection", (socket) => {
    console.log("A user connected: ", socket.id );
    socket.on("joinChannel", (channelId)=> {
        socket.join(channelId);
        console.log(`User joined channel: ${channelId}`);
    });

    socket.on("typing", (channelId)=> {
        socket.to(channelId).emit("userTyping", {userName: socket.user.name});
    });

    socket.on("stoppedTyping", (channelId)=> {
        socket.to(channelId).emit("userStoppedTyping", {userName: socket.user.name});
    })

    socket.on("leaveChannel", (channelId)=> {
        socket.leave(channelId);
        console.log(`User left channel: ${channelId}`);
    })

    socket.on("disconnect", ()=> {
        console.log("User disconnected: ", socket.id);
    });
});

const PORT = process.env.PORT || 3000;

connectDB().then(() => {
    server.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
});
