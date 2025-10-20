import express from 'express';
import "dotenv/config";
import { connectDB } from './config/db.js';
import { authRouter } from './routes/authRoutes.js';
import { configurePassport } from './config/passport.js';
import cookieParser from 'cookie-parser';
import { userProfileRouter } from './routes/userProfileRoutes.js'; // Import the new router
import { postRouter } from './routes/postRoutes.js'; // Import the post router
import passport from 'passport';




// initialize express app
const app = express();


// Middleware
app.use(express.json()); // Parse JSON bodies
app.use(cookieParser()); // Add cookie parser middleware

// Passport configuration
configurePassport();
app.use(passport.initialize());


//Initialize Routes

app.use(authRouter);
app.use( userProfileRouter);
app.use( postRouter);




const PORT = process.env.PORT || 3000;
// Connect to Database
connectDB()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Server is running on ${PORT}`);
        })
    })
    .catch((err) => {
        console.log(err);
        process.exit(1); // Exit process with failure
    });
