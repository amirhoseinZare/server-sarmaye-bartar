const mongoose = require("mongoose");
const ticketSchema = new mongoose.Schema({
    userId:{ type: mongoose.Schema.Types.ObjectId, required:true },
    resolverId:{ type: mongoose.Schema.Types.ObjectId, required:false },
    accountId:{ type:String, required:false },
    userRole:{ type: String, required:true, eunm:['admin', 'user'], default:'user' },
    title:{ type: String, required:true },
    description:{ type: String, required:true },
    type:{ type: String, required:true, enum:['question', 'answer'] },
    isReply: { type: Boolean, required:true, default:false },
    originId: { type: mongoose.Schema.Types.ObjectId, required:false },
    status: { type: String, required:true, enum:["waiting", "resolved"] }
},{ timestamps: true });

const TicketModel = mongoose.model("Ticket", ticketSchema);

module.exports = TicketModel;