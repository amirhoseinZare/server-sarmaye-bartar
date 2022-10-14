const mongoose = require("mongoose");
const mailSchema = new mongoose.Schema({
    to:{ type:String, required:true },
    subject:{ type:String, required:true },
    text:{ type:String, required:true },
    sent:{ type:Boolean, required:true },
    description:{ type:String, required:true }
},{ timestamps: true });

const MailModel = mongoose.model("Mail", mailSchema);

module.exports = MailModel;