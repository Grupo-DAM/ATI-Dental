import * as SecureStore from 'expo-secure-store';

export const JWT_TOKEN_KEY = 'ati_dental_jwt_token';
export const LAST_ACTIVE_KEY = 'ati_dental_last_active_timestamp';

/**
 * Tiempo de inactividad permitido por defecto: 30 días en milisegundos.
 */
export const DEFAULT_SESSION_TIMEOUT_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Guarda el token de sesión JWT de forma encriptada en el almacenamiento seguro del dispositivo.
 * 
 * @param token El token JWT emitido por el servicio de autenticación.
 * @returns Promesa que se resuelve en `true` si se guardó con éxito, o `false` en caso de fallo.
 */
export async function saveSessionToken(token: string): Promise<boolean> {
  try {
    await SecureStore.setItemAsync(JWT_TOKEN_KEY, token, {
      keychainAccessible: SecureStore.WHEN_UNLOCKED,
    });
    return true;
  } catch (error) {
    console.error('Error al guardar el token JWT en SecureStore:', error);
    return false;
  }
}

/**
 * Recupera el token de sesión JWT encriptado desde el almacenamiento seguro.
 * 
 * @returns Promesa que retorna el token como string o `null` si no existe o falló la lectura.
 */
export async function getSessionToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(JWT_TOKEN_KEY);
  } catch (error) {
    console.error('Error al recuperar el token JWT de SecureStore:', error);
    return null;
  }
}

/**
 * Elimina de manera permanente el token de sesión JWT del almacenamiento seguro.
 * 
 * @returns Promesa que se resuelve en `true` si se eliminó con éxito, o `false` en caso de fallo.
 */
export async function removeSessionToken(): Promise<boolean> {
  try {
    await SecureStore.deleteItemAsync(JWT_TOKEN_KEY);
    return true;
  } catch (error) {
    console.error('Error al eliminar el token JWT de SecureStore:', error);
    return false;
  }
}

/**
 * Guarda la marca de tiempo de la última interacción o inicio de sesión en almacenamiento seguro.
 *
 * @param timestamp Marca de tiempo en milisegundos (por defecto `Date.now()`).
 * @returns Promesa que se resuelve en `true` si se guardó con éxito, o `false` en caso de fallo.
 */
export async function saveLastActiveTimestamp(timestamp: number = Date.now()): Promise<boolean> {
  try {
    await SecureStore.setItemAsync(LAST_ACTIVE_KEY, String(timestamp), {
      keychainAccessible: SecureStore.WHEN_UNLOCKED,
    });
    return true;
  } catch (error) {
    console.error('Error al guardar timestamp de última actividad en SecureStore:', error);
    return false;
  }
}

/**
 * Recupera la marca de tiempo de la última interacción del usuario.
 *
 * @returns Promesa con el timestamp como número o `null` si no existe o falló la lectura.
 */
export async function getLastActiveTimestamp(): Promise<number | null> {
  try {
    const raw = await SecureStore.getItemAsync(LAST_ACTIVE_KEY);
    if (!raw) return null;
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : null;
  } catch (error) {
    console.error('Error al recuperar timestamp de última actividad de SecureStore:', error);
    return null;
  }
}

/**
 * Elimina la marca de tiempo de última interacción de SecureStore.
 *
 * @returns Promesa que se resuelve en `true` si se eliminó con éxito, o `false` en caso de fallo.
 */
export async function removeLastActiveTimestamp(): Promise<boolean> {
  try {
    await SecureStore.deleteItemAsync(LAST_ACTIVE_KEY);
    return true;
  } catch (error) {
    console.error('Error al eliminar timestamp de última actividad de SecureStore:', error);
    return false;
  }
}

/**
 * Limpia todos los datos de sesión local (token JWT y marca de actividad).
 *
 * @returns Promesa que se resuelve en `true` si ambos se procesaron exitosamente.
 */
export async function clearSessionData(): Promise<boolean> {
  const tokenRemoved = await removeSessionToken();
  const timestampRemoved = await removeLastActiveTimestamp();
  return tokenRemoved && timestampRemoved;
}

/**
 * Determina si la sesión ha expirado comparando el tiempo transcurrido desde la última interacción.
 *
 * @param lastActive Marca de tiempo de la última actividad en milisegundos.
 * @param timeoutMs Límite de inactividad en milisegundos (por defecto `DEFAULT_SESSION_TIMEOUT_MS`).
 * @param now Tiempo actual en milisegundos (por defecto `Date.now()`).
 * @returns `true` si la sesión excedió el límite o no existe marca de tiempo válida, `false` si sigue activa.
 */
export function isSessionExpired(
  lastActive: number | null,
  timeoutMs: number = DEFAULT_SESSION_TIMEOUT_MS,
  now: number = Date.now()
): boolean {
  if (lastActive === null || lastActive === undefined || !Number.isFinite(lastActive) || lastActive <= 0) {
    return true;
  }
  return now - lastActive > timeoutMs;
}
