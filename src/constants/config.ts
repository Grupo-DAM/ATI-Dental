export const Config = {
  contact: {
    email: 'admin@ejemplo.com',
    emailSubject: 'Consulta desde el sitio web',
    phone: '+123456789',
    whatsApp: '+123456789',
    whatsAppMessage: 'Hola, deseo solicitar información...',
  },
  social: {
    feedApi: 'https://api.ejemplo.com/v1/social-feed',
    instagram: 'https://instagram.com/ati_dental',
    facebook: 'https://facebook.com/ATIDentalOficial',
  },
  serverless: {
    proxyUrl: 'https://secure-proxy.ati-dental-retention.workers.dev',
    retentionEndpoint: 'https://secure-proxy.ati-dental-retention.workers.dev/metrics/retention',
  },
} as const;
