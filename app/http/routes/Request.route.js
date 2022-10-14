const express = require("express");
const router = express.Router();

const {RequestController} = require("../controllers/index");
const {requestValidator} = require("../validators/index")
const auth = require("../middlewares/auth")

router.get("/", [auth("admin", "user")], RequestController.getAll);

router.post("/", [auth("admin", "user")], [...requestValidator.postValidator()], RequestController.post);

router.patch("/:id", [auth("admin", "user")], [...requestValidator.patchValidator()], RequestController.patch)

module.exports = router;