const nodeCron = require("node-cron");
const { UserModel } = require("../models/index")
const axios = require("axios")
const { accountOrders, accountInformation, accountMetrics } = require("./endpoints")
const csv = require('csv-parser')
const path = require('path')
const fs = require('fs')
const { hashPassword } = require("../core/utils")
const io = require("./io")
const MetaApi = require('metaapi.cloud-sdk').default
const api = new MetaApi("eyJhbGciOiJSUzUxMiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI5M2ExYTM4MWFhMTU3NTU2M2RmYTI4MDk1YWQ3M2RjZSIsInBlcm1pc3Npb25zIjpbXSwidG9rZW5JZCI6IjIwMjEwMjEzIiwiaWF0IjoxNjUxNjA4MzA2LCJyZWFsVXNlcklkIjoiOTNhMWEzODFhYTE1NzU1NjNkZmEyODA5NWFkNzNkY2UifQ.KmJA4U-xLpzM4P2QH4CcK0DB5JuY_YN3Ht6kIOTBOV61CzGCpvQRcQqs7Bk7Z8eoWV3NiPBHjtZMlgHX7ZQeaeNgpeaiW5ors7z2HZuHLD9XzlrIsMRfntIXp5ifTKjh8oSnkiIN485sHRPXE688GVKil80Qsqt6qva-56JS9EHTsSgWT0Qp6iEY_AaIQFSzXUIU3Ty82JWrInTRLV2CDx4fT4KiRfm0Go0OAt_ONTjNWAXjwHhWhsDcQRPf2xFzYf5dLD4C98lL0PDyWK04QMR7AgT5t51910ExWvFBBbfxMwra4sAzktuevd7zh0_mBLPQn7N7qnlEFrOHaoLCuPF2LWOhjpH-K_0U11D80tLKMncx-sbd3ZS1TYU033mSh9mGE_jLv8eHahmI_kqmflUnWdnj4Whr-EIYXfmByy1sQDNaSip9C_9DDol7DyhGEtaHKORDodZZStJPbToUVSn7t2NJXSGmFhl1m2H2Rzn5iQRYPk-20Qn0cEq-af_YnZ2tc96LWIOjEk2EONu26UtQp1wsZTZOuY3-4YQvd-IUdVTAB-knjUoGJBeu2DcPHtm_flh92oGL36pvsB3LM8kpJGd_tqrnrzsfuLyGMbKwyIx1jabZ824msqitiWU0zXt26Nay5J0BNhZSaF0fhYZVczOzCI8UUQZTw-GJoaQ");
const {sendMail} = require("../core/utils")
const sentEmails = []

let isUsersFetching = false

//fetch users
let allUsers = []
const setUsers = async ()=>{
    // console.log("starting")
    try {
        const users = await UserModel.find({})
        // console.log("end", users)
        allUsers = users
    
        allUsers = allUsers.filter(user=>(!!user.mtAccountId)).map(async user=>{
                let accountId = user.mtAccountId
                let account = await api.metatraderAccountApi.getAccount(accountId);
                const connection = account.getStreamingConnection();
                await connection.connect();
                const terminalState = connection.terminalState;
                await connection.waitSynchronized();
                const {
                    mtAccountId,
                    _id,
                    dayBalance,
                    firstBalance,
                    startTradeDay,
                    accountCreatedDate,
                    maxTradeDays,
                    user_login,
                    hasFailedDailyLoss,
                    hasFailedMaxLoss,
                    user_email,
                    maxLossLimit,
                    flyEquity,
                    percentDays
                } = user
                return {
                    mtAccountId,
                    _id,
                    dayBalance,
                    firstBalance,
                    startTradeDay,
                    accountCreatedDate,
                    maxTradeDays,
                    user_login,
                    connection,
                    terminalState,
                    hasFailedDailyLoss,
                    hasFailedMaxLoss,
                    user_email,
                    maxLossLimit,
                    allowableMaxLossLimit:1 - (maxLossLimit/100),
                    flyEquity,
                    percentDays
                }
        })
        allUsers = await Promise.all(allUsers)
    
    }

    catch(error){
        console.log(error)
    }
    // console.log("end",allUsers, allUsers.length)
}

//services
const saveTradingDays = async ()=>{
    if(allUsers.length===0)
        await setUsers()
    allUsers.forEach(async user=>{
        try {
            const d = new Date(user.startTradeDay || user.accountCreatedDate)
            const startTime = d
            const endTime = new Date(d.getTime() + 86400*1000*10)
            console.log("calculating... ")
            if(user.mtAccountId){
                const historyStorage = user.connection.historyStorage;
                const response = historyStorage.historyOrders
                const tradeDays = new Set(response.map(item=>{
                    const time = item.doneTime.toISOString()
                    return time.split("T")[0]
                })).size
                user.tradeDaysCount = tradeDays
                const userDoc = await UserModel.findByIdAndUpdate(user._id.toString(), {
                    tradeDaysCount:tradeDays
                })
                if(tradeDays>=5){
                    sendMail({
                        to:user.user_email,
                        subject:"حداقل روزهای معاملاتی شما تکمیل شد.",
                        text:"حداقل روزهای معاملاتی شما تکمیل شد."
                    })
                    sentEmails.push({type:  "minTradeDays",email:user.user_email})
                }
            }    
        }
        catch(err){
            console.log('error when saving trade days for user ', user.user_login, err.message)
        }
    })
}

