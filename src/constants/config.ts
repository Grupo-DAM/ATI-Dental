export const Config = {
  contact: {
    email: 'admin@ejemplo.com',
    emailSubject: 'Consulta desde el sitio web',
    phone: '+123456789',
    whatsApp: '+123456789',
    whatsAppMessage: 'Hola, deseo solicitar información...',
  },
  social: {
    feedApi: 'https://ati-dental-social-feed.jesusecova73.workers.dev',
    instagram: 'https://www.instagram.com/atidental_/',
    facebook: 'https://www.facebook.com/1308722738999653',
  },
  serverless: {
    proxyUrl: 'https://secure-proxy.ati-dental-retention.workers.dev',
    retentionEndpoint: 'https://secure-proxy.ati-dental-retention.workers.dev/metrics/retention',
  },
} as const;

export const ListConfig = {
  page: {
    capacity: 5,
  },
} as const;