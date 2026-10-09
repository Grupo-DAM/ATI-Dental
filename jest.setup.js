require('react-native-reanimated').setUpTests();

jest.mock('react-native-worklets', () => {
  return require('react-native-worklets/lib/module/mock');
});

// Mocks de React Native Firebase para tests unitarios
jest.mock('@react-native-firebase/app', () => ({
  initializeApp: jest.fn(),
}));

globalThis.registeredFirestoreOnNext = null;
globalThis.registeredFirestoreOnError = null;
globalThis.triggerFirestoreSnapshot = (docSnapshot) => {
  if (globalThis.registeredFirestoreOnNext) {
    globalThis.registeredFirestoreOnNext(docSnapshot);
  }
};
globalThis.triggerFirestoreError = (error) => {
  if (globalThis.registeredFirestoreOnError) {
    globalThis.registeredFirestoreOnError(error);
  }
};

jest.mock('@react-native-firebase/firestore', () => {
  const mockFirestoreInstance = {
    collection: jest.fn(() => mockFirestoreInstance),
    doc: jest.fn(() => mockFirestoreInstance),
    where: jest.fn(() => mockFirestoreInstance),
    orderBy: jest.fn(() => mockFirestoreInstance),
    limit: jest.fn(() => mockFirestoreInstance),
    get: jest.fn(() => Promise.resolve({ docs: [], empty: true, exists: () => false, data: () => ({}) })),
    onSnapshot: jest.fn((onNext, onError) => {
      globalThis.registeredFirestoreOnNext = onNext;
      globalThis.registeredFirestoreOnError = onError;
      return jest.fn(); // unsubscribe
    }),
    add: jest.fn(() => Promise.resolve({ id: 'mock-id' })),
    set: jest.fn(() => Promise.resolve()),
    update: jest.fn(() => Promise.resolve()),
    delete: jest.fn(() => Promise.resolve()),
  };
  
  const mockFirestore = jest.fn(() => mockFirestoreInstance);
  mockFirestore.FieldValue = {
    serverTimestamp: jest.fn(() => 'mock-server-timestamp'),
  };
  return mockFirestore;
});

// Mock react-native-svg
jest.mock('react-native-svg', () => {
  const React = require('react');
  const MockSvgComponent = (name) => {
    const Comp = (props) => React.createElement(name, props, props.children);
    Comp.displayName = name;
    return Comp;
  };
  return {
    __esModule: true,
    default: MockSvgComponent('Svg'),
    Svg: MockSvgComponent('Svg'),
    Circle: MockSvgComponent('Circle'),
    Ellipse: MockSvgComponent('Ellipse'),
    G: MockSvgComponent('G'),
    Text: MockSvgComponent('Text'),
    TSpan: MockSvgComponent('TSpan'),
    TextPath: MockSvgComponent('TextPath'),
    Path: MockSvgComponent('Path'),
    Polygon: MockSvgComponent('Polygon'),
    Polyline: MockSvgComponent('Polyline'),
    Line: MockSvgComponent('Line'),
    Rect: MockSvgComponent('Rect'),
    Use: MockSvgComponent('Use'),
    Image: MockSvgComponent('Image'),
    Symbol: MockSvgComponent('Symbol'),
    Defs: MockSvgComponent('Defs'),
    LinearGradient: MockSvgComponent('LinearGradient'),
    RadialGradient: MockSvgComponent('RadialGradient'),
    Stop: MockSvgComponent('Stop'),
    ClipPath: MockSvgComponent('ClipPath'),
    Pattern: MockSvgComponent('Pattern'),
    Mask: MockSvgComponent('Mask'),
  };
});

