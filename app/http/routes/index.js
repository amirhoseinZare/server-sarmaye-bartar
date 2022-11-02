const express = require("express");
const router = express.Router();

const UserRoutes = require('./User.route')
const RequestRoutes = require("./Request.route")
const TicketRoutes = require("./Ticket.route")

router.use('/user', UserRoutes)

router.use('/request', RequestRoutes)

router.use('/ticket', TicketRoutes)

module.exports = router