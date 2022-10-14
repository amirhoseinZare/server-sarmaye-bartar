const { RequestModel, UserModel } = require('../../models/index')
const { validationResult } = require("express-validator");
const mongoose = require("mongoose")

class RequestController {
    async getAll(req, res){
        try {
            let { pageSize=20 , pageNumber=1, type="", user_email="" } = req.query
            pageSize = +pageSize
            pageNumber = +pageNumber
            pageNumber = pageNumber-1
            const query = {}
            if(user_email)
                query.user_email = user_email
            if(type)
                query.type = type
            const allRequests = await RequestModel.find(query).skip(pageNumber*pageSize).limit(pageSize)
            const count = query.userId ||  query.type ? allRequests.length : await RequestModel.count()
            return res.status(200).json({
                result:{
                    items:allRequests,
                    totalCount:count,
                    pageNumber:pageNumber+1,    
                    pageSize
                },
                message:"عملیات با موفقیت انجام شد",
                success:true
            })
        }
        catch(err){
            console.log(err)
            return res.send({
                result:null,
                success:false,
                message:"خطا در دریافت اطلاعات"
            })
        }
    }

    getOne(){
    }

    async post(req, res){
        const error = validationResult(req)
        if (!error.isEmpty()) {
            return res
              .status(400)
              .send({ result:null, message: "خطا در اعتبارسنجی", errors: error.array(), success:false });
        }

        const {
            type,
            userId, //accountId that user wants to change
        } = req.body
        try {
            const user = await UserModel.findOne({
                "$or":[
                    {
                        user_email:req.user.user_email,
                     }, //primary
                     {
                        accountEmail:req.user.user_email
                     }
                ],
                _id:new mongoose.Types.ObjectId(userId) //which account user should send object id of account (_id in user document)
            }).select("user_email mtAccountId accountEmail")
    
            if(!user){
                return res
                    .status(401)
                    .send({ message: "کاربری با مشخصات ارسال شده یافت نشد", result:null, success:false });
            }

            const isRequestRepeated = await RequestModel.findOne({
                user_email:req.user.user_email,
                type,
                mtAccountId:user.mtAccountId
            })
                
            if(isRequestRepeated) {
                return res
                    .status(401)
                    .send({ message: `you have already submitted a request for ${type} this account please check the status in your profile`, result:null, success:false });
            }
    
            const newRequest = new RequestModel({
                userId:new mongoose.Types.ObjectId(userId),
                type,
                user_email : user.user_email || user.accountEmail, //user primary account email
                status:"waiting",
                mtAccountId:user.mtAccountId
                /*
                    users can have multiple accounts
                    first document with same user_email in collection would be primary
                    others will carry accoutnEmail which stores the primary user_email
                */
               
            })
            const requestDoc = await newRequest.save()
            const successMessage = {
                'extend':`با عرض تبریک، درخواست شما با موفقیت ثبت شد و در صورت تائید در 1 الی 12 ساعت آینده، 10 روز به زمان چلنج شما اضافه خواهد شد. 
                لطفا از ارسال تیکت مجدد در این باره خودداری کنید
                `,
                'reset':`درخواست شما با موفقیت ثبت شد و در صورت تائید مشخصات حساب جدید، 1 الی 12 ساعت آینده به ایمیل شما ارسال خواهد شد. 
                لطفا از ارسال تیکت مجدد در این باره خودداری کنید
                `, 
                'nextPhase':`با عرض تبریک، درخواست شما با موفقیت ثبت شد و در صورت تائید مشخصات حساب جدید، 1 الی 12 ساعت آینده به ایمیل شما ارسال خواهد شد. 
                لطفا از ارسال تیکت مجدد در این باره خودداری کنید`, 
                'getProfit':``
            }

            return res.status(201).json({
                message: successMessage[type],
                result: true,
                success:true
            });
        }
        catch(err){
            console.log(err)
            return res.send({
                result:null,
                success:false,
                message:"خطا در ثبت درخواست لطفا مجدد اقدام نمایید."
            })
        }
      
    }

    async patch(req, res){
        const error = validationResult(req)
        if (!error.isEmpty()) {
            return res
              .status(400)
              .send({ result:null, message: "خطا در اعتبارسنجی", errors: error.array(), success:false });
        }
        const {
            status
        } = req.body

        const {
            id:requestId
        } = req.params
        try {
            const request = await RequestModel.findByIdAndUpdate( requestId, {
                status
            })
            if(request.type === "extend" && status==="accepted"){
                const account = await UserModel.findById(request.userId).select("startTradeDay endTradeDay")
                const [year, month, day] = new Date(new Date(account.startTradeDay).getTime() + 86400*1000).toLocaleDateString().split()
                account.endTradeDay = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
                const user = await account.save()
            }
            if(!request){
                return res
                    .status(401)
                    .send({ message: "درخواستی با مشخصات ارسال شده یافت نشد", result:null, success:false });
            }
            return res.status(200).json({
                result:true,
                message:"عملیات با موفقیت انجام شد",
                success:true
            })
        }
        catch(err){
            return res
                .status(401)
                .send({ message: "درخواستی با مشخصات ارسال شده یافت نشد", result:null, success:false });
        }
    }

}

module.exports =  new RequestController(RequestModel, 'request')