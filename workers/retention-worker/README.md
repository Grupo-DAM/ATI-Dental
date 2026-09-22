# Cloudflare Worker: Orquestador Serverless de Retención (ATI Dental)

Este worker proporciona una capa de orquestación serverless de alto rendimiento (<5ms de cold start) para calcular y servir métricas de retención de usuarios (Día 1, Día 7 y Día 30) a la aplicación móvil de **ATI Dental**, validado originalmente en el **Spike #100**.

---

## 📌 Características
- **Zero Cloud Functions**: Elimina la necesidad de Google Cloud Functions y evita costos/planes Blaze en Firebase.
- **CORS Habilitado**: Compatible con llamadas directas desde React Native (`fetch`) y navegadores web.
- **Análisis por Cohortes**: Calcula la tasa de usuarios que vuelven a la aplicación tras 24 horas, 7 días y 30 días de su registro.
- **Endpoints Flexibles**:
  - `GET /`: Endpoint directo explorado en la prueba de concepto del Spike #100.
  - `GET /metrics/retention`: Endpoint semántico para analíticas.
  - `GET /health`: Verificación de salud y estado del servicio.

---

## 🚀 Instalación y Desarrollo Local

### 1. Requisitos Previos
Tener Node.js (v18+) y Wrangler CLI:
```bash
npm install -g wrangler
# o usar npx wrangler
```

### 2. Ejecución Local (Emulador de Worker)
Dentro de este directorio (`workers/retention-worker`):
```bash
npm run dev
# o: npx wrangler dev
```
El worker estará disponible en `http://localhost:8787`.

Prueba el endpoint:
```bash
curl http://localhost:8787/metrics/retention
```

---

## 🔐 Configuración de Secretos y Variables

En Cloudflare Workers, las claves sensibles **no** se guardan en el repositorio:

```bash
# Definir la API Key de Firebase para leer colecciones vía REST
wrangler secret put FIREBASE_API_KEY

# (Opcional) Clave secreta para proteger el endpoint
wrangler secret put DENTAL_API_KEY
```

Las variables no sensibles están en `wrangler.toml`:
- `FIREBASE_PROJECT_ID`: `"ati-dental"`
- `ENVIRONMENT`: `"production"`

---

## 🚢 Despliegue en Cloudflare

Para compilar y desplegar a la red global de Cloudflare:
```bash
npm run deploy
# o: npx wrangler deploy
```

El endpoint quedará accesible bajo tu subdominio de Cloudflare Workers:
`https://secure-proxy.ati-dental-poc.workers.dev`
o el subdominio configurado para el proyecto ATI Dental.
