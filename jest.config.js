const isReassure = process.argv.some(arg => arg.includes('perf') || arg.includes('reassure'));

module.exports = {
  preset: "jest-expo",
  setupFiles: ["<rootDir>/jest.setup.js"],
  moduleNameMapper: {
    "\\.css$": "<rootDir>/jest.styleMock.js",
    "\\.(png|jpg|jpeg|gif|webp|svg)$": "<rootDir>/jest.assetMock.js",
    "^@/assets/(.*)$": "<rootDir>/assets/$1",
    "^@/(.*)$": "<rootDir>/src/$1"
  },
  testPathIgnorePatterns: isReassure
    ? ["/node_modules/"]
    : ["/node_modules/", "\\.perf-test\\.[jt]sx?$"],
  transformIgnorePatterns: [
    "node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@sentry/react-native|native-base|react-native-svg)"
  ]
};
