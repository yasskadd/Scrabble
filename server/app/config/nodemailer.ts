import { createTransport } from 'nodemailer';
import { MailOptions } from 'nodemailer/lib/json-transport';

const EMAIL = 'scrabble922@gmail.com';
const PASSWORD = 'obnyjbqhlwyamlgn';

export const transporter = createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com', // SMTP server address (usually mail.your-domain.com)
    port: 465, // Port for SMTP (usually 465)
    secure: true, // Usually true if connecting to port 465
    auth: {
        user: EMAIL,
        pass: PASSWORD,
    },
    from: EMAIL,
});

export const createMailOptions = (emailDestination: string): MailOptions => {
    return {
        from: EMAIL,
        to: emailDestination,
    } as MailOptions;
};

export const getPasswordResetEmail = (username: string, temporaryPassword: string): string => {
    const emailTemplate = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>PolyScrabble Password Reset</title>
        </head>
        <body>
          <p>Hi ${username},</p>
          <p>Forgot your password?</p>
          <p>We received a request to reset the password for your account.</p>
          <p>Here is a temporary password to let you access your account:</p>
          <h2 style="background-color: #f2f2f2; padding: 10px; display: inline-block;">Temporary Password: ${temporaryPassword}</h2>
          <p>Use this password to log in and immediately change your password.</p>
          <p>Thank you,</p>
          <p>The PolyScrabble Team</p>
        </body>
      </html>
    `;
    return emailTemplate;
};
