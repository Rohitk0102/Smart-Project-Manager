const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = mongoose.Schema({
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
        required: function () { return !this.googleId; } // Password required only if not Google OAuth
    },
    googleId: {
        type: String,
        unique: true,
        sparse: true
    },
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

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
    // Only attempt to match password if it exists (i.e., not a Google OAuth user)
    if (!this.password) {
        return false;
    }
    return await bcrypt.compare(enteredPassword, this.password);
};

// Encrypt password using bcrypt
userSchema.pre('save', async function () {
    if (!this.isModified('password')) {
        return;
    }

    // For Google OAuth users who don't have a password
    if (!this.password) {
        return;
    }

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

const User = mongoose.model('User', userSchema);

module.exports = User;
