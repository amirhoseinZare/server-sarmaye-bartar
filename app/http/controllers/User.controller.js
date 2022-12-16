const { UserModel } = require('../../models')
const { validationResult } = require("express-validator");
const { hashPassword, convertDateFormat, controller } = require("../../core/utils")
const bcrypt = require("bcrypt");
const hasher = require('wordpress-hash-node');
const { sendMail } = require("../../core/utils")
const MetaApi = require('metaapi.cloud-sdk').default
const { RiskManagement } = require('metaapi.cloud-sdk');
const axios = require('axios');
const { getRedisClient } = require('../../core/redis');
let redis = null
const nodemailer = require('nodemailer')
const mongoose = require("mongoose")
const {
    dailyDrawdonw,
    maxDrawdown
} = require("../../core/emails");
const { createUserAccountService, deployAccountService, unDeployAccountService, getProvisingProfilesService, deleteUserAccountService, getMetaUserService, deActiveUserService } = require("../../services/external/meta")

const getNowUTCDateInMetaFormat = (now) => {
    return `${now.getFullYear()}-${now.getMonth().padStart(2)}-${now.getDate().padStart(2)} ${now.getHours().padStart(2)}-${now.getMinutes().padStart(2)}-${now.getSeconds().padStart(2)}`
}

const formatDateMetaShape = (time) => {
    return new Date(new Date(time).toString().split('GMT')[0] + ' UTC').toISOString().replace("Z", "").replace("T", " ")
}

const convertStringToBoolean = str => str === 'true' ? true : false

const makeChartDot = (arrayItem, idx, lastChartItem) => {
    const offset = 3600000 * (idx + 1)
    const startMili = new Date(lastChartItem.startBrokerTime).getTime()
    const endMili = new Date(lastChartItem.endBrokerTime).getTime()

    return {
        "averageBalance": lastChartItem.averageBalance,
        "averageEquity": lastChartItem.averageEquity,
        "endBrokerTime": formatDateMetaShape(endMili + offset),
        "maxBalance": lastChartItem.maxBalance,
        "maxEquity": lastChartItem.maxEquity,
        "minBalance": lastChartItem.minBalance,
        "minEquity": lastChartItem.minEquity,
        "startBrokerTime": formatDateMetaShape(startMili + offset),
        "addedBySb": true
    }
}

const calcDateDiffInMs = (startDate, endDate) => {
    const startTime = new Date(startDate).getTime()
    const endTime = new Date(endDate).getTime()
    const diff = endTime - startTime
    return {
        diff,
        length: diff / 3600000 - 1
    }
}

const formatChart = (chart, user) => {
    if (chart.length === 0) {
        const firstBalance = user.firstBalance
        const nowUTCDate = new Date(new Date().getTime() - (150 * 60 * 1000))
        nowUTCDate.setMinutes(0)
        nowUTCDate.setMilliseconds(0)
        nowUTCDate.setSeconds(0)
        const month = +nowUTCDate.getMonth() + 1

        return [
            {
                "averageBalance": firstBalance,
                "averageEquity": firstBalance,
                "endBrokerTime": `${nowUTCDate.getFullYear()}-${month.toString().padStart(2, '0')}-${nowUTCDate.getDate().toString().padStart(2, '0')} ${nowUTCDate.getHours().toString().padStart(2, '0')}:59:59.000`,
                "maxBalance": firstBalance,
                "maxEquity": firstBalance,
                "minBalance": firstBalance,
                "minEquity": firstBalance,
                "startBrokerTime": `${nowUTCDate.getFullYear()}-${month.toString().padStart(2, '0')}-${nowUTCDate.getDate().toString().padStart(2, '0')} ${nowUTCDate.getHours().toString().padStart(2, '0')}:00:00.000`,
                "addedBySb": true,
                "isOnly": true
            }
        ]
    }
    let normalChart = []
    chart.forEach((item, index) => {
        if (index === chart.length)
            return
        if (!chart[index + 1]) {
            normalChart.push(item)
            return
        }
        const { diff, length } = calcDateDiffInMs(item.startBrokerTime, chart[index + 1].startBrokerTime)
        if (diff !== 3600000 && length > 0) {
            const addingValues = new Array(length).fill(0).map((arrayItem, index) => makeChartDot(arrayItem, index, item))
            if ((!normalChart.find(item => item.startBrokerTime === chart[index].startBrokerTime))) {
                addingValues.unshift(chart[index])
            }
            // if((!normalChart.find(item=>item.startBrokerTime === chart[index + 1].startBrokerTime))){
            //     addingValues.push(chart[index + 1])
            // }
            normalChart = normalChart.concat(addingValues)
        }
        else {
            if ((!normalChart.find(chartItem => chartItem.startBrokerTime === item.startBrokerTime))) {
                normalChart.push(item)
            }
        }
    })

    const nowDate = new Date(new Date().getTime() - (150 * 60 * 1000))
    nowDate.setMinutes(0)
    nowDate.setMilliseconds(0)
    nowDate.setSeconds(0)

    const { diff, length } = calcDateDiffInMs(normalChart[normalChart.length - 1].startBrokerTime, nowDate)
    const item = normalChart[normalChart.length - 1]
    if (diff !== 3600000 && length > 0) {
        const addingValues = new Array(length).fill(0).map((arrayItem, index) => makeChartDot(arrayItem, index, item))
        normalChart = normalChart.concat(addingValues)
    }
    else {
        if ((!normalChart.find(chartItem => chartItem.startBrokerTime === item.startBrokerTime))) {
            normalChart.push(item)
        }
    }
    return normalChart
}

