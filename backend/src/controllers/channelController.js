import Channel from "../models/channelModel.js";
import Course from "../models/courseModel.js";
import Message from "../models/messageModel.js";
import Enrollment from "../models/enrollmentModel.js"
import Submission from "../models/submissionModel.js";

export const createChannel = async(req,res)=> {
    try{
        const {courseId} = req.params;
        const {name, description,requiresJoinApproval, isLocked, type} = req.body;
    
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
            type: type || "chat",
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

export const addModule = async (req, res) => {
  try {
    const { id } = req.params; 
    const { title } = req.body;

    const channel = await Channel.findById(id);

    if (!channel || channel.type !== "assessment") {
      return res.status(400).json({ message: "Not an assessment channel" });
    }

    channel.assessment.modules.push({
      title,
      questions: []
    });

    await channel.save();

    res.status(200).json({ message: "Module added", channel });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


export const addQuestion = async (req, res) => {
  try {
    const { id, moduleIndex } = req.params;
    const { question, options, correctAnswer } = req.body;

    const channel = await Channel.findById(id);

    if (!channel || channel.type !== "assessment") {
      return res.status(400).json({ message: "Not an assessment channel" });
    }

    const module = channel.assessment.modules[moduleIndex];

    if (!module) {
      return res.status(404).json({ message: "Module not found" });
    }

    module.questions.push({
      question,
      options,
      correctAnswer
    });

    await channel.save();

    res.status(200).json({ message: "Question added", channel });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};




export const submitAssessment = async (req, res) => {
  try {
    const { id } = req.params;
    const { answers } = req.body;
    const userId = req.user._id;

    const channel = await Channel.findById(id);
    if (!channel || channel.type !== "assessment") {
      return res.status(400).json({ message: "Invalid assessment channel" });
    }

    let correctCount = 0;
    let totalQuestions = 0;

    const gradedAnswers = channel.assessment.modules.flatMap((mod) =>
      mod.questions.map((q) => {
        totalQuestions++;
        const userAnswer = answers.find(a => a.questionId === q._id.toString());
        const isCorrect = userAnswer && Number(userAnswer.selectedOption) === q.correctAnswer;
        
        if (isCorrect) correctCount++;

        return {
          questionId: q._id,
          selectedOption: userAnswer ? userAnswer.selectedOption : null,
          pointsAwarded: isCorrect ? 1 : 0
        };
      })
    );

    
    const finalScore = totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0;
    const passed = finalScore >= channel.assessment.passingScore;

    const submission = await Submission.create({
      user: userId,
      channel: id,
      answers: gradedAnswers,
      score: Math.round(finalScore), 
      passed
    });

    return res.status(200).json({ 
      message: "Assessment submitted", 
      score: Math.round(finalScore), 
      passed, 
      submissionId: submission._id 
    });

  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getPastSubmissions = async (req, res) => {
  try {
    const { id } = req.params; 
    const userId = req.user._id;

    const submissions = await Submission.find({ channel: id, user: userId })
      .sort({ submittedAt: -1 }) 
      .select("score passed submittedAt answers"); 

    return res.status(200).json({
      status: "Success",
      count: submissions.length,
      data: submissions
    });

  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};