const mongoose = require("mongoose");
const mailSchema = new mongoose.Schema({
    userId:{ type: mongoose.Schema.Types.ObjectId, required:true },
    resolverId:{ type: mongoose.Schema.Types.ObjectId, required:false },
    accountId:{ type: mongoose.Schema.Types.ObjectId, required:false },
    userRole:{ type: String, required:true, eunm:['admin', 'user'], default:'user' },
    title:{ type: String, required:true },
    description:{ type: String, required:true },
    type:{ type: String, required:true, enum:['question', 'answer'] },
    isReply: { type: Boolean, required:true, default:false }
},{ timestamps: true });

const MailModel = mongoose.model("Mail", mailSchema);

module.exports = MailModel;