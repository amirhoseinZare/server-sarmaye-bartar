const { body } = require("express-validator");

const postValidator = () => {
    const type = body("type").isString().custom(v=>['extend', 'reset', 'nextPhase', 'getProfit'] .includes(v))
    const userId = body("userId").isString().isMongoId()
    return [type, userId]
}

const patchValidator = () => {
    const status = body("status").isString().custom(v=>["waiting", "rejected", "accepted"].includes(v))
    return [status]
}

module.exports = {
    postValidator,
    patchValidator
}