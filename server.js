import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/db.js';
import {removeUnverifiedAccounts} from "./automation/removeUnverifiedAccounts.js"
import springRoutes from './routes/springRoutes.js';
import authRoutes from './routes/authRoutes.js';
import reportRoutes from './routes/reportRoutes.js';

dotenv.config();
const app = express();
const frontend = process.env.FRONTEND_URL;


//! Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


//! to allow frontend to access uploaded images:
app.use('/uploads', express.static('uploads'));


//! used to connect with frontend (react)
const corsOptions = {
    origin: frontend,  // react's port number
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
}
app.use(cors(corsOptions));


// Routes
app.use('/api/v1/springs', springRoutes);
app.use('/api/v1/user', authRoutes);
app.use('/api/v1/reports', reportRoutes);


//! this will remove the unverified user accounts at each 30 minute
removeUnverifiedAccounts();

//! Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    connectDB(); 
    console.log(`Server is running on port ${PORT}`);
});
