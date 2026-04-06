import Enrollment from "../models/enrollmentModel.js";
import Course from "../models/courseModel.js";
import Channel from "../models/channelModel.js";

export const enrollCourse = async (req, res) => {
    try {
        const { courseId } = req.params;
        const userId = req.user._id;

        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({ message: "Course not found" });
        }
        const alreadyEnrolled = await Enrollment.findOne({ user: userId, course: courseId });
        if (alreadyEnrolled) {
            return res.status(400).json({ message: "You are already enrolled in the course" });
        }
        const enrollment = new Enrollment({
            user: userId,
            course: courseId,
            role: "student"
        });

        await enrollment.save();
        
        await Channel.updateMany({
            courseId, slug: {$in : ["general", "announcements", "resources"]}
        },
        {$addToSet: {members: userId}}
    )
        

        await Course.findByIdAndUpdate(courseId, { $inc: { enrollmentCount: 1 } });

        res.status(201).json({ message: "Enrolled successfully", enrollment });

    }
    catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
}

export const getCourseEnrollments = async (req, res) => {
    try {
        const {courseId} = req.params;

        const enrollments = await Enrollment.find({ course: courseId }).populate("user", "name email");

        res.status(200).json({ count: enrollments.length, enrollments });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
}

export const unenrollCourse = async (req, res) => {
  try {
    const {courseId} = req.params;
    const userId = req.user._id;

    const enrollment = await Enrollment.findOneAndDelete({ user: userId, course: courseId });
    if (!enrollment) return res.status(404).json({ message: "You are not enrolled in this course" });

    await Promise.all([
    Channel.updateMany({ courseId }, { $pull: { members: userId } }),
    Course.findByIdAndUpdate(courseId, { $inc: { enrollmentCount: -1 } })
    ]);
    
    res.status(200).json({ message: "Unenrolled successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getMyEnrolledCourses = async (req, res) => {
  try {
    const userId = req.user._id;
    const enrollments = await Enrollment.find({ user: userId })
      .populate("course", "title description category instructor");
    
    const courses = enrollments.map(e => e.course);
    res.status(200).json({ data: courses });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};