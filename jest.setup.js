const mockAsyncStorage = {
  getItem: jest.fn(() => Promise.resolve('mock-token')),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
  clear: jest.fn(() => Promise.resolve()),
};

jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);

jest.mock('expo-constants', () => ({
  default: {
    expoConfig: {
      hostUri: 'localhost:3000'
    }
  },
  expoConfig: {
    hostUri: 'localhost:3000'
  }
}));
jest.mock('react-native/Libraries/Utilities/Platform', () => ({
  OS: 'ios',
  select: jest.fn((obj) => obj.ios || obj.default),
}));

global.AsyncStorage = mockAsyncStorage;