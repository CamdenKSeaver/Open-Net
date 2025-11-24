import { Platform } from 'react-native';
import Constants from 'expo-constants';

//auto detect local IP from Expo
const getLocalIP = () => {
  if (__DEV__) {
    const debuggerHost = Constants.expoConfig?.hostUri;
    if (debuggerHost) {
      const ip = debuggerHost.split(':')[0];
      return `http://${ip}:3000/api`;
    }
  }
  return 'http://localhost:3000/api';
};



const API_URL = getLocalIP();
export default API_URL;

