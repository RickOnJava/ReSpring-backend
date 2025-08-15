import express from 'express';
import { submitReport, getReportsBySpring, getUserReports, giveFeedbackOnReport, getAllFeedbacks, getSmartSuggestion } from '../controllers/reportController.js';
import { adminOnly, protect } from '../middlewares/authMiddleware.js';
import upload from '../middlewares/upload.js';

const router = express.Router();

// Use Cloudinary + multer
router.post('/', protect, upload.single('photo'), submitReport);
// router.get('/:id', getReportsBySpring);

router.get('/',  getReportsBySpring);

// router.post("/feedback/:reportId", protect, addFeedback);

// GET all reports of the logged-in user
router.get("/my-reports", protect, getUserReports);

// PUT feedback on a report
router.put("/:id/feedback", protect, giveFeedbackOnReport);

router.get("/admin/feedbacks", protect, adminOnly, getAllFeedbacks);

router.post('/smart-suggestion', protect, adminOnly, getSmartSuggestion);


export default router;
