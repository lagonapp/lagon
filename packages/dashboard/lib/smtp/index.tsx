import { createTransport } from 'nodemailer';
import { ReactElement } from 'react';
import { render } from '@react-email/render';
import * as Sentry from '@sentry/nextjs';
import Test from './test';

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

export const sendEmail = async ({ to, subject, email }: { to: string; subject: string; email: ReactElement }) => {
  try {
    console.log('Sending email to', to, 'with subject', subject);
    const transporter = createTransporter();
    console.log('Transporter created');

    await transporter.sendMail({
      to,
      from: process.env.SMTP_FROM,
      subject,
      html: render(email),
    });
    console.log('Email sent');
  } catch (error) {
    Sentry.captureException(error);
    console.error(error);
  }
};

export const sendTestEmail = async () => {
  await sendEmail({
    to: 'contact@lagon.app',
    subject: 'Organization updated',
    email: <Test url="https://google.com" />,
  });
};
