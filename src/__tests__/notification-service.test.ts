import { Platform } from 'react-native';
import { renderHook } from '@testing-library/react-native';
import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import { router } from 'expo-router';
import {
  BACKGROUND_NOTIFICATION_TASK,
  DEFAULT_NOTIFICATION_CHANNEL_ID,
  initForegroundNotificationHandler,
  backgroundNotificationTaskHandler,
  defineBackgroundNotificationTask,
  registerBackgroundNotificationTaskAsync,
  unregisterBackgroundNotificationTaskAsync,
  setupNotificationChannelsAsync,
  registerForPushNotificationsAsync,
  validatePushPayload,
  createStandardPushPayload,
  extractTargetRoute,
  setupNotificationListeners,
  useNotificationObserver,
  initNotifications,
} from '@/services/notification-service';

jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
  },
}));

describe('notification-service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('constants', () => {
    it('exports expected task name and default channel id', () => {
      expect(BACKGROUND_NOTIFICATION_TASK).toBe('BACKGROUND_NOTIFICATION_TASK');
      expect(DEFAULT_NOTIFICATION_CHANNEL_ID).toBe('default');
    });
  });

  describe('initForegroundNotificationHandler', () => {
    it('sets the notification handler with banner and list flags enabled', () => {
      initForegroundNotificationHandler();
      expect(Notifications.setNotificationHandler).toHaveBeenCalledWith({
        handleNotification: expect.any(Function),
      });

      const callArg = (Notifications.setNotificationHandler as jest.Mock).mock.calls[0][0];
      return expect(callArg.handleNotification()).resolves.toEqual({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      });
    });
  });

  describe('backgroundNotificationTaskHandler', () => {
    it('logs error and returns early if error is provided', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
      await backgroundNotificationTaskHandler({ data: null, error: new Error('background task fail') });
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('[BackgroundNotificationTask] Error'),
        expect.any(Error)
      );
      consoleErrorSpy.mockRestore();
    });

    it('schedules local notification for data-only message without root title', async () => {
      const data = {
        notification: {
          data: {
            title: 'Recordatorio de Cita',
            body: 'Tu cita es hoy a las 10:00 AM',
            route: '/(tabs)/agenda',
          },
        },
      };

      await backgroundNotificationTaskHandler({ data, error: null });
      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith({
        content: {
          title: 'Recordatorio de Cita',
          body: 'Tu cita es hoy a las 10:00 AM',
          data: data.notification.data,
          sound: 'default',
        },
        trigger: null,
      });
    });

    it('does not schedule local notification if root notification already has title', async () => {
      const data = {
        notification: {
          title: 'Notificación del sistema',
          data: {
            title: 'Subtítulo',
            body: 'Contenido',
          },
        },
      };

      await backgroundNotificationTaskHandler({ data, error: null });
      expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
    });

    it('handles exceptions gracefully when scheduleNotificationAsync rejects', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
      (Notifications.scheduleNotificationAsync as jest.Mock).mockRejectedValueOnce(new Error('Scheduler failed'));

      const data = {
        data: {
          title: 'Alerta',
          body: 'Mensaje urgente',
        },
      };

      await backgroundNotificationTaskHandler({ data, error: null });
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('[BackgroundNotificationTask] Excepción procesando notificación background:'),
        expect.any(Error)
      );
      consoleErrorSpy.mockRestore();
    });
  });

  describe('defineBackgroundNotificationTask', () => {
    it('defines background task in TaskManager', () => {
      defineBackgroundNotificationTask();
      expect(TaskManager.defineTask).toHaveBeenCalledWith(
        BACKGROUND_NOTIFICATION_TASK,
        backgroundNotificationTaskHandler
      );
    });
  });

  describe('registerBackgroundNotificationTaskAsync', () => {
    it('returns false on web platform', async () => {
      const originalPlatform = Platform.OS;
      Platform.OS = 'web';
      const result = await registerBackgroundNotificationTaskAsync();
      expect(result).toBe(false);
      Platform.OS = originalPlatform;
    });

    it('registers task when not already registered on native', async () => {
      (TaskManager.isTaskRegisteredAsync as jest.Mock).mockResolvedValueOnce(false);
      const result = await registerBackgroundNotificationTaskAsync();
      expect(result).toBe(true);
      expect(Notifications.registerTaskAsync).toHaveBeenCalledWith(BACKGROUND_NOTIFICATION_TASK);
    });

    it('does not register task when already registered', async () => {
      (TaskManager.isTaskRegisteredAsync as jest.Mock).mockResolvedValueOnce(true);
      const result = await registerBackgroundNotificationTaskAsync();
      expect(result).toBe(true);
      expect(Notifications.registerTaskAsync).not.toHaveBeenCalled();
    });

    it('returns false and logs error on registration failure', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
      (TaskManager.isTaskRegisteredAsync as jest.Mock).mockRejectedValueOnce(new Error('Task manager error'));
      const result = await registerBackgroundNotificationTaskAsync();
      expect(result).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('[NotificationService] Error al registrar tarea en segundo plano:'),
        expect.any(Error)
      );
      consoleErrorSpy.mockRestore();
    });
  });

  describe('unregisterBackgroundNotificationTaskAsync', () => {
    it('returns false on web platform', async () => {
      const originalPlatform = Platform.OS;
      Platform.OS = 'web';
      const result = await unregisterBackgroundNotificationTaskAsync();
      expect(result).toBe(false);
      Platform.OS = originalPlatform;
    });

    it('unregisters task when registered on native', async () => {
      (TaskManager.isTaskRegisteredAsync as jest.Mock).mockResolvedValueOnce(true);
      const result = await unregisterBackgroundNotificationTaskAsync();
      expect(result).toBe(true);
      expect(Notifications.unregisterTaskAsync).toHaveBeenCalledWith(BACKGROUND_NOTIFICATION_TASK);
    });

    it('does nothing when task is not registered', async () => {
      (TaskManager.isTaskRegisteredAsync as jest.Mock).mockResolvedValueOnce(false);
      const result = await unregisterBackgroundNotificationTaskAsync();
      expect(result).toBe(true);
      expect(Notifications.unregisterTaskAsync).not.toHaveBeenCalled();
    });

    it('returns false and logs error on unregistration failure', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
      (TaskManager.isTaskRegisteredAsync as jest.Mock).mockRejectedValueOnce(new Error('Unregister error'));
      const result = await unregisterBackgroundNotificationTaskAsync();
      expect(result).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('[NotificationService] Error al desregistrar tarea en segundo plano:'),
        expect.any(Error)
      );
      consoleErrorSpy.mockRestore();
    });
  });

  describe('setupNotificationChannelsAsync', () => {
    it('sets Android notification channel when on Android', async () => {
      const originalPlatform = Platform.OS;
      Platform.OS = 'android';
      await setupNotificationChannelsAsync();
      expect(Notifications.setNotificationChannelAsync).toHaveBeenCalledWith(
        DEFAULT_NOTIFICATION_CHANNEL_ID,
        expect.objectContaining({
          name: 'General',
          importance: Notifications.AndroidImportance.MAX,
          lightColor: '#52287D',
        })
      );
      Platform.OS = originalPlatform;
    });

    it('does not set notification channel on iOS', async () => {
      const originalPlatform = Platform.OS;
      Platform.OS = 'ios';
      await setupNotificationChannelsAsync();
      expect(Notifications.setNotificationChannelAsync).not.toHaveBeenCalled();
      Platform.OS = originalPlatform;
    });
  });

  describe('registerForPushNotificationsAsync', () => {
    it('returns null on web platform', async () => {
      const originalPlatform = Platform.OS;
      Platform.OS = 'web';
      const token = await registerForPushNotificationsAsync();
      expect(token).toBeNull();
      Platform.OS = originalPlatform;
    });

    it('returns token when permission is already granted', async () => {
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValueOnce({ status: 'granted' });
      (Notifications.getExpoPushTokenAsync as jest.Mock).mockResolvedValueOnce({ data: 'ExponentPushToken[123]' });

      const token = await registerForPushNotificationsAsync('test-project');
      expect(token).toBe('ExponentPushToken[123]');
      expect(Notifications.getExpoPushTokenAsync).toHaveBeenCalledWith({ projectId: 'test-project' });
    });

    it('requests permission if not initially granted and proceeds if accepted', async () => {
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValueOnce({ status: 'undetermined' });
      (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValueOnce({ status: 'granted' });
      (Notifications.getExpoPushTokenAsync as jest.Mock).mockResolvedValueOnce({ data: 'ExponentPushToken[456]' });

      const token = await registerForPushNotificationsAsync();
      expect(token).toBe('ExponentPushToken[456]');
      expect(Notifications.requestPermissionsAsync).toHaveBeenCalled();
    });

    it('returns null if permission is rejected', async () => {
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValueOnce({ status: 'denied' });
      (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValueOnce({ status: 'denied' });

      const token = await registerForPushNotificationsAsync();
      expect(token).toBeNull();
      expect(Notifications.getExpoPushTokenAsync).not.toHaveBeenCalled();
    });

    it('catches and logs error if token retrieval fails', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
      (Notifications.getPermissionsAsync as jest.Mock).mockRejectedValueOnce(new Error('Firebase service not available'));

      const token = await registerForPushNotificationsAsync();
      expect(token).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('[NotificationService] Error registrando push notifications:'),
        expect.any(Error)
      );
      consoleErrorSpy.mockRestore();
    });
  });

  describe('validatePushPayload', () => {
    it('fails when payload is null or not an object', () => {
      expect(validatePushPayload(null).isValid).toBe(false);
      expect(validatePushPayload('string').isValid).toBe(false);
      expect(validatePushPayload(undefined).errors).toContain('El payload debe ser un objeto válido');
    });

    it('validates priority, contentAvailable, and title/body', () => {
      const result = validatePushPayload({
        priority: 'normal',
        title: 'Hola',
      });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('La prioridad debe ser "high" para garantizar entrega en estado background');
      expect(result.errors).toContain('El payload debe incluir "contentAvailable: true" o "content-available: 1"');
      expect(result.errors).toContain('El payload debe contener title y body (a nivel raíz o dentro del objeto data)');
    });

    it('requires channelId on Android', () => {
      const originalPlatform = Platform.OS;
      Platform.OS = 'android';
      const result = validatePushPayload({
        priority: 'high',
        contentAvailable: true,
        title: 'Título',
        body: 'Cuerpo',
      });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Se debe especificar un channelId para dispositivos Android');
      Platform.OS = originalPlatform;
    });

    it('succeeds with a valid complete payload', () => {
      const result = validatePushPayload({
        priority: 'high',
        contentAvailable: true,
        channelId: 'default',
        title: 'Cita Confirmada',
        body: 'Tu cita está programada para mañana',
      });
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('succeeds when title and body are inside data object', () => {
      const result = validatePushPayload({
        priority: 'high',
        'content-available': 1,
        channelId: 'default',
        data: {
          title: 'Notificación Data',
          body: 'Detalles en background',
        },
      });
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('createStandardPushPayload', () => {
    it('creates standard payload with default parameters', () => {
      const payload = createStandardPushPayload({
        to: 'ExponentPushToken[user-1]',
        title: 'Prueba',
        body: 'Mensaje de prueba',
      });

      expect(payload).toEqual({
        to: 'ExponentPushToken[user-1]',
        title: 'Prueba',
        body: 'Mensaje de prueba',
        priority: 'high',
        channelId: DEFAULT_NOTIFICATION_CHANNEL_ID,
        contentAvailable: true,
        _contentAvailable: true,
        sound: 'default',
        data: {
          targetRoute: undefined,
          title: 'Prueba',
          body: 'Mensaje de prueba',
        },
      });
    });

    it('creates standard payload with customized options', () => {
      const payload = createStandardPushPayload({
        to: ['token-1', 'token-2'],
        title: 'Nueva Cita',
        body: 'Se ha agendado una cita',
        targetRoute: '/(tabs)/agenda',
        channelId: 'custom-channel',
        sound: 'custom.wav',
        data: { appointmentId: 'apt-99' },
      });

      expect(payload.to).toEqual(['token-1', 'token-2']);
      expect(payload.channelId).toBe('custom-channel');
      expect(payload.sound).toBe('custom.wav');
      expect(payload.data).toEqual({
        appointmentId: 'apt-99',
        targetRoute: '/(tabs)/agenda',
        title: 'Nueva Cita',
        body: 'Se ha agendado una cita',
      });
    });
  });

  describe('extractTargetRoute', () => {
    it('returns null if response or content is missing', () => {
      expect(extractTargetRoute(null)).toBeNull();
      expect(extractTargetRoute(undefined)).toBeNull();
      expect(extractTargetRoute({} as any)).toBeNull();
    });

    it('returns null if data is not an object', () => {
      const response: any = {
        notification: {
          request: {
            content: {
              data: null,
            },
          },
        },
      };
      expect(extractTargetRoute(response)).toBeNull();
    });

    it('extracts targetRoute, url or route correctly', () => {
      const responseWithTarget: any = {
        notification: { request: { content: { data: { targetRoute: ' /(tabs)/agenda ' } } } },
      };
      expect(extractTargetRoute(responseWithTarget)).toBe('/(tabs)/agenda');

      const responseWithUrl: any = {
        notification: { request: { content: { data: { url: '/(tabs)/patients' } } } },
      };
      expect(extractTargetRoute(responseWithUrl)).toBe('/(tabs)/patients');

      const responseWithRoute: any = {
        notification: { request: { content: { data: { route: '/profile' } } } },
      };
      expect(extractTargetRoute(responseWithRoute)).toBe('/profile');
    });

    it('returns null if route string is empty', () => {
      const response: any = {
        notification: { request: { content: { data: { route: '   ' } } } },
      };
      expect(extractTargetRoute(response)).toBeNull();
    });
  });

  describe('setupNotificationListeners', () => {
    it('calls onNavigate when app was opened from last notification response', async () => {
      const onNavigate = jest.fn();
      const mockLastResponse: any = {
        notification: {
          request: {
            content: {
              data: {
                targetRoute: '/(tabs)/agenda',
              },
            },
          },
        },
      };
      (Notifications.getLastNotificationResponseAsync as jest.Mock).mockResolvedValueOnce(mockLastResponse);

      const cleanup = setupNotificationListeners(onNavigate);

      await Promise.resolve(); // Permite resolver la promesa de getLastNotificationResponseAsync
      expect(onNavigate).toHaveBeenCalledWith('/(tabs)/agenda');
      cleanup();
    });

    it('handles error in getLastNotificationResponseAsync gracefully', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
      (Notifications.getLastNotificationResponseAsync as jest.Mock).mockRejectedValueOnce(new Error('Native error'));

      const cleanup = setupNotificationListeners(jest.fn());
      await new Promise((resolve) => setTimeout(resolve, 10));
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('[NotificationService] Error leyendo última notificación:'),
        expect.any(Error)
      );
      consoleErrorSpy.mockRestore();
      cleanup();
    });

    it('calls onNavigate when a notification response is received while running', () => {
      const onNavigate = jest.fn();
      let listenerCallback: ((response: any) => void) | undefined;
      const removeMock = jest.fn();

      (Notifications.addNotificationResponseReceivedListener as jest.Mock).mockImplementation((cb) => {
        listenerCallback = cb;
        return { remove: removeMock };
      });

      const cleanup = setupNotificationListeners(onNavigate);

      listenerCallback?.({
        notification: {
          request: {
            content: {
              data: { route: '/(tabs)/reports' },
            },
          },
        },
      });

      expect(onNavigate).toHaveBeenCalledWith('/(tabs)/reports');
      cleanup();
      expect(removeMock).toHaveBeenCalled();
    });
  });

  describe('useNotificationObserver', () => {
    it('sets up listeners and pushes to router by default', () => {
      let listenerCallback: ((response: any) => void) | undefined;
      (Notifications.addNotificationResponseReceivedListener as jest.Mock).mockImplementation((cb) => {
        listenerCallback = cb;
        return { remove: jest.fn() };
      });

      renderHook(() => useNotificationObserver());

      listenerCallback?.({
        notification: {
          request: {
            content: {
              data: { route: '/(tabs)/agenda' },
            },
          },
        },
      });

      expect(router.push).toHaveBeenCalledWith('/(tabs)/agenda');
    });

    it('invokes customHandler when provided', () => {
      const customHandler = jest.fn();
      let listenerCallback: ((response: any) => void) | undefined;
      (Notifications.addNotificationResponseReceivedListener as jest.Mock).mockImplementation((cb) => {
        listenerCallback = cb;
        return { remove: jest.fn() };
      });

      renderHook(() => useNotificationObserver(customHandler));

      listenerCallback?.({
        notification: {
          request: {
            content: {
              data: { route: '/profile' },
            },
          },
        },
      });

      expect(customHandler).toHaveBeenCalledWith('/profile');
      expect(router.push).not.toHaveBeenCalled();
    });
  });

  describe('initNotifications', () => {
    it('initializes foreground handlers, channels, background task and listeners', () => {
      const onNavigate = jest.fn();
      initNotifications(onNavigate);

      expect(Notifications.setNotificationHandler).toHaveBeenCalled();
      expect(Notifications.addNotificationResponseReceivedListener).toHaveBeenCalled();
    });

    it('handles routing error in notification listener without throwing', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
      let listenerCallback: ((response: any) => void) | undefined;

      (Notifications.addNotificationResponseReceivedListener as jest.Mock).mockImplementation((cb) => {
        listenerCallback = cb;
        return { remove: jest.fn() };
      });

      initNotifications(() => {
        throw new Error('Routing crash');
      });

      listenerCallback?.({
        notification: {
          request: {
            content: {
              data: { targetRoute: '/crash' },
            },
          },
        },
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('[NotificationService] Error enrutando desde notificación:'),
        expect.any(Error)
      );
      consoleErrorSpy.mockRestore();
    });

    it('logs warning if general initialization fails', () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
      (Notifications.setNotificationHandler as jest.Mock).mockImplementationOnce(() => {
        throw new Error('Immediate crash');
      });

      expect(() => initNotifications()).not.toThrow();
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('[NotificationService] No se pudieron inicializar las notificaciones:'),
        expect.any(Error)
      );
      consoleWarnSpy.mockRestore();
    });
  });
});
