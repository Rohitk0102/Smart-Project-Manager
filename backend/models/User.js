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
    isAdmin: {
        type: Boolean,
        required: true,
        default: false
    },
    role: {
        type: String,
        enum: ['Admin', 'Manager', 'Member'],
        default: 'Member'
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
