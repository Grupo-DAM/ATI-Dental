require('react-native-reanimated').setUpTests();

jest.mock('react-native-worklets', () => {
  return require('react-native-worklets/lib/module/mock');
});

// Mocks de React Native Firebase para tests unitarios
jest.mock('@react-native-firebase/app', () => ({
  initializeApp: jest.fn(),
}));

global.registeredFirestoreOnNext = null;
global.registeredFirestoreOnError = null;
global.triggerFirestoreSnapshot = (docSnapshot) => {
  if (global.registeredFirestoreOnNext) {
    global.registeredFirestoreOnNext(docSnapshot);
  }
};
global.triggerFirestoreError = (error) => {
  if (global.registeredFirestoreOnError) {
    global.registeredFirestoreOnError(error);
  }
};

jest.mock('@react-native-firebase/firestore', () => {
  const mockFirestoreInstance = {
    collection: jest.fn(() => mockFirestoreInstance),
    doc: jest.fn(() => mockFirestoreInstance),
    orderBy: jest.fn(() => mockFirestoreInstance),
    limit: jest.fn(() => mockFirestoreInstance),
    onSnapshot: jest.fn((onNext, onError) => {
      global.registeredFirestoreOnNext = onNext;
      global.registeredFirestoreOnError = onError;
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
global.registeredAuthStateCallback = null;
global.triggerAuthStateChange = (user) => {
  if (global.registeredAuthStateCallback) {
    return global.registeredAuthStateCallback(user);
  }
};

jest.mock('@react-native-firebase/auth', () => {
  const mockAuthInstance = {
    onAuthStateChanged: jest.fn((callback) => {
      global.registeredAuthStateCallback = callback;
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

