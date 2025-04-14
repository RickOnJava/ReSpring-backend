import { User } from "../models/User-model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import {sendEmail} from "../utils/sendEmail.js";

dotenv.config();

const generateToken = (user) => {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
};


//! Register a user
export const register = async (req, res) => {
  try {
    const { name, username, email, password, role } = req.body;
    const ADMIN_SECRET = process.env.ADMIN_SECRET;

    if (!name || !username || !email || !password || !role) {
      return res.status(400).json({
        message: "Something is missing, please check",
        success: false,
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        message: "Password must have at least 8 characters",
        success: false,
      });
    }

    if (role === "admin") {
      if (req.body.adminCode !== ADMIN_SECRET) {
        return res.status(403).json({ message: "Invalid admin access code.", success: false });
      }
    
      const existingAdmin = await User.findOne({ role: "admin" });
      if (existingAdmin) {
        return res.status(403).json({ message: "An admin already exists.", success: false });
      }
    }

    const userExists = await User.findOne({ email, accountVerified: true });

    if (userExists) {
      return res.status(400).json({
        message: "User already exists",
        success: false,
      });
    }

    const registrationAttemptedByUser = await User.find({
      email,
      accountVerified: false,
    });

    if (registrationAttemptedByUser.length > 3) {
      return res.status(400).json({
        success: false,
        message:
          "You have exceed the maximum number of attempts (3). Please try again after an hour.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      username,
      email,
      password: hashedPassword,
      role,
    });

    const verificationCode = await user.generateVerificationCode();
    await user.save();

    sendVerificationCode(
      verificationCode,
      name,
      email,
      res
    );
  } catch (error) {
    res.status(500).json({ error: err.message });
  }
};


async function sendVerificationCode(
    verificationCode,
    name,
    email,
    res
  ) {
    try {
        const message = generateEmailTemplate(verificationCode, name);
        sendEmail({ email, subject: "Your Verification Code", message });
        res.status(200).json({
          success: true,
          message: `Verification email has been sent to ${name}`,
        });
        
    } catch (error) {
      console.log(error);

      return res.status(500).json({
        success: false,
        message: "Verification code failed to send.",
      });
    }
}


function generateEmailTemplate(verificationCode, name) {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; background-color: #f9f9f9;">
        <h2 style="color: #4CAF50; text-align: center;">Verification Code</h2>
        <p style="font-size: 16px; color: #333;">Dear ${name},</p>
        <p style="font-size: 16px; color: #333;">Your verification code for the application is:</p>
        <div style="text-align: center; margin: 20px 0;">
          <span style="display: inline-block; font-size: 24px; font-weight: bold; color: #4CAF50; padding: 10px 20px; border: 1px solid #4CAF50; border-radius: 5px; background-color: #e8f5e9;">
            ${verificationCode}
          </span>
        </div>
        <p style="font-size: 16px; color: #333;">Please use this code to verify your email address. The code will expire in 10 minutes.</p>
        <p style="font-size: 16px; color: #333;">If you did not request this, please ignore this email.</p>
        <footer style="margin-top: 20px; text-align: center; font-size: 14px; color: #999;">
          <p>Thank you,<br>Team Devs</p>
          <p style="font-size: 12px; color: #aaa;">This is an automated message. Please do not reply to this email.</p>
        </footer>
      </div>
    `;
}


//! OTP verification
export const verifyOTP = async (req, res, next) => {
    const { email, otp } = req.body;
  
    try {
      const userAllEntries = await User.find({ email, accountVerified: false }).sort({ createdAt: -1 });
  
      if (!userAllEntries) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }
  
      // If the user has multiple entries then take the first (latest) one and delete the other entries
      let user;
      if (userAllEntries.length > 1) {
        user = userAllEntries[0];
  
        await User.deleteMany({
          _id: { $ne: user._id }, // this means delete the entries except the entrie which is latest and assigned to user
          $or: [
            { email, accountVerified: false },
          ],
        });
      } else {
        user = userAllEntries[0]; // if the user attempt only once
      }
  
      // Verify the otp
      if (user.verificationCode !== Number(otp)) {
        return res.status(400).json({
          success: false,
          message: "Invalid OTP",
        });
      }
  
      // Verify the otp expiary
      const currentTime = Date.now();
      const verificationCodeExpire = new Date(
        user.verificationCodeExpire
      ).getTime();
  
      if (currentTime > verificationCodeExpire) {
        return res.status(400).json({
          success: false,
          message: "OTP Expired",
        });
      }
  
      // After verification completed ...
      user.accountVerified = true;
      user.verificationCode = null;
      user.verificationCodeExpire = null;
      await user.save({ validateModifiedOnly: true }); // validationModifiedOnly = ensures that the modified values follow the types. (Like - 'accountVerified' is a boolean type. if you do "true" instead of true, it will not accept it )
  
      return res.status(200).json({
        success: false,
        message: "OTP validated successfully and User created",
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Internal Server Error",
      });
    }
};


//! Login the user
export const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      message: "Something is missing, please check",
      success: false,
    });
  }

  const user = await User.findOne({ email, accountVerified: true });

  if (!user)
    return res.status(400).json({
      message: "Invalid username or password",
      success: false,
    });

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch)
    return res.status(400).json({
      message: "Invalid username or password",
      success: false,
    });

  const token = generateToken(user);

  res.status(200).json({
    success: true,
    message: `Welcome back ${user.name}`,
    token,
    user: {
      _id: user._id,
      name: user.name,
      username: user.username,
      email: user.email,
      role: user.role,
    },
  });
};
