const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getUserProfile } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/signup', registerUser);
router.post('/login', loginUser);
router.get('/profile', protect, getUserProfile);

const passport = require('passport');
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};
// Needed for callback to use generateToken functionality if not exported from controller
// Actually controller has logic. Let's redirect logic into controller or inline here.
// Inline for simplicity with passport callback.
const jwt = require('jsonwebtoken');

router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'], session: false }));

router.get('/google/callback',
    passport.authenticate('google', { failureRedirect: 'http://localhost:5173/login', session: false }),
    (req, res) => {
        // Successful authentication, redirect home.
        const token = generateToken(req.user._id);
        res.redirect(`http://localhost:5173/login?token=${token}`);
    }
);

module.exports = router;
