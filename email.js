import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

export async function sendOrderEmails({ customerEmail, adminEmail, order }) {
  const adminMail = {
    from: process.env.EMAIL_USER,
    to: adminEmail,
    subject: "🛒 New Paid Order",
    html: `
      <h2>New Order Paid</h2>
      <pre>${JSON.stringify(order, null, 2)}</pre>
    `
  };

  const customerMail = {
    from: process.env.EMAIL_USER,
    to: customerEmail,
    subject: "✅ Order Confirmation",
    html: `
      <h2>Thank you for your order</h2>
      <p>Your payment was successful.</p>
      <pre>${JSON.stringify(order, null, 2)}</pre>
    `
  };

  await transporter.sendMail(adminMail);
  await transporter.sendMail(customerMail);
}
