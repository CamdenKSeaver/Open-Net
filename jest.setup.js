const mockAsyncStorage = {
  getItem: jest.fn(() => Promise.resolve('mock-token')),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
  clear: jest.fn(() => Promise.resolve()),
};

jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);


jest.mock('expo-constants', () => ({
  expoConfig: {
    hostUri: 'localhost:3000'
  }
}));


global.AsyncStorage = mockAsyncStorage;