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
    orderBy: jest.fn(() => mockFirestoreInstance),
    limit: jest.fn(() => mockFirestoreInstance),
    onSnapshot: jest.fn((onNext, onError) => {
      globalThis.registeredFirestoreOnNext = onNext;
      globalThis.registeredFirestoreOnError = onError;
      return jest.fn(); // unsubscribe
    }),
    add: jest.fn(() => Promise.resolve({ id: 'mock-id' })),
    get: jest.fn(() => Promise.resolve({ exists: false, data: () => ({}) })),
    set: jest.fn(() => Promise.resolve()),
    delete: jest.fn(() => Promise.resolve()),
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
globalThis.registeredAuthStateCallback = null;
globalThis.triggerAuthStateChange = (user) => {
  if (globalThis.registeredAuthStateCallback) {
    return globalThis.registeredAuthStateCallback(user);
  }
};

jest.mock('@react-native-firebase/auth', () => {
  const GoogleAuthProvider = {
    credential: jest.fn((idToken) => ({ providerId: 'google.com', token: idToken })),
  };

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
    signInWithCredential: jest.fn(() => Promise.resolve({
      user: {
        uid: 'google-mock-uid',
        email: 'google@example.com',
        displayName: 'Google User',
        getIdToken: jest.fn(() => Promise.resolve('mock-google-jwt')),
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
  return {
    __esModule: true,
    default: mockAuth,
    GoogleAuthProvider,
  };
});

jest.mock('@react-native-google-signin/google-signin', () => ({
  GoogleSignin: {
    configure: jest.fn(),
    signIn: jest.fn(),
    signOut: jest.fn(),
    hasPlayServices: jest.fn(() => Promise.resolve(true)),
  },
  isSuccessResponse: jest.fn(() => true),
  statusCodes: {
    SIGN_IN_REQUIRED: 'SIGN_IN_REQUIRED',
  },
}));

jest.mock('./src/services/google-auth', () => ({
  configureGoogleSignIn: jest.fn(),
  signInWithGoogleNative: jest.fn(() => Promise.resolve('mock-google-id-token')),
  signOutGoogleNative: jest.fn(() => Promise.resolve()),
}));

