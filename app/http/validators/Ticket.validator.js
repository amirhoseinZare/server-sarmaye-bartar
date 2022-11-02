const { body } = require("express-validator");

const postValidator = () => {
    const resolverId = body("resolverId").isMongoId().optional({nullable:false});
    const title = body("title").isString()
    const description = body("description").isString()
    const type = body("type").isString().custom(v=>["question", "answer"].includes(v))
    const isReply = body("isReply").isBoolean()
    const originId = body("originId").isString().optional({nullable:false});

    return [resolverId, title, description, type, isReply, originId]
}

const patchValidator = () => {
    const resolverId = body("resolverId").isMongoId().optional({nullable:false});
    const status = body("status").isString().custom(v=>["waiting", "accepted"].includes(v))

    return [ resolverId, status]
}

module.exports = {
    postValidator,
    patchValidator
}