const getChartApiConfig = (accountId) => {
    const token = "eyJhbGciOiJSUzUxMiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI5M2ExYTM4MWFhMTU3NTU2M2RmYTI4MDk1YWQ3M2RjZSIsInBlcm1pc3Npb25zIjpbXSwidG9rZW5JZCI6IjIwMjEwMjEzIiwiaWF0IjoxNjU2MzQ4MTk3LCJyZWFsVXNlcklkIjoiOTNhMWEzODFhYTE1NzU1NjNkZmEyODA5NWFkNzNkY2UifQ.EipbTU80FTXxvQeq6bYCqQvTbi4riF9VQ3kHCcwmLMrM2j_bFAXkj2HY7H3L61Q6UMKK3Ecn2rWc0zM4sLY-z1lbTu9w4Yzkobg27S57w1pjD6cnGXAFSex6X7ziT51o97r80-_K_8448pLXgDy8Q6m7xBgBfqtTiHlstb9lyylQSUuRIOwv4G7L7hJtde_y5H6EungIfH4MscecR4Gp8yrDMgpVJ9xFRNhNgyiW6y5oSNYFdI8jS5JaY4XxPp9-OH8iql9sWFOl-F8DzwBDyv2-APQkvOXwWLHE0BS9LWkAZG8zV8IMS6RUzMR_p2CBvbSH-NeoHxc5ySqXtNbS3rPlCyRem08dpsoGc36xJuscslrTgw_R_OWV6JJhIB7cJuyyWW_7B3oCY6BpEFD98LYCagLhJWFwhb9MU5oF1H-ZTJ4G07Spm9KcEI9-iVyjxvrSUyWNtEG7m4UNb7JD30O4E1TfluhpI6h-PlY_GTu6x5M18vU2hVY5ES_-1gBpSeuoCbr4KTqEJamLKnO7_zK8tFHi5FwwQbohgu--K07qoxwXAX9NYUrh5FsoH5WqxeUvU8AFjzmztahZKZQgv06NOx5U13JIKz3sM8YmE3MIR8bILx7mG0kQ8sTWnPrCJzae4MZLAhuXTZvq2C07Qw-3sDhjXaDYEHAA58Nyi9E"
    var config = {
        method: 'get',
        url: `https://risk-management-api-v1.new-york.agiliumtrade.ai/users/current/accounts/${accountId}/equity-chart?realTime=true`,
        headers: {
            'auth-token': token,
            "User-Agent": "PostmanRuntime/7.29.0",
            'Connection': 'keep-alive',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive'
        }
    };
    return config
}

const getTrackerApiConfig = (accountId, trackerId) => {
    const token = "eyJhbGciOiJSUzUxMiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI5M2ExYTM4MWFhMTU3NTU2M2RmYTI4MDk1YWQ3M2RjZSIsInBlcm1pc3Npb25zIjpbXSwidG9rZW5JZCI6IjIwMjEwMjEzIiwiaWF0IjoxNjU2MzQ4MTk3LCJyZWFsVXNlcklkIjoiOTNhMWEzODFhYTE1NzU1NjNkZmEyODA5NWFkNzNkY2UifQ.EipbTU80FTXxvQeq6bYCqQvTbi4riF9VQ3kHCcwmLMrM2j_bFAXkj2HY7H3L61Q6UMKK3Ecn2rWc0zM4sLY-z1lbTu9w4Yzkobg27S57w1pjD6cnGXAFSex6X7ziT51o97r80-_K_8448pLXgDy8Q6m7xBgBfqtTiHlstb9lyylQSUuRIOwv4G7L7hJtde_y5H6EungIfH4MscecR4Gp8yrDMgpVJ9xFRNhNgyiW6y5oSNYFdI8jS5JaY4XxPp9-OH8iql9sWFOl-F8DzwBDyv2-APQkvOXwWLHE0BS9LWkAZG8zV8IMS6RUzMR_p2CBvbSH-NeoHxc5ySqXtNbS3rPlCyRem08dpsoGc36xJuscslrTgw_R_OWV6JJhIB7cJuyyWW_7B3oCY6BpEFD98LYCagLhJWFwhb9MU5oF1H-ZTJ4G07Spm9KcEI9-iVyjxvrSUyWNtEG7m4UNb7JD30O4E1TfluhpI6h-PlY_GTu6x5M18vU2hVY5ES_-1gBpSeuoCbr4KTqEJamLKnO7_zK8tFHi5FwwQbohgu--K07qoxwXAX9NYUrh5FsoH5WqxeUvU8AFjzmztahZKZQgv06NOx5U13JIKz3sM8YmE3MIR8bILx7mG0kQ8sTWnPrCJzae4MZLAhuXTZvq2C07Qw-3sDhjXaDYEHAA58Nyi9E"
    var config = {
        method: 'get',
        url: `https://risk-management-api-v1.new-york.agiliumtrade.ai/users/current/accounts/${accountId}/drawdown-trackers/${trackerId}/statistics?limit=1000000000`,
        headers: {
            'auth-token': token,
            "User-Agent": "PostmanRuntime/7.29.0",
            'Connection': 'keep-alive',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive'
        }
    };
    return config
}

const addDrawdownTracker = async (mtAccountId) => {
    const token = 'eyJhbGciOiJSUzUxMiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI5M2ExYTM4MWFhMTU3NTU2M2RmYTI4MDk1YWQ3M2RjZSIsInBlcm1pc3Npb25zIjpbXSwidG9rZW5JZCI6IjIwMjEwMjEzIiwiaWF0IjoxNjU3Nzk2MjY1LCJyZWFsVXNlcklkIjoiOTNhMWEzODFhYTE1NzU1NjNkZmEyODA5NWFkNzNkY2UifQ.Uo1bOKN39o-zPJj1HrFbk25b4EEJyixpo89TOW0jNQcjBCpotnGXJBF2W1oCxULVJqNAOYRqL6cMd_iWjNFHlbr5riF30Bj5R_PaoPTL7nB8VO8h_NHV7yQER3JdLFpOwFa3prsFs5DU33bvV6eesiLWNMicaVhwpA5-LJuRSKz-_CMwlGlgiySVJmgzj30LnVVhfjjyhXZmD_rdq7cIjSCZbWIk4hCGy1kaZooIzz3PeR36s205v90u7_M2QTQLi_LBDRpD0H67ny6MvQolIlyfwNYvkn3eke11hKkolamZ0YQlCVXFbKsZlON4DW9zGlZbfEa-VhILAIYvY1Nja8z09QXwPlBknA6XE89XMOrDdM1qySh_ClsoNVhCVPlPLT2gDdc9nVQj5XRCVwHtrYgAOqcwtOAoxNLeEywhVPJBiI1arULcu7-Z0uL9aN6Y4oR5vyca4-n02xeJtbkiOKz1xQcmTk5iTTTSh14iino7QhBdB4VB0_yvAZo9KCW18eB9I8YDJKg79AfXBoRS4x9w_eDE1QkrjgdPmSALWYM6UmPnTPXJNcqwAX9obQ7UVrxkHjx5LCPw8Tyqa68JnYCV6vQC3FdTijr_ZmdSPPQh-dvem_GxrMbF7ouLhIy9rCMNsB_b4qp0HngIfIBZdJ5tqvMEQJM89IECVnRelMU'
    const data = {
        "name": `${mtAccountId} sb-panel-new-2359`,
        "startBrokerTime": "2020-02-01 23:59:00.000",
        "endBrokerTime": "2025-12-20 23:59:00.000",
        "period": "day",
        "relativeDrawdownThreshold": 0.95
    }
    console.log('tracker, ', data)
    const config = {
        method: 'post',
        url: `https://risk-management-api-v1.new-york.agiliumtrade.ai/users/current/accounts/${mtAccountId}/trackers`,
        headers: {
            'User-Agent': "PostmanRuntime/7.29.0",
            'auth-token': token,
            'Accept-Encoding': "gzip, deflate, br",
            'Connection': "keep-alive"
        },
        data: data
    };
    const res = await axios(config)
    const userDoc = await UserModel.updateOne({ mtAccountId }, {
        "$set": {
            trackerId: res.data.id
        }
    })
    return userDoc
}

