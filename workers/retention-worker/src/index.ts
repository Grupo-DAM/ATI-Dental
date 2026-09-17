import { Env, ExecutionContext } from './types';
import { getRetentionMetrics } from './retention-calculator';

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-api-key',
  'Access-Control-Max-Age': '86400',
};

export default {
  async fetch(request: Request, env: Env, _ctx: ExecutionContext): Promise<Response> {
    // 1. Manejo de preflight CORS
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders,
      });
    }

    const url = new URL(request.url);

    // 2. Endpoint de verificación de salud (health check)
    if (url.pathname === '/health') {
      return new Response(
        JSON.stringify({
          status: 'ok',
          service: 'ati-dental-retention-worker',
          timestamp: new Date().toISOString(),
        }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // 3. Validación de autenticación si está configurada en secretos
    if (env.DENTAL_API_KEY) {
      const authHeader = request.headers.get('Authorization') || '';
      const customApiKey = request.headers.get('x-api-key') || '';
      const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : '';

      if (customApiKey !== env.DENTAL_API_KEY && token !== env.DENTAL_API_KEY) {
        return new Response(
          JSON.stringify({
            status: 'error',
            error: 'Unauthorized: Invalid or missing API key',
          }),
          {
            status: 401,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json',
            },
          }
        );
      }
    }

    // 4. Endpoint de retención: Soporta raíz '/' (como en el spike) y '/metrics/retention'
    if (
      url.pathname === '/' ||
      url.pathname === '/metrics/retention' ||
      url.pathname === '/retention'
    ) {
      try {
        const metrics = await getRetentionMetrics(env);
        return new Response(JSON.stringify(metrics), {
          status: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
            'Cache-Control': 'public, max-age=180', // Caché por 3 minutos
          },
        });
      } catch (err: any) {
        return new Response(
          JSON.stringify({
            status: 'error',
            message: err?.message || 'Error al calcular métricas de retención',
          }),
          {
            status: 500,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json',
            },
          }
        );
      }
    }

    // 5. Ruta no encontrada
    return new Response(
      JSON.stringify({
        status: 'error',
        message: `Ruta no encontrada: ${url.pathname}`,
      }),
      {
        status: 404,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  },
};
