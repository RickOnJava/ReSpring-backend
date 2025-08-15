// server/controllers/adminController.js
import { Spring } from "../models/Spring-model.js";
import { Report } from "../models/Report-model.js";

export const getAdminAnalytics = async (req, res) => {
  try {
    const totalSprings = await Spring.countDocuments();
    const totalReports = await Report.countDocuments();

    const activeSprings = await Spring.countDocuments({ status: "Active" });
    const drySprings = await Spring.countDocuments({ status: "Dry" });
    const lowSprings = await Spring.countDocuments({ status: "Low" });

    const resolvedReports = await Report.countDocuments({ "feedback.status": "resolved" });
    const unresolvedReports = await Report.countDocuments({ "feedback.status": { $ne: "resolved" } });

    const monthlyReports = await Report.aggregate([
      {
        $group: {
          _id: { $substr: ["$createdAt", 0, 7] }, // YYYY-MM
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      totalSprings,
      totalReports,
      activeSprings,
      drySprings,
      resolvedReports,
      unresolvedReports,
      monthlyReports
    });
  } catch (err) {
    console.error("Error in getAdminAnalytics:", err);
    res.status(500).json({ error: "Server error" });
  }
};
