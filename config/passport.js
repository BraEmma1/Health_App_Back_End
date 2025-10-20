
import passport from 'passport';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { User } from '../models/userModel.js';
import { createUserProfile } from '../controllers/userProfileController.js';
import "dotenv/config";
import crypto from 'crypto';

// Helper function to generate a unique referral code for a new user
const generateUniqueReferralCode = async () => {
    let code;
    let isUnique = false;
    while (!isUnique) {
        code = crypto.randomBytes(4).toString('hex').toUpperCase();
        const existingUser = await User.findOne({ referralCode: code });
        if (!existingUser) {
            isUnique = true;
        }
    }
    return code;
};

export const configurePassport = () => {
    // --- JWT Strategy ---
    // This strategy is used to secure your API endpoints.
    // It extracts the JWT from a cookie and verifies it.
    const cookieExtractor = (req) => {
        let token = null;
        if (req && req.cookies) {
            token = req.cookies['authToken'];
        }
        return token;
    };

    const jwtOptions = {
        jwtFromRequest: cookieExtractor,
        secretOrKey: process.env.JWT_SECRET
    };

    passport.use(new JwtStrategy(jwtOptions, async (jwt_payload, done) => {
        try {
            const user = await User.findById(jwt_payload.id).select('-password');
            return user ? done(null, user) : done(null, false);
        } catch (error) {
            return done(error, false);
        }
    }));

    // --- Google OAuth Strategy ---
    passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL, // e.g., "/auth/google/callback" relative to your domain
        scope: ['profile', 'email'], // Ensure this matches the scope in your route
        passReqToCallback: true // This is crucial to access the request object in the callback
    },
        async (req, accessToken, refreshToken, profile, done) => {
            try {
                // Decode the state from the request to get the referral code
                let referredBy = null;
                if (req.query.state) {
                    try {
                        const decodedState = JSON.parse(Buffer.from(req.query.state, 'base64').toString('utf-8'));
                        referredBy = decodedState.referredBy;
                    } catch (e) {
                        console.error("Failed to parse state for referral code:", e);
                    }
                }

                const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
                if (!email) {
                    return done(new Error("Email not found in Google profile"), false);
                }

                let user = await User.findOne({ email: email });

                if (user) {
                    // User exists, update if necessary
                    user.googleId = profile.id;
                    if (profile.photos && profile.photos.length > 0) {
                        user.profilePicture = profile.photos[0].value;
                    }
                    user.lastLogin = Date.now();
                    await user.save();
                    return done(null, user);
                } else {
                    // Validate referral code BEFORE creating the user
                    if (referredBy) {
                        const referrer = await User.findOne({ referralCode: referredBy });
                        if (!referrer) {
                            // The referral code is invalid. Stop the process.
                            return done(null, false, { message: 'Invalid referral code.' });
                        }
                    }
                    // User does not exist, create a new one
                    const newUsersOwnReferralCode = await generateUniqueReferralCode();

                    const newUser = new User({
                        googleId: profile.id,
                        email: email,
                        firstName: profile.name.givenName || profile.displayName.split(' ')[0],
                        lastName: profile.name.familyName || profile.displayName.split(' ').slice(1).join(' ') || '',
                        isEmailVerified: true, // Email from Google is considered verified
                        profilePicture: profile.photos && profile.photos.length > 0 ? profile.photos[0].value : undefined,
                        referralCode: newUsersOwnReferralCode, // Assign the new user their own code
                        referredBy: referredBy // Store the code of the person who referred them
                    });
                    await newUser.save();

                    // If the new user was referred, create the referral record
                    if (referredBy) {
                        const referrer = await User.findOne({ referralCode: referredBy });
                        if (referrer) {
                            await Referral.create({
                                referrer: referrer._id,
                                referredUser: newUser._id,
                                referralCode: referredBy,
                                status: 'approved' // Or 'pending' based on your business logic
                            });
                            console.log(`Referral record created for ${newUser.email} by referrer ${referrer.email}`);
                        } else {
                            // This case is now handled by the pre-validation check above.
                            console.warn(`Referrer with code '${referredBy}' not found for new Google user ${newUser.email}. This should not happen.`);
                        }
                    }
                    // Create a user profile for the new user
                    if (newUser) {
                        try {
                            await createUserProfile(newUser._id);
                        } catch (profileError) {
                            console.error(`Failed to create profile for Google user ${newUser._id}:`, profileError.message);
                            // Log and continue
                        }
                    }
                    return done(null, newUser);
                }
            } catch (error) {
                return done(error, false);
            }
        }));
};