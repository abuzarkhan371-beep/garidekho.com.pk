import "server-only";
import nodemailer from "nodemailer";

/** SMTP-backed email delivery with a console transport for local development. */
export async function sendEmail(to: string, subject: string, html: string) {
  const host = process.env.EMAIL_HOST;

  if (!host) {
    console.info(`[EMAIL to ${to}] ${subject}\n${html.replace(/<[^>]+>/g, " ").slice(0, 400)}`);
    return { sent: true, provider: "console" };
  }

  const transporter = nodemailer.createTransport({
    host,
    port: Number(process.env.EMAIL_PORT ?? 587),
    secure: Number(process.env.EMAIL_PORT ?? 587) === 465,
    auth: process.env.EMAIL_USER
      ? { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASSWORD }
      : undefined,
  });

  await transporter.sendMail({
    from: process.env.EMAIL_FROM ?? "Garidekho <no-reply@garidekho.com.pk>",
    to,
    subject,
    html,
  });
  return { sent: true, provider: "smtp" };
}

export function verificationEmail(name: string, link: string) {
  return `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;padding:32px">
    <h1 style="color:#122534;font-size:24px">Assalam-o-Alaikum, ${name}</h1>
    <p>Thank you for joining Garidekho. Please verify your email address to secure your account.</p>
    <p><a href="${link}" style="display:inline-block;background:#008874;color:white;padding:12px 22px;border-radius:10px;text-decoration:none;font-weight:bold">Verify email</a></p>
    <p style="color:#6f96b0;font-size:12px">If you did not create this account you can safely ignore this message.</p>
  </div>`;
}

export function passwordResetEmail(name: string, link: string) {
  return `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;padding:32px">
    <h1 style="color:#122534;font-size:24px">Password reset request</h1>
    <p>Hello ${name}, use the button below to choose a new password. This link expires in 60 minutes.</p>
    <p><a href="${link}" style="display:inline-block;background:#008874;color:white;padding:12px 22px;border-radius:10px;text-decoration:none;font-weight:bold">Reset password</a></p>
    <p style="color:#6f96b0;font-size:12px">If this wasn't you, no action is required.</p>
  </div>`;
}