jest.mock('@react-native-firebase/storage', () => {
  const mockStorageInstance = {
    ref: jest.fn(() => mockStorageInstance),
    putString: jest.fn(() => {
      const mockTask = Promise.resolve();
      mockTask.on = jest.fn((event, progressCallback) => {
        progressCallback({
          bytesTransferred: 100,
          totalBytes: 100,
        });
      });
      return mockTask;
    }),
    getDownloadURL: jest.fn(() => Promise.resolve('https://mock-firebase-storage-url.com/file.txt')),
  };
  
  return jest.fn(() => mockStorageInstance);
});

// Mocks de expo-secure-store
jest.mock('expo-secure-store', () => {
  const store = {};
  return {
    WHEN_UNLOCKED: 'WHEN_UNLOCKED',
    setItemAsync: jest.fn((key, value) => {
      store[key] = value;
      return Promise.resolve();
    }),
    getItemAsync: jest.fn((key) => {
      return Promise.resolve(store[key] || null);
    }),
    deleteItemAsync: jest.fn((key) => {
      delete store[key];
      return Promise.resolve();
    }),
  };
});

// Mocks de @react-native-firebase/auth
globalThis.registeredAuthStateCallback = null;
globalThis.triggerAuthStateChange = (user) => {
  if (globalThis.registeredAuthStateCallback) {
    return globalThis.registeredAuthStateCallback(user);
  }
};

jest.mock('@react-native-firebase/auth', () => {
  const mockAuthInstance = {
    onAuthStateChanged: jest.fn((callback) => {
      globalThis.registeredAuthStateCallback = callback;
      // Llamamos al callback con null inicialmente
      callback(null);
      return jest.fn(); // unsubscribe
    }),
    signInWithEmailAndPassword: jest.fn(() => Promise.resolve({
      user: {
        uid: 'mock-uid',
        email: 'test@example.com',
        getIdToken: jest.fn(() => Promise.resolve('mock-jwt-token')),
      },
    })),
    signOut: jest.fn(() => Promise.resolve()),
    createUserWithEmailAndPassword: jest.fn(() => Promise.resolve({
      user: {
        uid: 'mock-uid-new',
        email: 'new@example.com',
        getIdToken: jest.fn(() => Promise.resolve('mock-jwt-token-new')),
      },
    })),
  };
  const mockAuth = jest.fn(() => mockAuthInstance);
  return mockAuth;
});

jest.mock('react-native-safe-area-context', () => {
  const actual = jest.requireActual('react-native-safe-area-context');
  return {
    ...actual,
    useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
    useSafeAreaFrame: () => ({ x: 0, y: 0, width: 390, height: 844 }),
  };
});

jest.mock('@react-native-community/netinfo', () => {
  const defaultState = {
    type: 'wifi',
    isConnected: true,
    isInternetReachable: true,
    details: {
      isConnectionExpensive: false,
    },
  };

  // Definimos la función del hook
  const useNetInfo = jest.fn(() => defaultState);

  return {
    __esModule: true,
    default: {
      getCurrentState: jest.fn(() => Promise.resolve(defaultState)),
      addEventListener: jest.fn(() => jest.fn()),
      useNetInfo: useNetInfo,
      fetch: jest.fn(() => Promise.resolve(defaultState)),
    },
    // 👈 FIXED: Exportamos el hook de forma directa en la raíz para soportar { useNetInfo }
    useNetInfo: useNetInfo,
    InternetReachability: {
      update: jest.fn(),
      isInternetReachable: true,
    }
  };
});

// Mocks de expo-print
jest.mock('expo-print', () => ({
  printAsync: jest.fn(() => Promise.resolve()),
  printToFileAsync: jest.fn(() => Promise.resolve({
    uri: 'file:///data/user/0/com.atidental/cache/Print/report.pdf',
    numberOfPages: 1,
    base64: 'bW9jay1wZGYtY29udGVudA==',
  })),
  selectPrinterAsync: jest.fn(() => Promise.resolve({ name: 'Mock Printer', url: 'ipp://mock' })),
  Orientation: {
    portrait: 'portrait',
    landscape: 'landscape',
  },
}));

