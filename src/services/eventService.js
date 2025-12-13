import { getAuthToken } from './authService';
import API_URL from '../config/api';

const getHeaders = async () => {
  const token = await getAuthToken();  // Gets from AsyncStorage
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : ''
  };
};

export const createEvent = async (eventData) => {
  try {
    const headers = await getHeaders();
    const response = await fetch(`${API_URL}/events`, {
      method: 'POST',
      headers,
      body: JSON.stringify(eventData)
    });

    const result = await response.json();

    if (!result.success) throw new Error(result.error);

    return result.data;
  } catch (error) {
    throw new Error(`Failed to create event: ${error.message}`);
  }
};

export const getEventsInArea = async (center, radiusKm = 50) => {
  try {
    const response = await fetch(`${API_URL}/events`);
    const result = await response.json();

    if (!result.success) throw new Error(result.error);

    return result.data;
  } catch (error) {
    throw new Error(`Failed to fetch events: ${error.message}`);
  }
};

export const joinEventWaitlist = async (eventId, userId) => {
  try {
    const headers = await getHeaders();
    const response = await fetch(`${API_URL}/events/${eventId}/join`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ userId })
    });

    const result = await response.json();

    if (!result.success) throw new Error(result.error);

    return result.data;
  } catch (error) {
    throw new Error(`Failed to join event: ${error.message}`);
  }
};

export const leaveEvent = async (eventId, userId) => {
  try {
    const headers = await getHeaders();
    const response = await fetch(`${API_URL}/events/${eventId}/leave`, {
      method: 'DELETE',
      headers,
      body: JSON.stringify({ userId })
    });

    const result = await response.json();

    if (!result.success) throw new Error(result.error);

    return true;
  } catch (error) {
    throw error;
  }
};

export const getPlayersByPosition = async (eventId) => {
  try {
    const headers = await getHeaders();
    const response = await fetch(`${API_URL}/events/${eventId}/players/positions`, {
      headers
    });

    const result = await response.json();

    if (!result.success) throw new Error(result.error);

    return result.data;
  } catch (error) {
    throw new Error(`Failed to fetch players by position: ${error.message}`);
  }
};

export const updatePlayerPosition = async (eventId, playerId, newPosition, requesterId) => {
  try {
    const headers = await getHeaders();
    const response = await fetch(`${API_URL}/events/${eventId}/players/${playerId}/position`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ newPosition, requesterId })
    });

    const result = await response.json();

    if (!result.success) throw new Error(result.error);

    return true;
  } catch (error) {
    throw error;
  }
};

export const getEvent = async (eventId) => {
  try {
    const response = await fetch(`${API_URL}/events/${eventId}`);
    const result = await response.json();

    if (!result.success) throw new Error(result.error);

    return result.data;
  } catch (error) {
    throw new Error(`Failed to fetch event: ${error.message}`);
  }
};

export const getUserEvents = async (userId) => {
  try {
    const headers = await getHeaders();
    const response = await fetch(`${API_URL}/events/user/${userId}`, {
      headers
    });

    const result = await response.json();

    if (!result.success) throw new Error(result.error);

    return result.data;
  } catch (error) {
    throw new Error(`Failed to fetch user events: ${error.message}`);
  }
};

export const cancelEvent = async (eventId, reason = '') => {
  try {
    const headers = await getHeaders();
    const response = await fetch(`${API_URL}/events/${eventId}/cancel`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ reason })
    });

    const result = await response.json();

    if (!result.success) throw new Error(result.error);

    return true;
  } catch (error) {
    throw new Error(`Failed to cancel event: ${error.message}`);
  }
};

export const removePlayer = async (eventId, userId) => {
  try {
    const headers = await getHeaders();
    const response = await fetch(`${API_URL}/events/${eventId}/players/${userId}`, {
      method: 'DELETE',
      headers
    });

    const result = await response.json();

    if (!result.success) throw new Error(result.error);

    return true;
  } catch (error) {
    throw new Error(`Failed to remove player: ${error.message}`);
  }
};

export const getEventPlayers = async (eventId) => {
  try {
    const headers = await getHeaders();
    const response = await fetch(`${API_URL}/events/${eventId}/players`, {
      headers
    });

    const result = await response.json();

    if (!result.success) throw new Error(result.error);

    return result.data;
  } catch (error) {
    throw new Error(`Failed to fetch players: ${error.message}`);
  }
};

export const approvePlayer = async (eventId, userId, hostId) => {
  try {
    const headers = await getHeaders();
    const response = await fetch(`${API_URL}/events/${eventId}/approve`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ userId, hostId })
    });

    const result = await response.json();

    if (!result.success) throw new Error(result.error);

    return true;
  } catch (error) {
    throw new Error(`Failed to approve player: ${error.message}`);
  }
};

export const rejectPlayer = async (eventId, userId, hostId) => {
  try {
    const headers = await getHeaders();
    const response = await fetch(`${API_URL}/events/${eventId}/reject`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ userId, hostId })
    });

    const result = await response.json();

    if (!result.success) throw new Error(result.error);

    return true;
  } catch (error) {
    throw new Error(`Failed to reject player: ${error.message}`);
  }
};

export const getEventWaitlist = async (eventId) => {
  try {
    const headers = await getHeaders();
    const response = await fetch(`${API_URL}/events/${eventId}/waitlist`, {
      headers
    });

    const result = await response.json();

    if (!result.success) throw new Error(result.error);

    return result.data;
  } catch (error) {
    throw new Error(`Failed to fetch waitlist: ${error.message}`);
  }
};