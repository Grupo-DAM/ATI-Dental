import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import { router } from 'expo-router';
import { renderHook } from '@testing-library/react-native';
import {
  BACKGROUND_NOTIFICATION_TASK,
  DEFAULT_NOTIFICATION_CHANNEL_ID,
  initForegroundNotificationHandler,
  defineBackgroundNotificationTask,
  backgroundNotificationTaskHandler,
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
} from '../notification-service';

jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
  },
}));

describe('NotificationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Platform.OS = 'android';
  });

  describe('Foreground Handler', () => {
    it('configura el handler con banner, list, sound y badge activados', async () => {
      initForegroundNotificationHandler();
      expect(Notifications.setNotificationHandler).toHaveBeenCalled();

      const lastCall = (Notifications.setNotificationHandler as jest.Mock).mock.calls.slice(-1)[0][0];
      const handlerResult = await lastCall.handleNotification();
      expect(handlerResult).toEqual({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      });
    });
  });

  describe('Background Task Definition and Execution', () => {
    it('define la tarea en segundo plano con TaskManager', () => {
      defineBackgroundNotificationTask();
      expect(TaskManager.defineTask).toHaveBeenCalledWith(
        BACKGROUND_NOTIFICATION_TASK,
        backgroundNotificationTaskHandler
      );
    });

    it('maneja errores reportados por TaskManager sin arrojar excepción', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      await backgroundNotificationTaskHandler({ data: null, error: new Error('Fallo de SO') });

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[BackgroundNotificationTask]'),
        expect.any(Error)
      );
      consoleSpy.mockRestore();
    });

    it('despliega notificación local cuando llega un mensaje headless con data title y body', async () => {
      await backgroundNotificationTaskHandler({
        data: {
          notification: {
            data: {
              title: 'Cita Confirmada',
              body: 'Tu cita ha sido agendada con éxito.',
              targetRoute: '/(tabs)/agenda',
            },
          },
        },
        error: null,
      });

      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith({
        content: {
          title: 'Cita Confirmada',
          body: 'Tu cita ha sido agendada con éxito.',
          data: {
            title: 'Cita Confirmada',
            body: 'Tu cita ha sido agendada con éxito.',
            targetRoute: '/(tabs)/agenda',
          },
          sound: 'default',
        },
        trigger: null,
      });
    });

    it('captura excepciones internas durante la ejecución de la tarea en background', async () => {
      (Notifications.scheduleNotificationAsync as jest.Mock).mockRejectedValueOnce(
        new Error('Storage failure')
      );
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      await backgroundNotificationTaskHandler({
        data: {
          notification: {
            data: {
              title: 'Aviso',
              body: 'Mensaje de prueba',
            },
          },
        },
        error: null,
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[BackgroundNotificationTask] Excepción procesando notificación background:'),
        expect.any(Error)
      );
      consoleSpy.mockRestore();
    });
  });

  describe('Registration & Lifecycle', () => {
    it('no registra la tarea de background si la plataforma es web', async () => {
      Platform.OS = 'web';
      const result = await registerBackgroundNotificationTaskAsync();
      expect(result).toBe(false);
      expect(TaskManager.isTaskRegisteredAsync).not.toHaveBeenCalled();
    });

    it('registra la tarea si no está registrada previamente', async () => {
      (TaskManager.isTaskRegisteredAsync as jest.Mock).mockResolvedValueOnce(false);
      const result = await registerBackgroundNotificationTaskAsync();
      expect(result).toBe(true);
      expect(Notifications.registerTaskAsync).toHaveBeenCalledWith(BACKGROUND_NOTIFICATION_TASK);
    });

    it('no vuelve a registrar la tarea si ya está activa', async () => {
      (TaskManager.isTaskRegisteredAsync as jest.Mock).mockResolvedValueOnce(true);
      const result = await registerBackgroundNotificationTaskAsync();
      expect(result).toBe(true);
      expect(Notifications.registerTaskAsync).not.toHaveBeenCalled();
    });

    it('retorna false si ocurre un error al registrar la tarea', async () => {
      (TaskManager.isTaskRegisteredAsync as jest.Mock).mockRejectedValueOnce(new Error('Registro falló'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      const result = await registerBackgroundNotificationTaskAsync();
      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('desregistra la tarea si está registrada', async () => {
      (TaskManager.isTaskRegisteredAsync as jest.Mock).mockResolvedValueOnce(true);
      const result = await unregisterBackgroundNotificationTaskAsync();
      expect(result).toBe(true);
      expect(Notifications.unregisterTaskAsync).toHaveBeenCalledWith(BACKGROUND_NOTIFICATION_TASK);
    });

    it('no desregistra la tarea en plataforma web', async () => {
      Platform.OS = 'web';
      const result = await unregisterBackgroundNotificationTaskAsync();
      expect(result).toBe(false);
      expect(Notifications.unregisterTaskAsync).not.toHaveBeenCalled();
    });

    it('retorna false si ocurre un error al desregistrar la tarea', async () => {
      (TaskManager.isTaskRegisteredAsync as jest.Mock).mockRejectedValueOnce(new Error('Error de sistema'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      const result = await unregisterBackgroundNotificationTaskAsync();
      expect(result).toBe(false);
      consoleSpy.mockRestore();
    });
  });

  describe('setupNotificationChannelsAsync', () => {
    it('crea el canal default en Android con importancia MAX', async () => {
      Platform.OS = 'android';
      await setupNotificationChannelsAsync();

      expect(Notifications.setNotificationChannelAsync).toHaveBeenCalledWith(
        DEFAULT_NOTIFICATION_CHANNEL_ID,
        expect.objectContaining({
          name: 'General',
          importance: Notifications.AndroidImportance.MAX,
          enableLights: true,
          enableVibrate: true,
          showBadge: true,
        })
      );
    });

    it('no ejecuta configuración de canales en iOS', async () => {
      Platform.OS = 'ios';
      await setupNotificationChannelsAsync();
      expect(Notifications.setNotificationChannelAsync).not.toHaveBeenCalled();
    });
  });

  describe('registerForPushNotificationsAsync', () => {
    it('retorna null en web', async () => {
      Platform.OS = 'web';
      const token = await registerForPushNotificationsAsync();
      expect(token).toBeNull();
    });

    it('obtiene el token si los permisos ya están concedidos', async () => {
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValueOnce({ status: 'granted' });
      (Notifications.getExpoPushTokenAsync as jest.Mock).mockResolvedValueOnce({
        data: 'ExponentPushToken[12345]',
      });

      const token = await registerForPushNotificationsAsync('proj-abc');
      expect(token).toBe('ExponentPushToken[12345]');
      expect(Notifications.getExpoPushTokenAsync).toHaveBeenCalledWith({ projectId: 'proj-abc' });
    });

    it('solicita permisos si el estado no es granted y los obtiene', async () => {
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValueOnce({ status: 'undetermined' });
      (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValueOnce({ status: 'granted' });
      (Notifications.getExpoPushTokenAsync as jest.Mock).mockResolvedValueOnce({
        data: 'ExponentPushToken[67890]',
      });

      const token = await registerForPushNotificationsAsync();
      expect(Notifications.requestPermissionsAsync).toHaveBeenCalled();
      expect(token).toBe('ExponentPushToken[67890]');
    });

    it('retorna null si los permisos son denegados', async () => {
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValueOnce({ status: 'undetermined' });
      (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValueOnce({ status: 'denied' });

      const token = await registerForPushNotificationsAsync();
      expect(token).toBeNull();
      expect(Notifications.getExpoPushTokenAsync).not.toHaveBeenCalled();
    });

    it('retorna null si getExpoPushTokenAsync falla', async () => {
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValueOnce({ status: 'granted' });
      (Notifications.getExpoPushTokenAsync as jest.Mock).mockRejectedValueOnce(new Error('Network error'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      const token = await registerForPushNotificationsAsync();
      expect(token).toBeNull();
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('validatePushPayload', () => {
    it('invalida si el payload es nulo o no es un objeto', () => {
      const res1 = validatePushPayload(null);
      expect(res1.isValid).toBe(false);
      expect(res1.errors).toContain('El payload debe ser un objeto válido');

      const res2 = validatePushPayload('cadena inválida');
      expect(res2.isValid).toBe(false);
    });

    it('detecta errores de prioridad, content-available, canal y contenido', () => {
      Platform.OS = 'android';
      const res = validatePushPayload({
        priority: 'normal',
      });

      expect(res.isValid).toBe(false);
      expect(res.errors).toContain('La prioridad debe ser "high" para garantizar entrega en estado background');
      expect(res.errors).toContain('El payload debe incluir "contentAvailable: true" o "content-available: 1"');
      expect(res.errors).toContain('Se debe especificar un channelId para dispositivos Android');
      expect(res.errors).toContain('El payload debe contener title y body (a nivel raíz o dentro del objeto data)');
    });

    it('valida exitosamente cuando incluye todos los requisitos con contentAvailable booleano', () => {
      Platform.OS = 'android';
      const validPayload = {
        title: 'Cita Odontológica',
        body: 'Tienes una consulta mañana a las 10:00 AM',
        priority: 'high',
        channelId: 'default',
        contentAvailable: true,
        data: { targetRoute: '/(tabs)/agenda' },
      };

      const res = validatePushPayload(validPayload);
      expect(res.isValid).toBe(true);
      expect(res.errors).toHaveLength(0);
    });

    it('acepta content-available numérico y datos de title/body dentro de data', () => {
      Platform.OS = 'ios';
      const validPayload = {
        priority: 'high',
        'content-available': 1,
        data: {
          title: 'Historial Actualizado',
          body: 'Se agregaron nuevas observaciones.',
          targetRoute: '/(tabs)/patient-file',
        },
      };

      const res = validatePushPayload(validPayload);
      expect(res.isValid).toBe(true);
      expect(res.errors).toHaveLength(0);
    });
  });

  describe('createStandardPushPayload', () => {
    it('construye un payload completo y válido para background', () => {
      const payload = createStandardPushPayload({
        to: 'ExponentPushToken[abcdef]',
        title: 'Nueva Cita',
        body: 'El paciente Juan Pérez ha llegado.',
        targetRoute: '/(tabs)/agenda',
        data: { citaId: '123' },
      });

      expect(payload).toEqual({
        to: 'ExponentPushToken[abcdef]',
        title: 'Nueva Cita',
        body: 'El paciente Juan Pérez ha llegado.',
        priority: 'high',
        channelId: 'default',
        contentAvailable: true,
        _contentAvailable: true,
        sound: 'default',
        data: {
          citaId: '123',
          targetRoute: '/(tabs)/agenda',
          title: 'Nueva Cita',
          body: 'El paciente Juan Pérez ha llegado.',
        },
      });

      const validation = validatePushPayload(payload);
      expect(validation.isValid).toBe(true);
    });
  });

  describe('extractTargetRoute', () => {
    it('retorna null si no hay respuesta o datos', () => {
      expect(extractTargetRoute(null)).toBeNull();
      expect(extractTargetRoute({} as any)).toBeNull();
      expect(
        extractTargetRoute({
          notification: {
            request: {
              content: { data: null },
            },
          },
        } as any)
      ).toBeNull();
    });

    it('extrae targetRoute con prioridad', () => {
      const res = {
        notification: {
          request: {
            content: {
              data: {
                targetRoute: '/(tabs)/agenda',
                url: '/(tabs)/home',
              },
            },
          },
        },
      } as any;

      expect(extractTargetRoute(res)).toBe('/(tabs)/agenda');
    });

    it('extrae url si targetRoute no está presente', () => {
      const res = {
        notification: {
          request: {
            content: {
              data: {
                url: '/(tabs)/patient-file',
              },
            },
          },
        },
      } as any;

      expect(extractTargetRoute(res)).toBe('/(tabs)/patient-file');
    });

    it('extrae route como fallback', () => {
      const res = {
        notification: {
          request: {
            content: {
              data: {
                route: '/contacts',
              },
            },
          },
        },
      } as any;

      expect(extractTargetRoute(res)).toBe('/contacts');
    });
  });

  describe('setupNotificationListeners', () => {
    it('ejecuta onNavigate si existe una notificación previa desde estado cerrado', async () => {
      (Notifications.getLastNotificationResponseAsync as jest.Mock).mockResolvedValueOnce({
        notification: {
          request: {
            content: {
              data: { targetRoute: '/(tabs)/agenda' },
            },
          },
        },
      });

      const onNavigate = jest.fn();
      const cleanup = setupNotificationListeners(onNavigate);

      await Promise.resolve(); // resolver microtareas

      expect(onNavigate).toHaveBeenCalledWith('/(tabs)/agenda');
      cleanup();
    });

    it('captura errores si getLastNotificationResponseAsync falla', async () => {
      (Notifications.getLastNotificationResponseAsync as jest.Mock).mockRejectedValueOnce(
        new Error('Disk error')
      );
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      const onNavigate = jest.fn();
      const cleanup = setupNotificationListeners(onNavigate);

      await new Promise((resolve) => setTimeout(resolve, 20));

      expect(consoleSpy).toHaveBeenCalled();
      cleanup();
      consoleSpy.mockRestore();
    });

    it('ejecuta onNavigate cuando el usuario pulsa una notificación en background', () => {
      let listenerCallback: ((res: any) => void) | undefined;
      const removeMock = jest.fn();

      (Notifications.addNotificationResponseReceivedListener as jest.Mock).mockImplementation((cb) => {
        listenerCallback = cb;
        return { remove: removeMock };
      });

      const onNavigate = jest.fn();
      const cleanup = setupNotificationListeners(onNavigate);

      expect(listenerCallback).toBeDefined();
      listenerCallback?.({
        notification: {
          request: {
            content: {
              data: { targetRoute: '/(tabs)/patients/schedule-appointment' },
            },
          },
        },
      });

      expect(onNavigate).toHaveBeenCalledWith('/(tabs)/patients/schedule-appointment');

      cleanup();
      expect(removeMock).toHaveBeenCalled();
    });
  });

  describe('useNotificationObserver', () => {
    it('registra el observer en el hook y utiliza router.push por defecto', async () => {
      let listenerCallback: ((res: any) => void) | undefined;
      (Notifications.addNotificationResponseReceivedListener as jest.Mock).mockImplementation((cb) => {
        listenerCallback = cb;
        return { remove: jest.fn() };
      });

      const { unmount } = renderHook(() => useNotificationObserver());

      expect(Notifications.addNotificationResponseReceivedListener).toHaveBeenCalled();

      listenerCallback?.({
        notification: {
          request: {
            content: {
              data: { targetRoute: '/(tabs)/home' },
            },
          },
        },
      });

      expect(router.push).toHaveBeenCalledWith('/(tabs)/home');
      unmount();
    });

    it('soporta un customHandler en el hook', async () => {
      let listenerCallback: ((res: any) => void) | undefined;
      (Notifications.addNotificationResponseReceivedListener as jest.Mock).mockImplementation((cb) => {
        listenerCallback = cb;
        return { remove: jest.fn() };
      });

      const customHandler = jest.fn();
      const { unmount } = renderHook(() => useNotificationObserver(customHandler));

      listenerCallback?.({
        notification: {
          request: {
            content: {
              data: { targetRoute: '/(tabs)/explore' },
            },
          },
        },
      });

      expect(customHandler).toHaveBeenCalledWith('/(tabs)/explore');
      expect(router.push).not.toHaveBeenCalled();
      unmount();
    });
  });

  describe('initNotifications', () => {
    it('inicializa handlers, canales, tareas y listeners con navegación por defecto', () => {
      let listenerCallback: ((res: any) => void) | undefined;
      (Notifications.addNotificationResponseReceivedListener as jest.Mock).mockImplementation((cb) => {
        listenerCallback = cb;
        return { remove: jest.fn() };
      });

      initNotifications();

      expect(Notifications.setNotificationHandler).toHaveBeenCalled();
      expect(Notifications.setNotificationChannelAsync).toHaveBeenCalled();
      expect(Notifications.addNotificationResponseReceivedListener).toHaveBeenCalled();

      listenerCallback?.({
        notification: {
          request: {
            content: {
              data: { targetRoute: '/(tabs)/agenda' },
            },
          },
        },
      });

      expect(router.push).toHaveBeenCalledWith('/(tabs)/agenda');
    });

    it('utiliza callback personalizado si se proporciona a initNotifications', () => {
      let listenerCallback: ((res: any) => void) | undefined;
      (Notifications.addNotificationResponseReceivedListener as jest.Mock).mockImplementation((cb) => {
        listenerCallback = cb;
        return { remove: jest.fn() };
      });

      const customNavigate = jest.fn();
      initNotifications(customNavigate);

      listenerCallback?.({
        notification: {
          request: {
            content: {
              data: { targetRoute: '/(tabs)/patient-file' },
            },
          },
        },
      });

      expect(customNavigate).toHaveBeenCalledWith('/(tabs)/patient-file');
      expect(router.push).not.toHaveBeenCalled();
    });

    it('captura errores al navegar si router.push arroja error', () => {
      let listenerCallback: ((res: any) => void) | undefined;
      (Notifications.addNotificationResponseReceivedListener as jest.Mock).mockImplementation((cb) => {
        listenerCallback = cb;
        return { remove: jest.fn() };
      });

      (router.push as jest.Mock).mockImplementationOnce(() => {
        throw new Error('Navigation failed');
      });
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      initNotifications();

      listenerCallback?.({
        notification: {
          request: {
            content: {
              data: { targetRoute: '/(tabs)/agenda' },
            },
          },
        },
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[NotificationService] Error enrutando desde notificación:'),
        expect.any(Error)
      );
      consoleSpy.mockRestore();
    });
  });
});

