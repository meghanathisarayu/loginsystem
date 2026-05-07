import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'https://loginsystem-egbm.onrender.com';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to add token to requests
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const login = (email, password) => api.post('/api/login', { email, password });
export const getUsers = () => api.get('/api/users');
export const createUser = (userData) => api.post('/api/users', userData);
export const updateUser = (id, userData) => api.put(`/api/users/${id}`, userData);
export const deleteUser = (id, performedBy) => api.delete(`/api/users/${id}`, { data: { performedBy } });
export const getLogs = () => api.get('/api/activity-logs');

export default api;
