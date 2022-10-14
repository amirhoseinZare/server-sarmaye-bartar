const { body } = require("express-validator");

const postValidator = () => {
    const user_login = body("user_login").isString()
    const display_name = body("display_name").isString()
    const user_email = body("user_email").isString()
    const firstBalance = body("firstBalance").isNumeric()
    const maxTradeDays = body("maxTradeDays").isNumeric().custom(v=>[0, 30, 60].includes(v))
    const percentDays = body("percentDays").isNumeric().custom(v=>[0, 8, 4].includes(v))
    const infinitive = body("infinitive").isBoolean()
    const accountType = body("accountType").isString()
    const platform = body("platform").custom(v=>['MT4', 'MT5'].includes(v))
    const role = body("role").custom(v=>['admin', 'user'].includes(v))
    const user_pass = body("user_pass").isString().isLength({min:8}).optional({nullable:false})

    const mtAccountId = body("mtAccountId").isString().optional({ nullable:true })
    const mtAccessToken = body("mtAccessToken").isString().optional({ nullable:true })

    const ID = body("ID").isString().optional({nullable:false})
    const user_nicename = body("user_nicename").isString().optional({nullable:false})
    const user_url = body("user_url").isString().optional({nullable:false})
    const user_activation_key = body("user_activation_key").isString().optional({nullable:false})
    const user_status = body("user_status").isString().optional({nullable:false})

    const startTradeDay = body("startTradeDay").isString().optional({nullable:false})
    const endTradeDay = body("endTradeDay").isString().optional({nullable:false})
    const accountCreatedDate = body("accountCreatedDate").isString().optional({nullable:false})
    const maxLossLimit = body("maxLossLimit").isNumeric().custom(v=>[8, 10, 12].includes(v))

    const type =  body("type").isString().custom(v=>['primary', 'secondary'].includes(v))
    const level = body("level").isNumeric().custom(v=>[1, 2, 3].includes(v))
    // const status = body("status").isString().custom(v=>['active', 'deactive'].includes(v))
    return [ user_login, display_name, user_email, firstBalance, maxTradeDays, percentDays, infinitive, accountType, role, user_pass, platform,
         mtAccountId, mtAccessToken, ID, user_nicename, user_url, user_activation_key, user_status, startTradeDay, endTradeDay, 
         accountCreatedDate, maxLossLimit, type, level ]
}

const patchValidator = () => {
    // user_login & user_email & user_pass wont change ever in this endpoint
    const display_name = body("display_name").isString().optional({nullable:false})
    const firstBalance = body("firstBalance").isNumeric().optional({nullable:false})
    const maxTradeDays = body("maxTradeDays").isNumeric().custom(v=>[0, 30, 60].includes(v)).optional({nullable:false})
    const percentDays = body("percentDays").isNumeric().custom(v=>[0, 8, 4].includes(v)).optional({nullable:false})
    const infinitive = body("infinitive").isBoolean().optional({nullable:false})
    const accountType = body("accountType").isString().optional({nullable:false})
    const platform = body("platform").custom(v=>['MT4', 'MT5', "-"].includes(v)).optional({nullable:false})
    const role = body("role").custom(v=>['admin', 'user'].includes(v)).optional({nullable:false})

    const mtAccountId = body("mtAccountId").isString().optional({ nullable:true })
    const mtAccessToken = body("mtAccessToken").isString().optional({ nullable:true })

    const ID = body("ID").isString().optional({nullable:false})
    const user_nicename = body("user_nicename").isString().optional({nullable:false})
    const user_url = body("user_url").isString().optional({nullable:false})
    const user_activation_key = body("user_activation_key").isString().optional({nullable:false})
    const user_status = body("user_status").isString().optional({nullable:false})
    const user_pass = body("user_pass").isString().isLength({min:8}).optional({nullable:false})
    const startTradeDay = body("startTradeDay").isString().optional({nullable:false})
    const endTradeDay = body("endTradeDay").isString().optional({nullable:false})
    // const accountCreatedDate = body("accountCreatedDate").isString().optional({nullable:false})
    const maxLossLimit = body("maxLossLimit").isNumeric().custom(v=>[8, 10, 12].includes(v)).optional({nullable:false})
    const level = body("level").isNumeric().custom(v=>[1, 2, 3].includes(v)).optional({nullable:false})
    const status = body("status").isString().custom(v=>['active', 'deactive'].includes(v)).optional({nullable:false})

    return [
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
        level,
        status
        // accountCreatedDate
    ]
}

const loginValidator = () => {
    const user_email = body("user_email").isString()
    const user_pass = body("user_pass").isString()
    return [ user_email,user_pass  ]
}

module.exports = {
    postValidator,
    patchValidator,
    loginValidator
}