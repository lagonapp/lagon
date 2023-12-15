import { createTransport } from 'nodemailer';
import { ReactElement } from 'react';
import { render } from '@react-email/render';
import { Welcome } from './Welcome';

const createTransporter = () => {
  const port = parseInt(process.env.SMTP_PORT!);

  return createTransport({
    host: process.env.SMTP_HOST,
    secure: port === 465,
    port,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });
};

const sendEmail = async ({ to, subject, email }: { to: string; subject: string; email: ReactElement }) => {
  try {
    const transporter = createTransporter();

    await transporter.sendMail({
      to,
      from: process.env.SMTP_FROM,
      subject,
      html: render(email),
    });
  } catch (error) {
    console.error(error);
  }
};

export const sendWelcomeEmail = async ({ to, name }: { to: string; name: string }) =>
  sendEmail({
    to,
    subject: 'Welcome to Lagon',
    email: <Welcome name={name} />,
  });
