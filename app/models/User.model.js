const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const { getJwtSecret } = require("../core/utils");

const userSchema = new mongoose.Schema({
    ID:{ required:false, type:String, default:"" },
    user_login:{ required:true, type:String },//username input
    user_pass:{ required:true, type:String },
    user_nicename:{ required:false, type:String, default:"" },
    user_email:{ required:false, type:String },//email input
    accountEmail:{ required:false, type:String },//email input
    user_url:{ required:false, type:String },
    user_registered:{ required:true, type:String },// '2022-02-13 09:40:06' server
    user_activation_key:{ required:false, type:String, default:"" },
    user_status:{ required:false, type:String, default:"" },
    display_name:{ required:true, type:String },//displayName input
    role:{ required:true, type:String, eunm:['admin', 'user'], default:'user' },//role input

    firstBalance:{ required:true, type:Number, default:0 },//- input
    dayBalance:{ required:true, type:Number, default:0 },
    maxTradeDays:{ required:true, type:Number, eunm:[0, 30, 60], default:0 },//0 for default - 30 for level1 - 60 for level 2- 
    percentDays:{ required:true, type:Number, eunm:[0, 8, 4], default:0 },
    infinitive:{ required:true, type:Boolean, default:false },
    accountType:{ required:true, type:String, default:"-" },
    mtAccountId:{ required:false, type:String, default:"" },
    mtAccessToken:{ required:false, type:String, default:"" },
    platform:{ required:true, type:String, enum:['MT4', 'MT5', "-"], default:"-" },
    startTradeDay:{ type:String, default:"" },
    endTradeDay:{ type:String, default:"" },
    accountCreatedDate:{ required:true, type:String, default:"" },

    tradeDaysCount:{ required:true, type:Number, default:0 },

    equityHistory: [{ trades:{type:Number}, equity:{type:Number} }],
    equity:{ required:true, type:Number, default:0 },
    flyEquity:{ required:true, type:Number, default:0 },

    balance:{ required:true, type:Number, default:0 },
    hasFailedDailyLoss:{ required:true, type:Boolean, default:false },
    hasFailedMaxLoss:{ required:true, type:Boolean, default:false },
    maxLossLimit:{ required:true, type:Number, eunm:[8, 10, 12], default:0 },
    minEquityHistory: [{ time:{ type:String } , equity:{ type:Number } }],
    metaUsername:{ required:false, type:String,  default:'' },
    trackerId:{ required:false, type:String,  default:'' },
    type:{ required:true, type:String, default:'primary', eunm:['primary', 'secondary'] },
    level:{ required:true, type:Number, enum:[1, 2, 3, 10] }, //10 is for unkonw this will be deleted once datas are fixed
    status:{ required:true, type:String, enum:['active', 'deactive'] },
},{ timestamps: true });

userSchema.methods.generateToken = function () {
    const data = {
      id: this._id,
    };
    const bas64EncodedData = Buffer.from(JSON.stringify(data)).toString('base64')
    const token = jwt.sign(bas64EncodedData, getJwtSecret());
  
    return token;
};

const UserModel = mongoose.model("User", userSchema);

module.exports = UserModel;
