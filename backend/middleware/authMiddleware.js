const { clerkClient, getAuth } = require('@clerk/express');
const User = require('../models/User');

const getPrimaryEmail = (clerkUser) => {
    const primaryEmail = clerkUser.emailAddresses?.find(
        (emailAddress) => emailAddress.id === clerkUser.primaryEmailAddressId
    );

    return primaryEmail?.emailAddress || clerkUser.emailAddresses?.[0]?.emailAddress || '';
};

const ensureWorkspaceUser = async (clerkUserId) => {
    let user = await User.findOne({ clerkId: clerkUserId });

    if (user) {
        return user;
    }

    const clerkUser = await clerkClient.users.getUser(clerkUserId);
    const email = getPrimaryEmail(clerkUser);

    if (!email) {
        throw new Error('Clerk user is missing a primary email address');
    }

    user = await User.findOne({ email });

    const fullName = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ')
        || clerkUser.username
        || email;

    if (!user) {
        user = new User({
            clerkId: clerkUserId,
            name: fullName,
            email,
            avatar: clerkUser.imageUrl || '',
        });
    } else {
        user.clerkId = clerkUserId;
        user.name = fullName || user.name;
        user.email = email;
        user.avatar = clerkUser.imageUrl || user.avatar;
    }

    await user.save();
    return user;
};

const protect = async (req, res, next) => {
    try {
        if (!process.env.CLERK_SECRET_KEY) {
            return res.status(500).json({ message: 'Backend Clerk setup is incomplete. Add CLERK_SECRET_KEY to the server environment.' });
        }

        const auth = getAuth(req);

        if (!auth.userId) {
            return res.status(401).json({ message: 'Not authorized, Clerk session missing' });
        }

        req.auth = auth;

        const user = await ensureWorkspaceUser(auth.userId);
        req.user = user;
        return next();
    } catch (error) {
        console.error('Clerk auth middleware failed', error);
        return res.status(401).json({ message: error.message || 'Not authorized, token failed' });
    }
};

const admin = (req, res, next) => {
    if (req.user && req.user.role === 'Admin') {
        return next();
    }

    return res.status(401).json({ message: 'Not authorized as an admin' });
};

module.exports = { protect, admin, ensureWorkspaceUser };
