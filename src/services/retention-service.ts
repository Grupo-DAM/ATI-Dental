import { Config } from '@/constants/config';

export interface RetentionEndpointData {
  status?: string;
  dia1?: number;
  dia7?: number;
  dia30?: number;
  day1?: number;
  day7?: number;
  day30?: number;
  overallRetentionRate?: number;
  totalCohortUsers?: number;
  totalUsuariosCohorte?: number;
  calculatedAt?: string;
  source?: string;
}

export interface FetchRetentionResult {
  success: boolean;
  data?: RetentionEndpointData;
  error?: string;
}

/**
 * Consulta el endpoint serverless de Cloudflare Worker para obtener
 * la tasa de retención de usuarios calculada en el backend.
 */
export async function fetchRetentionMetrics(
  endpointUrl: string = Config.serverless.retentionEndpoint
): Promise<FetchRetentionResult> {
  try {
    const response = await fetch(endpointUrl, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      return {
        success: false,
        error: `HTTP error: ${response.status} ${response.statusText}`,
      };
    }

    const data: RetentionEndpointData = await response.json();
    return {
      success: true,
      data,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Error de conexión con el Worker de retención',
    };
  }
}
