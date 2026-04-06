import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
    channel: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Channel',
        required: true
    },
    course : {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: true
    },

    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    
    content: {
        type:String,
        trim:true,
        maxlength: 3500,
        default: ""
    }, 
    attachments: [{
        url:String,
        name: String,
        type: String,
        size: Number
    }],
    isPinned:{
        type:Boolean,
        default:false
    },
    replyTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message',
        default: null,
    },
    isEdited: {
        type: Boolean,
        default: false,
    },
    isDeleted: {
        type: Boolean,
        default: false,
    },

}, {timestamps: true})

messageSchema.index({channel:1, createdAt: -1});

const Message = mongoose.model("Message", messageSchema);
export default Message;
