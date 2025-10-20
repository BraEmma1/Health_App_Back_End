import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import 'dotenv/config';

// Configure Cloudinary with credentials from environment variables
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure Multer to use memory storage. This is efficient for
// processing files before uploading them to a cloud service.
const storage = multer.memoryStorage();

export const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        // Accept images only
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Not an image! Please upload an image file.'), false);
        }
    },
    limits: { fileSize: 1024 * 1024 * 5 }, // 5MB file size limit
});

// Middleware to upload the file buffer from Multer to Cloudinary
export const uploadToCloudinary = (folder) => async (req, res, next) => {
    if (!req.file) {
        return next(); // No file was uploaded, proceed to the next middleware
    }

    // Create a promise-based upload
    const uploadPromise = new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream({ folder }, (error, result) => {
            if (error) return reject(error);
            req.cloudinaryUrl = result.secure_url; // Attach the secure URL to the request object
            resolve(result);
        });
        stream.end(req.file.buffer);
    });

    try {
        await uploadPromise;
        next();
    } catch (error) {
        console.error('Cloudinary upload error:', error);
        next(error);
    }
};