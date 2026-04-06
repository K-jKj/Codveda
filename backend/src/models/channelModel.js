import mongoose from "mongoose";

const channelSchema = new mongoose.Schema({
    name: {
        type:String,
        required:true,
        trim:true,
    },
    slug: {
        type:String,
        required:true,
        lowercase:true,
        trim:true,
    },
    description: {
        type:String,
        default: "",
    },
    
    courseId: {
        type:mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required:true,
    },
    isLocked: {
        type: Boolean,
        default: false
    },
    type: {
        type: String,
        enum : ["chat", "announcement", "resources"],
        default: "chat",
    },

    requiresJoinApproval: {
        type: Boolean,
        default: false,
    },
    joinRequests: [
        {
            user: {type: mongoose.Schema.Types.ObjectId, ref: "User"},
            requestedAt: {type:Date, default: Date.now},
        }
    ],

    members: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }]
}, {timestamps: true});

channelSchema.index({courseId:1, slug:1}, {unique:true});
channelSchema.index({ courseId: 1 });
channelSchema.index({ members: 1 });

channelSchema.pre("validate", function() {
    if (this.name && !this.slug) {
        this.slug = this.name
            .toLowerCase()
            .trim()
            .replace(/\s+/g, "-");
    }
   
});


const Channel = mongoose.model("Channel", channelSchema);
export default Channel;

