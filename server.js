import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';
import connectDB from './config/db.js';
import springRoutes from './routes/springRoutes.js';
import authRoutes from './routes/authRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import chatbotRoutes from './routes/chatBotRoute.js';
import adminRoutes from "./routes/adminRoute.js"
import { removeUnverifiedAccounts } from './automation/removeUnverifiedAccounts.js';

dotenv.config();
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  },
});

connectDB();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));

app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
}));

// Attach io to app
app.set('io', io);

// Routes
app.use('/api/v1/springs', springRoutes);
app.use('/api/v1/user', authRoutes);
app.use('/api/v1/reports', reportRoutes);
app.use('/api/v1/chat', chatbotRoutes);
app.use('/api/v1/admin', adminRoutes);

// Background jobs
removeUnverifiedAccounts();

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
