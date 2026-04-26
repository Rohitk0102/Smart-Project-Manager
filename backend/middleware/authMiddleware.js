const { clerkClient, getAuth } = require('@clerk/express');
const mongoose = require('mongoose');
const User = require('../models/User');
const Invitation = require('../models/Invitation');

const getPrimaryEmail = (clerkUser) => {
    const primaryEmail = clerkUser.emailAddresses?.find(
        (emailAddress) => emailAddress.id === clerkUser.primaryEmailAddressId
    );

    return primaryEmail?.emailAddress || clerkUser.emailAddresses?.[0]?.emailAddress || '';
};

const ensureWorkspaceUser = async (clerkUserId) => {
    try {
        let user = await User.findOne({ clerkId: clerkUserId });

        if (user) {
            return user;
        }

        const clerkUser = await clerkClient.users.getUser(clerkUserId);
        const email = getPrimaryEmail(clerkUser);

        if (!email) {
            console.error(`Sync Error: User ${clerkUserId} has no primary email address in Clerk.`);
            throw new Error('Clerk user is missing a primary email address. Ensure Email is enabled in Clerk.');
        }

        user = await User.findOne({ email });

        const fullName = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ')
            || clerkUser.username
            || email;

        if (!user) {
            const invitation = await Invitation.findOne({ email });
            
            user = new User({
                clerkId: clerkUserId,
                name: fullName,
                email,
                avatar: clerkUser.imageUrl || '',
                role: invitation ? invitation.role : 'Pending',
                createdBy: invitation ? invitation.invitedBy : undefined,
                technicalRole: 'Unspecified',
                points: 0
            });

            if (invitation) {
                await Invitation.deleteOne({ _id: invitation._id });
            }
            console.log(`Successfully created new workspace user: ${email} (${user.role})`);
        } else {
            // Link existing user by email to their new Clerk ID
            user.clerkId = clerkUserId;
            user.name = fullName || user.name;
            user.email = email;
            user.avatar = clerkUser.imageUrl || user.avatar;
            console.log(`Linked existing user ${email} to Clerk ID ${clerkUserId}`);
        }

        await user.save();
        return user;
    } catch (error) {
        console.error('ensureWorkspaceUser failed:', error.message);
        throw error;
    }
};

const protect = async (req, res, next) => {
    try {
        if (!process.env.CLERK_SECRET_KEY) {
            console.error('ERROR: CLERK_SECRET_KEY is missing in backend .env');
            return res.status(500).json({ message: 'Backend Clerk setup is incomplete. Add CLERK_SECRET_KEY to the server environment.' });
        }

        const auth = getAuth(req);

        if (!auth.userId) {
            return res.status(401).json({ message: 'Not authorized, Clerk session missing' });
        }

        req.auth = auth;

        const user = await ensureWorkspaceUser(auth.userId);
        
        // Block Pending users from accessing the app (except for sync/claim/profile routes)
        if (user.role === 'Pending' && !['/claim-cto', '/sync', '/profile'].includes(req.path)) {
            return res.status(403).json({ message: 'Account is pending role assignment. Please contact your administrator.' });
        }
        
        req.user = user;
        return next();
    } catch (error) {
        console.error('Clerk auth middleware failed:', error.message);
        return res.status(401).json({ message: error.message || 'Not authorized, token failed' });
    }
};

const requireRole = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !req.user.role) {
            return res.status(401).json({ message: 'Not authorized' });
        }
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ message: `Forbidden: Requires one of ${roles.join(', ')} role` });
        }
        next();
    };
};

const requireOwnership = (ModelName) => {
    return async (req, res, next) => {
        try {
            if (req.user.role === 'CTO') return next();

            const Model = mongoose.model(ModelName);
            const doc = await Model.findById(req.params.id);
            
            if (!doc) {
                return res.status(404).json({ message: 'Resource not found' });
            }

            if (ModelName === 'Project') {
                if (doc.ownerId && doc.ownerId.toString() !== req.user._id.toString()) {
                    return res.status(403).json({ message: 'Forbidden: You do not own this project' });
                }
            }
            
            req.doc = doc; // Pass it along to save DB calls if needed
            return next();
        } catch (error) {
            console.error(`Ownership check failed for ${ModelName}:`, error);
            return res.status(500).json({ message: 'Server error during ownership check' });
        }
    };
};

module.exports = { protect, requireRole, requireOwnership, ensureWorkspaceUser };