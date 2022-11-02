const { body } = require("express-validator");

const postValidator = () => {
    const accountId = body("accountId").isMongoId();
    const title = body("title").isString()
    const description = body("description").isString()
    
    return [accountId, title, description]
}

const patchValidator = () => {
    const originId = body("originId").isMongoId();
    const title = body("title").isString()
    const description = body("description").isString()
    const type = body("type").isString().custom(v=>["question", "answer"].includes(v))
    
    return [ originId, title, description, type]
}

module.exports = {
    postValidator,
    patchValidator
}