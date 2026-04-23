import { NextRequest, NextResponse } from "next/server";
import EmailService from "@/lib/emailService";

export async function POST(req: NextRequest) {
  try {
    const { name, email, company, message } = await req.json();
    if (!name || !email || !message) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }
    await EmailService.send({
      to: process.env.SMTP_FROM_EMAIL || "noreply@voicecall-system.com",
      subject: `[Contact Form] New inquiry from ${name}`,
      html: `<p><strong>Name:</strong> ${name}</p><p><strong>Email:</strong> ${email}</p><p><strong>Company:</strong> ${company || "-"}</p><p><strong>Message:</strong><br/>${message}</p>`
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: (error instanceof Error ? error.message : String(error)) }, { status: 500 });
  }
}
