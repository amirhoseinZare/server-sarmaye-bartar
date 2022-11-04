const { TicketModel, UserModel } = require('../../models/index')
const { validationResult } = require("express-validator");
const mongoose = require("mongoose")

class TicketController {
    async getAll(req, res){
        try {
            let { pageSize=20 , pageNumber=1, isReply="", status="" } = req.query
            pageSize = +pageSize
            pageNumber = +pageNumber
            pageNumber = pageNumber-1
            const query = {
                isReply:false
            }
            if(req.user.role === 'user')
                query.userId = new mongoose.Types.ObjectId(req.user._id)
            if(isReply==='both'){
                delete query.isReply
            }
            if(isReply==='true'){
                query.isReply = true
            }
            if(status){
                query.status = status
            }
            const allTickets = await TicketModel.find(query).populate("userId resolverId accountId", "user_login display_name user_email accountEmail role accountType platform mtAccountId hasFailedMaxLoss hasFailedDailyLoss firstBalance dayBalance infinitive percentDays level type").skip(pageNumber*pageSize).limit(pageSize)
            const count = query.userId ||  query.type ? allTickets.length : await TicketModel.count()
            return res.status(200).json({
                result:{
                    items:allTickets,
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

    async getTicketReplies(req, res){
        const { originId:id } = req.params
        try {
            const ticket = await TicketModel.findById(id)
            const ticketReplies = await TicketModel.find({ originId:ticket._id }).populate("userId resolverId accountId", "user_login display_name user_email accountEmail role accountType platform mtAccountId hasFailedMaxLoss hasFailedDailyLoss firstBalance dayBalance infinitive percentDays level type").sort('-createdAt')
            return res.status(200).json({
                result:{
                    items:ticketReplies,
                    origin:ticket
                },
                message:"عملیات با موفقیت انجام شد",
                success:true
            })
        }
        catch(err){
            return res.send({
                result:null,
                success:false,
                message:"خطا در دریافت اطلاعات"
            })
        }
    }

    async post(req, res){
        const error = validationResult(req)
        if (!error.isEmpty()) {
            return res
              .status(400)
              .send({ result:null, message: "خطا در اعتبارسنجی", errors: error.array(), success:false });
        }

        const {
            title,
            description,
            accountId
        } = req.body

        console.log(req.user)

        const {
            _id:userId,
            role:userRole,
        } = req.user

        try {
            const newTicket = new TicketModel({
                userId,
                accountId,
                userRole,
                title,
                description,
                type:"question",
                isReply:false,
                status:'waiting'
            })
            const ticketDoc = await newTicket.save()

            return res.status(201).json({
                message: 'تیکت شما با موفقیت ثبت شد.',
                result:ticketDoc ,
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

    // async patch(req, res){
    //     const error = validationResult(req)
    //     if (!error.isEmpty()) {
    //         return res
    //           .status(400)
    //           .send({ result:null, message: "خطا در اعتبارسنجی", errors: error.array(), success:false });
    //     }
    //     const {
    //         status
    //     } = req.body

    //     const {
    //         id:ticketId
    //     } = req.params
    //     try {
    //         const ticket = await TicketModel.findByIdAndUpdate( ticketId, {
    //             status
    //         })
    //         if(ticket.type === "extend" && status==="accepted"){
    //             const account = await UserModel.findById(ticket.userId).select("startTradeDay endTradeDay")
    //             const [year, month, day] = new Date(new Date(account.startTradeDay).getTime() + 86400*1000).toLocaleDateString().split()
    //             account.endTradeDay = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
    //             const user = await account.save()
    //         }
    //         if(!ticket){
    //             return res
    //                 .status(401)
    //                 .send({ message: "درخواستی با مشخصات ارسال شده یافت نشد", result:null, success:false });
    //         }
    //         return res.status(200).json({
    //             result:true,
    //             message:"عملیات با موفقیت انجام شد",
    //             success:true
    //         })
    //     }
    //     catch(err){
    //         return res
    //             .status(401)
    //             .send({ message: "درخواستی با مشخصات ارسال شده یافت نشد", result:null, success:false });
    //     }
    // }

    async reply(req, res) {
        const error = validationResult(req)
        if (!error.isEmpty()) {
            return res
              .status(400)
              .send({ result:null, message: "خطا در اعتبارسنجی", errors: error.array(), success:false });
        }

        const {
            title,
            description,
            originId
        } = req.body

        let {
            originTicketStatus
        } = req.body

        const {
            _id:userId,
            role:userRole,
        } = req.user

        const resolverId = userRole==='admin' ? userId : undefined
        const type = userRole==='admin' ? 'answer' :'question'
        originTicketStatus = userRole==='admin' ? originTicketStatus : 'waiting'
        const newTicketStatus =  userRole==='admin' ? originTicketStatus : 'waiting'

        try {
            const originTicket = await TicketModel.findById(originId)
            const allTicketsWay = await TicketModel.updateMany({"$or":[{originId:new mongoose.Types.ObjectId(originId)}, {_id:new mongoose.Types.ObjectId(originId)}]}, {status:originTicketStatus})
            const newTicket = new TicketModel({
                userId,
                userRole,
                title,
                description,
                type,
                isReply:true,
                originId:originTicket._id,
                resolverId,
                accountId:originTicket.accountId,
                status:newTicketStatus
            })
            const ticketDoc = await newTicket.save()

            return res.status(201).json({
                message: ticketDoc,
                result: true,
                success:true
            });
        }
        catch(err){
            return res.send({
                result:null,
                success:false,
                message:"خطا در ثبت درخواست لطفا مجدد اقدام نمایید."
            })
        }
      
    }

    async close(req, res){
        const { originId:id } = req.params
        try {
            const tickets = await TicketModel.updateMany({"$or":[{originId:new mongoose.Types.ObjectId(id)}, {_id:new mongoose.Types.ObjectId(id)}]}, {
                status:'resolved'
            })
            return res.status(200).json({
                result:true,
                message:"عملیات با موفقیت انجام شد",
                success:true
            })
        }
        catch(err){
            return res.send({
                result:null,
                success:false,
                message:"خطا در دریافت اطلاعات"
            })
        }
    }

}

module.exports =  new TicketController(TicketModel, 'ticket')