import { useEffect } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import { router } from 'expo-router';

/**
 * Nombre de la tarea en segundo plano registrada con TaskManager.
 */
export const BACKGROUND_NOTIFICATION_TASK = 'BACKGROUND_NOTIFICATION_TASK';

/**
 * ID del canal de notificaciones predeterminado para Android.
 */
export const DEFAULT_NOTIFICATION_CHANNEL_ID = 'default';

export interface PushPayload {
  to?: string | string[];
  title?: string;
  body?: string;
  data?: Record<string, unknown>;
  priority?: 'default' | 'normal' | 'high';
  sound?: string | boolean;
  badge?: number;
  channelId?: string;
  contentAvailable?: boolean;
  _contentAvailable?: boolean;
  categoryId?: string;
  subtitle?: string;
}

export interface PushPayloadValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Configura el handler de notificaciones en primer plano.
 * Cumple con Expo SDK 55 usando shouldShowBanner y shouldShowList.
 */
export function initForegroundNotificationHandler(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
}

// Inicializar el handler inmediatamente al importar el módulo
initForegroundNotificationHandler();

/**
 * Handler de la tarea headless ejecutada por el sistema operativo cuando llega una notificación en segundo plano
 * o con la aplicación completamente cerrada (killed state).
 */
export async function backgroundNotificationTaskHandler({
  data,
  error,
}: {
  data: any;
  error: any;
  executionInfo?: any;
}): Promise<void> {
  if (error) {
    console.error('[BackgroundNotificationTask] Error al recibir notificación en background:', error);
    return;
  }

  try {
    const notification = data?.notification ?? data;
    const content = notification?.data ?? notification;

    // Si es un data-only/headless message en background y requiere despliegue en bandeja
    if (content?.title && content?.body && !notification?.title) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: content.title,
          body: content.body,
          data: content,
          sound: 'default',
        },
        trigger: null,
      });
    }
  } catch (err) {
    console.error('[BackgroundNotificationTask] Excepción procesando notificación background:', err);
  }
}

/**
 * Define la tarea en TaskManager.
 */
export function defineBackgroundNotificationTask(): void {
  TaskManager.defineTask(BACKGROUND_NOTIFICATION_TASK, backgroundNotificationTaskHandler);
}

// Inicializar la definición de la tarea al importar el módulo
defineBackgroundNotificationTask();


/**
 * Registra la tarea de background en expo-notifications y TaskManager.
 */
export async function registerBackgroundNotificationTaskAsync(): Promise<boolean> {
  if (Platform.OS === 'web') {
    return false;
  }

  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_NOTIFICATION_TASK);
    if (!isRegistered) {
      await Notifications.registerTaskAsync(BACKGROUND_NOTIFICATION_TASK);
    }
    return true;
  } catch (err) {
    console.error('[NotificationService] Error al registrar tarea en segundo plano:', err);
    return false;
  }
}

/**
 * Desregistra la tarea de background.
 */
export async function unregisterBackgroundNotificationTaskAsync(): Promise<boolean> {
  if (Platform.OS === 'web') {
    return false;
  }

  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_NOTIFICATION_TASK);
    if (isRegistered) {
      await Notifications.unregisterTaskAsync(BACKGROUND_NOTIFICATION_TASK);
    }
    return true;
  } catch (err) {
    console.error('[NotificationService] Error al desregistrar tarea en segundo plano:', err);
    return false;
  }
}

/**
 * Configura los canales de notificación en Android con máxima prioridad e importancia.
 */
export async function setupNotificationChannelsAsync(): Promise<void> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(DEFAULT_NOTIFICATION_CHANNEL_ID, {
      name: 'General',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#52287D',
      enableLights: true,
      enableVibrate: true,
      showBadge: true,
    });
  }
}

/**
 * Solicita permisos y obtiene el Expo Push Token del dispositivo.
 */
export async function registerForPushNotificationsAsync(projectId?: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    return null;
  }

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      return null;
    }

    await setupNotificationChannelsAsync();
    await registerBackgroundNotificationTaskAsync();

    const tokenData = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined
    );

    return tokenData.data;
  } catch (error) {
    console.error('[NotificationService] Error registrando push notifications:', error);
    return null;
  }
}

/**
 * Valida que el payload cumpla con los requisitos para entrega confiable en background:
 * - priority: 'high'
 * - contentAvailable: true (o 'content-available': 1)
 * - channelId para Android
 * - presencia de datos válidos
 */
