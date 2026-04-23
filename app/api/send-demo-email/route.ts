import { NextRequest, NextResponse } from "next/server";
import EmailService from "@/lib/emailService";

export async function POST(req: NextRequest) {
  try {
    const { customerEmail, customerSubject, customerBody } = await req.json();
    if (!customerEmail || !customerSubject || !customerBody) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    // Send email to agent (your own address)
    await EmailService.send({
      to: process.env.SMTP_FROM_EMAIL || "noreply@voicecall-system.com",
      subject: `[Demo] Customer Issue: ${customerSubject}`,
      html: `<p><strong>From:</strong> ${customerEmail}</p><p><strong>Message:</strong><br/>${customerBody}</p>`
    });

    // Auto-reply to customer
    await EmailService.send({
      to: customerEmail,
      subject: `Re: ${customerSubject}`,
      html: `<p>Hi,</p><p>Thank you for contacting our agent. We have received your message:</p><blockquote>${customerBody}</blockquote><p>Our team will respond as soon as possible.<br><br><em>This is an automated demo reply.</em></p>`
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: (error instanceof Error ? error.message : String(error)) }, { status: 500 });
  }
}
