import { transporter } from "../config/emailConfig.js";
import { User } from "../models/userModel.js";
import { VERIFICATION_EMAIL_TEMPLATE, WELCOME_EMAIL_TEMPLATE,PASSWORD_RESET_REQUEST_TEMPLATE, PASSWORD_RESET_SUCCESS_TEMPLATE } from "./emailTemplates.js";

export const sendVerificationEmail = async (email,verificationToken) => {
    const recipient = email;
    try {
        const response = await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: recipient,
            subject: "Verify your email address",
            html: VERIFICATION_EMAIL_TEMPLATE.replace("{verificationCode}",verificationToken)
        });
        console.log("Email sent successfully");
    } catch (error) {
        console.error("Error sending email:", error);
        throw new Error(`Failed to send verification email:${error.message}`);
    }
};

export const sendWelcomeEmail = async (email, firstName, companyName) => {
    const recipient = email;
    const user = await User.findOne({ email });
firstName = user.firstName;
    companyName = user.companyName || "Skill Link";
    try {
        const response = await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: recipient,
            subject: `Welcome to ${companyName}`,
            html: WELCOME_EMAIL_TEMPLATE(firstName, companyName)
        });
        console.log("Welcome email sent successfully");
    } catch (error) {
        console.error("Error sending welcome email:", error);
        throw new Error(`Failed to send welcome email:${error.message}`);
    }
};


export const sendPasswordResetEmail = async (email, resetUrl) => {    
    const recipient = email;
    try {
        const response = await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: recipient,
            subject: "Password Reset Request",
            html: PASSWORD_RESET_REQUEST_TEMPLATE.replace("{resetURL}", resetUrl)
        });
        console.log("Password reset email sent successfully");
    }catch (error) {
        console.error("Error sending password reset email:", error);
        throw new Error(`Failed to send password reset email: ${error.message}`);
    }
}

export const sendPasswordResetSuccessEmail = async (email) => {
    const recipient = email;
    try {
        const response = await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: recipient,
            subject: "Password Reset Successful",
            html: PASSWORD_RESET_SUCCESS_TEMPLATE
        });
        console.log("Password reset success email sent successfully");
    } catch (error) {
        console.error("Error sending password reset success email:", error);
        throw new Error(`Failed to send password reset success email: ${error.message}`);
    }
};      