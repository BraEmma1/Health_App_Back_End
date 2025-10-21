import { Router } from "express";
import { forgetPassword, loginUser, logoutUser, registerUser, resetPassword, verifyUserEmail, googleAuth, googleAuthCallback, googleLoginSuccess, userLogout, loginFailed, getUser, deleteUser, updateUserRole } from "../controllers/authController.js";
import { authenticateUser } from "../middlewares/authMiddleware.js";

export const authRouter = Router();

/**
 * @swagger
 * /test:
 *   get:
 *     summary: Health check (Swagger setup test)
 *     responses:
 *       200:
 *         description: OK
 */
authRouter.post('/auth/register', registerUser);

authRouter.post('/auth/verify-email', verifyUserEmail);

authRouter.post('/auth/login', loginUser);

authRouter.post('/auth/logout', logoutUser);

authRouter.post("/auth/forget-password", forgetPassword);   

authRouter.put("/auth/reset-password/:resetToken", resetPassword);

authRouter.delete('/auth/delete-user/:id', authenticateUser, deleteUser);

authRouter.put('/auth/update-user-role/:id', authenticateUser, updateUserRole);

authRouter.get('/auth/user/:id', authenticateUser, getUser);

// Google OAuth routes
authRouter.get('/auth/google', googleAuth);

authRouter.get('/auth/google/callback', googleAuthCallback); 

authRouter.get('/auth/google/success',authenticateUser, googleLoginSuccess);

authRouter.get('/auth/google/login-failed', loginFailed);

authRouter.get('/auth/google/logout', userLogout);


