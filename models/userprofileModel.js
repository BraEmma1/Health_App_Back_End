import mongoose from 'mongoose';


const userProfileSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true // Ensure one profile per user
    },

    // Personal Information
    dateOfBirth: Date,
    gender: {
        type: String,
        enum: ['male', 'female', 'other'],
    },
    address: {
        country: String,
        city: String
    },
    bio: {
        type: String,
        max: [500, 'Bio cannot exceed 500 characters']
    },

    // Doctor-specific fields
    specialties: [String], // for doctors
    verified: {
        type: Boolean,
        default: false
    }, // verified doctor flag
    
    verificationMeta: {
        idDocUrl: String,
        licenseNumber: String,
        licenseIssuer: String,
        verifiedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        verifiedAt: Date,
        status: {
            type: String,
            enum: ['pending', 'approved', 'rejected'],
            default: 'pending'
        }
    },

    // User preferences
    preferences: {
        notifications: {
            push: {
                type: Boolean,
                default: true
            },
            sms: {
                type: Boolean,
                default: true
            },
            email: {
                type: Boolean,
                default: true
            }
        }
    },

    // User settings
    settings: {
        privacy: {
            profileVisibility: {
                type: String,
                enum: ['public', 'private', 'friends'],
                default: 'public'
            },
            showEmail: {
                type: Boolean,
                default: false
            },
            showPhone: {
                type: Boolean,
                default: false
            }
        }
    }

})

export const UserProfile = mongoose.model('UserProfile', userProfileSchema);