const nodemailer = require('nodemailer')
const TOKEN = 'gqoksglhkytcratr'
const SENDERـUSERـEMAIL = "Sarmayegozarebartar@gmail.com"
const PORT = 8000
// const mongoose = require('mongoose')

const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
          user: SENDERـUSERـEMAIL,
          pass: TOKEN
        }
});

const sendEmail = (options, handler)=>{
  // const mailOptions = {
  //   subject: 'Node Mailer', // Subject line
  //   text: 'Hello People!, Welcome to Bacancy!', // Plain text body
  // };
  // function(err, info) {
  //   if (err) {
  //     console.log(err)
  //   } else {
  //     console.log(info);
  //   }
  //  }
  return transporter.sendMail({...options, from :SENDERـUSERـEMAIL}, handler)
}

exports.sendEmail = sendEmail
exports.transporter = transporter
exports.runServer = async (app)=>{
  try {
    app.listen(PORT)  
    // const connection = await mongoose.connect("link to your cluster", { useUnifiedTopology: true, useNewUrlParser: true })
    // exports.connection = connection
  } catch (error) {
    console.log(error)
  }
}
