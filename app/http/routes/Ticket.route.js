const express = require("express");
const router = express.Router();

const {TicketController} = require("../controllers/index");
const {ticketValidator} = require("../validators/index")
const auth = require("../middlewares/auth")

router.get("/", [auth("admin", "user")], TicketController.getAll);

router.post("/reply", [auth("admin", "user")], [...ticketValidator.replyValidator()], TicketController.reply);

router.post("/", [auth("user")], [...ticketValidator.postValidator ()], TicketController.post );

// router.patch("/:id", [auth("admin")], [...ticketValidator.patchValidator()], TicketController.reply)

module.exports = router;
