global.__ExpoImportMetaRegistry = new Map();
global.__EXPO_ENV_PRELOAD__ = true;
global.structuredClone = obj => JSON.parse(JSON.stringify(obj));

jest.mock('expo/src/winter/runtime.native', () => ({}), { virtual: true });
jest.mock(
  'expo/src/winter/installGlobal',
  () => ({
    installGlobals: jest.fn(),
  }),
  { virtual: true }
);

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
  useLocalSearchParams: jest.fn(),
  Stack: {
    Screen: ({ children }) => children,
  },
  router: {
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    canGoBack: jest.fn(() => true),
  },
  Link: ({ children }) => children,
}));

jest.mock('expo-constants', () => ({
  expoConfig: {
    extra: {
      apiBaseUrl: 'http://test-api.loc',
    },
  },
}));

jest.mock('expo-image', () => ({
  Image: 'Image',
}));

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }) => children,
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));

jest.mock('axios');

global.console = {
  ...console,
  error: jest.fn(),
  warn: jest.fn(),
};

jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

jest.mock('expo-font');
jest.mock('expo-asset');
jest.mock('expo-haptics');
jest.mock('expo-linking');
jest.mock('expo-web-browser');
jest.mock('expo-splash-screen');
jest.mock('expo-status-bar');

jest.mock('@react-native-picker/picker', () => ({
  Picker: 'Picker',
}));

jest.mock('react-native/Libraries/Components/ScrollView/ScrollView', () =>
  jest.requireActual('react-native/Libraries/Components/ScrollView/ScrollView')
);