const calculateObjective = ({ userName, metaUsername, user_email, tradeDaysCount, maxDailyLossObjective, chart, maxLossLimit, firstBalance, startTradeDay, hasFailedMaxLoss, hasFailedDailyLoss, percentDays, maxTradeDays }) => {
    const allowableMaxLossLimit = 1 - (maxLossLimit / 100)

    const currentTodayData = chart.filter(item => item.startBrokerTime.split(" ")[0] === new Date().toISOString().split("T")[0])
    const allTodayEquity = currentTodayData.map(item => item.minEquity)
    const allTodayBalance = currentTodayData.map(item => item.maxBalance)

    const { dayBalance, failed: isMaxDailyLossFailed, result } = calculateMaxDailyLossObjective(maxDailyLossObjective, firstBalance)
    const equity = allTodayEquity.length > 0 ? Math.min(...allTodayEquity) : chart[chart.length - 1]?.minEquity
    //balance
    const balance = allTodayBalance.length > 0 ? Math.max(...allTodayBalance) : chart[chart.length - 1]?.maxBalance
    // const newTradeDays = chart.length>0 ? new Date().toLocaleString(chart[0]) : startTradeDay

    if (hasFailedMaxLoss == false && !(hasFailedMaxLoss ? false : equity > (firstBalance * allowableMaxLossLimit))) {
        // maxDrawdown({to:user_email, userName, firstBalance, balance})
    }

    return {
        objective: {
            minimumTradeDaysObjective: {
                count: tradeDaysCount,
                passed: tradeDaysCount >= 5,
                maxTradeDays,
                firstTradeDay: startTradeDay
            },
            maxLoss: {
                passed: hasFailedMaxLoss ? false : equity > (firstBalance * allowableMaxLossLimit),
                equity: equity,
                firstBalance: firstBalance,
                limit: (firstBalance * allowableMaxLossLimit),
                allowableMaxLossLimit: maxLossLimit
            },
            maxDailyLoss: {
                passed: !isMaxDailyLossFailed,
                equity: equity,
                dayBalance: dayBalance,
                limit: (dayBalance * 0.95)
            },
            profitTarget: {
                passed: balance > (firstBalance * (1 + (percentDays / 100))),
                firstBalance: firstBalance,
                balance: balance,
                percentDays: percentDays,
                limit: (firstBalance * (1 + (percentDays / 100)))
            }
        },
        data: {
            allowableMaxLossLimit,
            tradeDaysCount,
            equity,
            balance,
            dayBalance,
            tradeDaysCount
        }

    }
}

const saveChartInMemory = ({ accountId, chart, objective }) => {
    const formattedChart = {
        chart: chart,
        objective: objective
    }
    const parsedChart = JSON.stringify(formattedChart)
    redis.set(accountId, parsedChart)
        .then(result => {
            console.log("redis saved")
        })
        .catch(err => {
            console.log(err)
        })
}

const getChartFromMemory = async ({ accountId }) => {
    // try {
    const result = await redis.get(accountId)
    const parsedResult = JSON.parse(result)
    const chart = parsedResult ? parsedResult : {
        chart: [],
        objective: {}
    }
    return chart
    // }

}

const calculateMaxDailyLossObjective = (maxDailyLossObjective, firstBalance) => {
    if ((!maxDailyLossObjective) || maxDailyLossObjective.length <= 0)
        return {
            failed: null,
            dayBalance: null,
            result: null
        }
    const result = maxDailyLossObjective.find(item => item.maxAbsoluteDrawdown > item.initialBalance * 0.05 && item.initialBalance > 0)
    // console.log({result}, maxDailyLossObjective)
    return {
        failed: result ? true : false,
        dayBalance: maxDailyLossObjective.length > 1 ? maxDailyLossObjective[0].initialBalance : firstBalance,
        result: maxDailyLossObjective.length > 1 ? maxDailyLossObjective[0] : firstBalance
    }
}

const updateObjective = ({ userName, metaUsername, user_email, tradeDaysCount, maxDailyLossObjective, formattedChart, maxLossLimit, firstBalance, startTradeDay, hasFailedMaxLoss, hasFailedDailyLoss, percentDays, userId, maxTradeDays }) => {
    const { data, objective } = calculateObjective({ userName, metaUsername, user_email, tradeDaysCount, maxDailyLossObjective, chart: formattedChart, maxLossLimit, firstBalance, startTradeDay, hasFailedMaxLoss, hasFailedDailyLoss, percentDays, maxTradeDays })
    const {
        allowableMaxLossLimit,
        userTradeDaysCount,
        equity,
        balance,
        dayBalance,
        newTradeDays,
    } = data

    const {
        count,
        passed,
        firstTradeDay,
    } = objective.minimumTradeDaysObjective

    let endTradeDay = ''
    if (maxTradeDays > 0) {
        if (firstTradeDay)
            endTradeDay = new Date(new Date(firstTradeDay).getTime() + (86400 * 1000 * maxTradeDays)).toISOString().split("T")[0]
    }

    const updatingValue = {
        hasFailedMaxLoss: hasFailedMaxLoss || equity < (firstBalance * allowableMaxLossLimit),
        hasFailedDailyLoss: !objective.maxDailyLoss.passed,
        startTradeDay: firstTradeDay,
        endTradeDay: endTradeDay,
        balance: balance,
        equity: equity,
        dayBalance: dayBalance,
        tradeDaysCount: tradeDaysCount
    }

    UserModel.findByIdAndUpdate(userId, updatingValue, { new: true }).select("-user_pass -minEquityHistory").then(res => {
    })
        .catch(err => {
            console.log('error while updating objective')
        })
    return objective
}

