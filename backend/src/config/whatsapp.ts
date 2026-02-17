import { env } from './env';

export const whatsappConfig = {
  apiUrl: 'https://graph.facebook.com/v18.0',
  phoneNumberId: env.WHATSAPP_PHONE_NUMBER_ID,
  accessToken: env.WHATSAPP_ACCESS_TOKEN,
  webhookVerifyToken: env.WEBHOOK_VERIFY_TOKEN,
};
