import mongoose from "mongoose"

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true,
        minlength:8,
        select: false
    },

    role:{
        type:String,
        enum: ["student", "instructor", "admin"],
        default: "student"
    },

    lastLogin: {
        type: Date,
        default: Date.now
    },


}, {timestamps: true}
);

const User = mongoose.model('User', userSchema);
export default User;