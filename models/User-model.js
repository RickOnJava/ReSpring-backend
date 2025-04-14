// server/models/User.js
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({

  name: String,

  email: String,

  username: String,

  password: String,

  role: {
    type: String,
    enum: ['admin', 'citizen'],
    default: 'citizen'
  },

  accountVerified: {
    type: Boolean,
    default: false,
  },

  verificationCode: Number,

  verificationCodeExpire: Date,

  createdAt: {
    type: Date,
    default: Date.now,
  },
  
});


userSchema.methods.generateVerificationCode = function () {
  
  function generateRandomFiveDigitNumber(){
    const firstDigit = Math.floor(Math.random() * 9) + 1;
    const remainingDigits = Math.floor(Math.random() * 10000).toString().padStart(4,0)

    return parseInt(firstDigit + remainingDigits);
  }
  const verificationCode = generateRandomFiveDigitNumber();
  this.verificationCode = verificationCode;

  this.verificationCodeExpire = Date.now() + 10 * 60 * 1000  // 10 minute

  return verificationCode;
}

export const User = mongoose.model("User", userSchema);