const getHistoryOrdersConfig = ({ accountId, maxTradeDays = 60 }) => {
    const token = "eyJhbGciOiJSUzUxMiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI5M2ExYTM4MWFhMTU3NTU2M2RmYTI4MDk1YWQ3M2RjZSIsInBlcm1pc3Npb25zIjpbXSwidG9rZW5JZCI6IjIwMjEwMjEzIiwiaWF0IjoxNjU2MzQ4MTk3LCJyZWFsVXNlcklkIjoiOTNhMWEzODFhYTE1NzU1NjNkZmEyODA5NWFkNzNkY2UifQ.EipbTU80FTXxvQeq6bYCqQvTbi4riF9VQ3kHCcwmLMrM2j_bFAXkj2HY7H3L61Q6UMKK3Ecn2rWc0zM4sLY-z1lbTu9w4Yzkobg27S57w1pjD6cnGXAFSex6X7ziT51o97r80-_K_8448pLXgDy8Q6m7xBgBfqtTiHlstb9lyylQSUuRIOwv4G7L7hJtde_y5H6EungIfH4MscecR4Gp8yrDMgpVJ9xFRNhNgyiW6y5oSNYFdI8jS5JaY4XxPp9-OH8iql9sWFOl-F8DzwBDyv2-APQkvOXwWLHE0BS9LWkAZG8zV8IMS6RUzMR_p2CBvbSH-NeoHxc5ySqXtNbS3rPlCyRem08dpsoGc36xJuscslrTgw_R_OWV6JJhIB7cJuyyWW_7B3oCY6BpEFD98LYCagLhJWFwhb9MU5oF1H-ZTJ4G07Spm9KcEI9-iVyjxvrSUyWNtEG7m4UNb7JD30O4E1TfluhpI6h-PlY_GTu6x5M18vU2hVY5ES_-1gBpSeuoCbr4KTqEJamLKnO7_zK8tFHi5FwwQbohgu--K07qoxwXAX9NYUrh5FsoH5WqxeUvU8AFjzmztahZKZQgv06NOx5U13JIKz3sM8YmE3MIR8bILx7mG0kQ8sTWnPrCJzae4MZLAhuXTZvq2C07Qw-3sDhjXaDYEHAA58Nyi9E"
    const noewDate = new Date().getTime()
    const reallyMaxTradeDays = (maxTradeDays == 0 || !maxTradeDays) ? 60 : maxTradeDays
    const startTime = new Date(new Date(noewDate - 86400 * 1000 * (reallyMaxTradeDays + 1)))
    const endTime = new Date(new Date(noewDate + 86400 * 1000 * ((reallyMaxTradeDays + 1))))
    console.log("inside getHistoryOrdersConfig", reallyMaxTradeDays, { startTime }, { endTime }, { maxTradeDays })
    const url = `https://mt-client-api-r6fbqlkvmwtbessr.new-york.agiliumtrade.ai/users/current/accounts/${accountId}/history-orders/time/${startTime.toISOString()}/${endTime.toISOString()}`
    console.log(url)
    var config = {
        method: 'get',
        url: url,
        headers: {
            'auth-token': token,
            "User-Agent": "PostmanRuntime/7.29.0",
            'Connection': 'keep-alive',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive'
        }
    };
    return config
}

const calculateMinTradeDays = async ({ accountId, maxTradeDays = 60 }) => {
    try {
        const { data } = await axios(getHistoryOrdersConfig({ accountId: accountId, maxTradeDays }))
        let tradeDaysCount = 0
        let firstTradeDay = "-"
        let endTradeDay = "-"
        if (data.length > 0) {
            tradeDaysCount = [...new Set([...data.map(item => item.brokerTime.split(" ")[0])])].length
            firstTradeDay = data[0].brokerTime.split(" ")[0]
            endTradeDay = new Date(new Date(firstTradeDay).getTime() + (86400 * 1000 * (maxTradeDays))).toISOString().split("T")[0]
        }

        return {
            tradeDaysCount,
            firstTradeDay,
            endTradeDay
        }
    }
    catch (err) {
        console.log(err)
        return {
            tradeDaysCount: null,
            firstTradeDay: null
        }
    }
}

const saveProfilesInMemory = ({ profiles }) => {
    const parsedProfiles = JSON.stringify(profiles)
    return redis.set('mt-profiles', parsedProfiles)
}

const getProfilesFromMemory = async () => {
    const result = await redis.get('mt-profiles')
    const parsedResult = JSON.parse(result)

    return parsedResult
}

const findServerByAccountTypeAndPlatform = ({ profiles, accountType, platform }) => {
    const server = profiles.find(item => {
        return item.name.toLowerCase() === accountType.toLowerCase() && item.version === +platform.substring(2, 3)
    })
    if (server)
        return server._id
    return null
}

class UserController {
    async getAll(req, res) {
        let { 
            pageSize = 20, 
            pageNumber = 1, 
            user_email = "", 
            display_name = "", 
            level = "", 
            user_login = "", 
            platform = "", 
            accountType = "", 
            metaUsername = "", 
            standardType = "", 
            hasFailedMaxLoss, 
            hasFailedDailyLoss, 
            status,
            anyObjectiveFailed=""
        } = req.query
        pageSize = +pageSize
        pageNumber = +pageNumber
        pageNumber = pageNumber - 1
        const query = {
            "$or":[]
        }
        if (user_email) {
            query["$or"].push({user_email: user_email})
            query["$or"].push({accountEmail: user_email})
        }

        if(convertStringToBoolean(anyObjectiveFailed)) {
            query["$or"].push({hasFailedDailyLoss: true})
            query["$or"].push({hasFailedMaxLoss: true})
        }

        if(query["$or"].length ===0)
            delete query["$or"]

        if (display_name)
            query.display_name = display_name
        if (level)
            query.level = level
        if (user_login)
            query.user_login = user_login
        if (platform)
            query.platform = platform
        if (accountType)
            query.accountType = accountType
        if (metaUsername)
            query.metaUsername = metaUsername
        if (standardType)
            query.standardType = standardType
        if (hasFailedMaxLoss === 'false' || hasFailedMaxLoss === 'true')
            query.hasFailedMaxLoss = convertStringToBoolean(hasFailedMaxLoss)
        if (hasFailedDailyLoss === 'false' || hasFailedDailyLoss === 'true')
            query.hasFailedDailyLoss = convertStringToBoolean(hasFailedDailyLoss)
        if (status)
            query.status = status
        const allUsers = await UserModel.find(query).skip(pageNumber * pageSize).limit(pageSize).select("-user_pass -minEquityHistory -equityHistory -user_activation_key -user_status -ID -user_url")
        const count = await UserModel.count(query)
        return res.status(200).json({
            result: {
                items: allUsers,
                totalCount: count,
                pageNumber: pageNumber + 1,
                pageSize
            },
            message: "عملیات با موفقیت انجام شد",
            success: true
        })
    }

