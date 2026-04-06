import Course from "../models/courseModel.js";
import Channel from "../models/channelModel.js";
import Message from "../models/messageModel.js";
import Enrollment from "../models/enrollmentModel.js";

export const createCourse = async (req, res) => {
    const { title, description, category } = req.body;
    try {
        if (!title || !description || !category) {
            return res.status(400).json({ message: "Missing Field Details" });
        }

        const instructor = req.user._id;
        const course = new Course({
            title,
            description,
            category,
            instructor
        })

        const newCourse = await course.save();
        await Enrollment.create({
            user: instructor,
            course: newCourse._id,
            role: "instructor"
        });

        const defaults = [
            {
                name: "Announcements", slug: "announcements", type:"announcement", courseId: newCourse._id, isLocked: true, members: [instructor]
            },
            {
                name: "Resources", slug: "resources", type:"resources", courseId: newCourse._id, isLocked:true, members:[instructor]
            },
                
            {
                name: "General", slug: "general", type: "chat", courseId: newCourse._id,isLocked:false, members:[instructor]
            },
            ]

        await Channel.insertMany(defaults);

        res.status(201).json({ message: "Course Created Successfully", course: newCourse });
    }
    catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    }
}

export const getAllCourses = async (req, res) => {
    try {
        const courses = await Course.find().populate("instructor", "name email role");
        res.status(200).json({ results: courses.length, data: courses });
    }
    catch (error) {
        res.status(500).json({ status: "Fail", message: error.message });
    }
}

export const getCourseById = async (req, res) => {
    try {
        const course = await Course.findById(req.params.id).populate("instructor", "name email role");
        if (!course) {
            return res.status(404).json({ message: "Course not found" });
        }
        res.status(200).json(course);

    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
}

export const updateCourse = async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);
        if (!course) {
            return res.status(404).json({ message: "Course cannot be found" });
        }

        if (req.user.role !== "admin" && course.instructor.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Not authorized" });
        }

        const { title, description, category } = req.body;
        if (title) {
            course.title = title;
        }
        if (description) {
            course.description = description;

        }
        if (category) {
            course.category = category;
        }
        await course.save();


        res.status(200).json({ status: "success", data: course });
    }
    catch (error) {
        res.status(500).json({ status: "Failed", error: error.message })
    }
}

export const deleteCourse = async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);
        if (!course) {
            return res.status(404).json({ message: "Course cannot be found" });
        }

        if (req.user.role !== "admin" && course.instructor.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Not authorized " });
        }

        const channels = await Channel.find({courseId: req.params.id});
        const channelIds = channels.map(ch => ch._id);

        await Promise.all([
            Message.deleteMany({channel: {$in: channelIds}}),
            Channel.deleteMany({courseId: req.params.id}),
            Enrollment.deleteMany({course: req.params.id}),
            
        ])
        await Course.findByIdAndDelete(req.params.id);
        res.json({message: "Course deleted"});

    }
    catch(error) {
        res.status(500).json({message: error.message});
    }
}

export const getMyEnrolledCourses = async (req, res) => {
  try {
    const userId = req.user._id;
    const enrollments = await Enrollment.find({ user: userId }).populate("course", "title description category instructor");
    const courses = enrollments.map(e => e.course);
    res.status(200).json({ data: courses });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};