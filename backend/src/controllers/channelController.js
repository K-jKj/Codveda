import Channel from "../models/channelModel.js";
import Course from "../models/courseModel.js";
import Message from "../models/messageModel.js";
import Enrollment from "../models/enrollmentModel.js"

export const createChannel = async(req,res)=> {
    try{
        const {courseId} = req.params;
        const {name, description,requiresJoinApproval, isLocked} = req.body;
    
        if(!name) {
            return res.status(400).json({message: "Channel Name is required"});
        }

        const course = await Course.findById(courseId);
        if (!course) return res.status(404).json({message: "Course not found"});

        if (req.user.role !== "admin" && course.instructor.toString() !== req.user._id.toString()) {
            return res.status(403).json({message: "Not authorized"});
        }
        const slug = name.toLowerCase().trim().replace(/\s+/g, '-');
        const existing = await Channel.findOne({ courseId, slug });
        if (existing) {
            return res.status(400).json({ message: "Channel with this name already exists in this course" });
        }   
        const newChannel = new Channel({
            name, 
            description,
            requiresJoinApproval: requiresJoinApproval || false,
            type: "chat",
            courseId,
            isLocked: isLocked || false,
            members: [req.user._id]
        })

        await newChannel.save();

        return res.status(201).json({message:"Channel created successfully", channel: newChannel});

    }
    catch(error) {
        return res.status(500).json({message: "Server Error", error: error.message});
    }
}

export const getChannels = async(req,res)=> {
    try{
        const {courseId} = req.params;
        const course = await Course.findById(courseId);
        if(!course){
            return res.status(404).json({message: 'Course not Found'});
        }
        const channels = await Channel.find({courseId}).sort({type:1, name:1});
        return res.status(200).json({status: "Success", dataLength: channels.length, data: {channels}});
    }
    catch(error){
        return res.status(500).json({message: "Server error", error: error.message});
    }
}

export const getChannelsById = async(req,res)=> {
    try{
        const {courseId} = req.params;
        const course = await Course.findById(courseId);
        if(!course){
            return res.status(404).json({message: 'Course not found'});
        }

        const channel = await Channel.findOne({_id: req.params.id, courseId}).populate("courseId", "title description");
        if (!channel){
            return res.status(404).json({message: "Channel not found"});
        }
        return res.status(200).json({status: "Success", data: {channel}});


    }
    catch(error){
        return res.status(500).json({message: "Server error", error: error.message});
    }
}

export const updateChannel= async(req,res)=> {
    try{
        const {courseId}= req.params;
        const {name,description,requiresJoinApproval, isLocked} = req.body;

        const course = await Course.findById(courseId);
        if(!course){
            return res.status(404).json({message: "Course not found"})
        }
        const channel = await Channel.findOne({_id: req.params.id, courseId});
        if(!channel){
            return res.status(404).json({message: "Channel not found"});
        }

        if (req.user.role !== "admin" && course.instructor.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Not authorized to update this channel" });
        }

        if(name){
            const newSlug = name.toLowerCase().trim().replace(/\s+/g, "-");
            const existing = await Channel.findOne({
                courseId,
                slug: newSlug,
                _id: {$ne: channel._id}
            })

            if (existing){
                return res.status(400).json({message: "Another channel has this name"});
            }
            channel.name = name;
            channel.slug = newSlug;
        }
        if(description){
            channel.description = description;
        }
        if(requiresJoinApproval!== undefined){
            channel.requiresJoinApproval = requiresJoinApproval;
        }
        if(isLocked !== undefined){
            channel.isLocked = isLocked;
        }

        await channel.save()
        return res.status(200).json({status: "Success"});
    }
    catch(error){
        return res.status(500).json({message: "Server error", error: error.message});
    }
}

export const deleteChannel = async(req,res)=> {
    try{
        const {courseId} = req.params;
        const course = await Course.findById(courseId);
        if(!course){
            return res.status(404).json({message: "Course not found"});
        }
        const channel = await Channel.findOne({_id: req.params.id, courseId});
        if(!channel){
            return res.status(404).json({message: "Channel cannot be found"});
        }
        if(req.user.role !== "admin" && course.instructor.toString() !== req.user._id.toString()){
            return res.status(403).json({message: "Not authorized"});
        }

        await Message.deleteMany({channel: channel._id});
        await Channel.findByIdAndDelete(channel._id);

        return res.status(200).json({message: "Channel deleted successfully"})
    }
    catch(error){
        return res.status(500).json({message: "Server error", error: error.message});

    }
}

export const joinChannel = async(req,res)=> {
    try{
        const userId= req.user._id;
        const channel = await Channel.findById(req.params.id);
        if(!channel) {
            return res.status(404).json({message: "Channel cannot be found"});
        }

        const enrollment = await Enrollment.findOne({
            user: userId,
            course: channel.courseId
        });

        if (!enrollment) {
            return res.status(403).json({ message: "You must enroll in the course first" });
        }

        const isMember = channel.members.some(member => member.toString() === userId.toString());
        if(isMember){
            return res.status(400).json({message: "You are already in the channel"});
        }

        const alreadyRequested = channel.joinRequests.find(req => req.user.toString() === userId.toString());
        if (alreadyRequested) return res.status(400).json({ message: "Join request already pending" });

        if(channel.requiresJoinApproval){
            channel.joinRequests.push({user: userId});
            await channel.save();
            return res.status(200).json({message: "Join request sent successfully. Waiting for approval "});
        }
        
        else{
            channel.members.push(userId);
            await channel.save();
            return res.status(200).json({message: "You have successfully joined the channel"});
        }
    }
    catch(error){
        return res.status(500).json({message: "Server error", error: error.message});
    }

}

export const approveJoinRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const { userId } = req.body;

        const channel = await Channel.findById(id);
        if (!channel) return res.status(404).json({ message: "Channel not found" });

        const course = await Course.findById(channel.courseId);

        if (req.user.role !== "admin" && course.instructor.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Not authorized" });
        }

        const enrollment = await Enrollment.findOne({ user: userId, course: course._id });
        if (!enrollment) {
            return res.status(400).json({ message: "User is not enrolled in the course" });
        }

        const requestIndex = channel.joinRequests.findIndex(req => req.user.toString() === userId.toString());
        if (requestIndex === -1) {
            return res.status(404).json({ message: "Join request not found" });
        }

        channel.joinRequests.splice(requestIndex, 1);
        if(!channel.members.some(member => member.toString() === userId.toString())){
            channel.members.push(userId);
        }

        await channel.save();
        return res.status(200).json({ message: "User approved successfully", channel });
    } catch (error) {
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};