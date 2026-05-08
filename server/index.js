import express, { json } from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import { emailOtpSend } from "./email/emai.otp.js";
import { createOrder, verifyPayment } from "./paymentGateway/razor.payment.js";
import {
  initiateUpiSession, 
  checkUpiSession, 
  confirmUpiSession, 
} from "./paymentGateway/upi.payment.js"; 

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const corsOption = {
  origin: process.env.FRONTEND_URL,
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

app.use(cors(corsOption));
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: false }));
app.use(json());
app.use(cors({ origin: process.env.FRONTEND_URL }));

app.get("/", (req, res) => {
  res.send("hello server");
});

/* email otp related route */
app.post("/api/send-otp", emailOtpSend);

/* razor payment related routes */
app.post("/api/create", createOrder);
app.post("/api/verify", verifyPayment);

/* upi payment related routes */
app.post("/api/upi-initiate", initiateUpiSession); 
app.get("/api/upi-check", checkUpiSession); 
app.post("/api/upi-confirm", confirmUpiSession); 

app.listen(PORT, () => console.log(`ShopEasy Server running on port ${PORT}`));
