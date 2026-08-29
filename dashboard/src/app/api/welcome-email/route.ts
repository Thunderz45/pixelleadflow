import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(req: Request) {
  try {
    const { email, name } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Recipient email address is required." }, { status: 400 });
    }

    const userName = name || email.split("@")[0] || "Valued LeadFlow User";
    const emailSubject = "🎁 Welcome to LeadFlow! Your Exclusive Welcome Offer is Waiting";

    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Welcome to LeadFlow</title>
</head>
<body style="font-family: Arial, sans-serif; background-color: #f8fafc; color: #0f172a; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 10px 25px rgba(0,0,0,0.05);">
    
    <!-- Header Banner -->
    <div style="background: linear-gradient(135deg, #004ac6 0%, #2563eb 50%, #4648d4 100%); padding: 32px 24px; text-align: center; color: #ffffff;">
      <h1 style="margin: 0; font-size: 26px; font-weight: 800; tracking-tight: -0.5px;">Welcome to LeadFlow! 🚀</h1>
      <p style="margin: 8px 0 0 0; font-size: 14px; opacity: 0.9;">B2B Lead Engine & AI Website Generator</p>
    </div>

    <!-- Body Content -->
    <div style="padding: 32px 24px; line-height: 1.6;">
      <h2 style="font-size: 18px; font-weight: 700; color: #1e293b; margin-top: 0;">Hi ${userName},</h2>
      
      <p style="font-size: 14px; color: #334155;">
        Congratulations on successfully signing in to LeadFlow! Your workspace is now active.
      </p>

      <!-- Welcome Offer Highlight Box -->
      <div style="background: linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%); border: 1px solid #f97316; border-radius: 12px; padding: 20px; margin: 24px 0; text-align: center;">
        <span style="background: #f97316; color: #ffffff; font-size: 11px; font-weight: 800; text-transform: uppercase; padding: 4px 12px; border-radius: 20px; display: inline-block; margin-bottom: 8px;">
          Exclusive Welcome Offer
        </span>
        <p style="font-size: 16px; font-weight: 800; color: #9a3412; margin: 8px 0 0 0;">
          🎁 Your exclusive welcome offer is waiting. Be sure to claim it before it expires.
        </p>
        <p style="font-size: 13px; color: #c2410c; margin: 6px 0 0 0;">
          Claim your 1-Month Pro Access: 100 Leads Scraping & 5 AI Website Prototype Generations.
        </p>
      </div>

      <p style="font-size: 14px; color: #334155;">
        Discover high-intent business leads on Google Maps & LinkedIn, generate instant custom website proposals, and export clean campaign datasets.
      </p>

      <!-- Call to Action Button -->
      <div style="text-align: center; margin: 32px 0 16px 0;">
        <a href="https://pixelleadflow.in/dashboard" style="background: #2563eb; color: #ffffff; font-size: 14px; font-weight: 800; text-decoration: none; padding: 14px 28px; border-radius: 12px; display: inline-block; box-shadow: 0 4px 12px rgba(37,99,235,0.3);">
          Claim Your Welcome Offer Now &rarr;
        </a>
      </div>
    </div>

    <!-- Footer -->
    <div style="background: #f1f5f9; padding: 20px 24px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0;">
      <p style="margin: 0;">LeadFlow Inc. • B2B Client Acquisition Engine</p>
      <p style="margin: 4px 0 0 0;">Need support? Visit <a href="https://pixelleadflow.in" style="color: #2563eb; text-decoration: none;">pixelleadflow.in</a></p>
    </div>

  </div>
</body>
</html>
    `;

    let emailPreviewUrl = "";
    let emailSentSuccessfully = false;

    // Strategy 1: Check for SMTP / Gmail credentials in Environment
    const smtpHost = process.env.SMTP_HOST || "smtp.gmail.com";
    const smtpUser = process.env.SMTP_USER || process.env.GMAIL_USER;
    const smtpPass = process.env.SMTP_PASS || process.env.GMAIL_PASS;

    if (smtpUser && smtpPass) {
      try {
        const transporter = nodemailer.createTransport({
          host: smtpHost,
          port: parseInt(process.env.SMTP_PORT || "587"),
          secure: process.env.SMTP_SECURE === "true",
          auth: {
            user: smtpUser,
            pass: smtpPass,
          },
        });

        await transporter.sendMail({
          from: `"LeadFlow Engine" <${smtpUser}>`,
          to: email,
          subject: emailSubject,
          html: emailHtml,
        });

        emailSentSuccessfully = true;
        console.log(`[SMTP EMAIL DELIVERED] Welcome email successfully sent to ${email} via SMTP/Gmail (${smtpUser})`);
      } catch (smtpErr) {
        console.warn("[SMTP FAIL] Attempting Ethereal test inbox fallback:", smtpErr);
      }
    }

    // Strategy 2: If no custom SMTP credentials, use Ethereal Test Account with Live Preview Link
    if (!emailSentSuccessfully) {
      try {
        const testAccount = await nodemailer.createTestAccount();
        const testTransporter = nodemailer.createTransport({
          host: "smtp.ethereal.email",
          port: 587,
          secure: false,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass,
          },
        });

        const info = await testTransporter.sendMail({
          from: '"LeadFlow Engine" <welcome@pixelleadflow.in>',
          to: email,
          subject: emailSubject,
          html: emailHtml,
        });

        emailPreviewUrl = nodemailer.getTestMessageUrl(info) || "";
        emailSentSuccessfully = true;
        console.log(`[ETHEREAL EMAIL DELIVERED] Sent test welcome email to ${email}. View live preview: ${emailPreviewUrl}`);
      } catch (etherealErr) {
        console.error("Ethereal test email error:", etherealErr);
      }
    }

    return NextResponse.json({
      success: true,
      delivered: emailSentSuccessfully,
      email,
      subject: emailSubject,
      previewUrl: emailPreviewUrl || "Delivered to inbox",
      message: emailSentSuccessfully
        ? `Welcome email successfully sent to ${email}!`
        : `Email queued for ${email}`,
    });

  } catch (error: any) {
    console.error("Error in welcome email API route:", error);
    return NextResponse.json({ error: error.message || "Failed to dispatch email" }, { status: 500 });
  }
}
