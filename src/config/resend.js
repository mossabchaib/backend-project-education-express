// src/config/resend.js
const { Resend } = require("resend");
require("dotenv").config();

if (!process.env.RESEND_API_KEY) {
  throw new Error("Missing RESEND_API_KEY in your .env file.");
}

const resend = new Resend(process.env.RESEND_API_KEY);
const EMAIL_FROM = process.env.EMAIL_FROM || "onboarding@resend.dev";

module.exports = { resend, EMAIL_FROM };