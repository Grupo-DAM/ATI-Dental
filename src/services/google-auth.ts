import Constants from 'expo-constants';
import { Platform } from 'react-native';
import {
  GoogleSignin,
  isSuccessResponse,
  statusCodes,
} from '@react-native-google-signin/google-signin';

let configured = false;

function getWebClientId(): string {
  const webClientId = Constants.expoConfig?.extra?.googleWebClientId as string | undefined;
  if (!webClientId || webClientId.startsWith('REEMPLAZAR')) {
    throw new Error(
      'Configura googleWebClientId en app.json (Web client ID de Firebase Console).',
    );
  }
  return webClientId;
}

/** Configura Google Sign-In con el Web Client ID de Firebase. */
export function configureGoogleSignIn(): void {
  if (configured || Platform.OS === 'web') {
    return;
  }
  GoogleSignin.configure({
    webClientId: getWebClientId(),
    offlineAccess: false,
  });
  configured = true;
}

/**
 * Flujo nativo: UI de Google → idToken.
 * Firebase Auth consume ese token en use-auth (GoogleAuthProvider.credential).
 */
export async function signInWithGoogleNative(): Promise<string> {
  if (Platform.OS === 'web') {
    throw new Error('Google Sign-In nativo no está soportado en web en esta PoC.');
  }

  configureGoogleSignIn();
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

  const response = await GoogleSignin.signIn();
  if (!isSuccessResponse(response)) {
    throw new Error('Inicio de sesión con Google cancelado.');
  }

  const idToken = response.data.idToken;
  if (!idToken) {
    throw new Error(
      'Google no devolvió idToken. Revisa SHA-1 y OAuth en Firebase Console.',
    );
  }

  return idToken;
}

/** Cierra la sesión local de Google Sign-In (complementa auth().signOut()). */
export async function signOutGoogleNative(): Promise<void> {
  if (Platform.OS === 'web') {
    return;
  }
  try {
    await GoogleSignin.signOut();
  } catch (error) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code: string }).code === statusCodes.SIGN_IN_REQUIRED
    ) {
      return;
    }
    throw error;
  }
}
