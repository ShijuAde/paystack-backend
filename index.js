import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import nodemailer from "nodemailer";

const app = express();
app.use(cors());
app.use(express.json());

// --------------------
// Email Setup
// --------------------
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,      // your Gmail address
    pass: process.env.EMAIL_PASS       // 16-char app password
  }
});

// Function to send emails
async function sendOrderEmails({ customerEmail, adminEmail, order }) {
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

// --------------------
// Health check
// --------------------
app.get("/", (req, res) => {
  res.json({ status: "ok", message: "Backend is live 🎉" });
});

// --------------------
// Paystack verification endpoint
// --------------------
app.post("/verify-payment", async (req, res) => {
  const { reference, customerEmail, cart } = req.body;

  if (!reference || !customerEmail || !cart) {
    return res.status(400).json({ success: false, message: "Missing required fields" });
  }

  try {
    // Verify with Paystack
    const response = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const data = await response.json();

    if (data.status === true && data.data.status === "success") {
      // Payment verified → send emails
      const order = {
        reference: data.data.reference,
        amount: data.data.amount / 100, // kobo to naira
        email: customerEmail,
        cart,
        paidAt: new Date().toISOString()
      };

      await sendOrderEmails({
        customerEmail,
        adminEmail: process.env.EMAIL_USER,
        order
      });

      return res.json({
        success: true,
        message: "Payment verified and emails sent",
        order
      });
    } else {
      return res.status(400).json({
        success: false,
        message: "Payment not successful",
        data
      });
    }
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Verification failed",
      details: err.message
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on port", PORT));
