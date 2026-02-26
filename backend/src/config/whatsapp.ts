import { env } from './env';

export const whatsappConfig = {
  apiUrl: 'https://graph.facebook.com/v21.0',
  phoneNumberId: env.WHATSAPP_PHONE_NUMBER_ID,
  accessToken: env.WHATSAPP_ACCESS_TOKEN,
  businessAccountId: env.WHATSAPP_BUSINESS_ACCOUNT_ID,
  webhookVerifyToken: env.WEBHOOK_VERIFY_TOKEN,
};
