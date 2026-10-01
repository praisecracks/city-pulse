const fetch = require("node-fetch");

async function sendOtpViaTermii(phone, otp) {
  const formattedPhone = phone.startsWith("0") ? "234" + phone.slice(1) : phone;

  // DEV MODE: Log OTP instead of sending via Termii (skip sender ID approval)
  if (process.env.NODE_ENV === "development" && process.env.TERMII_DEV_MODE === "true") {
    console.log(`[Termii DEV] OTP for ${formattedPhone}: ${otp}`);
    return { success: true, data: { message: "DEV MODE - OTP logged to console" } };
  }

  const body = {
    api_key: process.env.TERMII_API_KEY,
    to: formattedPhone,
    from: process.env.TERMII_SENDER_ID || "CityPulse",
    sms: `Your City Pulse verification code is ${otp}`,
    type: "plain",
    channel: "generic",
  };

  const url = `${process.env.TERMII_BASE_URL}api/sms/send`;
  console.log("[Termii] Sending to:", url);

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  console.log("[Termii] Response:", res.status, data);

  if (!res.ok) {
    return { success: false, error: data };
  }
  return { success: true, data };
}

module.exports = { sendOtpViaTermii };