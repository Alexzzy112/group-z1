const nodemailer = require('nodemailer');

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  if (process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  }
  return transporter;
}

async function sendEmail({ to, subject, html }) {
  const t = getTransporter();
  if (!t) {
    console.log('Email not configured. Skipping notification to:', to);
    return false;
  }
  try {
    await t.sendMail({
      from: process.env.EMAIL_FROM || '"GroupZ1" <noreply@groupz1.edu>',
      to,
      subject,
      html
    });
    return true;
  } catch (err) {
    console.error('Email send failed:', err.message);
    return false;
  }
}

async function sendDeadlineReminder(userEmail, userName, assignmentTitle, deadline) {
  return sendEmail({
    to: userEmail,
    subject: `Assignment Deadline Reminder: ${assignmentTitle}`,
    html: `<h2>Dear ${userName},</h2><p>This is a reminder that the assignment <strong>${assignmentTitle}</strong> is due on <strong>${new Date(deadline).toLocaleString()}</strong>.</p><p>Please submit your work before the deadline.</p><p>Best regards,<br/>GroupZ1 Team</p>`
  });
}

async function sendGradeNotification(userEmail, userName, assignmentTitle, grade, maxMarks) {
  return sendEmail({
    to: userEmail,
    subject: `Assignment Graded: ${assignmentTitle}`,
    html: `<h2>Dear ${userName},</h2><p>Your assignment <strong>${assignmentTitle}</strong> has been graded.</p><p>Score: <strong>${grade}/${maxMarks}</strong></p><p>Please check your dashboard for feedback.</p><p>Best regards,<br/>GroupZ1 Team</p>`
  });
}

module.exports = { sendEmail, sendDeadlineReminder, sendGradeNotification };
