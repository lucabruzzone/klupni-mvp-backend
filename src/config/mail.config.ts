import { registerAs } from '@nestjs/config';

export default registerAs('mail', () => ({
  host: process.env.MAIL_HOST,
  port: parseInt(process.env.MAIL_PORT ?? '2525', 10),
  user: process.env.MAIL_USER,
  pass: process.env.MAIL_PASS,
  from: process.env.MAIL_FROM,
  frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:5173',
  skipSend: process.env.MAIL_SKIP_SEND === 'true',
}));
