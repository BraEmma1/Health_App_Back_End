import { Router } from 'express';
import {  getUserProfile, updateUserProfile,deleteUserProfile,
    createUserProfile,
    getUserProfileById,
    getUserProfileByUserId,
} from '../controllers/userProfileController.js';
import { authenticateUser } from '../middlewares/authMiddleware.js'; 

export const userProfileRouter = Router();

/**
 * @swagger
 * /create-profile:
 *   post:
 *     summary: Create a user profile
 *     tags: [UserProfile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *               bio:
 *                 type: string
 *     responses:
 *       201:
 *         description: Profile created
 *       400:
 *         description: Invalid input
 */
userProfileRouter.post('/create-profile', authenticateUser, createUserProfile);
userProfileRouter.put('/user-profile/update-profile', authenticateUser, updateUserProfile);
userProfileRouter.delete('/user-profile/delete-profile', authenticateUser, deleteUserProfile);
/**
 * @swagger
 * /user-profile:
 *   get:
 *     summary: Get the authenticated user's profile
 *     tags: [UserProfile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile fetched
 *       404:
 *         description: Profile not found
 */
userProfileRouter.get('/user-profile', authenticateUser, getUserProfile);
userProfileRouter.get('/user-profile/:id', authenticateUser, getUserProfileById);
userProfileRouter.get('/user-profile/:userId', authenticateUser, getUserProfileByUserId);

