import bcrypt from "bcryptjs";
import { User } from "../models/userModel.js";
import {
    sendPasswordResetEmail,
    sendPasswordResetSuccessEmail,
    sendVerificationEmail,
    sendWelcomeEmail,
} from "../utils/emailService.js";
import userValidationSchema from "../validation_schema/userValidation.js";
import { generateAuthToken } from "../middlewares/authMiddleware.js";
import { createUserProfile } from "./userProfileController.js";
import { UserProfile } from "../models/userprofileModel.js";
import passport from "passport";
import crypto from "crypto";


// REGISTER A NEW USER
export const registerUser = async (req, res) => {
    try {
        //validate user input with joi schema
        const { error, value } = userValidationSchema.validate(req.body, {
            abortEarly: false,
        });

        if (error) {
            return res
                .status(400)
                .json({ message: error.details.map((err) => err.message) });
        }
        // Check if user already exists
        const email = value.email.toLowerCase(); // Convert to lowercase for consistent checking
        const userExists = await User.findOne({ email: email }); // Use the lowercased email
        if (userExists) {
            return res
                .status(400)
                .json({
                    success: false,
                    message: "User with this email already exists.",
                });
        }

        // Hash the password
        value.password = await bcrypt.hash(value.password, 10);

        //generate a verification token
        // const verificationToken = crypto.randomBytes(16).toString("hex");
        const verificationToken = Math.floor(100000 + Math.random() * 900000).toString();

        // CREATE A NEW USER
        try {
            const newUser = await User.create({
                ...value,
                email: email, // Ensure the lowercased email from the check is used for creation
                verificationToken,
                verificationTokenExpiry: Date.now() + 3600000, // 1 hour
            });

            // CREATE A USER PROFILE
            if (newUser) {
                try {
                    const userProfile = await createUserProfile(newUser._id); // Pass the new user's ID
                    if (userProfile) {
                        newUser.profile = userProfile._id; // Link profile to user
                        await newUser.save(); // Save the user again to store the profile link
                    }
                } catch (profileError) {
                    console.error(
                        `Failed to create profile for user ${newUser._id}:`,
                        profileError.message
                    );
                    // Decide if this error is critical enough to affect user registration response
                }
            }

            //  Send verification email/SMS with the token
            try {
                sendVerificationEmail(newUser.email, verificationToken);
            } catch (emailError) {
                console.error("Error sending verification email:", emailError.message);
            }
            return res.status(201).json({
                success: true,
                message: "User registered successfully.",
                user: {
                    ...newUser._doc,
                    password: undefined,
                },
            });
        } catch (error) {
            if (error.code === 11000) {
                // Log the actual field that caused the duplicate error
                console.error("Duplicate key error:", error.keyValue);
                let duplicateFieldMessage =
                    "An account with this email already exists.";
                return res
                    .status(400)
                    .json({ success: false, message: duplicateFieldMessage });
            }
            throw error;
        }
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
        console.log(error);
    }
};




