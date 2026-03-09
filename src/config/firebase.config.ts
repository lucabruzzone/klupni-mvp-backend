import { registerAs } from '@nestjs/config';

export default registerAs('firebase', () => {
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  return {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: privateKey ? privateKey.replace(/\\n/g, '\n') : undefined,
  };
});
