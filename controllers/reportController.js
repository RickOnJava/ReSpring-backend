import {Report} from '../models/Report-model.js';
import { Spring } from "../models/Spring-model.js";
import axios from "axios";

// Submit a report with optional photo
export const submitReport = async (req, res) => {
  const { spring, message } = req.body;
  const photo = req.file?.path || null; // Cloudinary gives URL in .path

  if (!spring || !message) {
    return res.status(400).json({ error: 'Spring and message are required' });
  }

  const report = await Report.create({
    spring,
    message,
    photo,
    createdBy: req.user.id,
  });

  res.status(201).json(report);
};



export const getReportsBySpring = async (req, res) => {

  const reports = await Report.find()
    .populate('spring', '_id name district status')
    .populate('createdBy', 'name email') // optional: show user info
    .sort({ createdAt: -1 });

  res.json(reports);
};


//! controllers/reportController.js
// export const addFeedback = async (req, res) => {
//   try {
//     const { reportId } = req.params;
//     const { comment, status } = req.body;

//     const report = await Report.findById(reportId);
//     if (!report) {
//       return res.status(404).json({ message: "Report not found" });
//     }

//     const feedbackEntry = {
//       user: req.user.id,
//       comment,
//       status,
//     };

//     report.feedback.push(feedbackEntry);
//     await report.save();

//     res.status(200).json({ success: true, message: "Feedback submitted" });
//   } catch (error) {
//     res.status(500).json({ success: false, message: "Error adding feedback" });
//   }
// };


//! GET all reports created by the logged-in user
export const getUserReports = async (req, res) => {
  try {
    const reports = await Report.find({ createdBy: req.user.id })
      .populate("spring", "name district location")
      .sort({ createdAt: -1 });

    res.status(200).json(reports);
  } catch (err) {
    console.error("Error fetching user reports:", err);
    res.status(500).json({ message: "Failed to fetch reports" });
  }
};

//! Add or update feedback

export const giveFeedbackOnReport = async (req, res) => {
  const { id } = req.params;
  const { comment, status } = req.body;

  try {

    if(!req.user.id) return res.status(403).json({message: "Unauthorized access , please login first" , success: false})
    const report = await Report.findById(id);

    if (!report) return res.status(404).json({ message: "Report not found" });

    // Ensure only the report creator can submit feedback
    if (report.createdBy.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: "Unauthorized to give feedback on this report", success: false });
    }

    report.feedback = {
      comment,
      status,
      createdAt: new Date(),
    };

    await report.save();

    res.status(200).json({ success: true, message: "Feedback added successfully", report });
  } catch (err) {
    console.error("Error giving feedback:", err);
    res.status(500).json({ message: "Failed to submit feedback", success: false });
  }
};


//! GET all user feedbacks (admin only)
export const getAllFeedbacks = async (req, res) => {
  try {
    const reports = await Report.find({ "feedback.comment": { $ne: null } })
      .populate("spring", "name district")
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json(reports);
  } catch (err) {
    console.error("Failed to get feedbacks:", err);
    res.status(500).json({ message: "Server error" });
  }
};



export const getSmartSuggestion = async (req, res) => {
  const { reportId } = req.body;

  try {
    // Fetch the report with the associated spring data
    const report = await Report.findById(reportId).populate("spring");
    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    const spring = report.spring;

    const prompt = `
You are an assistant for a water resource management system. A user submitted the following report:

Report Message: "${report.message}"

Here is the related spring data:
- Name: ${spring?.name || "Unknown"}
- District: ${spring?.district || "Unknown"}
- Usage: ${spring?.usage || "Unknown"}
- Flow Rate: ${spring?.flowRate || "Unknown"}
- Status: ${spring?.status || "Unknown"}

Based on this, provide:
- A possible cause of the issue
- Suggested resolution steps
- Any department or authority to contact
- Preventive measures (if applicable)
    `;

    // Send request to AI provider (e.g., OpenRouter)
    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "openai/gpt-3.5-turbo", // or another model you're using
        messages: [{ role: "user", content: prompt }],
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const suggestion = response.data.choices[0]?.message?.content;
    return res.status(200).json({ suggestion });
  } catch (error) {
    console.error("Smart suggestion generation error:", error);
    return res.status(500).json({ message: "Failed to generate smart suggestion" });
  }
};
