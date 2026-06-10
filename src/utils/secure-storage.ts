import * as SecureStore from 'expo-secure-store';

const JWT_TOKEN_KEY = 'ati_dental_jwt_token';

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
