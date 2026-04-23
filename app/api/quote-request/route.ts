import nodemailer from "nodemailer";

import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const { name, email, company, projectType, details } = await req.json();

  // Configure your SMTP or use a service like SendGrid/Mailgun
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const mailOptions = {
    from: process.env.QUOTE_FROM || process.env.SMTP_USER,
    to: process.env.QUOTE_TO || process.env.SMTP_USER,
    subject: `New Quote Request: ${projectType} from ${name}`,
    text: `Name: ${name}\nEmail: ${email}\nCompany: ${company}\nProject Type: ${projectType}\nDetails: ${details}`,
    html: `<strong>Name:</strong> ${name}<br/><strong>Email:</strong> ${email}<br/><strong>Company:</strong> ${company}<br/><strong>Project Type:</strong> ${projectType}<br/><strong>Details:</strong><br/>${details.replace(/\n/g, '<br/>')}`,
  };

  try {
    await transporter.sendMail(mailOptions);
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Failed to send email" }), { status: 500 });
  }
}
