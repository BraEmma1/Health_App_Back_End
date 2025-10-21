import express from 'express';
import "dotenv/config";
import { connectDB } from './config/db.js';
import { authRouter } from './routes/authRoutes.js';
import { configurePassport } from './config/passport.js';
import cookieParser from 'cookie-parser';
import { userProfileRouter } from './routes/userProfileRoutes.js'; // Import the new router
import { postRouter } from './routes/postRoutes.js'; // Import the post router
import passport from 'passport';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';




// initialize express app
const app = express();


// Middleware
app.use(express.json()); // Parse JSON bodies
app.use(cookieParser()); // Add cookie parser middleware

// Passport configuration
configurePassport();
app.use(passport.initialize());

// Swagger setup
const swaggerOptions = {
  swaggerDefinition: {
    openapi: '3.0.0',
    info: {
      title: 'Ditechted Health App API',
      version: '1.0.0',
      description: 'API documentation for Ditechted Health App',
    },
    servers: [
      { url: 'http://localhost:3000', description: 'Local server' },
    ],
  },
  apis: ['./routes/*.js', './models/*.js'], // Path to the API docs
};
const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));


//Initialize Routes

app.use(authRouter);
app.use(userProfileRouter);
app.use(postRouter);




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
