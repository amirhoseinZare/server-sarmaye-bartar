const { TicketModel, UserModel } = require('../../models/index')
const { validationResult } = require("express-validator");
const mongoose = require("mongoose")

class TicketController {
    async getAll(req, res){
        try {
            let { pageSize=20 , pageNumber=1, type="", user_email="" } = req.query
            pageSize = +pageSize
            pageNumber = +pageNumber
            pageNumber = pageNumber-1
            const query = {}
            // if(user_email)
            //     query.user_email = user_email
            // if(type)
            //     query.type = type
            const allTickets = await TicketModel.find(query).skip(pageNumber*pageSize).limit(pageSize)
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
            resolverId,
            title,
            description,
            type,
            isReply,
            originId,
            status
        } = req.body

        console.log(req.user)

        const {
            _id:userId,
            mtAccountId:accountId,
            role:userRole,
        } = req.user

        console.log({
            userId:new mongoose.Types.ObjectId(userId),
            resolverId,
            accountId,
            userRole,
            title,
            description,
            type,
            isReply,
            originId,
            status
        })
        
        try {
            const newTicket = new TicketModel({
                userId,
                resolverId,
                accountId,
                userRole,
                title,
                description,
                type,
                isReply,
                originId,
                status:'waiting'
            })
            const ticketDoc = await newTicket.save()

            return res.status(201).json({
                message: ticketDoc,
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
            id:ticketId
        } = req.params
        try {
            const ticket = await TicketModel.findByIdAndUpdate( ticketId, {
                status
            })
            if(ticket.type === "extend" && status==="accepted"){
                const account = await UserModel.findById(ticket.userId).select("startTradeDay endTradeDay")
                const [year, month, day] = new Date(new Date(account.startTradeDay).getTime() + 86400*1000).toLocaleDateString().split()
                account.endTradeDay = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
                const user = await account.save()
            }
            if(!ticket){
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

module.exports =  new TicketController(TicketModel, 'ticket')