const getUserEquityAndBalance = async ()=>{
    // console.log(allUsers)
    if(allUsers.length===0  )
        if(!isUsersFetching){
            isUsersFetching = true
            await setUsers()
            isUsersFetching = false
        }
        console.log("allUsers",allUsers.length)
        allUsers.forEach(async user=>{
            console.log(user.mtAccountId)
            if(user.mtAccountId ){
                try {
                    const response = user.terminalState.accountInformation
                    const userCurrentEquity = response.equity
                    const userCurrentBalance = response.balance
                    const userDayBalance = user.dayBalance
                    const userFirstBalance = user.firstBalance
                    const allowableMaxLossLimit = user.allowableMaxLossLimit
                    if(userCurrentEquity<userFirstBalance*0.9){
                        const message =  {
                            time: "time",
                            message: `equity:${userCurrentEquity} - balance:${userFirstBalance}`,
                            title:"max loss alert",
                            read: true,
                            type: "type",
                            userId: user._id,
                        }
                        const encryptedMessage = Buffer.from(JSON.stringify(message)).toString('base64')
                        io.getIo().emit("alert", encryptedMessage)
                    }

                    if(userCurrentEquity<userDayBalance*0.95){
                        const message =  {
                            time: "time",
                            message: `equity:${userCurrentEquity} - day balance:${userDayBalance}`,
                            title:"max daily loss alert",
                            read: true,
                            type: "type",
                            userId: user._id,
                        }
                        const encryptedMessage = Buffer.from(JSON.stringify(message)).toString('base64')
                        io.getIo().emit("alert", encryptedMessage)
                    }
                    const d = new Date(user.startTradeDay || user.accountCreatedDate)
                    const startTime = d
                    const endTime = new Date(d.getTime() + 86400*1000*10)

                    historyStorage = user.connection.historyStorage;

                    const response2 = historyStorage.historyOrders

                    //max dailyloss
                    if(user.hasFailedMaxLoss ===false && userCurrentEquity<userFirstBalance*allowableMaxLossLimit, (!sentEmails.find(e=>e.email ===user.user_email && e.type=== "maxDailyLoss" ))){
                        sendMail({
                            to:user.user_email,
                            subject:"Max Loss 8% to 12%",
                            text:"hمتاسفانه بدلیل عدم پایبندی به مدیریت ریسک و سرمایه درادون کل حساب نقض شد."
                        })
                        sentEmails.push({type:  "maxDailyLoss",email:user.user_email})
                    }

                    //max loss
                    if(user.hasFailedDailyLoss === false && userCurrentEquity<userDayBalance*0.95 && (!sentEmails.find(e=>e.email ===user.user_email && e.type=== "maxLoss" )) ){
                        sendMail({
                            to:user.user_email,
                            subject:"Max Daily loss 5%",
                            text:"متاسفانه بدلیل رعایت نشدن ریسک، درادون روزانه شما نقض شد.",
                        })
                        sentEmails.push({type:  "maxLoss",email:user.user_email})
                    }

                    //progit target
                    if(userCurrentBalance > (userFirstBalance*(1+(user.percentDays/100))) && (!sentEmails.find(e=>e.email ===user.user_email && e.type=== "profitTarget" )) ){
                        sendMail({
                            to:user.user_email,
                            subject:"Profit Target.",
                            text:`
                            با عرض تبریک! شما به تارگت موردنظر رسیده اید و در صورت تکمیل بودن روزهای معاملاتی، به مرحله بعدی منتقل خواهید شد.\n
                            اطلاعات حساب بزودی برای شما ارسال خواهد شد.\n
                            از همکاری با شما مفتخر هستیم.
                            `
                        })
                        sentEmails.push({type:  "profitTarget",email:user.user_email})
                    }

                    
                    const userDoc = await UserModel.findByIdAndUpdate(user._id.toString(), {
                            equity:userCurrentEquity,
                            balance:userCurrentBalance,
                            startTradeDay:response2[0]?.time || "",
                            endTradeDay:response2[0] ? new Date(new Date(response2[0]?.time).getTime() + user.maxTradeDays*86400*1000).toISOString() : "",
                            hasFailedMaxLoss:user.hasFailedMaxLoss || userCurrentEquity<userFirstBalance*allowableMaxLossLimit,
                            hasFailedDailyLoss:user.hasFailedDailyLoss || userCurrentEquity<userDayBalance*0.95,
                            flyEquity: [0, 15, 30 , 45].includes(new Date().getMinutes()) ? userCurrentEquity : userCurrentEquity < user.flyEquity ? userCurrentEquity : user.flyEquity
                    }, {new:true})
                    userDoc.minEquityHistory.push({
                        equity:userDoc.flyEquity,
                        time:new Date().toLocaleString()
                    })
                    if(userDoc.equityHistory.length===0){
                        userDoc.equityHistory.push({
                            trades:response2.length,
                            equity:response.equity
                        })
                    }
                    else {
                        if((!userDoc.equityHistory.find(item=>item.trades==response2.length)))
                            userDoc.equityHistory.push({
                                trades:response2.length,
                                equity:response.equity
                            })
                    }
                    await userDoc.save()
                    // console.log(`========================================\n `,
                    //     userCurrentEquity,
                    //     userCurrentBalance,
                    //     userDayBalance,
                    //     userFirstBalance,
                    //     new Date().toLocaleString())
                }
                catch(err){
                    console.log('error saving equity balance and equity history ', user.user_login, err)
                }
            }
    })
}

