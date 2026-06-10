require('react-native-reanimated').setUpTests();

jest.mock('react-native-worklets', () => {
  return require('react-native-worklets/lib/module/mock');
});

// Mocks de React Native Firebase para tests unitarios
jest.mock('@react-native-firebase/app', () => ({
  initializeApp: jest.fn(),
}));

jest.mock('@react-native-firebase/firestore', () => {
  const mockFirestoreInstance = {
    collection: jest.fn(() => mockFirestoreInstance),
    doc: jest.fn(() => mockFirestoreInstance),
    orderBy: jest.fn(() => mockFirestoreInstance),
    limit: jest.fn(() => mockFirestoreInstance),
    onSnapshot: jest.fn((callback) => {
      callback({
        metadata: { fromCache: false },
        forEach: jest.fn(),
      });
      return jest.fn(); // unsubscribe
    }),
    add: jest.fn(() => Promise.resolve({ id: 'mock-id' })),
  };
  
  const mockFirestore = jest.fn(() => mockFirestoreInstance);
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
