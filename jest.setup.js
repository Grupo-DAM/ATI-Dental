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
    get: jest.fn(() => Promise.resolve({ docs: [], empty: true })),
    onSnapshot: jest.fn((onNext, onError) => {
      globalThis.registeredFirestoreOnNext = onNext;
      globalThis.registeredFirestoreOnError = onError;
      return jest.fn(); // unsubscribe
    }),
    add: jest.fn(() => Promise.resolve({ id: 'mock-id' })),
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

