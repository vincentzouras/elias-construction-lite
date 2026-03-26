import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

async function verifyRecaptcha({ token, expectedAction, remoteIp }) {
  const secret = process.env.RECAPTCHA_SECRET_KEY || process.env.RECAPTCHA_ENTERPRISE_API_KEY;
  if (!secret) {
    return { ok: false, message: "Server is missing reCAPTCHA secret key." };
  }

  if (!token) {
    return { ok: false, message: "Missing reCAPTCHA token." };
  }

  const body = new URLSearchParams({
    secret,
    response: token,
  });
  if (remoteIp) body.set("remoteip", remoteIp);

  const response = await fetch("https://www.google.com/recaptcha/api/siteverify", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  const data = await response.json();
  if (!data?.success) {
    return { ok: false, message: "reCAPTCHA verification failed." };
  }

  // reCAPTCHA v3 returns score + action; v2 typically does not.
  if (typeof data.action === "string" && expectedAction && data.action !== expectedAction) {
    return { ok: false, message: "reCAPTCHA action mismatch." };
  }

  if (typeof data.score === "number") {
    const threshold = Number(process.env.RECAPTCHA_SCORE_THRESHOLD ?? 0.5);
    if (Number.isFinite(threshold) && data.score < threshold) {
      return { ok: false, message: "reCAPTCHA score too low." };
    }
  }

  return { ok: true, data };
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { name, email, phone, address, message, recaptchaToken, recaptchaAction } = req.body;

  // Verify reCAPTCHA before doing any work that can be abused.
  try {
    const forwardedFor = req.headers["x-forwarded-for"];
    const remoteIp = Array.isArray(forwardedFor)
      ? forwardedFor[0]
      : typeof forwardedFor === "string"
        ? forwardedFor.split(",")[0]?.trim()
        : undefined;

    const verification = await verifyRecaptcha({
      token: recaptchaToken,
      expectedAction: recaptchaAction || "contact_form",
      remoteIp,
    });

    if (!verification.ok) {
      return res.status(400).send("reCAPTCHA verification failed. Please try again.");
    }
  } catch (error) {
    console.error("reCAPTCHA error:", error);
    return res.status(400).send("reCAPTCHA verification failed. Please try again.");
  }

  // Validate inputs
  if (!name || !email || !phone || !address || !message) {
    return res.status(400).send("All fields are required");
  }

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).send("Please provide a valid email address");
  }

  try {
    const result = await resend.emails.send({
      from: "projectinquiry@eliasremodel.com", // Test email (use your verified domain in production)
      to: "vincentzouras@gmail.com", // Your business email
      replyTo: email, // Customer's email for replies
      subject: `New Project Inquiry from ${name}`,
      html: `
        <h2>New Project Inquiry</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone}</p>
        <p><strong>Home Address:</strong> ${address}</p>
        <h3>Project Details:</h3>
        <p>${message.replace(/\n/g, "<br>")}</p>
      `,
    });

    if (result.error) {
      console.error("Resend error:", result.error);
      return res.status(500).send("Error sending email. Please try again later.");
    }

    res.status(200).json({ message: "Email sent successfully", id: result.data.id });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Error sending email. Please try again later.");
  }
}
