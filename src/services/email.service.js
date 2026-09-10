const { resend, EMAIL_FROM } = require("../config/resend");

async function sendConfirmationEmail(email, link) {
  const { data, error } = await resend.emails.send({
    from: EMAIL_FROM,
    to: [email],
    subject: "تأكيد حسابك",
    text: `مرحبًا،

اضغط على الرابط التالي لتأكيد حسابك:

${link}

إذا لم تطلب هذا، تجاهل هذا الإيميل.`,
  });

  if (error) {
    throw new Error(
      error.message || "Failed to send confirmation email via Resend"
    );
  }

  return data;
}

async function sendPasswordResetEmail(email, link) {
  const { data, error } = await resend.emails.send({
    from: EMAIL_FROM,
    to: [email],
    subject: "إعادة تعيين كلمة المرور",
    text: `مرحبًا،

اضغط على الرابط التالي لإعادة تعيين كلمة المرور:

${link}

إذا لم تطلب هذا، تجاهل هذا الإيميل.`,
  });

  if (error) {
    throw new Error(
      error.message || "Failed to send password reset email via Resend"
    );
  }

  return data;
}

module.exports = {
  sendConfirmationEmail,
  sendPasswordResetEmail,
};