const express = require("express");
const router = express.Router();

const {TicketController} = require("../controllers/index");
const {ticketValidator} = require("../validators/index")
const auth = require("../middlewares/auth")

router.get("/", [auth("admin", "user")], TicketController.getAll);

router.get("/replies/:originId", [auth("admin", "user")], TicketController.getTicketReplies);

router.post("/reply", [auth("admin", "user")], [...ticketValidator.replyValidator()], TicketController.reply);

router.post("/", [auth("user")], [...ticketValidator.postValidator ()], TicketController.post );

router.post("/close/:originId", [auth("admin")], TicketController.close);

// router.post("/", [auth("admin")], TicketController.close );

// router.patch("/:id", [auth("admin")], [...ticketValidator.patchValidator()], TicketController.reply)

module.exports = router;
