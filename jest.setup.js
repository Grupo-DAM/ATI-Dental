require('react-native-reanimated').setUpTests();

jest.mock('react-native-worklets', () => {
  return require('react-native-worklets/lib/module/mock');
});

jest.mock('expo-symbols', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    SymbolView: (props) => React.createElement(View, props),
  };
});

jest.mock('expo-device', () => ({
  isDevice: false,
}));

jest.mock('expo-constants', () => ({
  manifest: {},
  expoConfig: {},
}));

jest.mock('expo-linking', () => ({
  createURL: (path) => `http://localhost/${path}`,
  useURL: () => 'http://localhost/',
  openURL: jest.fn(),
  canOpenURL: jest.fn().mockResolvedValue(true),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
}));

jest.mock('expo-asset', () => ({
  Asset: {
    fromModule: jest.fn().mockReturnValue({
      localUri: 'mocked-uri',
      uri: 'mocked-uri',
    }),
  },
}));

jest.mock('expo-image', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    Image: (props) => React.createElement(View, props),
  };
});
