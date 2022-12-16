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
const { deleteUserAccountService } = require("../services/external/meta")

const removeUndeployedAccountsFunc = ()=>{
    console.log("removeUndeployedAccountsFunc", new Date().toLocaleString())
    const axios = require('axios');
    const token = "eyJhbGciOiJSUzUxMiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI5M2ExYTM4MWFhMTU3NTU2M2RmYTI4MDk1YWQ3M2RjZSIsInBlcm1pc3Npb25zIjpbXSwidG9rZW5JZCI6IjIwMjEwMjEzIiwiaWF0IjoxNjU3Nzk2MjY1LCJyZWFsVXNlcklkIjoiOTNhMWEzODFhYTE1NzU1NjNkZmEyODA5NWFkNzNkY2UifQ.Uo1bOKN39o-zPJj1HrFbk25b4EEJyixpo89TOW0jNQcjBCpotnGXJBF2W1oCxULVJqNAOYRqL6cMd_iWjNFHlbr5riF30Bj5R_PaoPTL7nB8VO8h_NHV7yQER3JdLFpOwFa3prsFs5DU33bvV6eesiLWNMicaVhwpA5-LJuRSKz-_CMwlGlgiySVJmgzj30LnVVhfjjyhXZmD_rdq7cIjSCZbWIk4hCGy1kaZooIzz3PeR36s205v90u7_M2QTQLi_LBDRpD0H67ny6MvQolIlyfwNYvkn3eke11hKkolamZ0YQlCVXFbKsZlON4DW9zGlZbfEa-VhILAIYvY1Nja8z09QXwPlBknA6XE89XMOrDdM1qySh_ClsoNVhCVPlPLT2gDdc9nVQj5XRCVwHtrYgAOqcwtOAoxNLeEywhVPJBiI1arULcu7-Z0uL9aN6Y4oR5vyca4-n02xeJtbkiOKz1xQcmTk5iTTTSh14iino7QhBdB4VB0_yvAZo9KCW18eB9I8YDJKg79AfXBoRS4x9w_eDE1QkrjgdPmSALWYM6UmPnTPXJNcqwAX9obQ7UVrxkHjx5LCPw8Tyqa68JnYCV6vQC3FdTijr_ZmdSPPQh-dvem_GxrMbF7ouLhIy9rCMNsB_b4qp0HngIfIBZdJ5tqvMEQJM89IECVnRelMU"
    const config = {
        method: 'get',
        url: `https://mt-provisioning-api-v1.agiliumtrade.agiliumtrade.ai/users/current/accounts?offset=0&limit=1&endpointVersion=v1&state=UNDEPLOYED`,
        headers: { 
            'auth-token': token, 
        },
    };

    axios(config)
        .then(res=>{
            console.log("removeUndeployedAccountsFunc", res.data.length>0 && res.data[0]._id)
            if(res.data.length>0 && res.data[0]._id){
                deleteUserAccountService({ mtAccountId:res.data[0]._id })
                console.log("user deleted: ", res.data[0]._id)
            }

        })
        .catch(err =>{
            console.log(err)
        })
}

const removeUndeployedAccounts = ()=>{
    const job = nodeCron.schedule("*/30 * * * * *", () => {
        removeUndeployedAccountsFunc()
    });
    job.start();
}

const removeFailedAccountsFunc = async ()=>{
    const users = await UserModel.find({
        "$or":[
            {
                hasFailedDailyLoss : true
            },
            {
                hasFailedMaxLoss : true
            }
        ],
        status: "active"
    })
    .sort("-createdAt")
    .limit(1)

    const user = users[0]
    
    const axios = require('axios');
    const token = "eyJhbGciOiJIUzI1NiJ9.ZXlKcFpDSTZJall5WW1RNVpXUTVOREZpTXpjNU1EQXhNelZqTnpaaE5DSXNJbXR2YzNOb1pYSkJiVzVwWVhScElqb2lhMjl6YzJobGNrRnRibWxoZEdraWZRPT0.wbhTunpXE9T643t8PgApQal7EVSnhfZotbx8aiSrt84"
    const config = {
        method: 'get',
        url: `https://panel.sarmayegozarebartar.com/api/user/chart/equity/${user.mtAccountId}`,
        headers: { 
            "accept": "application/json, text/plain, */*",
            'x-auth-token': token, 
        },
    };

    axios(config)
        .then(res=>{
            console.log("removeFailedAccountsFunc", res.data.success, user.mtAccountId)
            if(res.data.success){
                deleteUserAccountService({ mtAccountId:user.mtAccountId })
            }

        })
        .catch(err =>{
            console.log(err)
        })
}

const removeFailedAccounts = ()=>{
    const job = nodeCron.schedule("*/15 * * * * *", () => {
        removeFailedAccountsFunc()
    });
    job.start();
}

module.exports = {
    removeUndeployedAccounts,
    removeFailedAccounts
}
