const { Resend } = require("resend");

exports.resend = new Resend(process.env.RESEND_API_KEY);
