import Channel from "../models/channelModel.js";
import Enrollment from "../models/enrollmentModel.js";

export const canPost = async (req, res, next) => {
    try {
        const channel = await Channel.findById(req.params.id);
        if (!channel) return res.status(404).json({ message: "Channel not found" });

        const enrollment = await Enrollment.findOne({
            user: req.user._id,
            course: channel.courseId
        });

        if (!enrollment) {
            return res.status(403).json({ 
                message: "You must be enrolled in this course to post messages." 
            });
        }

        const isCourseInstructor = enrollment.role === "instructor";
        const isGlobalAdmin = req.user.role === "admin";
        const isAuthorizedStaff = isCourseInstructor || isGlobalAdmin;

        const isMember = channel.members.some(m => m.toString() === req.user._id.toString());

        if ((channel.isLocked || channel.requiresJoinApproval) && !isMember && !isAuthorizedStaff) {
            return res.status(403).json({ 
                message: "You are not an authorized member of this channel." 
            });
        }

        const restrictedTypes = ["announcement", "resources"];
        
        if (restrictedTypes.includes(channel.type) && !isAuthorizedStaff) {
            return res.status(403).json({ 
                message: `Only the course instructor can post in ${channel.type} channels.` 
            });
        }

        req.channel = channel;
        next();
    } catch (error) {
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};
