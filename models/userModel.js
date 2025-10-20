import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    // Basic Information
    firstName: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
      max: [50, "First name cannot exceed 50 characters"],
    },
    lastName: {
      type: String,
      required: [true, "Last name is required"],
      trim: true,
      max: [50, "Last name cannot exceed 50 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please enter a valid email",
      ],
    }, 
    phone: {
      type: String,
      required: function () {
        return !this.googleId;
      },
      match: [
        /^(\+233|233|0)(20|23|24|26|27|28|50|54|55|56|57|59)\d{7}$/,
        "Please enter a valid Ghana phone number",
      ],
    },
    isPhoneVerified: {
      type: Boolean,
      default: false,
    },
    profilePicture: {
      type: String,
      default:
        "https://res.cloudinary.com/dz4qj1x8h/image/upload/v1709300000/default-profile-picture.png",
    },
    password: {
      type: String,
      required: function () {
        return !this.googleId;
      },
      minlength: [8, "Password must be at least 8 characters"],
    },

    language: {
      type: String,
      enum: ["English", "Twi", "Ewe", "Hausa", "Other"],
      default: "English",
    },
    // User Role
    role: {
      type: String,
      enum: ["user", "patient", "doctor", "admin", "influencer"],
      default: "user",
    },
    profile: {
      type: mongoose.Schema.Types.ObjectId,
              ref: 'UserProfile',
        default: null
    },
    // Account Status
    isActive: {
      type: Boolean,
      default: false,
    },
    lastSeen: {
      type: Date,
      default: Date.now(),
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    verificationToken: {
      type: String,
      default: null,
    },
    verificationTokenExpiry: {
      type: Date,
      default: null,
    },
    
    phoneVerificationCode: String,
    phoneVerificationExpires: Date,

    resetPasswordToken: {
      type: String,
      default: null,
    },
    resetPasswordTokenExpiry: {
      type: Date,
      default: null,
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },

  },
  {
    timestamps: true,
  }
);
// Virtual field to get full name
userSchema.virtual("fullName").get(function () {
  return `${this.firstName} ${this.lastName}`;
});
export const User = mongoose.model("User", userSchema);
