import mongoose from "mongoose";

const courseSchema = new mongoose.Schema({
    title: {
        type:String,
        required:true,
        trim:true,
        unique:true
    },
    description: {
        type:String,
        required:true
    },
    category: {
        type:String,
        required:true,
        index:true,
    },
    instructor : {
        type:mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index:true
    },
    enrollmentCount: {
        type:Number,
        default: 0
    }
}, {timestamps: true});

courseSchema.index({category: 1, title:1, });

const Course = mongoose.model('Course', courseSchema);
export default Course;
