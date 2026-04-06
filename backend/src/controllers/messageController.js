import Channel from "../models/channelModel.js";
import Message from "../models/messageModel.js";
import Enrollment from "../models/enrollmentModel.js"


export const postMessage = async (req, res) => {
    try {
        const { content, attachments, replyTo } = req.body;
        const channel = req.channel;


        const message = new Message({
            channel: channel._id,
            course: channel.courseId,
            sender: req.user._id,
            content: content || "",
            attachments: attachments || [],
            replyTo: replyTo || null,
        });
        await message.save();

        const populatedMessage = await message.populate("sender", "name email role");

        const io = req.app.get("io");
        io.to(channel._id.toString()).emit("newMessage", populatedMessage);

        return res.status(201).json({
            message: "Message sent successfully",
            data: populatedMessage
        });

    } catch (error) {
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const getMessages = async (req, res) => {
    try {
        const channelId = req.params.id;
        const messages = await Message.find({ channel: channelId, isDeleted: { $ne: true} })
            .sort({ createdAt: 1 })
            .populate("sender", "name email role")
            .populate("replyTo", "content sender createdAt");

        return res.status(200).json({
            count: messages.length,
            data: messages
        });

    } catch (error) {
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};


export const editMessage = async (req, res) => {
    try {
        const { messageId } = req.params;
        const { content } = req.body;

        const message = await Message.findById(messageId);
        if (!message) {
            return res.status(404).json({ message: "Message not found" });
        }

        if (message.sender.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Not authorized" });
        }

        message.content = content;
        message.isEdited = true;

        await message.save();

        return res.status(200).json({
            message: "Message updated successfully",
            data: message
        });

    } catch (error) {
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};




export const deleteMessage = async (req, res) => {
    try {
        const { messageId } = req.params;
        const userId = req.user._id;

        const message = await Message.findById(messageId);
        if (!message) {
            return res.status(404).json({ message: "Message not found" });
        }

        const channel = await Channel.findById(message.channel);
        if (!channel) {
            return res.status(404).json({ message: "Channel not found" });
        }

        const enrollment = await Enrollment.findOne({
            user: userId,
            course: channel.courseId
        });

        if (!enrollment) {
            return res.status(403).json({ message: "Not enrolled in this course" });
        }

        const isOwner = message.sender.toString() === userId.toString();
        const isAdmin = req.user.role === "admin";
        const isInstructor = enrollment.role === "instructor";

        if (!isOwner && !isAdmin && !isInstructor) {
            return res.status(403).json({
                message: "Not authorized to delete this message"
            });
        }

        message.isDeleted = true;
        await message.save();

        return res.status(200).json({
            message: "Message deleted successfully",
            data: message
        });

    } catch (error) {
        return res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
};