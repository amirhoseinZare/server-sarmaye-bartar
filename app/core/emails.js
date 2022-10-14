const { sendMail } = require("./utils")

const dailyDrawdonwMessage = ({
    metaUsername,
    username,
    initialBalance,
    hadZarrar,
    omgh
})=>{
    return `<!doctype html>
    <html ⚡4email data-css-strict>
    
    <head>
      <meta charset="utf-8">
      <meta name="x-apple-disable-message-reformatting">
      <style amp4email-boilerplate>
        body {
          visibility: hidden
        }
      </style>
    
      <script async src="https://cdn.ampproject.org/v0.js"></script>
    
    
      <style amp-custom>
        .u-row {
          display: flex;
          flex-wrap: nowrap;
          margin-left: 0;
          margin-right: 0;
        }
        
        .u-row .u-col {
          position: relative;
          width: 100%;
          padding-right: 0;
          padding-left: 0;
        }
        
        .u-row .u-col.u-col-100 {
          flex: 0 0 100%;
          max-width: 100%;
        }
        
        @media (max-width: 767px) {
          .u-row:not(.no-stack) {
            flex-wrap: wrap;
          }
          .u-row:not(.no-stack) .u-col {
            flex: 0 0 100%;
            max-width: 100%;
          }
        }
        
        body {
          margin: 0;
          padding: 0;
        }
        
        table,
        tr,
        td {
          vertical-align: top;
          border-collapse: collapse;
        }
        
        p {
          margin: 0;
        }
        
        .ie-container table,
        .mso-container table {
          table-layout: fixed;
        }
        
        * {
          line-height: inherit;
        }
        
        table,
        td {
          color: #000000;
        }
      </style>
    
    
    </head>
    
    <body class="clean-body u_body" style="margin: 0;padding: 0;background-color: #ffffff;color: #000000">
      <!--[if IE]><div class="ie-container"><![endif]-->
      <!--[if mso]><div class="mso-container"><![endif]-->
      <table style="border-collapse: collapse;table-layout: fixed;border-spacing: 0;vertical-align: top;min-width: 320px;Margin: 0 auto;background-color: #ffffff;width:100%" cellpadding="0" cellspacing="0">
        <tbody>
          <tr style="vertical-align: top">
            <td style="word-break: break-word;border-collapse: collapse;vertical-align: top">
              <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" style="background-color: #ffffff;"><![endif]-->
    
              <div style="padding: 0px;">
                <div style="max-width: 500px;margin: 0 auto;">
                  <div class="u-row">
    
                    <div class="u-col u-col-100">
                      <div style="padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;">
    
                        <table style="font-family:arial,helvetica,sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
                          <tbody>
                            <tr>
                              <td style="overflow-wrap:break-word;word-break:break-word;padding:10px;font-family:arial,helvetica,sans-serif;" align="left">
    
                                <h1 style="margin: 0px; line-height: 140%; text-align: left; word-wrap: break-word; font-weight: normal; font-family: arial,helvetica,sans-serif; font-size: 22px;">
                                  Daily Drawdown Violation
                                </h1>
    
                              </td>
                            </tr>
                          </tbody>
                        </table>
    
                        <table style="font-family:arial,helvetica,sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
                          <tbody>
                            <tr>
                              <td style="overflow-wrap:break-word;word-break:break-word;padding:10px;font-family:arial,helvetica,sans-serif;" align="left">
    
                                <div style="line-height: 140%; text-align: left; word-wrap: break-word;">
                                  <p style="font-size: 14px; line-height: 140%;">Dear {{username}}<br />Meta username:{{metaUsername}}<br />We are so SORRY to inform you that, Our Automatic Drawdown detection system Found a Daily Drawdown Violation on your Account. <br />=============================== <br
                                    />Here's The Detail: <br /> <br />Your Initial Balance: {{initialBalance}}$ <br />Maximum Acceptable Daily Loss 5% = {{hadZarrar}}$ <br />Your Equity touched={{omgh}}$</p>
                                </div>
    
                              </td>
                            </tr>
                          </tbody>
                        </table>
    
                        <table style="font-family:arial,helvetica,sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
                          <tbody>
                            <tr>
                              <td style="overflow-wrap:break-word;word-break:break-word;padding:10px;font-family:arial,helvetica,sans-serif;" align="left">
    
                                <h3 style="margin: 0px; line-height: 140%; text-align: left; word-wrap: break-word; font-weight: normal; font-family: arial,helvetica,sans-serif; font-size: 18px;">
                                  Sarmayegozar Bartar
                                </h3>
    
                              </td>
                            </tr>
                          </tbody>
                        </table>
    
                      </div>
                    </div>
    
                  </div>
                </div>
              </div>
    
              <!--[if (mso)|(IE)]></td></tr></table><![endif]-->
            </td>
          </tr>
        </tbody>
      </table>
      <!--[if mso]></div><![endif]-->
      <!--[if IE]></div><![endif]-->
    </body>
    
    </html>`.replace("{{metaUsername}}", metaUsername).replace("{{username}}", username).replace("{{initialBalance}}", initialBalance).replace("{{hadZarrar}}", hadZarrar).replace("{{omgh}}", omgh)
}

