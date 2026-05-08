import { createTransport } from "nodemailer";
import dotenv from "dotenv";
dotenv.config();


const transporter = createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});


export const emailOtpSend = async (req, res) => {
  const { email, userName, type } = req.body; 

  // 1. Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000);


  const mailOptions = {
    from: `"ShopEasy" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `Your ShopEasy Verification Code: ${otp}`,
    html: `
  <div style="font-family: 'DM Sans', Helvetica, Arial, sans-serif; background-color: #FDF5E6; padding: 50px 20px; text-align: center;">
    <div style="max-width: 500px; margin: 0 auto; background-color: #FFFFFF; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05); border: 1px solid #FEF3C7;">
      
      <div style="background-color: #EA580C; padding: 20px;">
        <h1 style="color: #FFFFFF; margin: 0; font-size: 24px; letter-spacing: 1px;">ShopEasy</h1>
      </div>

      <div style="padding: 40px 30px; background-color: #FFFFFF;">
        <h2 style="color: #1E293B; margin-top: 0; font-size: 20px;">Hello, ${userName || "Valued Customer"}!</h2>
        <p style="color: #475569; font-size: 16px; line-height: 1.6;">
          To complete your <strong>${type || "Account Access"}</strong> process, please use the OTP given below. This OTP is valid for only 10 minutes.
        </p>

        <div style="margin: 35px 0;">
          <div style="display: inline-block; background-color: #FFFBEB; border: 2px dashed #F59E0B; padding: 15px 30px; border-radius: 8px;">
            <span style="font-size: 36px; font-weight: bold; color: #EA580C; letter-spacing: 8px; font-family: monospace;">
              ${otp}
            </span>
          </div>
        </div>

        <p style="color: #94A3B8; font-size: 13px; font-style: italic;">
          If you didn't request this code, you can safely ignore this email.
        </p>
      </div>

      <div style="background-color: #FFFBEB; padding: 20px; border-top: 1px solid #FEF3C7;">
        <p style="font-size: 12px; color: #B45309; margin: 0;">
          &copy; 2026 <strong>ShopEasy</strong> Marketplace. <br>
          Experience the best of modern shopping.
        </p>
      </div>
    </div>
  </div>
`,
  };

  try {
    await transporter.sendMail(mailOptions);
    res
      .status(200)
      .json({ success: true, otp: otp, message: "OTP sent successfully!" });
  } catch (error) {
    console.error("Email Error:", error);
    res.status(500).json({ success: false, message: "Failed to send email." });
  }
};