    async getOne(req, res) {
        const { userId } = req.params

        let selectString = ""
        let orQuery = {}

        if (req.user.role === "user") {
            selectString += "-mtAccountId -mtAccessToken"
            orQuery["$or"] = [
                {
                    accountEmail: req.user.user_email,
                },
                {
                    user_email: req.user.user_email,
                }
            ]
        }
        try {
            const user = await UserModel.findOne({ _id: userId, ...orQuery }).select("-user_pass -minEquityHistory -equityHistory" + selectString)
            if (!user) {
                if (req.user.role === "user")
                    return res
                        .status(403)
                        .send({ message: "امکان دسترسی به این بخش برای شما مجاز نمی باشد", result: null, success: false });
                return res.status(200).json({
                    result: null,
                    message: "کاربری یافت نشد",
                    success: false
                })
            }
            return res.status(200).json({
                result: user,
                message: "عملیات با موفقیت انجام شد",
                success: true
            })
        }
        catch (err) {
            return res.status(404).json({
                result: null,
                message: "کاربری یافت نشد",
                success: false
            })
        }
    }

    async post(req, res, next) {
        const error = validationResult(req)
        if (!error.isEmpty()) {
            return res
                .status(400)
                .send({ result: null, message: "خطا در اعتبارسنجی", errors: error.array(), success: false });
        }
        const {
            user_login,
            display_name,
            user_email,
            firstBalance,
            maxTradeDays,
            percentDays,
            infinitive,
            accountType,
            platform,
            role,
            user_pass,

            mtAccessToken,

            ID,
            user_nicename,
            user_url,
            // user_registered,
            user_activation_key,
            user_status,

            startTradeDay,
            endTradeDay,
            maxLossLimit,
            metaUsername,
            metaPassword,
            investorPassword,
            type,
            level,
        } = req.body;

        let {
            mtAccountId
        } = req.body

        const userExist = await UserModel.findOne({ $or: [{ user_email: user_email }, { user_login: user_login }], type: "primary" })

        if (userExist) {
            if (type === "primary")
                return res
                    .status(400)
                    .send({ message: "کاربر با این ایمیل وجود یا نام کاربری وجود دارد", result: null, success: false });
        }
        redis = getRedisClient()
        try {
            const profilesCache = await getProfilesFromMemory()
            const provisioningProfileId = findServerByAccountTypeAndPlatform({ profiles: profilesCache, accountType, platform })
            const res = await createUserAccountService({
                login: metaUsername,
                password: investorPassword,
                name: user_login,
                server: accountType,
                provisioningProfileId,
                platform: platform.toLowerCase(),
                symbol: "",
                magic: 0,
                quoteStreamingIntervalInSeconds: 2.5
            })
            mtAccountId = res.data.id
            const deployedAccountRes = await deployAccountService({ mtAccountId })
        }
        catch (error) {
            console.log(error)
            return res
                .status(400)
                .send({ message: "سرویس های خارجی با خطا رو به رو شدند", result: null, success: false });
        }
        const randomPassword = Math.random().toString().slice(2, 11);

        const hashedPassword = hasher.HashPassword(randomPassword);
        // const hashedPassword =  await hashPassword(user_pass);
        const nowDate = new Date()

        const newUser = new UserModel({
            user_login,
            display_name,
            user_email: type === "secondary" ? undefined : type === "primary" ? user_email : "",
            firstBalance,
            dayBalance: firstBalance,
            maxTradeDays,
            percentDays,
            infinitive,
            accountType,
            role,
            user_pass: hashedPassword,
            platform,

            mtAccountId,
            mtAccessToken,

            ID,
            user_nicename,
            user_url,
            user_registered: convertDateFormat(nowDate),
            user_activation_key,
            user_status,

            startTradeDay,
            endTradeDay,
            accountCreatedDate: nowDate.toISOString(),
            equityHistory: [],
            positions: [],
            equity: firstBalance,
            flyEquity: firstBalance,
            balance: firstBalance,
            maxLossLimit: maxLossLimit,
            metaUsername,
            type,
            level,
            status: 'active',
            accountEmail: type === "primary" ? undefined : type === "secondary" ? user_email : ""
        })

        const userDoc = await newUser.save()
        const trackerResult = await addDrawdownTracker(mtAccountId)

        const token = newUser.generateToken();
        let emailText = `
سلام و عرض احترام خدمت تریدر گرامی؛
حساب شما در پرتابل سرمایه گذار برتر ایجاد شد
.برای بررسی و انالیز حساب میتوانید از طریق یوزرنیم و پسورد ارسالی، به حساب خود متصل شوید
${(!userExist) ? `Email: ${user_email}` : ""}
${(!userExist) ? `Password: ${randomPassword}` : ""}
Platform: ${platform}
Server: ${accountType}
Balance: ${firstBalance}
Level: ${level}
            `
        if (metaUsername && metaPassword)
            emailText = emailText.concat(`\nMeta Trader Username:${metaUsername}\nMeta Trader Password:${metaPassword}`)
        emailText = emailText.concat("\nآرزوی موفقیت❤️")
        sendMail({
            to: user_email,
            subject: "ساخت اکانت جدید",
            text: emailText
        })
        return res.header("x-auth-token", token).status(201).json({
            message: "کاربر با موفقیت اضافه شد",
            result: userDoc,
            success: true
        });
    }

    async patch(req, res) {
        const {
            display_name,
            firstBalance,
            maxTradeDays,
            percentDays,
            infinitive,
            accountType,
            platform,
            role,
            mtAccountId,
            mtAccessToken,
            ID,
            user_nicename,
            user_url,
            user_activation_key,
            user_status,
            startTradeDay,
            endTradeDay,
            user_pass,
            maxLossLimit,
            status,
            level,
            metaUsername
            // accountCreatedDate,
        } = req.body

        const hashedPassword = hasher.HashPassword(user_pass);

        const replacingValue = {
            display_name,
            firstBalance,
            maxTradeDays,
            percentDays,
            infinitive,
            accountType,
            platform,
            role,
            mtAccountId,
            mtAccessToken,
            ID,
            user_nicename,
            user_url,
            user_activation_key,
            user_status,

            startTradeDay,
            endTradeDay,
            maxLossLimit,
            status,
            level,
            metaUsername
            // accountCreatedDate,
        }
        if (user_pass)
            replacingValue.user_pass = hashedPassword

        Object.keys(replacingValue).forEach(key => replacingValue[key] === undefined && delete replacingValue[key])

        const error = validationResult(req)
        if (!error.isEmpty()) {
            return res
                .status(400)
                .send({ result: null, message: "خطا در اعتبارسنجی", errors: error.array(), success: false });
        }

        const { userId } = req.params
        try {
            const user = await UserModel.findByIdAndUpdate(userId, replacingValue, { new: true }).select("-user_pass -equityHistory -minEquityHistory")
            if (!user) {
                return res.status(404).json({
                    result: null,
                    message: "کاربری یافت نشد",
                    success: false
                })
            }
            return res.status(200).json({
                result: user,
                message: "عملیات با موفقیت انجام شد",
                success: true
            })
        }
        catch (err) {
            return res.status(404).json({
                result: null,
                message: "کاربری یافت نشد",
                success: false
            })
        }

    }

