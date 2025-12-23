import dotenv from "dotenv";
dotenv.config();

import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { name, email, phone, address, message } = req.body;

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
      from: "onboarding@resend.dev", // Test email (use your verified domain in production)
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
