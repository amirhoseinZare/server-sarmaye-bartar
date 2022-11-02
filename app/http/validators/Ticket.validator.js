const { body } = require("express-validator");

const postValidator = () => {
    const accountId = body("accountId").isMongoId();
    const title = body("title").isString()
    const description = body("description").isString()
    
    return [accountId, title, description]
}

const replyValidator = () => {
    const originId = body("originId").isMongoId();
    const title = body("title").isString()
    const description = body("description").isString()
    const originTicketStatus = body("originTicketStatus").isString().custom(v=>["waiting", "resolved"].includes(v))
    
    return [ originId, title, description, originTicketStatus]
}

module.exports = {
    postValidator,
    replyValidator
}