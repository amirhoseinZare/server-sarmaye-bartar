const jwt = require("jsonwebtoken");
const { getJwtSecret } = require("../../core/utils");
const { UserModel } = require("../../models/index")

module.exports = (...role) => {
  return async (req, res, next) => {
    console.log("2",new Date().toLocaleTimeString())
    try {
      const token = req.header("x-auth-token");
      if (!token) {
        return res.status(401).send({ message: "ورود ناموفق", result:null, resultCode:1001, success:false });
      }

      const decodedJwt = jwt.verify(token, getJwtSecret())
      const decodedBase64 = Buffer.from(decodedJwt, 'base64').toString()
      const userId = JSON.parse(decodedBase64).id
      let user = null
      try {
        user = await UserModel.findById(userId).select("-user_pass  -minEquityHistory -equityHistory -user_activation_key -user_status -ID -user_url ")
      }
      catch(err){
          return res.status(404).json({
              result:null,
              message:"کاربری یافت نشد",
              resultCode:1001,
              success:false
          })
      }

      if (!user) {
        return res.status(401).send({ message: "توکن ارسال شده نادرست است", result:null, resultCode:1001, success:false });
      }
      if (role.length !== 0) {
        if (!role.includes(user.role)) {
          return res
            .status(403)
            .send({ message: "امکان دسترسی به این بخش برای شما مجاز نمی باشد", result:null, resultCode:1043, success:false });
        }
      }
      req.token = token;
      req.user = user;
      console.log("3",new Date().toLocaleTimeString())
      next();
    } catch (error) {
      console.log('Not dangeroues===> ', error.message)
      return res.status(401).send({ message: "ورود ناموفق یا دسترسی به این بخش برای شما مجاز نمی باشد", result:null, resultCode:1001, success:false });
    }
  };
};
