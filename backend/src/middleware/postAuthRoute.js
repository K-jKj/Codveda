import Channel from "../models/channelModel.js";


export const canPost = async (req, res, next) => {
    try {
        const channel = await Channel.findById(req.params.id);
        if (!channel) return res.status(404).json({ message: "Channel not found" });

        const isInstructorOrAdmin = req.user.role === "admin" || req.user.role === "instructor";

        const isMember = channel.members.includes(req.user._id.toString());

        if ((channel.isLocked || channel.requiresJoinApproval) && !isMember && !isInstructorOrAdmin) {
            return res.status(403).json({ 
                message: "You are not an authorized member of this channel." 
            });
        }

        if(channel.type === "announcement" && !isInstructorOrAdmin){
            return res.status(403).json({message: "Only instructors can post in announcements"});
        }

        req.channel = channel;
        next();
    } catch (error) {
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};