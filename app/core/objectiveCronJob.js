const nodeCron = require("node-cron");
const { UserModel } = require("../models/index")
const axios = require("axios")
const { accountOrders, accountInformation, accountMetrics } = require("./endpoints")

const deleteUsersFromMeta = async ()=>{
    const twoMonthesAgo = new Date().getTime() - 1000 * 86400 * 60
    const query = {
        role:'user',
        createdAt:{ "$lt" : new Date(twoMonthesAgo).toISOString() }
    }

    const users = await UserModel
        .find({
            role:'user',
            createdAt:{ "$lt" : new Date(twoMonthesAgo).toISOString() },
            status: 'active'
        })
        .select("firstBalance dayBalance maxTradeDays percentDays infinitive accountType mtAccountId accountCreatedDate tradeDaysCount equity balance hasFailedDailyLoss hasFailedMaxLoss maxLossLimit metaUsername type trackerId standardType user_login display_name level status createdAt accountEmail status")
        // .sort("-createdAt")
        .limit(1)
}

const deleteUserFromMetaAndSaveUserDataInCache = ()=>{
    // every hour at o minutes
    const job = nodeCron.schedule("00 33 */1 * * *", function jobYouNeedToExecute() {
        // every hour at o minutes
        deleteUsersFromMeta()
        console.log('delete user from Meta and save user data in cache => ', new Date().toLocaleString());
    });
    job.start();
}

module.exports = {
    deleteUserFromMetaAndSaveUserDataInCache
}
