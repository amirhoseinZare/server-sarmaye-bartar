const axios = require('axios');
const token = 'eyJhbGciOiJSUzUxMiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI5M2ExYTM4MWFhMTU3NTU2M2RmYTI4MDk1YWQ3M2RjZSIsInBlcm1pc3Npb25zIjpbXSwidG9rZW5JZCI6IjIwMjEwMjEzIiwiaWF0IjoxNjU3Nzk2MjY1LCJyZWFsVXNlcklkIjoiOTNhMWEzODFhYTE1NzU1NjNkZmEyODA5NWFkNzNkY2UifQ.Uo1bOKN39o-zPJj1HrFbk25b4EEJyixpo89TOW0jNQcjBCpotnGXJBF2W1oCxULVJqNAOYRqL6cMd_iWjNFHlbr5riF30Bj5R_PaoPTL7nB8VO8h_NHV7yQER3JdLFpOwFa3prsFs5DU33bvV6eesiLWNMicaVhwpA5-LJuRSKz-_CMwlGlgiySVJmgzj30LnVVhfjjyhXZmD_rdq7cIjSCZbWIk4hCGy1kaZooIzz3PeR36s205v90u7_M2QTQLi_LBDRpD0H67ny6MvQolIlyfwNYvkn3eke11hKkolamZ0YQlCVXFbKsZlON4DW9zGlZbfEa-VhILAIYvY1Nja8z09QXwPlBknA6XE89XMOrDdM1qySh_ClsoNVhCVPlPLT2gDdc9nVQj5XRCVwHtrYgAOqcwtOAoxNLeEywhVPJBiI1arULcu7-Z0uL9aN6Y4oR5vyca4-n02xeJtbkiOKz1xQcmTk5iTTTSh14iino7QhBdB4VB0_yvAZo9KCW18eB9I8YDJKg79AfXBoRS4x9w_eDE1QkrjgdPmSALWYM6UmPnTPXJNcqwAX9obQ7UVrxkHjx5LCPw8Tyqa68JnYCV6vQC3FdTijr_ZmdSPPQh-dvem_GxrMbF7ouLhIy9rCMNsB_b4qp0HngIfIBZdJ5tqvMEQJM89IECVnRelMU'

exports.createUserAccountService = async ({
    login, 
    password, 
    name, 
    server, 
    provisioningProfileId="2e94248a-f95f-4997-a2ce-c859c5088748", 
    platform,
    symbol="",
    magic=0,
    quoteStreamingIntervalInSeconds=2.5,
})=>{        
    const data = {
        login,
        password,
        name,
        server,
        provisioningProfileId,
        platform,
        symbol,
        magic,
        quoteStreamingIntervalInSeconds,
        tags: [
            "automate"
        ],
        extensions: [
        ],
        metadata: {},
        reliability: "high",
        resourceSlots: 1,
        copyFactoryResourceSlots: 1,
        region: "new-york",
        manualTrades: false,
        slippage: 0,
        application: "MetaApi",
        type: "cloud",
        baseCurrency: "USD",
        copyFactoryRoles: [
            "PROVIDER"
        ],
        riskManagementApiEnabled: true
    }
    const config = {
        method: 'post',
        url: `https://mt-provisioning-api-v1.agiliumtrade.agiliumtrade.ai/users/current/accounts`,
        headers: { 
            'User-Agent':"PostmanRuntime/7.29.0",
            'auth-token': token, 
            'Accept-Encoding':"gzip, deflate, br",
            'Connection':"keep-alive"
        },
        data : data
    };
    console.log(data)
    const res = await axios(config)
    return res
}

exports.deployAccountService = async ({mtAccountId}) =>{
    const config = {
        method: 'post',
        url: `https://mt-provisioning-api-v1.agiliumtrade.agiliumtrade.ai/users/current/accounts/${mtAccountId}/deploy?executeForAllReplicas=false`,
        headers: { 
            'User-Agent':"PostmanRuntime/7.29.0",
            'auth-token': token, 
            'Accept-Encoding':"gzip, deflate, br",
            'Connection':"keep-alive"
        }
    };
    
    const res = await axios(config)
    return res
}

exports.unDeployAccountService = async ({mtAccountId}) =>{
    const config = {
        method: 'get',
        url: `https://mt-provisioning-api-v1.agiliumtrade.agiliumtrade.ai/users/current/accounts/${mtAccountId}/undeploy?executeForAllReplicas=false`,
        headers: { 
            'User-Agent':"PostmanRuntime/7.29.0",
            'auth-token': token, 
            'Accept-Encoding':"gzip, deflate, br",
            'Connection':"keep-alive"
        }
    };
    
    const res = await axios(config)
    return res
}

exports.getProvisingProfilesService = async ()=>{
    const config = {
        method: 'get',
        url: `https://mt-provisioning-api-v1.agiliumtrade.agiliumtrade.ai/users/current/provisioning-profiles`,
        headers: { 
            'User-Agent':"PostmanRuntime/7.29.0",
            'auth-token': token, 
            'Accept-Encoding':"gzip, deflate, br",
            'Connection':"keep-alive"
        }
    };
    
    const res = await axios(config)
    return res
}

exports.deleteUserAccountService = async ({
    mtAccountId
})=>{        
    const config = {
        method: 'delete',
        url: `https://mt-provisioning-api-v1.agiliumtrade.agiliumtrade.ai/users/current/accounts/${mtAccountId}?executeForAllReplicas=true`,
        headers: { 
            'User-Agent':"PostmanRuntime/7.29.0",
            'auth-token': token, 
            'Accept-Encoding':"gzip, deflate, br",
            'Connection':"keep-alive"
        },
    };

    const res = await axios(config)
    return res
}