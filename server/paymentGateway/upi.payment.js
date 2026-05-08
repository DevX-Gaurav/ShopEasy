const upiSessions = new Map();

const SESSION_TTL_MS = 10 * 60 * 1000; // 10 minutes

function purgeExpired() {
  const now = Date.now();
  for (const [token, session] of upiSessions.entries()) {
    if (session.expiresAt < now) upiSessions.delete(token);
  }
}

export const initiateUpiSession = (req, res) => {
  try {
    purgeExpired();

    const { amount, merchant } = req.body;

    if (!amount || isNaN(Number(amount))) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid amount" });
    }

    const token =
      Math.random().toString(36).slice(2, 10) +
      Date.now().toString(36) +
      Math.random().toString(36).slice(2, 8);

    upiSessions.set(token, {
      amount: Number(amount),
      merchant: merchant || "ShopEase",
      verified: false,
      expiresAt: Date.now() + SESSION_TTL_MS,
      createdAt: Date.now(),
    });

    console.log(`[UPI] Session created — token: ${token}, amount: ₹${amount}`);

    return res.status(200).json({ success: true, token });
  } catch (error) {
    console.error("[UPI] initiateUpiSession error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to create UPI session" });
  }
};

export const checkUpiSession = (req, res) => {
  try {
    purgeExpired();

    const { token } = req.query;

    if (!token) {
      return res
        .status(400)
        .json({ success: false, message: "Token is required" });
    }

    const session = upiSessions.get(token);

    if (!session) {
      return res
        .status(404)
        .json({ success: false, message: "Session not found or expired" });
    }

    return res.status(200).json({
      success: true,
      verified: session.verified,
      amount: session.amount,
      merchant: session.merchant,
    });
  } catch (error) {
    console.error("[UPI] checkUpiSession error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

export const confirmUpiSession = (req, res) => {
  try {
    purgeExpired();

    const { token } = req.body;

    if (!token) {
      return res
        .status(400)
        .json({ success: false, message: "Token is required" });
    }

    const session = upiSessions.get(token);

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Payment session not found or expired. Please try again.",
      });
    }

    if (session.verified) {
      return res.status(200).json({
        success: true,
        alreadyVerified: true,
        amount: session.amount,
        merchant: session.merchant,
      });
    }

    session.verified = true;
    upiSessions.set(token, session);

    console.log(
      `[UPI] Session verified — token: ${token}, amount: ₹${session.amount}`,
    );

    return res.status(200).json({
      success: true,
      verified: true,
      amount: session.amount,
      merchant: session.merchant,
    });
  } catch (error) {
    console.error("[UPI] confirmUpiSession error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};