    async delete(req, res) {
        const { userId } = req.params
        try {
            const user = await UserModel.findByIdAndDelete(userId).select("-user_pass -equityHistory -minEquityHistory")
            if (!user) {
                return res.status(404).json({
                    result: null,
                    message: "کاربری یافت نشد",
                    success: false
                })
            }
            const { mtAccountId } = user
            const call = await deleteUserAccountService({ mtAccountId })
            return res.status(200).json({
                result: user,
                message: "عملیات با موفقیت انجام شد",
                success: true
            })
        }
        catch (err) {
            return res.status(404).json({
                result: null,
                message: "کاربری یافت نشد",
                success: false
            })
        }
    }

    async login(req, res) {
        const {
            user_email,
            user_pass
        } = req.body

        const error = validationResult(req)
        if (!error.isEmpty()) {
            return res
                .status(400)
                .send({ result: null, message: "خطا در اعتبارسنجی", errors: error.array(), success: false });
        }
        const user = await UserModel.findOne({ user_email: user_email.trim(), type: "primary" })
        const accounts = await UserModel.find({ accountEmail: user_email }).select("-user_pass  -minEquityHistory -equityHistory -user_activation_key -user_status -ID -user_url ")

        if (!user) {
            return res
                .status(401)
                .send({ message: "کاربری با مشخصات ارسال شده یافت نشد", result: null, success: false });
        }
        const checkPass = hasher.CheckPassword(user_pass.trim(), user.user_pass); //This will return true;
        if (!checkPass) {
            return res
                .status(401)
                .send({ message: "کاربری با مشخصات ارسال شده یافت نشد", result: null, success: false });
        }
        const token = user.generateToken();
        delete user.user_pass
        const {
            accountType,
            balance,
            dayBalance,
            display_name,
            endTradeDay,
            equity,
            firstBalance,
            infinitive,
            maxTradeDays,
            percentDays,
            platform,
            role,
            startTradeDay,
            tradeDaysCount,
            user_login,
            user_nicename,
            _id,
            mtAccountId,
            accountEmail,
            status,
            type,
            level,
            metaUsername
        } = user
        const userObject = {
            accountType,
            balance,
            dayBalance,
            display_name,
            endTradeDay,
            equity,
            firstBalance,
            infinitive,
            maxTradeDays,
            percentDays,
            platform,
            role,
            startTradeDay,
            tradeDaysCount,
            user_login,
            user_nicename,
            _id,
            mtAccountId,
            accountEmail,
            user_email,
            accounts: accounts,
            status,
            type,
            level,
            endTradeDay,
            metaUsername
        }
        // user.accounts = accounts
        return res
            .header("x-auth-token", token)
            .send({ message: "با موفقیت وارد سیستم شدید", result: userObject, token: token, resultCode: 2000, success: true });
    }

    async getProfile(req, res) {
        const { user_email } = req.user
        const accounts = await UserModel.find({ accountEmail: user_email }).select("-user_pass  -minEquityHistory -equityHistory -user_activation_key -user_status -ID -user_url ")
        const {
            accountType,
            balance,
            dayBalance,
            display_name,
            endTradeDay,
            equity,
            firstBalance,
            infinitive,
            maxTradeDays,
            percentDays,
            platform,
            role,
            startTradeDay,
            tradeDaysCount,
            user_login,
            user_nicename,
            _id,
            mtAccountId,
            accountEmail,
            status,
            type,
            level,
            createdAt
        } = req.user
        const userObject = {
            accountType,
            balance,
            dayBalance,
            display_name,
            endTradeDay,
            equity,
            firstBalance,
            infinitive,
            maxTradeDays,
            percentDays,
            platform,
            role,
            startTradeDay,
            tradeDaysCount,
            user_login,
            user_nicename,
            _id,
            mtAccountId,
            accountEmail,
            user_email,
            accounts: accounts,
            status,
            type,
            level,
            endTradeDay,
            createdAt
        }
        return res.status(200).json({
            result: userObject, message: "عملیات با موفقیت انجام شد", success: true
        })
    }

    // not is use
    async getAllObjectives(req, res) {
        // not is use
        const { userId } = req.params
        if (req.user.role === "user" && req.user._id.toString() !== userId.toString()) {
            return res
                .status(403)
                .send({ message: "امکان دسترسی به این بخش برای شما مجاز نمی باشد", result: null, success: false });
        }
        try {
            const toSelect = "firstBalance startTradeDay percentDays hasFailedDailyLoss hasFailedMaxLoss maxLossLimit mtAccountId maxTradeDays"
            const notSelect = "-user_pass -minEquityHistory".concat(" ")
            const user = await UserModel.findById(userId).select(notSelect.concat(toSelect))
            const { firstBalance, startTradeDay, percentDays, hasFailedDailyLoss, hasFailedMaxLoss, maxLossLimit, mtAccountId, maxTradeDays } = user
            if (!user) {
                return res.status(404).json({
                    result: null,
                    message: "کاربری یافت نشد",
                    success: false
                })
            }

            const { data: chart } = await axios(getChartApiConfig(mtAccountId))
            const formattedChart = formatChart(chart, user)

            const { result, objective } = calculateObjective({ formattedChart, maxLossLimit, firstBalance, startTradeDay, hasFailedMaxLoss, hasFailedDailyLoss, percentDays, user_email: user.user_email })
            const {
                allowableMaxLossLimit,
                userTradeDaysCount,
                equity,
                balance,
                dayBalance,
                newTradeDays
            } = result

            UserModel.findByIdAndUpdate(userId, {
                hasFailedMaxLoss: hasFailedMaxLoss || equity < (firstBalance * allowableMaxLossLimit),
                hasFailedDailyLoss: hasFailedDailyLoss || equity < (dayBalance * 0.95),
                startTradeDay: newTradeDays,
                endTradeDay: new Date(new Date(newTradeDays).getTime() + (86400 * 1000 * maxTradeDays)).toLocaleString(),
                balance: balance
            }, { new: true }).select("-user_pass -minEquityHistory").then(res => {
            })

            return res
                .status(200)
                .json({
                    result: objective,
                    message: "عملیات با موفقیت انجام شد",
                    success: true
                })

        }
        catch (err) {
            console.log(err)
            return res.status(200).json({
                result: null,
                message: "در حال دریافت داده ها",
                success: false
            })
        }

    }

