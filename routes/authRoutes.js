import express from 'express';
import { register, login, verifyOTP } from '../controllers/authController.js';

const router = express.Router();

router.route("/register").post(register);
router.route("/otp-verification").post(verifyOTP);
router.route("/login").post(login);

export default router;
