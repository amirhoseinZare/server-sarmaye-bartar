const mongoose = require("mongoose");
const mailSchema = new mongoose.Schema({
    userId:{ type: mongoose.Schema.Types.ObjectId, required:true },
    resolverId:{ type: mongoose.Schema.Types.ObjectId, required:false },
    accountId:{ type: mongoose.Schema.Types.ObjectId, required:false },
    description:{ type: string, required:true },
    type:{ type: string, required:true, enum:['question', 'answer'] },
    isReply: { type: string, required:true, enum:['question', 'answer'] }
},{ timestamps: true });

const MailModel = mongoose.model("Mail", mailSchema);

module.exports = MailModel;