    async getUserEquityHistory(req, res) {
        const { userId } = req.params
        if (req.user.role === "user" && req.user._id.toString() !== userId.toString()) {
            return res
                .status(403)
                .send({ message: "امکان دسترسی به این بخش برای شما مجاز نمی باشد", result: null, success: false });
        }

        try {
            const user = await UserModel.findById(userId).select("-user_pass")
            if (!user) {
                return res.status(404).json({
                    result: null,
                    message: "کاربری یافت نشد",
                    success: false
                })
            }
            return res
                .status(200)
                .json({
                    result: user.minEquityHistory,
                    message: "عملیات با موفقیت انجام شد",
                    success: true
                })
        }
        catch (err) {
            console.log(error)
            return res.status(404).json({
                result: null,
                message: "کاربری یافت نشد",
                success: false
            })
        }
    }

    async getRankings(req, res) {
        let { pageSize = 20, pageNumber = 1, firstBalance } = req.query
        pageSize = +pageSize
        pageNumber = +pageNumber
        pageNumber = pageNumber - 1

        let select = "display_name equity balance firstBalance "
        if (req?.user?.role === "user")
            select += " -_id"
        if (req?.user?.role === "admin")
            select += " user_email id"

        let toSelect = {
            infinitive: true, hasFailedMaxLoss: false, hasFailedDailyLoss: false, balance: { $ne: null }
        }
        if (firstBalance)
            toSelect["firstBalance"] = +firstBalance

        const users = await UserModel
            .aggregate([
                {
                    $match: toSelect
                },
                {
                    $addFields: {
                        profit: {
                            $function: {
                                body: function (balance, firstBalance) {
                                    return ((balance - firstBalance) / firstBalance) * 100
                                },
                                args: ["$balance", "$firstBalance"],
                                lang: "js"
                            }
                        }

                    }
                },
                { "$project": { display_name: 1, equity: 1, balance: 1, firstBalance: 1, profit: 1, accountType: 1 } },
            ])
            .sort('-profit')
            .skip(pageNumber * pageSize)
            .limit(pageSize)
        const allUsers = users.filter(user => user.profit > 0)
        return res.status(200).json(
            {
                items: allUsers,
                totalCount: allUsers.length,
                pageNumber: pageNumber + 1,
                pageSize,
                success: true
            }
        )
    }

    async getChart(req, res) {

        let selectString = ""
        let orQuery = {}

        if (req.user.role === "user") {
            selectString += "-mtAccountId -mtAccessToken"
            orQuery["$or"] = [
                {
                    accountEmail: req.user.user_email,
                },
                {
                    user_email: req.user.user_email,
                }
            ]
        }

        const { userId: accountId } = req.params
        redis = getRedisClient()
        const user = await UserModel.findOne({ mtAccountId: accountId, ...orQuery }, { tradeDaysCount: 1, user_login: 1, user_email: 1, metaUsername: 1, mtAccountId: 1, firstBalance: 1, startTradeDay: 1, percentDays: 1, hasFailedDailyLoss: 1, hasFailedMaxLoss: 1, maxLossLimit: 1, maxTradeDays: 1, trackerId: 1, status: 1 })
            .catch(err => {
                res.send({
                    result: null,
                    success: true,
                    message: "عملیات با خطا روبرو شد."
                })
            })
        if (!user) {
            return res.status(404).json({
                result: null,
                message: "امکان دسترسی به این بخش برای شما مجاز نمی باشد",
                success: false
            })
        }
        const { firstBalance, startTradeDay, percentDays, hasFailedDailyLoss, hasFailedMaxLoss, maxLossLimit, mtAccountId, maxTradeDays, _id: userId, trackerId, status } = user

        try {
            let chart = []
            let maxDailyLossObjective = {}
            let tradeDaysObjective
            console.log('try 0 ', new Date().toLocaleString())
            const nowUTCMinutes = new Date().getUTCMinutes()
            if (status === 'deactive') {
                const data = await getChartFromMemory({ accountId })
                chart = data.chart
                maxDailyLossObjective = [data.objective] || null
                const minTradeDayRes = await calculateMinTradeDays({ accountId, maxTradeDays })
                tradeDaysObjective = {
                    tradeDaysCount: minTradeDayRes?.tradeDaysCount,
                    firstTradeDay: minTradeDayRes?.firstTradeDay
                }
            }
            else {
                const promises = [axios(getChartApiConfig(accountId))]
                if (trackerId) {
                    promises.push(axios(getTrackerApiConfig(accountId, trackerId)))
                }
                else {
                    promises.push(new Promise((resolve, reject) => {
                        resolve(null)
                    }))
                }
                const [chartData, objectiveData] = await Promise.all(promises)
                chart = chartData.data
                maxDailyLossObjective = objectiveData?.data || []
                tradeDaysObjective = {
                    tradeDaysCount: 0,
                    firstTradeDay: ''
                }

            }
            const formattedChart = formatChart(chart, user)
            const objective = updateObjective({
                userName: user.user_login,
                user_email: user.user_email,
                metaUsername: user.metaUsername,
                tradeDaysCount: maxDailyLossObjective.reduce((acc, cv) => acc + (cv.tradeDayCount || 0), 0),
                maxDailyLossObjective,
                formattedChart,
                maxLossLimit,
                firstBalance,
                startTradeDay: maxDailyLossObjective && Array.isArray(maxDailyLossObjective) && maxDailyLossObjective.length > 0 ? maxDailyLossObjective[0].startBrokerTime.split(" ")[0] : startTradeDay,
                hasFailedMaxLoss,
                hasFailedDailyLoss,
                percentDays,
                userId,
                maxTradeDays
            })
            saveChartInMemory({ accountId, chart: formattedChart, objective: objective })
            console.log('try 2 ', new Date().toLocaleString())
            return res.send({
                result: {
                    chart: formattedChart,
                    objective: objective
                },
                success: true,
                message: "عملیات با موفقیت انجام شد."
            })
        }
        catch (error) {
            console.log(error)
            if (error.status === 404) {
                return res.status(400).json({
                    success: false,
                    result: null,
                    message: "یوزر مورد نظر موجود نمی باشد"
                })
            }
            console.log("error", "error")
            console.log('catch 1 ', new Date().toLocaleString())
            const { chart } = await getChartFromMemory({ accountId })
            const objective = updateObjective({
                userName: user.user_login,
                user_email: user.user_email,
                metaUsername: user.metaUsername,
                formattedChart: chart,
                maxLossLimit,
                firstBalance,
                startTradeDay,
                hasFailedMaxLoss,
                hasFailedDailyLoss,
                percentDays,
                userId,
                maxTradeDays
            })
            console.log('catch 2 ', new Date().toLocaleString())
            return res.send({
                result: {
                    chart: formatChart(chart, user),
                    objective: objective
                },
                success: true,
                message: "عملیات با موفقیت انجام شد."
            })
        }
    }

