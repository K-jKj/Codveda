import mongoose from "mongoose";

const enrollmentSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: true,
    },

    role: {
        type:String,
        enum : ["student", "instructor"],
        default: "student"
    },
    enrolledAt: {
        type: Date,
        default: Date.now
    }
}, {timestamps:true})

enrollmentSchema.index({user: 1, course:1}, {unique:true});

const Enrollment = mongoose.model("Enrollment", enrollmentSchema);
export default Enrollment;
