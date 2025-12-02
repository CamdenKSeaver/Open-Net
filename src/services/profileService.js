
import API_URL from '../config/api';
import { getAuthToken } from './authService';

const getHeaders = async () => {
  const token = await getAuthToken();  // Gets from AsyncStorage
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : ''
  };
};

export const getUserProfile = async (userId)=> {


  try {
    const headers = await getHeaders();
    const response = await fetch(`${API_URL}/profiles/${userId}`, {
      headers
    });

    const result = await response.json();

    if (!result.success) throw new Error(result.error);


    return result.data;
  } catch (error) {

    return null;
  }
};

export const createUserProfile = async (profileData) => {
  try {
    const headers = await getHeaders();

    const response = await fetch(`${API_URL}/profiles`, {
      method: 'POST',
      headers,
      body: JSON.stringify(profileData)
    });

    const result = await response.json();

    if (!result.success) throw new Error(result.error);

    return result.data;
  } catch (error) {
    throw error;
  }
};
export const isProfileComplete = async(userId) => {
  try {

    if (!userId) return false;

    const headers = await getHeaders();


    const response = await fetch(`${API_URL}/profiles/${userId}/complete`,{headers});

    const result = await response.json();

    if (!result.success) return false;

    return result.data.isComplete;
  } catch (error) {
    return false;
  }
};