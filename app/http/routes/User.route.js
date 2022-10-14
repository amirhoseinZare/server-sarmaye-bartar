const express = require("express");
const router = express.Router();

const {UserController} = require("../controllers/index");
const {userValidator} = require("../validators/index")
const auth = require("../middlewares/auth")

router.use((req, res, next)=>{
    console.log("1",new Date().toLocaleTimeString())
    next()
})
router.get("/redis", UserController.redis)

router.get("/", [auth("admin")], UserController.getAll);

//not in use in production
// router.get("/objectives/all/:userId", [auth("admin", "user")], UserController.getAllObjectives);

//not in use in production
// router.get("/equity-by-trades/all/:userId", [auth("admin", "user")], UserController.getUserEquityHistory);

router.get("/get-profile", [auth("admin", "user")], UserController.getProfile);

router.get("/rankings/balance", UserController.getRankings)

router.get("/:userId", [auth("admin", "user")], UserController.getOne);

router.post("/", [...userValidator.postValidator()],[auth("admin")], UserController.post);

router.patch("/:userId", [auth("admin")], [...userValidator.patchValidator()], UserController.patch);

router.delete("/:userId", [auth("admin")], UserController.delete);

router.post("/login", [...userValidator.loginValidator()], UserController.login);

router.get("/chart/equity/:userId",  [auth("admin", "user")], UserController.getChart)

router.post("/tracker/send",  UserController.tracker)

router.get("/account/by-email/:email", [auth("admin", "user")], UserController.getUserAccounts);

//not in use in production
// router.get("/redis/rbgedbrdbrdb",  UserController.redis) 

//not in use in production
// router.get("/email/send/test", UserController.email)  

// not in use in production
router.get("/update/type/user", UserController.test)  

module.exports = router;