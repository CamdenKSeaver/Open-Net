import AsyncStorage from '@react-native-async-storage/async-storage';
import API_URL from '../config/api';

export const signUpWithEmail = async(email, password, name) => {


  try {
    const response = await fetch(`${API_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },

      body: JSON.stringify({email, password, name})
    });

    const result = await response.json();

    if (!result.success) throw new Error(result.error);
    await AsyncStorage.setItem('authToken', result.data.token);
    await AsyncStorage.setItem('userData',JSON.stringify(result.data.user));
    return result.data.user;
  } catch (error) {
    throw error;
  }
};

export const signInWithEmail = async (email, password) => {
  try {
    const response = await fetch(`${API_URL}/auth/signin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const result = await response.json();

    if (!result.success) throw new Error(result.error);

    // Store token and user data
    await AsyncStorage.setItem('authToken', result.data.token);
    await AsyncStorage.setItem('userData', JSON.stringify(result.data.user));

    return result.data.user;
  } catch (error) {
    throw error;
  }
};

export const signOut = async () => {

    
  await AsyncStorage.removeItem('authToken');
  await AsyncStorage.removeItem('userData');
};

export const getAuthToken = async () => {
  return await AsyncStorage.getItem('authToken');
};