// VERIFY USER EMAIL
export const verifyUserEmail = async (req, res) => {
    try {
        const { code } = req.body;

        // Find the user by email and verification token
        const user = await User.findOne({
            verificationToken: code,
            verificationTokenExpiry: { $gt: Date.now() },
        });

        if (!user) {
            return res
                .status(400)
                .json({
                    success: false,
                    message: "Invalid or expired  verification Code",
                });
        }

        // Update the user's verified status and clear the verification token
        user.isEmailVerified = true;
        user.isActive = true;
        user.verificationToken = undefined;
        user.verificationTokenExpiry = undefined;
        await user.save();

        // SEND WELCOME EMAIL
        try {
            await sendWelcomeEmail(user.email, user.firstName, "Ditechted Health App");
            res
                .status(200)
                .json({
                    success: true,
                    message: "Email verified successfully. Welcome email sent.",
                });
        } catch (emailError) {
            console.error("Error sending welcome email:", emailError.message);
        }
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};



// LOGIN USER
export const loginUser = async (req, res) => {
    const { email, password } = req.body;
    try {
        // Find the user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res
                .status(400)
                .json({ success: false, message: "Invalid  email credentials " });
        }

        // Check if the password matches
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res
                .status(400)
                .json({ success: false, message: "Invalid credentials" });
        }
        // Generate authentication token
        const token = generateAuthToken(res, user);

        // update the last login time
        user.lastLogin = Date.now();
        await user.save();

        // Send response
        res.status(200).json({
            success: true,
            message: "Login successful",
            user,
            token,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
        console.log(error);
    }
};



// FORGET PASSWORD
export const forgetPassword = async (req, res) => {
    const { email } = req.body;
    try {
        // Find the user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res
                .status(400)
                .json({ success: false, message: "User not found" });
        }
        // Generate a password reset token

        const resetToken = Math.floor(100000 + Math.random() * 900000).toString();
        user.resetPasswordToken = resetToken;
        user.resetPasswordTokenExpiry = Date.now() + 3600000; // 1 hour
        await user.save();
        // Send password reset email
        try {
            await sendPasswordResetEmail(
                user.email,
                `${process.env.CLIENT_URL}/reset-password/${resetToken}`
            );
            res
                .status(200)
                .json({ success: true, message: "Password reset email sent" });
        } catch (emailError) {
            console.error("Error sending password reset email:", emailError.message);
            res
                .status(500)
                .json({
                    success: false,
                    message: "Failed to send password reset email",
                });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
        console.log(error);
    }
};

// UPDATE USER ROLE 
export const updateUserRole = async (req, res) => {
    const { id } = req.params;
    const { role } = req.body;
    try {
        const user = await User.findByIdAndUpdate(id, { role });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// DELETE USER
export const deleteUser = async (req, res) => {
    const { id } = req.params;
    try {
        const user = await User.findByIdAndDelete(id);
        if (!user) {
            return res
                .status(400)
                .json({ success: false, message: "User not found" });
        }
        await UserProfile.findByIdAndDelete(user.profile);
        res.status(200).json({ success: true, message: "User deleted successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// RESET PASSWORD
export const resetPassword = async (req, res) => {
    const { newPassword } = req.body;
    const { resetToken } = req.params;
    try {
        // Find the user by reset token
        const user = await User.findOne({
            resetPasswordToken: resetToken,
            resetPasswordTokenExpiry: { $gt: Date.now() },
        });
        if (!user) {
            return res
                .status(400)
                .json({ success: false, message: "Invalid or expired reset token" });
        }
        // Hash the new password
        user.password = await bcrypt.hash(newPassword, 10);
        user.resetPasswordToken = undefined;
        user.resetPasswordTokenExpiry = undefined;
        await user.save();
        // Send success email
        try {
            await sendPasswordResetSuccessEmail(user.email);
            res
                .status(200)
                .json({
                    success: true,
                    message:
                        "Password reset successful. A confirmation email has been sent.",
                });
        } catch (emailError) {
            console.error(
                "Error sending password reset success email:",
                emailError.message
            );
            res
                .status(500)
                .json({
                    success: false,
                    message: "Failed to send password reset success email",
                });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
        console.log(error);
    }
};


// LOGOUT USER
export const logoutUser = async (req, res) => {
    try {
        // Clear the authentication token
        res.clearCookie("authToken");
        res.status(200).json({ success: true, message: "Logout successful" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};



// GOOGLE AUTH
export const googleAuth = (req, res, next) => {
    const authenticator = passport.authenticate("google", {
        scope: ["profile", "email"]
    });

    authenticator(req, res, next);
};


// GOOGLE AUTH CALLBACK
export const googleAuthCallback = (req, res, next) => {
    passport.authenticate(
        "google",
        {
            session: false,
            failureRedirect: `${process.env.CLIENT_URL || "http://localhost:3000"
                }/login?error=google_auth_failed`,
        },
        (err, user, info) => {
            if (err || !user) {
                console.error(
                    "Google authentication error:",
                    err || (info ? info.message : "No user returned")
                );

                return res.redirect(
                    `${process.env.CLIENT_URL || "http://localhost:3000/login"
                    }?error=google_auth_failed`
                );
            }
            // generate JWT 
            generateAuthToken(res, user);

            return res.redirect(process.env.SUCCESS_URL || "http://localhost:3000");
        }
    )(req, res, next);
}


// LOGIN FAILED
export const loginFailed = (req, res) => {
    res.status(401).json({ success: false, message: "Login failed" });
};
// Google login success handler
export const googleLoginSuccess = (req, res) => {
    const user = req.user;
    const profilePictureUrl =
        user.profilePicture ||
        "https://res.cloudinary.com/dz4qj1x8h/image/upload/v1709300000/default-profile-picture.png";
    const htmlResponse = `
        <h1>Hello, ${user.firstName || user.fullName}! Welcome!</h1>
        <p>Here's your profile picture:</p>
        <img src="${profilePictureUrl}" alt="Profile Picture" style="width:100px; height:100px; border-radius:50%;">
    `;
    res.send(htmlResponse);
};


// GOOGLE USER LOGOUT HANDLER
export const userLogout = (req, res, next) => {
    req.logout((err) => {
        if (err) {
            console.error("Error during Google user logout:", err);
            return res.status(500).json({ success: false, message: "Logout failed" });
        }

        res.clearCookie("authToken");
        res
            .status(200)
            .json({ success: true, message: "User logged out successfully" });
    });
};


//GET USER 
export const getUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        res.status(200).json({ success: true, user });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};