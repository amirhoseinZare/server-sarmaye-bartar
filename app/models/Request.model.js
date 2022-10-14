const mongoose = require("mongoose");
const requestSchema = new mongoose.Schema({
    type:{ type:String, required:true, enum:['extend', 'reset', 'nextPhase', 'getProfit'] },
    user_email:{ type:String, required:true },
    mtAccountId:{ type: String, required:true },
    userId:{ type: mongoose.Schema.Types.ObjectId, required:true },
    status:{ type:String, required:true, enum:["waiting", "rejected", "accepted"] },
},{ timestamps: true });

const RequestModel = mongoose.model("Request", requestSchema);

module.exports = RequestModel;
