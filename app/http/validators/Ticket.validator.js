const { body } = require("express-validator");

const postValidator = () => {
    const userId = body("userId").isMongoId();
    const resolverId = body("resolverId").isMongoId().optional({nullable:false});
    const accountId = body("accountId").isString().optional({nullable:false});
    const userRole = body("userRole").isString().custom(v=>["user", "admin"].includes(v))
    const title = body("title").isString()
    const description = body("description").isString()
    const type = body("type").isString().custom(v=>["question", "answer"].includes(v))
    const isReply = body("isReply").isBoolean()
    const originId = body("originId").isString().optional({nullable:false});
    const status = body("status").isString().custom(v=>["waiting", "accepted"].includes(v))

    return [userId, resolverId, accountId, userRole, title, description, type, isReply, originId, status]
}

const patchValidator = () => {
    const resolverId = body("resolverId").isMongoId().optional({nullable:false});
    const status = body("status").isString().custom(v=>["waiting", "accepted"].includes(v))

    return [ resolverId, accountId, userRole, title, description, type, isReply, originId, status]
}

module.exports = {
    postValidator,
    patchValidator
}