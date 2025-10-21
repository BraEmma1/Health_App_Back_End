import { Router } from 'express';
import {  getUserProfile, updateUserProfile,deleteUserProfile,
    createUserProfile,
    getUserProfileById,
    getUserProfileByUserId,
} from '../controllers/userProfileController.js';
import { authenticateUser } from '../middlewares/authMiddleware.js'; 

export const userProfileRouter = Router();

// User Profile Routes

userProfileRouter.post('/create-profile', authenticateUser, createUserProfile);
userProfileRouter.put('/user-profile/update-profile', authenticateUser, updateUserProfile);
userProfileRouter.delete('/user-profile/delete-profile', authenticateUser, deleteUserProfile);
userProfileRouter.get('/user-profile', authenticateUser, getUserProfile);
userProfileRouter.get('/user-profile/:id', authenticateUser, getUserProfileById);
userProfileRouter.get('/user-profile/:userId', authenticateUser, getUserProfileByUserId);

