import express from 'express';
import { submitReport, getReportsBySpring } from '../controllers/reportController.js';
import { protect } from '../middlewares/authMiddleware.js';
import upload from '../middlewares/upload.js';

const router = express.Router();

// Use Cloudinary + multer
router.post('/', protect, upload.single('photo'), submitReport);
// router.get('/:id', getReportsBySpring);
router.get('/', getReportsBySpring);

export default router;
