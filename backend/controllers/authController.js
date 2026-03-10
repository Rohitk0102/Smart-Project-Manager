const User = require('../models/User');
const { ensureWorkspaceUser } = require('../middleware/authMiddleware');

const serializeUser = (user) => ({
    _id: user._id,
    clerkId: user.clerkId,
    name: user.name,
    email: user.email,
    role: user.role,
    avatar: user.avatar,
    googleConnected: Boolean(user.googleRefreshToken || user.googleAccessToken),
});

const syncCurrentUser = async (req, res) => {
    const user = await ensureWorkspaceUser(req.auth.userId);
    return res.json(serializeUser(user));
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
const getUserProfile = async (req, res) => {
    return res.json(serializeUser(req.user));
};

// @desc    Get all users (Company Directory)
// @route   GET /api/auth/users
// @access  Private
const getAllUsers = async (req, res) => {
    try {
        const users = await User.find({}).select('-password').sort({ name: 1 });
        return res.json(users.map(serializeUser));
    } catch (error) {
        console.error('Failed to fetch users', error);
        return res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = { syncCurrentUser, getUserProfile, getAllUsers };
