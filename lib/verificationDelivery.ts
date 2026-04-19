import nodemailer from "nodemailer";

export interface VerificationDeliveryResult {
  delivered: boolean;
  channel: "email" | "phone" | "preview";
  message: string;
}

function canSendEmail(): boolean {
  return Boolean(
    process.env.SMTP_HOST &&
      process.env.SMTP_PORT &&
      process.env.SMTP_USERNAME &&
      process.env.SMTP_PASSWORD &&
      process.env.SMTP_FROM_EMAIL
  );
}

export async function sendVerificationCode(input: {
  businessName: string;
  verificationMethod: "email" | "phone";
  email?: string | null;
  phone?: string | null;
  verificationCode: string;
  verificationUrl?: string | null;
}): Promise<VerificationDeliveryResult> {
  if (input.verificationMethod === "email" && input.email && canSendEmail()) {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USERNAME,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    await transporter.sendMail({
      from: process.env.SMTP_FROM_EMAIL,
      to: input.email,
      subject: `${input.businessName} verification email`,
      text: input.verificationUrl
        ? `Click this link to verify your account: ${input.verificationUrl}\n\nThis link expires in 15 minutes.`
        : `Your verification code is ${input.verificationCode}. It expires in 15 minutes.`,
      html: input.verificationUrl
        ? `<div style="font-family:Arial,sans-serif;line-height:1.5"><h2>Verify your business account</h2><p>Click the button below to verify your email and activate your workspace.</p><p style="margin:20px 0"><a href="${input.verificationUrl}" style="display:inline-block;padding:12px 18px;background:#0ea5e9;color:#fff;text-decoration:none;border-radius:8px;font-weight:700">Verify email</a></p><p>If the button does not work, use this link:</p><p><a href="${input.verificationUrl}">${input.verificationUrl}</a></p><p>This link expires in 15 minutes.</p></div>`
        : `<div style="font-family:Arial,sans-serif;line-height:1.5"><h2>Verify your business account</h2><p>Your verification code is:</p><p style="font-size:32px;font-weight:700;letter-spacing:0.12em">${input.verificationCode}</p><p>This code expires in 15 minutes.</p></div>`,
    });

    return {
      delivered: true,
      channel: "email",
      message: `Verification email sent to ${input.email}.`,
    };
  }

  return {
    delivered: false,
    channel: "preview",
    message: "Email delivery is not configured, using preview code instead.",
  };
}