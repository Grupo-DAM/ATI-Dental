import * as SecureStore from 'expo-secure-store';

/**
 * Guarda un token ficticio de manera cifrada y segura en el dispositivo.
 */
export async function saveSecureToken() {
  try {
    await SecureStore.setItemAsync('token', 'mi_clave_secreta_123');
    console.log('Token guardado de forma segura: mi_clave_secreta_123');
    return true;
  } catch (error) {
    console.error('Error al guardar el token de forma segura:', error);
    return false;
  }
}

/**
 * Recupera el token previamente guardado e imprime su valor.
 */
export async function getSecureToken() {
  try {
    const token = await SecureStore.getItemAsync('token');
    console.log('Token recuperado de forma segura:', token);
    return token;
  } catch (error) {
    console.error('Error al recuperar el token de forma segura:', error);
    return null;
  }
}
