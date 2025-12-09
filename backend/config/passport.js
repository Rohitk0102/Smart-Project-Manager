const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/api/auth/google/callback"
},
    async (accessToken, refreshToken, profile, done) => {
        try {
            // Check if user exists
            let user = await User.findOne({ googleId: profile.id });

            if (user) {
                return done(null, user);
            }

            // If not, check if email exists (link account)
            user = await User.findOne({ email: profile.emails[0].value });

            if (user) {
                user.googleId = profile.id;
                user.avatar = profile.photos[0].value;
                await user.save();
                return done(null, user);
            }

            // Create new user
            user = await User.create({
                googleId: profile.id,
                name: profile.displayName,
                email: profile.emails[0].value,
                avatar: profile.photos[0].value,
                role: 'Member' // Default role
            });

            return done(null, user);

        } catch (error) {
            return done(error, null);
        }
    }
));

// Serialize/Deserialize not strictly needed for JWT stateless but passport might require them if using session, 
// but we will manually handle token generation in the callback route.
passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser((id, done) => {
    User.findById(id, (err, user) => done(err, user));
});
