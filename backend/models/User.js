const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
    clerkId: {
        type: String,
        unique: true,
        sparse: true
    },
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    googleId: {
        type: String,
        unique: true,
        sparse: true
    },
    googleAccessToken: { type: String },
    googleRefreshToken: { type: String },
    role: {
        type: String,
        enum: ['CTO', 'PM', 'TeamLead', 'Employee', 'Pending'],
        default: 'Pending'
    },
    technicalRole: {
        type: String,
        enum: ['AI', 'Frontend', 'Backend', 'DevOps', 'ML Engineer', 'Unspecified'],
        default: 'Unspecified'
    },
    points: {
        type: Number,
        default: 0
    },
    bio: {
        type: String,
        default: ''
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    avatar: {
        type: String,
        default: ''
    }
}, {
    timestamps: true
});

const User = mongoose.model('User', userSchema);

module.exports = User;
