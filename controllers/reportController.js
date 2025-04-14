import {Report} from '../models/Report-model.js';

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

// Get all reports for a specific spring
// export const getReportsBySpring = async (req, res) => {
//   const { id } = req.params;

//   const reports = await Report.find({ spring: id })
//     .populate('createdBy', 'name') // optional: show user info
//     .sort({ createdAt: -1 });

//   res.json(reports);
// };

export const getReportsBySpring = async (req, res) => {

  const reports = await Report.find()
    .populate('spring', '_id name district status')
    .populate('createdBy', 'name email') // optional: show user info
    .sort({ createdAt: -1 });

  res.json(reports);
};
