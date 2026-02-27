import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();
app.use(cors());
app.use(express.json());

// Health check
app.get("/", (req, res) => {
  res.json({ status: "ok", message: "Backend is live 🎉" });
});

// 🔐 Paystack verification endpoint
app.post("/verify-payment", async (req, res) => {
  const { reference } = req.body;

  if (!reference) {
    return res.status(400).json({ success: false, message: "Missing payment reference" });
  }

  try {
    const response = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        method: "GET", // Must be GET
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`, // your secret key
          "Content-Type": "application/json",
        },
      }
    );

    const data = await response.json();

    // 🔑 Trust only Paystack status
    if (data.status === true && data.data.status === "success") {
      return res.json({
        success: true,
        message: "Payment verified",
        reference: data.data.reference,
        amount: data.data.amount,
        customer: data.data.customer,
      });
    } else {
      return res.status(400).json({
        success: false,
        message: "Payment not successful",
        data,
      });
    }
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Verification failed",
      details: err.message,
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on port", PORT));
