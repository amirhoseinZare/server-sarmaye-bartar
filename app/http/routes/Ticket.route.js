const express = require("express");
const router = express.Router();

const {TicketController} = require("../controllers/index");
const {ticketValidator} = require("../validators/index")
const auth = require("../middlewares/auth")

router.get("/", [auth("admin", "user")], TicketController.getAll);

router.post("/", [auth("admin", "user")], [...ticketValidator.postValidator()], TicketController.post);

router.patch("/:id", [auth("admin", "user")], [...ticketValidator.patchValidator()], TicketController.patch)

module.exports = router;