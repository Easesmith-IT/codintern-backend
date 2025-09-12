exports.getOtpEmailTemplate = (otp) => {
  return `
    <div style="font-family: Arial, sans-serif; color: #333; padding: 20px;">
      <h2 style="color: #7E0CFF;">🔐 Your One-Time Password</h2>
      <p>Hello,</p>
      <p>Use the following OTP to proceed. It is valid for <strong>5 minutes</strong>.</p>
      <div style="font-size: 24px; font-weight: bold; margin: 20px 0; background: #f0f0f0; padding: 10px 20px; border-radius: 8px; display: inline-block;">
        ${otp}
      </div>
      <p>If you did not request this code, you can safely ignore this email.</p>
      <p style="margin-top: 40px;">Best regards,<br/><strong>Codintern Team</strong></p>
    </div>
  `;
};

exports.getGenerativeAiWorkshopRegistrationEmailTemplate = ({
  fullName,
  email,
}) => {
  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1.0" />
    <title>Workshop Registration Confirmed</title>
  </head>
  <body style="margin:0; padding:0; background-color:#f8f8f8; font-family:Arial, sans-serif; color:#333;">
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
      <tr>
        <td align="center" style="padding:40px 0;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="background-color:#ffffff; border-radius:10px; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,0.08);">
            
            <!-- Header -->
            <tr>
              <td align="center" style="background-color:#9237E3; padding:25px;">
                <h1 style="margin:0; font-size:22px; color:#ffffff; font-weight:bold;">
                  🎉 Registration Confirmed
                </h1>
              </td>
            </tr>

            <!-- Body -->
            <tr>
              <td style="padding:30px; font-size:16px; line-height:1.6;">
                <p>Hi <strong>${fullName}</strong>,</p>
                <p>Thank you for registering for our <strong>Generative AI Workshop</strong>! We’re thrilled to have you join us.</p>

                <p>Here’s a quick summary of your registration:</p>
                <ul style="padding-left:20px; margin:15px 0;">
                  <li><strong>Name:</strong> ${fullName}</li>
                  <li><strong>Email:</strong> ${email}</li>
                </ul>

                <p><strong>Workshop Details:</strong></p>
                <p>
                  📅 <strong>Date:</strong> Saturday, 28th September 2025 <br/>
                  ⏰ <strong>Time:</strong> 10:00 AM – 1:00 PM (IST) <br/>
                  📍 <strong>Venue:</strong> Online (Zoom – link will be shared 24 hours before the event)
                </p>

                <p style="margin-top:20px;">
                  We’ll send you a reminder email with the joining link and additional resources before the event.
                </p>

                <p style="margin-top:25px;">
                  If you have any questions, just reply to this email or contact us at 
                  <a href="mailto:info@codintern.com" style="color:#9237E3; text-decoration:none;">info@codintern.com</a>.
                </p>

                <p style="margin-top:30px;">Looking forward to seeing you at the workshop! 🚀</p>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td align="center" style="background-color:#f4f4f4; padding:20px; font-size:13px; color:#666;">
                © ${new Date().getFullYear()} CodIntern Team. All rights reserved.
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>
  `;
};
