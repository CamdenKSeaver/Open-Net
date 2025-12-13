jest.mock('./src/config/api', () => ({
  default: 'http://localhost:3000/api'
}));

jest.mock('react-native', () => ({
  Platform: {
    OS: 'ios',
    select: jest.fn((obj) => obj.ios || obj.default),
  },
}));

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

const mockAsyncStorage = {
  getItem: jest.fn(() => Promise.resolve('mock-token')),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
  clear: jest.fn(() => Promise.resolve()),
};

jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);

global.AsyncStorage = mockAsyncStorage;