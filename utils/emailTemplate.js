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
      <p style="margin-top: 40px;">Best regards,<br/><strong>Easesmith Team</strong></p>
    </div>
  `;
};
