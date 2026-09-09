import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { auth, firestore } from '../config/firebase';
import { saveSessionToken, removeSessionToken } from '../utils/secure-storage';
import { FirebaseAuthTypes } from '@react-native-firebase/auth';

/**
 * Representa el perfil del usuario autenticado en la aplicación.
 */
export interface UserProfile {
  uid: string;
  email: string | null;
  nombre?: string;
  alias?: string;
  rol?: 'odontologo' | 'asistente' | 'admin' | 'medico' | 'usuario_externo' | (string & {});
  estado?: 'pendiente' | 'activo' | 'inactivo' | (string & {});
  idiomaPreferencia?: 'es' | 'en' | (string & {});
}

interface AuthContextType {
  /** El perfil del usuario autenticado, o null si no hay sesión activa */
  user: UserProfile | null;
  /** Verdadero si la sesión está cargando o inicializando */
  loading: boolean;
  /** Error en la última operación de autenticación, si aplica */
  error: string | null;
  /** Iniciar sesión con email y contraseña (US-16) */
  login: (email: string, password: string) => Promise<FirebaseAuthTypes.UserCredential>;
  /** Cerrar la sesión del usuario actual */
  logout: () => Promise<void>;
  /** Registrar un nuevo usuario e inicializar su perfil en Firestore (US-19) */
  register: (email: string, password: string) => Promise<FirebaseAuthTypes.UserCredential>;
  /** Verificar que el usuario haya hecho clic en el enlace de correo (US-19) */
  verifyCode: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribeProfile: (() => void) | null = null;

    const unsubscribeAuth = auth().onAuthStateChanged(async (firebaseUser) => {
      setError(null);

      if (!firebaseUser) {
        if (unsubscribeProfile) {
          unsubscribeProfile();
          unsubscribeProfile = null; // Evitamos ejecuciones duplicadas
        }

        setUser(null);
        await removeSessionToken();
        setLoading(false);
        return;
      }

      try {
        const token = await firebaseUser.getIdToken();
        await saveSessionToken(token);
      } catch (err) {
        console.error('Error al guardar token JWT tras cambio de sesión:', err);
      }

      if (unsubscribeProfile) unsubscribeProfile();
      unsubscribeProfile = firestore()
        .collection('usuarios')
        .doc(firebaseUser.uid)
        .onSnapshot(
          (docSnapshot) => {
            if (docSnapshot.exists()) {
              const data = docSnapshot.data() || {};
              setUser({
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                nombre: data.nombre,
                alias: data.alias,
                rol: data.rol,
                estado: data.estado,
                idiomaPreferencia: data.idiomaPreferencia,
              });
            } else {
              setUser({
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                estado: 'pendiente',
              });
            }
            setLoading(false);
          },
          (err) => {
            // Evaluamos de forma defensiva si el error es provocado por el deslogueo reactivo
            if (auth().currentUser) {
              console.error('Error al escuchar el perfil del usuario en Firestore:', err);
              setError(err.message);
            }
            setLoading(false);
          }
        );
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) {
        unsubscribeProfile();
      }
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setError(null);
    try {
      const credential = await auth().signInWithEmailAndPassword(email, password);
      return credential;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, []);

  const logout = useCallback(async () => {
    setError(null);
    try {
      await auth().signOut();
      await removeSessionToken();
      setUser(null);
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, []);

  const register = useCallback(async (email: string, password: string) => {
    setError(null);
    try {
      // 1. Crear usuario en Firebase Auth
      const credential = await auth().createUserWithEmailAndPassword(email, password);
      const firebaseUser = credential.user;

      // 2. Enviar correo de verificación oficial de Firebase
      await firebaseUser.sendEmailVerification();

      // 3. Crear perfil del usuario en Firestore en estado "pendiente" (US-19)
      await firestore()
        .collection('usuarios')
        .doc(firebaseUser.uid)
        .set({
          nombre: '',
          alias: '',
          email: email,
          rol: 'usuario_externo', // Rol base predeterminado
          estado: 'pendiente',   // Requiere validación por OTP en el primer registro
          fechaCreacion: firestore.FieldValue.serverTimestamp(),
        });

      return credential;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, []);

  const verifyCode = useCallback(async () => {
    setError(null);
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) throw new Error('No hay usuario autenticado');

      // Recargamos el usuario para refrescar el estado de verificación desde el servidor
      await currentUser.reload();

      if (!currentUser.emailVerified) {
        throw new Error('El correo electrónico aún no ha sido verificado. Por favor revisa tu bandeja de entrada o carpeta de spam y haz clic en el enlace.');
      }

      // Cambiamos el estado a "activo"
      await firestore()
        .collection('usuarios')
        .doc(currentUser.uid)
        .update({
          estado: 'activo',
        });
      
      // Actualizamos el token local (asegura que los claims estén frescos si usaran Cloud Functions)
      const token = await currentUser.getIdToken(true);
      await saveSessionToken(token);
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, []);

  const authValue = useMemo(() => ({
    user,
    loading,
    error,
    login,
    logout,
    register,
    verifyCode
  }), [user, loading, error, login, logout, register, verifyCode]);

  return (
    <AuthContext.Provider value={authValue}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook para acceder al contexto global de autenticación en cualquier parte de la app.
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe utilizarse dentro de un AuthProvider');
  }
  return context;
}
