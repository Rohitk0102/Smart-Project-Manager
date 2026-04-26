const User = require('../models/User');
const Invitation = require('../models/Invitation');
const { ensureWorkspaceUser } = require('../middleware/authMiddleware');

const serializeUser = (user) => ({
    _id: user._id,
    clerkId: user.clerkId,
    name: user.name,
    email: user.email,
    role: user.role,
    technicalRole: user.technicalRole || 'Unspecified',
    points: user.points || 0,
    bio: user.bio || '',
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

// @desc    Invite a user
// @route   POST /api/auth/invite
// @access  Private (CTO, PM)
const inviteUser = async (req, res) => {
    try {
        const { email, role } = req.body;
        
        // Validation: CTO can invite PM/TeamLead/Employee. PM can invite TeamLead/Employee.
        const allowedRolesForPM = ['TeamLead', 'Employee'];
        if (req.user.role === 'PM' && !allowedRolesForPM.includes(role)) {
            return res.status(403).json({ message: `PMs can only invite ${allowedRolesForPM.join(' and ')}` });
        }
        
        const existingUser = await User.findOne({ email });
        if (existingUser && existingUser.role !== 'Pending') {
            return res.status(400).json({ message: 'User already exists and is active.' });
        }
        
        let invitation = await Invitation.findOne({ email });
        if (invitation) {
            invitation.role = role;
            invitation.invitedBy = req.user._id;
            await invitation.save();
        } else {
            invitation = await Invitation.create({ email, role, invitedBy: req.user._id });
        }
        
        return res.json({ message: 'Invitation created successfully', invitation });
    } catch (error) {
        console.error('Failed to invite user', error);
        return res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Check if an email is invited
// @route   GET /api/auth/check-invite
// @access  Public
const checkInvite = async (req, res) => {
    try {
        const { email } = req.query;
        if (!email) return res.status(400).json({ message: 'Email required' });
        
        const invitation = await Invitation.findOne({ email });
        return res.json({ invited: !!invitation });
    } catch (error) {
        console.error('Check invite error', error);
        return res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Claim CTO Role
// @route   POST /api/auth/claim-cto
// @access  Private (Pending users)
const claimCto = async (req, res) => {
    try {
        const { secret } = req.body;
        if (secret !== '9866308149') {
            return res.status(403).json({ message: 'Invalid CTO secret.' });
        }
        
        // Ensure no CTO exists
        const ctoExists = await User.findOne({ role: 'CTO' });
        if (ctoExists) {
            return res.status(400).json({ message: 'A CTO already exists in the system.' });
        }
        
        req.user.role = 'CTO';
        await req.user.save();
        
        return res.json(serializeUser(req.user));
    } catch (error) {
        console.error('Claim CTO error', error);
        return res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Search for users
// @route   GET /api/auth/search
// @access  Private
const searchUsers = async (req, res) => {
    try {
        const { query } = req.query;
        if (!query) return res.json([]);
        const users = await User.find({
            $or: [
                { name: { $regex: query, $options: 'i' } },
                { email: { $regex: query, $options: 'i' } }
            ]
        }).limit(10);
        return res.json(users.map(serializeUser));
    } catch (error) {
        console.error('User search error', error);
        return res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Update current user's technical role/specialization
// @route   PUT /api/auth/profile/tech-role
// @access  Private
const updateTechRole = async (req, res) => {
    try {
        const { technicalRole, bio } = req.body;
        const allowedTechRoles = ['AI', 'Frontend', 'Backend', 'DevOps', 'ML Engineer', 'Unspecified'];
        
        if (technicalRole && !allowedTechRoles.includes(technicalRole)) {
            return res.status(400).json({ message: 'Invalid technical role' });
        }
        
        const user = await User.findById(req.user._id);
        if (technicalRole) user.technicalRole = technicalRole;
        if (bio !== undefined) user.bio = bio;
        
        await user.save();
        return res.json(serializeUser(user));
    } catch (error) {
        console.error('Update tech role error', error);
        return res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = { syncCurrentUser, getUserProfile, getAllUsers, inviteUser, checkInvite, claimCto, searchUsers, updateTechRole };