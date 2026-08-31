import nodemailer from 'nodemailer';

function createTransporter() {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) return null;
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

export async function sendPasswordResetEmail(email: string, token: string): Promise<void> {
  try {
    const transporter = createTransporter();
    if (!transporter) {
      console.log('SMTP not configured. Password reset token:', token);
      return;
    }
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
    await transporter.sendMail({
      from: '"VitaNexa AI" <noreply@vitanexa.com>',
      to: email,
      subject: 'Password Reset - VitaNexa AI',
      html: `<p>Click <a href="${resetUrl}">here</a> to reset your password.</p><p>Token: ${token}</p><p>This link expires in 1 hour.</p>`,
    });
  } catch (error) {
    console.error('Error sending password reset email:', error);
  }
}

export async function sendNotificationEmail(email: string, subject: string, message: string): Promise<void> {
  try {
    const transporter = createTransporter();
    if (!transporter) {
      console.log('SMTP not configured. Notification:', subject);
      return;
    }
    await transporter.sendMail({
      from: '"VitaNexa AI" <noreply@vitanexa.com>',
      to: email,
      subject,
      html: `<p>${message}</p>`,
    });
  } catch (error) {
    console.error('Error sending notification email:', error);
  }
}
