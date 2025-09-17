const Otp = require("../models/Otp");
const { getOtpEmailTemplate } = require("../utils/emailTemplate");
const { resend } = require("./resend");

exports.sendOtpSms = async (phone) => {
  try {
    const otp = Math.floor(100000 + Math.random() * 900000);
    const fetchReq = await fetch("https://control.msg91.com/api/v5/flow", {
      method: "POST",
      headers: {
        authkey: "372402AzHs005I672c389bP1",
        accept: "application/json",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        template_id: "61f9414634696e7dfc2f76fe",
        short_url: "1 (On) or 0 (Off)",
        realTimeResponse: "1 (Optional)",
        recipients: [
          {
            mobiles: phone,
            var1: otp.toString(),
          },
        ],
      }),
    });
    const response = await fetchReq.json();
    console.log(response);

    const expirationTimeframe = 10 * 60 * 1000; // 5 minutes in milliseconds
    const currentTime = new Date(); // Current time
    const otpExpiresAt = new Date(currentTime.getTime() + expirationTimeframe);
    const existingOtpDoc = await UserOtpLink.findOne({
      phone,
    });
    if (existingOtpDoc) {
      existingOtpDoc.otp = otp;
      existingOtpDoc.otpExpiresAt = otpExpiresAt;
      await existingOtpDoc.save();
    } else {
      await UserOtpLink.findOneAndDelete({ phone });
      const otpDoc = new UserOtpLink({
        phone,
        otp: otp,
        otpExpiresAt: otpExpiresAt,
      });
      await otpDoc.save();
    }
  } catch (err) {
    console.log(err);
  }
};

exports.sendOtpEmail = async (email,res) => {
  try {
    const otp = Math.floor(100000 + Math.random() * 900000);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 mins

    // Replace or upsert OTP
    await Otp.findOneAndUpdate(
      { email, type: "register" },
      { otp, otpExpiresAt: expiresAt, verified: false },
      { upsert: true }
    );

    // Send email
    const htmlContent = getOtpEmailTemplate(otp);

    try {
      await resend.emails.send({
        from: "Codintern <no-reply@codintern.com>",
        to: email,
        subject: "Your OTP Code",
        html: htmlContent,
      });
    } catch (error) {
      console.error("Failed to send email:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to send OTP",
        error: error?.message || "Unknown error",
      });
    }


    console.log(`OTP for ${email}: ${otp}`);
  } catch (err) {
    console.error("OTP send error:", err);
  }
};