// Mocks de expo-sharing
jest.mock('expo-sharing', () => ({
  isAvailableAsync: jest.fn(() => Promise.resolve(true)),
  shareAsync: jest.fn(() => Promise.resolve()),
  getSharedPayloads: jest.fn(() => []),
  getResolvedSharedPayloadsAsync: jest.fn(() => Promise.resolve([])),
  clearSharedPayloads: jest.fn(),
  useIncomingShare: jest.fn(() => ({ resolvedSharedPayloads: [], isResolving: false })),
}));

// Mocks de expo-file-system
const mockFileSystem = {
  cacheDirectory: 'file:///data/user/0/com.atidental/cache/',
  documentDirectory: 'file:///data/user/0/com.atidental/documents/',
  bundleDirectory: 'file:///data/user/0/com.atidental/bundle/',
  copyAsync: jest.fn(() => Promise.resolve()),
  moveAsync: jest.fn(() => Promise.resolve()),
  deleteAsync: jest.fn(() => Promise.resolve()),
  getInfoAsync: jest.fn(() => Promise.resolve({ exists: true, isDirectory: false })),
  makeDirectoryAsync: jest.fn(() => Promise.resolve()),
  readAsStringAsync: jest.fn(() => Promise.resolve('')),
  writeAsStringAsync: jest.fn(() => Promise.resolve()),
};
jest.mock('expo-file-system', () => mockFileSystem);
jest.mock('expo-file-system/legacy', () => mockFileSystem);

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);
jest.mock('@react-native-community/netinfo', () => {
 const defaultState = {
   type: 'wifi',
   isConnected: true,
   isInternetReachable: true,
   details: {
     isConnectionExpensive: false,
   },
 };

 // Definimos la función del hook
 const useNetInfo = jest.fn(() => defaultState);

 return {
   __esModule: true,
   default: {
     getCurrentState: jest.fn(() => Promise.resolve(defaultState)),
     addEventListener: jest.fn(() => jest.fn()),
     useNetInfo: useNetInfo,
     fetch: jest.fn(() => Promise.resolve(defaultState)),
   },
   // 👈 FIXED: Exportamos el hook de forma directa en la raíz para soportar { useNetInfo }
   useNetInfo: useNetInfo,
   InternetReachability: {
     update: jest.fn(),
     isInternetReachable: true,
   }
 };
});

// Mocks de expo-task-manager
jest.mock('expo-task-manager', () => ({
  defineTask: jest.fn(),
  isTaskRegisteredAsync: jest.fn(() => Promise.resolve(false)),
  unregisterTaskAsync: jest.fn(() => Promise.resolve()),
}));

// Mocks de expo-notifications
const mockExpoNotifications = {
  setNotificationHandler: jest.fn(),
  registerTaskAsync: jest.fn(() => Promise.resolve()),
  unregisterTaskAsync: jest.fn(() => Promise.resolve()),
  getPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  requestPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  getExpoPushTokenAsync: jest.fn(() => Promise.resolve({ data: 'ExponentPushToken[mock-token-12345]' })),
  setNotificationChannelAsync: jest.fn(() => Promise.resolve()),
  getNotificationChannelsAsync: jest.fn(() => Promise.resolve([])),
  deleteNotificationChannelAsync: jest.fn(() => Promise.resolve()),
  scheduleNotificationAsync: jest.fn(() => Promise.resolve('mock-notification-id')),
  dismissNotificationAsync: jest.fn(() => Promise.resolve()),
  dismissAllNotificationsAsync: jest.fn(() => Promise.resolve()),
  getLastNotificationResponseAsync: jest.fn(() => Promise.resolve(null)),
  addNotificationReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  addNotificationResponseReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  removeNotificationSubscription: jest.fn(),
  AndroidImportance: {
    UNKNOWN: 0,
    MIN: 1,
    LOW: 2,
    DEFAULT: 3,
    HIGH: 4,
    MAX: 5,
  },
};
jest.mock('expo-notifications', () => mockExpoNotifications);