    async redis(req, res) {
        const pattern = new RegExp('^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$', 'i');
        const users = await UserModel.find({}).select("mtAccountId user_email")
        return res.send(users)
    }

    async tracker(req, res) {
        const { mtAccountId } = req.body
        try {
            const userDoc = await addDrawdownTracker(mtAccountId)
            return res.send({
                result: userDoc,
                success: true,
                message: "عملیات با موفقیت انجام شد."
            })
        }
        catch (err) {
            console.log(err)
            return res.send({
                result: null,
                success: false,
                message: "خطا در ثبت ترکر دراداون مجدد تلاش کنید یا یوزر از متا پاک شده است"
            })
        }
    }

    async getUserAccounts(req, res) {
        try {
            const isUserAdmin = req.user.role === "admin"
            let selectString = "role firstBalance level metaUsername createdAt display_name user_login hasFailedMaxLoss hasFailedDailyLoss startTradeDay endTradeDay platform infinitive accountType type accountEmail"
            if (isUserAdmin)
                selectString = selectString.concat(" ").concat("mtAccountId")
            const { email } = req.params
            const users = await UserModel
                .find({ $or: [{ user_email: email }, { accountEmail: email }] })
                .select(selectString)

            if (isUserAdmin) {
                return res.status(200).send({
                    result: users,
                    success: true,
                    message: "عملیات با موفقیت انجام شد"
                })

            }
            else {
                const isUserAllowed = req.user.role === "user" && users.some(user => user._id.toString() === req.user._id.toString())
                if (isUserAllowed)
                    return res.status(200).send({
                        result: users,
                        success: true,
                        message: "عملیات با موفقیت انجام شد"
                    })

                return res
                    .status(403)
                    .send({ message: "امکان دسترسی به این بخش برای شما مجاز نمی باشد", result: null, success: false });
            }
        }
        catch (err) {
            console.log(err)
            return res
                .status(403)
                .send({ message: "خطا در دریافت حساب ها", result: null, success: false });
        }


    }

    async email(req, res) {
        const TOKEN = 'gqoksglhkytcratr'
        const SENDERـUSERـEMAIL = "Sarmayegozarebartar@gmail.com"
        const transporter = nodemailer.createTransport({
            service: "Gmail",
            auth: {
                user: SENDERـUSERـEMAIL,
                pass: TOKEN
            }
        });

        const mailOptions = {
            from: 'sarmaye_gozar_bartar@gmail.com',
            to: 'sarmaye_gozar_bartar@gmail.com',
            subject: 'Node Mailer',
            html: ``,
        };
        transporter.sendMail(mailOptions, (err, info) => {
            if (err)
                console.log(err)
        })
        return res.send('email sent')
    }

    async test(req, res) {
        console.log("helooooooooooo")
        const fs = require("fs")
        const path = require("path")
        console.log()
        const users = JSON.parse(fs.readFileSync(path.join(process.cwd(), "notOkUsers2.json"), "utf-8"))
        const errors = []
        const success = []
        let count = 0
        users.forEach(user => {
            const config = {
                method: 'get',
                url: `https://panel.sarmayegozarebartar.com/api/user/chart/equity/${user.mtAccountId}`,
                headers: {
                    'x-auth-token': 'eyJhbGciOiJIUzI1NiJ9.ZXlKcFpDSTZJall5TkdWbE5tTTVaV1psWWpsbU5HVTVPREEyTmpka05pSjk.yqZCgM1gI7HL08VIgKbGOJ06t3_jlXt056Dz1J67hcg'
                }
            };

            axios(config)
                .then(function (response) {
                    success.push(user.mtAccountId)
                    // console.log("ok", user.mtAccountId);
                })
                .catch(function (error) {
                    errors.push(user.mtAccountId)

                })
                .finally(() => {
                    count++;
                })

        })
        if (count === users.length) {
            console.log({
                errors,
                success
            })
        }
        // const users =await  UserModel.updateMany({
        //     status:undefined
        // }, {
        //     status:"active"            
        // })
        // console.log(users)
    }

    async updateObjectiveManul(req, res) {
        const { id, type } = req.body
        const user = await UserModel.findOneAndUpdate({ mtAccountId: id }, {
            [type === 'day' ? 'hasFailedDailyLoss' : 'hasFailedMaxLoss']: false
        })
        return res.json({
            success: true,
            message: 'updated successfully'
        })
    }

    async revalidateProvisingProfiles(req, res) {
        console.log('heelo')
        try {
            redis = getRedisClient()
            const { data: profiles } = await getProvisingProfilesService()
            const result = await saveProfilesInMemory({ profiles })
        }
        catch (error) {
            console.log(error)
            return res
                .status(400)
                .send({ message: "سرویس های خارجی با خطا رو به رو شدند", result: null, success: false });
        }
        return res.send({
            success: true
        })
    }

    async reportUserrrrrrrrrrrrrrr(req, res) {
        const twoMonthesAgo = new Date().getTime() - 1000 * 86400 * 60

        const users = await UserModel
            .find({
                role: 'user',
                createdAt: { "$lt": new Date(twoMonthesAgo).toISOString() },
                status: 'active'
            })
            .select("firstBalance dayBalance maxTradeDays percentDays infinitive accountType mtAccountId accountCreatedDate tradeDaysCount equity balance hasFailedDailyLoss hasFailedMaxLoss maxLossLimit metaUsername type trackerId standardType user_login display_name level status createdAt accountEmail")
            // .sort("-createdAt")
            .limit(1)

        const {
            _id,
            createdAt,
            mtAccountId
        } = users[0]
        deActiveUserService({ id: "62d2d03d32d3d8001363bf21", mtAccountId: "c22f9197-b45d-42d9-a183-93c9dd4c73be" })

        return res.json(users)
    }

}

module.exports = new (controller(UserController))()
