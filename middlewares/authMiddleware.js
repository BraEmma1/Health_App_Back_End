import jwt from 'jsonwebtoken';
import { User } from '../models/userModel.js'; // Import your User model
import passport from 'passport';

const Token_expiration = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
export const generateAuthToken = (res, user) => {
    const payload = {
        id: user._id,
        role: user.role
    };
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: Token_expiration
    });
    res.cookie('authToken', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'development',
        sameSite: 'Lax',
        expires: new Date(Date.now() + Token_expiration)// Set cookie expiration to match token expiration
    });

    return token;
}

export const authenticateUser = async (req, res, next) => {
    const token = req.cookies.authToken;
    if (!token) {
        return res.status(401).json({ message: 'Unauthorized access No Token provided' });
    }
    try {
        // Verify the token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('-password');

        if (!user) {
            return res.status(401).json({ message: 'Unauthorized access: User not found' });
        }
        req.user = user;
        next();

    } catch (error) {
        console.error('Token verification failed:', error);
        return res.status(401).json({ message: 'Unauthorized access: Invalid or expired token' });
    }
};



// Middleware to protect routes using the JWT strategy
export const protect = passport.authenticate('jwt', { session: false });

// Middleware for admin-only authorization
export const admin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        return next();
    }
    return res.status(403).json({ message: 'Not authorized as an admin' });
};
