const {sendEmail} = require("../../config")

exports.hashPassword = (pass) => {
    const bcrypt = require("bcrypt");
    return bcrypt.hash(`${pass}`, 12);
};
exports.getJwtSecret = () => "hachalhaft)(@U)_($&_))$&_$(Y$hachalhaft_(&$_($&_($&)$(&$_)hachalhaft(&$_($&_$(&$_)(Y$_(&$_($&_$(hachalhaft";
exports.convertDateFormat = (date)=> {
    const d = date
    return format = [ d.getFullYear(), d.getMonth()+1, d.getDate(), ].join('/')+' '+[ d.getHours(), d.getMinutes(), d.getSeconds()].join(':');
}
exports.controller = function (cn) {
    const prototype = Object.getOwnPropertyNames(cn.prototype);
    prototype.shift();
    prototype.map((h) => {
      const func = cn.prototype[h];
      cn.prototype[h] = (req, res, next) => {
        func(req, res, next).catch((err) => {
          console.log(err);
          res.status(500).send({ err: err.message, message:"مشکلی در سمت سرور رخ داده است" });
        });
      };
    });
    return cn;
};
exports.sendMail = function (options) {
  const {MailModel, UserModel} = require("../models/index")
  // console.log(MailModel, UserModel)
  const saveMail = async (options, sent, description)=>{
    const newMail = new MailModel({
      ...options,
      sent,
      description,
      text:options.text || options.html
    })
    return await newMail.save()
  }
  const handler = async (err, info)=>{
    if (err) {
      console.log(err)
      try {
        await saveMail(options, false, err.toString())
        console.log('sent')
      }
      catch(error){
        console.log('email not sent ', error, new Date().toLocaleString())
      }
    } else {
      console.log(info);
      try {
        await saveMail(options, true, info.toString())
        console.log('sent')
      }
      catch(error){
        console.log('email not sent ', error, new Date().toLocaleString())
      }
    }
  }
  sendEmail(options, handler)
}