const maxDrawdownMessage = ({userName, firstBalance, hadZarrar, balance})=>{
    console.log({userName, firstBalance, hadZarrar, balance}, "maxDrawdownMessage")
    return `<!doctype html>
    <html ⚡4email data-css-strict>
    
    <head>
      <meta charset="utf-8">
      <meta name="x-apple-disable-message-reformatting">
      <style amp4email-boilerplate>
        body {
          visibility: hidden
        }
      </style>
    
      <script async src="https://cdn.ampproject.org/v0.js"></script>
    
    
      <style amp-custom>
        .u-row {
          display: flex;
          flex-wrap: nowrap;
          margin-left: 0;
          margin-right: 0;
        }
        
        .u-row .u-col {
          position: relative;
          width: 100%;
          padding-right: 0;
          padding-left: 0;
        }
        
        .u-row .u-col.u-col-100 {
          flex: 0 0 100%;
          max-width: 100%;
        }
        
        @media (max-width: 767px) {
          .u-row:not(.no-stack) {
            flex-wrap: wrap;
          }
          .u-row:not(.no-stack) .u-col {
            flex: 0 0 100%;
            max-width: 100%;
          }
        }
        
        body {
          margin: 0;
          padding: 0;
        }
        
        table,
        tr,
        td {
          vertical-align: top;
          border-collapse: collapse;
        }
        
        p {
          margin: 0;
        }
        
        .ie-container table,
        .mso-container table {
          table-layout: fixed;
        }
        
        * {
          line-height: inherit;
        }
        
        table,
        td {
          color: #000000;
        }
      </style>
    
    
    </head>
    
    <body class="clean-body u_body" style="margin: 0;padding: 0;background-color: #ffffff;color: #000000">
      <!--[if IE]><div class="ie-container"><![endif]-->
      <!--[if mso]><div class="mso-container"><![endif]-->
      <table style="border-collapse: collapse;table-layout: fixed;border-spacing: 0;vertical-align: top;min-width: 320px;Margin: 0 auto;background-color: #ffffff;width:100%" cellpadding="0" cellspacing="0">
        <tbody>
          <tr style="vertical-align: top">
            <td style="word-break: break-word;border-collapse: collapse;vertical-align: top">
              <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" style="background-color: #ffffff;"><![endif]-->
    
              <div style="padding: 0px;">
                <div style="max-width: 500px;margin: 0 auto;">
                  <div class="u-row">
    
                    <div class="u-col u-col-100">
                      <div style="padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;border-radius: 0px;">
    
                        <table style="font-family:arial,helvetica,sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
                          <tbody>
                            <tr>
                              <td style="overflow-wrap:break-word;word-break:break-word;padding:10px;font-family:arial,helvetica,sans-serif;" align="left">
    
                                <h1 style="margin: 0px; line-height: 140%; text-align: left; word-wrap: break-word; font-weight: normal; font-family: arial,helvetica,sans-serif; font-size: 22px;">
                                  Maximum Drawdown Violation
                                </h1>
    
                              </td>
                            </tr>
                          </tbody>
                        </table>
    
                        <table style="font-family:arial,helvetica,sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
                          <tbody>
                            <tr>
                              <td style="overflow-wrap:break-word;word-break:break-word;padding:10px;font-family:arial,helvetica,sans-serif;" align="left">
    
                                <div style="line-height: 140%; text-align: left; word-wrap: break-word;">
                                  <p style="font-size: 14px; line-height: 140%;">Dear {{username}}<br />  <br />We are so SORRY to inform you that, Our Automatic Drawdown detection system Found a Maximum Drawdown Violation on your Account.  <br />===============================  <br />Here's The Detail:
                                     <br />  <br />Your Initial Balance: {{firstBalance}}<br />Maximum Acceptable Monthly Drawdown 12% = {{hadZarrar}}<br />Your Balance touched={{balance}}</p>
                                </div>
    
                              </td>
                            </tr>
                          </tbody>
                        </table>
    
                        <table style="font-family:arial,helvetica,sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
                          <tbody>
                            <tr>
                              <td style="overflow-wrap:break-word;word-break:break-word;padding:10px;font-family:arial,helvetica,sans-serif;" align="left">
    
                                <h3 style="margin: 0px; line-height: 140%; text-align: left; word-wrap: break-word; font-weight: normal; font-family: arial,helvetica,sans-serif; font-size: 18px;">
                                  Sarmayegozar Bartar
                                </h3>
    
                              </td>
                            </tr>
                          </tbody>
                        </table>
    
                      </div>
                    </div>
    
                  </div>
                </div>
              </div>
    
              <!--[if (mso)|(IE)]></td></tr></table><![endif]-->
            </td>
          </tr>
        </tbody>
      </table>
      <!--[if mso]></div><![endif]-->
      <!--[if IE]></div><![endif]-->
    </body>
    
    </html>`.replace("{{username}}", userName).replace("{{firstBalance}}", firstBalance)
    .replace("{{hadZarrar}}", hadZarrar).replace("{{balance}}", balance)
}
``
const dailyDrawdonw = ({to, userName, metaUsername, initialBalance, maxAbsoluteDrawdown})=> {
    sendMail({
        to:to,
        subject:"Daily Drawdown Violation",
        html:dailyDrawdonwMessage({metaUsername, userName, initialBalance, hadZarrar:initialBalance*0.05, omgh:initialBalance-maxAbsoluteDrawdown})
    })
}

const maxDrawdown = ({to, userName, firstBalance, balance}) =>{
    console.log({to, userName, firstBalance, balance}, "maxdrawdown")
    sendMail({
        to:to,
        subject:"Maximum Drawdown Violation",
        html:maxDrawdownMessage({userName, firstBalance, hadZarrar:firstBalance*0.12, balance})
    })
  }

module.exports = {
  dailyDrawdonw,
  maxDrawdown
}