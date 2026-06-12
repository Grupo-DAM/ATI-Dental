import { Redirect } from 'expo-router';

/** Ruta legacy: la PoC vive en la pantalla inicial (index). */
export default function AuthPocRoute() {
  return <Redirect href="/" />;
}
