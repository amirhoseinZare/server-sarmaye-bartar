const nodeCron = require("node-cron");
const { UserModel } = require("../models/index")

const { deleteUserAccountService } = require("../services/external/meta")

const removeUndeployedAccountsFunc = ()=>{
    try {
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
    catch (err){
        console.log("err: ")
    }
    
}

const removeFailedAccountsFunc = async ()=>{
    try {
        console.log('here')
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
        console.log('here3')
        axios(config)
            .then(res=>{
                console.log("removeFailedAccountsFunc", res.data, res.data.success, user.mtAccountId)
                if(res.data.success){
                    deleteUserAccountService({ mtAccountId:user.mtAccountId })
                }
    
            })
            .catch(err =>{
                console.log(err)
            })
        console.log('here4')
    }
    catch(err){
        console.log("err")
    }
  
}

const removeExpiredAccountsFunc = async ()=>{
    console.log("removeExpiredAccountsFunc")
    let toSelect = {
        infinitive:false, status:"active"
    }
    const users = await UserModel
        .aggregate([
            {
                $match: toSelect
            },
            {
                $addFields: {
                    expired: {
                        $function: {
                            body: function (createdAt, maxTradeDays) {
                                const days = maxTradeDays === 30 ? 40 : 60
                                return (new Date().getTime() - (new Date(createdAt).getTime() + days * 86400 * 1000)) > 0
                            },
                            args: ["$createdAt", "$maxTradeDays"],
                            lang: "js"
                        }
                    }

                }
            },
            { "$project": { mtAccountId:1, expired: 1, createdAt: 1, maxTradeDays:1, infinitive:1 } },
            {
                $match: {
                    expired : true
                }
            }
        ])
        .sort("-createdAt")
        // .limit(1)
        console.log(users.length)
    if(users.length >0) {
        const user = users[0]
        if(user.infinitive)
            return
        if(user.mtAccountId.length !== 32){
            console.log('mtAccountId invalied')
            const result = await UserModel.findByIdAndUpdate(user._id, {
                status:'deactive'
            }) 
            return result
        }
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
                if(res.data.success){
                    deleteUserAccountService({ mtAccountId:user.mtAccountId })
                    console.log("removeExpiredAccountsFunc", user.mtAccountId, user.createdAt, user.maxTradeDays, {infi:user.infinitive})
                }
    
            })
            .catch(err =>{
                console.log(err)
            })
    }
}

const removeUndeployedAccounts = ()=>{
    const job = nodeCron.schedule("00 */1 * * * *", () => {
        removeUndeployedAccountsFunc()
    });
    job.start();
}

const removeFailedAccounts = ()=>{
    const job = nodeCron.schedule("00 */1 * * * *", () => {
        removeFailedAccountsFunc()
    });
    job.start();
}

const removeExpiredAccounts = ()=>{
    const job = nodeCron.schedule("*/8 * * * * *", () => {
        removeExpiredAccountsFunc()
    });
    job.start();
}

module.exports = {
    removeUndeployedAccounts,
    removeFailedAccounts,
    removeExpiredAccounts
}
