import express from 'express';
import { getAllSprings, addSpring, getSpring, updateSpring, deleteSpring } from '../controllers/springController.js';
import { protect, adminOnly } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/', getAllSprings);
router.post('/', protect, adminOnly, addSpring);

router.get('/:id', protect, adminOnly, getSpring);
router.put('/:id', protect, adminOnly, updateSpring);
router.delete('/:id', protect, adminOnly, deleteSpring);

export default router;