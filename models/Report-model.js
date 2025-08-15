// server/models/Report.js
import mongoose from "mongoose";

const reportSchema = new mongoose.Schema(
  {
    spring: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Spring",
    },

    message: String,

    photo: String, // optional file support later

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    
    feedback: {
      comment: String,
      status: {
        type: String,
        enum: ["resolved", "unresolved", "partial"],
        default: "unresolved",
      },
      createdAt: {
        type: Date,
        default: Date.now,
      },
    },
  },
  { timestamps: true }
);

// export default mongoose.model('Report', reportSchema);
export const Report = mongoose.model("Report", reportSchema);
