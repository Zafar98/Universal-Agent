import nodemailer from "nodemailer";

interface EmailOptions {
  to: string;
  subject: string;
  html?: string;
  text?: string;
}

class EmailService {
  private transporter: any;

  constructor() {
    // Use test account or configured SMTP
    const smtpHost = process.env.SMTP_HOST || "localhost";
    const smtpPort = parseInt(process.env.SMTP_PORT || "1025", 10);
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    const transportConfig: any = {
      host: smtpHost,
      port: smtpPort,
      secure: process.env.NODE_ENV === "production",
    };

    if (smtpUser && smtpPass) {
      transportConfig.auth = {
        user: smtpUser,
        pass: smtpPass,
      };
    }

    this.transporter = nodemailer.createTransport(transportConfig);
  }

  async send(options: EmailOptions): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: process.env.EMAIL_FROM || "noreply@voicecall-system.com",
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text || "Email notification",
      });
    } catch (error) {
      console.error("Error sending email:", error);
      throw error;
    }
  }
}

export default new EmailService();
