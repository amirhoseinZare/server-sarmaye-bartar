const express = require("express");
const router = express.Router();

const UserRoutes = require('./User.route')
const RequestRoutes = require("./Request.route")

router.use('/user', UserRoutes)

router.use('/request', RequestRoutes)

module.exports = router