export function validatePushPayload(payload: unknown): PushPayloadValidationResult {
  const errors: string[] = [];

  if (!payload || typeof payload !== 'object') {
    return {
      isValid: false,
      errors: ['El payload debe ser un objeto válido'],
    };
  }

  const p = payload as Record<string, any>;

  // Validar prioridad alta para despertar el dispositivo y entrega background
  if (p.priority !== 'high') {
    errors.push('La prioridad debe ser "high" para garantizar entrega en estado background');
  }

  // Validar bandera de contenido disponible para APNs / FCM background delivery
  const hasContentAvailable =
    p.contentAvailable === true ||
    p._contentAvailable === true ||
    p['content-available'] === 1 ||
    p['content-available'] === '1';

  if (!hasContentAvailable) {
    errors.push('El payload debe incluir "contentAvailable: true" o "content-available: 1"');
  }

  // Validar canal de notificación en Android
  if (!p.channelId && Platform.OS === 'android') {
    errors.push('Se debe especificar un channelId para dispositivos Android');
  }

  // Validar datos mínimos o título/cuerpo
  const hasTitleAndBody = Boolean(p.title && p.body);
  const data = p.data;
  const hasDataTitleAndBody = Boolean(data && typeof data === 'object' && (data as any).title && (data as any).body);

  if (!hasTitleAndBody && !hasDataTitleAndBody) {
    errors.push('El payload debe contener title y body (a nivel raíz o dentro del objeto data)');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Construye un payload estándar listo para envío con todas las propiedades requeridas para background.
 */
export function createStandardPushPayload(options: {
  to: string | string[];
  title: string;
  body: string;
  targetRoute?: string;
  data?: Record<string, unknown>;
  priority?: 'high' | 'default';
  channelId?: string;
  sound?: string | boolean;
}): PushPayload {
  return {
    to: options.to,
    title: options.title,
    body: options.body,
    priority: options.priority ?? 'high',
    channelId: options.channelId ?? DEFAULT_NOTIFICATION_CHANNEL_ID,
    contentAvailable: true,
    _contentAvailable: true,
    sound: options.sound ?? 'default',
    data: {
      ...options.data,
      targetRoute: options.targetRoute,
      title: options.title,
      body: options.body,
    },
  };
}

/**
 * Extrae la ruta de redirección desde la respuesta de una notificación recibida o pulsada.
 */
export function extractTargetRoute(
  response: Notifications.NotificationResponse | null | undefined
): string | null {
  if (!response?.notification?.request?.content) {
    return null;
  }

  const data = response.notification.request.content.data;
  if (!data || typeof data !== 'object') {
    return null;
  }

  const route = (data as any).targetRoute || (data as any).url || (data as any).route;
  if (typeof route === 'string' && route.trim().length > 0) {
    return route.trim();
  }

  return null;
}

/**
 * Escucha las interacciones con notificaciones tanto desde estado cerrado (killed) como background.
 */
export function setupNotificationListeners(
  onNavigate: (route: string) => void
): () => void {
  // 1. Manejar caso de apertura de app desde estado cerrado (killed state)
  Notifications.getLastNotificationResponseAsync()
    .then((lastResponse) => {
      if (lastResponse) {
        const route = extractTargetRoute(lastResponse);
        if (route) {
          onNavigate(route);
        }
      }
    })
    .catch((err) => {
      console.error('[NotificationService] Error leyendo última notificación:', err);
    });

  // 2. Manejar pulsación de notificación cuando la app está en segundo plano o foreground
  const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
    const route = extractTargetRoute(response);
    if (route) {
      onNavigate(route);
    }
  });

  return () => {
    subscription.remove();
  };
}

/**
 * Hook de React para integrar fácilmente la observación de notificaciones en el ciclo de vida de la aplicación.
 */
export function useNotificationObserver(customHandler?: (route: string) => void): void {
  useEffect(() => {
    const handleNavigate = (route: string) => {
      if (customHandler) {
        customHandler(route);
      } else {
        router.push(route as any);
      }
    };

    const cleanup = setupNotificationListeners(handleNavigate);
    return () => {
      cleanup();
    };
  }, [customHandler]);
}

/**
 * Inicializa globalmente la recepción y manejo de notificaciones:
 * - Handlers en primer plano
 * - Canales de alta importancia para Android
 * - Tarea background/headless registrada con TaskManager
 * - Listeners de interacciones y navegación killed/background
 */
export function initNotifications(onNavigate?: (route: string) => void): void {
  initForegroundNotificationHandler();
  setupNotificationChannelsAsync().catch((e) =>
    console.error('[NotificationService] Error configurando canales:', e)
  );
  registerBackgroundNotificationTaskAsync().catch((e) =>
    console.error('[NotificationService] Error registrando tarea background:', e)
  );
  setupNotificationListeners((route) => {
    try {
      if (onNavigate) {
        onNavigate(route);
      } else {
        router.push(route as any);
      }
    } catch (e) {
      console.error('[NotificationService] Error enrutando desde notificación:', e);
    }
  });
}

