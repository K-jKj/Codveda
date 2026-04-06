import mongoose from "mongoose";

const channelSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    slug: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
    },
    description: {
        type: String,
        default: "",
    },

    courseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: true,
    },
    isLocked: {
        type: Boolean,
        default: false
    },
    type: {
        type: String,
        enum: ["chat", "announcement", "resources", "assessment"],
        default: "chat",
    },

    assessment: {
        passingScore: {
            type: Number,
            default: 50,
        },

        timeLimit: {
            type: Number,
            default: null,
        },

        modules: [
            {
                title: {
                    type: String,
                    required: true,
                },

                questions: [
                    {
                        question: {
                            type: String,
                            required: true,
                        },

                        options: {
                            type: [String],
                            validate: [arr => arr.length >= 2, "At least 2 options required"]
                        },

                        correctAnswer: {
                            type: Number,
                            required: true,
                            validate: {
                                validator: function (val) {
                                    return val >= 0 && val < this.options.length;
                                },
                                message: "Correct answer index out of range"
                            }
                        },

                        explanation: {
                            type: String,
                            default: "",
                        },

                        points: {
                            type: Number,
                            default: 1,
                        },

                        shuffleOptions: {
                            type: Boolean,
                            default: false,
                        }
                    }
                ]
            }
        ]
    },

    requiresJoinApproval: {
        type: Boolean,
        default: false,
    },
    joinRequests: [
        {
            user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
            requestedAt: { type: Date, default: Date.now },
        }
    ],

    members: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }]
}, { timestamps: true });

channelSchema.index({ courseId: 1, slug: 1 }, { unique: true });
channelSchema.index({ courseId: 1 });
channelSchema.index({ members: 1 });

channelSchema.pre("validate", function () {
    if (this.name && !this.slug) {
        this.slug = this.name
            .toLowerCase()
            .trim()
            .replace(/\s+/g, "-");
    }

});


const Channel = mongoose.model("Channel", channelSchema);
export default Channel;

