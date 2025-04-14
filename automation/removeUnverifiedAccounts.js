import cron from "node-cron";
import {User} from "../models/User-model.js";

export const removeUnverifiedAccounts = () => {

// The function will run at every 30 minutes
  cron.schedule("*/30 * * * *", async () => {
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    await User.deleteMany({
      accountVerified: false,
      createdAt: { $lt: thirtyMinutesAgo },
    });
  });
};

//! node-cron -> help in scheduling for more (https://www.npmjs.com/package/node-cron)