const saveBalance = async ()=>{
    if(allUsers.length===0  )
        if(!isUsersFetching){
            isUsersFetching = true
            await setUsers()
            isUsersFetching = false
        }
    allUsers.forEach(async user=>{
        if(user.mtAccountId){
            try {
                const account = user.terminalState.accountInformation
                const newUser = await UserModel.findByIdAndUpdate(user._id.toString(), {
                    dayBalance:account.balance
                })
            }
            catch(err){
                console.log('error saving balance user ', user.user_login, err)
            }
        }
    })
}

//Register JOBs
const minimumTradingDays = ()=>{
    //every day at 
    const job = nodeCron.schedule("00 */1 * * * *", function jobYouNeedToExecute() {
        // every minute
        console.log('minimumTradingDays=> ', new Date().toLocaleString());
        saveTradingDays()
    });
    job.start();
}

const saveEquityAndBalance = ()=>{
    //every second
    const job = nodeCron.schedule("*/1 * * * * *", function jobYouNeedToExecute() {
        console.log('saveEquityAndBalance=> ', new Date().toLocaleString());
        getUserEquityAndBalance()
    });
    job.start();
}

const saveDayBalance = ()=>{
    //every day at 01:30
    const job = nodeCron.schedule("00 30 01 */1 * *", function jobYouNeedToExecute() {
        // every day of month at 00:00
        console.log('saveDayBalance=> ', new Date().toLocaleString());
        saveBalance()
    });
    job.start();
}

const readUsersFromCsv = ()=>{
    const job = nodeCron.schedule("00 00 */1 * * *", function jobYouNeedToExecute() {
        // every hour
        console.log('transform users=> ', new Date().toLocaleString());
        const results = [];
        const filePath = path.join(__dirname, '..', 'wp_users.csv')
        fs.createReadStream(filePath)
            .pipe(csv({ separator: ';' }))
            .on('data', (data) => results.push(data))
            .on('end', () => {
                console.log(results[0].ID);
                // console.log(results.map(userItem=>userItem.user_login).every(item=>item.length>3))
                results.forEach(async user=>{
                    // console.log()
                    try{
                        const userDoc = await UserModel.findOne({ID:user.ID})
                        if(userDoc){

                        }
                        else {
                            const { 
                                ID,
                                user_login,
                                user_pass,
                                user_nicename,
                                user_email,
                                user_url,
                                user_registered,
                                user_activation_key,
                                user_status,
                                display_name
                            } = user

                            // const hashedPassword =  await hashPassword(user_email);

                            const userDoc = new UserModel({
                                ID,
                                user_login,
                                user_pass,
                                user_nicename,
                                user_email,
                                user_url,
                                user_registered,
                                user_activation_key,
                                user_status,
                                display_name,
                                role:"user",
                                accountCreatedDate:new Date().toISOString(),
                            })
                            
                            const newUserDoc = await userDoc.save()
                            // console.log(newUserDoc)
                        }    
                    }
                    catch(error){
                        console.log(error, user.ID, user.user_login, user.display_name)
                    }
                })
            })
        console.log('async')
    });
    job.start();

}

const revalidateUSers = ()=>{
    //every day at 01:30
    const job = nodeCron.schedule("00 */1 * * * *", function jobYouNeedToExecute() {
        // every minutes
        console.log('revalidateUSers=> ', new Date().toLocaleString());
        setUsers()
    });
    job.start();
}

module.exports = {
    minimumTradingDays,
    saveEquityAndBalance,
    saveDayBalance,
    readUsersFromCsv,
    revalidateUSers
}