import jwt from 'jsonwebtoken';
import dotenv from "dotenv";

dotenv.config({});

export const protect = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) return res.status(401).json({ message: 'No token', success: false });

    const decoded = await jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded;

    next();

  } catch (err) {
    return res.status(401).json({ message: 'Invalid token', success: false });
  }
};

export const adminOnly = (req, res, next) => {

  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access only', success: false });
  }
  next();
};
