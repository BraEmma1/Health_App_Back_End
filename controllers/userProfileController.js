import { UserProfile } from "../models/userprofileModel.js";
import mongoose from "mongoose";

// Create a new user profile
export const createUserProfile = async (userId, profileData = {}) => {
  try {
    // Check if a profile already exists for this user
    const existingProfile = await UserProfile.findOne({ user: userId });
    if (existingProfile) {
      console.warn(
        `Profile already exists for user ${userId}. Returning existing profile.`
      );
      return existingProfile;
    }
    // Create the new profile linked to the user ID
    const newProfile = new UserProfile({
      user: userId,
      ...profileData,
    });

    await newProfile.save();

    console.log(`User profile created for user ${userId}`);
    return newProfile;
  } catch (error) {
    console.error(`Error creating user profile for user ${userId}:`, error);
    // Re-throw the error so the calling function can handle it
    throw error;
  }
};

//     Get my profile
export const getUserProfile = async (req, res) => {
  try {
    // req.user is populated by the authenticateUser middleware
    const profile = await UserProfile.findOne({ user: req.user._id });

    if (!profile) {
      return res
        .status(404)
        .json({ success: false, message: "User profile not found" });
    }
    res.status(200).json({ success: true, profile });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

//     Update my profile
export const updateUserProfile = async (req, res) => {
  try {
    const profile = await UserProfile.findOne({ user: req.user._id });

    if (!profile) {
      return res
        .status(404)
        .json({ success: false, message: "User profile not found" });
    }
    Object.assign(profile, req.body);

    await profile.save();

    res
      .status(200)
      .json({
        success: true,
        message: "Profile updated successfully",
        profile,
      });
  } catch (error) {
    console.error("Error updating user profile:", error);
    if (error instanceof mongoose.Error.ValidationError) {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res
        .status(400)
        .json({
          success: false,
          message: "Validation failed",
          errors: messages,
        });
    }
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

// Delete my profile
export const deleteUserProfile = async (req, res) => {
  try {
    const profile = await UserProfile.findOne({ user: req.user._id });

    if (!profile) {
      return res
        .status(404)
        .json({ success: false, message: "User profile not found" });
    }
    await profile.deleteOne();

    res
      .status(200)
      .json({ success: true, message: "User profile deleted successfully" });
  } catch (error) {
    console.error("Error deleting user profile:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

// @Get user profile by Profile ID (for admin or specific use cases)
export const getUserProfileById = async (req, res) => {
  try {
    const profile = await UserProfile.findById(req.params.id);

    if (!profile) {
      return res
        .status(404)
        .json({ success: false, message: "User profile not found" });
    }

    res.status(200).json({ success: true, profile });
  } catch (error) {
    console.error(`Error fetching user profile by ID ${req.params.id}:`, error);
    // Handle invalid ObjectId format for the ID parameter
    if (error instanceof mongoose.Error.CastError && error.path === "_id") {
      return res
        .status(400)
        .json({ success: false, message: "Invalid profile ID format" });
    }
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

// Get user profile by User ID

export const getUserProfileByUserId = async (req, res) => {
  try {
    // // Optional: Implement authorization check here (e.g., is user admin?)
    // if (req.user.role !== "admin") {
    //   return res.status(403).json({ success: false, message: "Forbidden" });
    // }

    // Validate ObjectId format before querying
    if (!mongoose.Types.ObjectId.isValid(req.params.userId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid user ID format" });
    }

    const profile = await UserProfile.findOne({ user: req.params.userId });

    if (!profile) {
      return res
        .status(404)
        .json({
          success: false,
          message: "User profile not found for this user ID",
        });
    }

    res.status(200).json({ success: true, profile });
  } catch (error) {
    console.error(
      `Error fetching user profile by User ID ${req.params.userId}:`,
      error
    );
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};
