// src/services/email.service.js
const { resend, EMAIL_FROM } = require("../config/resend");

async function sendConfirmationEmail(email, link) {
  return resend.emails.send({
    from: EMAIL_FROM,
    to: [email],
    subject: "تأكيد حسابك",
    html: `
      <p>مرحبًا،</p>
      <p>اضغط على الرابط التالي لتأكيد حسابك:</p>
      <p><a href="${link}">تأكيد الحساب</a></p>
      <p>إذا لم تطلب هذا، تجاهل هذا الإيميل.</p>
    `,
  });
}

async function sendPasswordResetEmail(email, link) {
  return resend.emails.send({
    from: EMAIL_FROM,
    to: [email],
    subject: "إعادة تعيين كلمة المرور",
    html: `
      <p>مرحبًا،</p>
      <p>اضغط على الرابط التالي لإعادة تعيين كلمة المرور:</p>
      <p><a href="${link}">إعادة تعيين كلمة المرور</a></p>
      <p>إذا لم تطلب هذا، تجاهل هذا الإيميل.</p>
    `,
  });
}

module.exports = { sendConfirmationEmail, sendPasswordResetEmail };