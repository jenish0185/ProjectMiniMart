// test-email.js
const nodemailer = require("nodemailer");
require("dotenv").config();

async function testEmail() {
  try {
    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: "bhagawati.jerry@gmail.com", // Replace with your real email
      subject: "Test Email",
      text: "This is a test from Node.js!",
    });

    console.log("Message sent:", info.messageId);
  } catch (err) {
    console.error("Error sending email:", err.message);
  }
}

testEmail();