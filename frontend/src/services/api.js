import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000,
});

export const checkHealth = async () => {
  const response = await apiClient.get('/api/health/');
  return response.data;
};

export const analyzeRoutes = async ({
  origin,
  destination,
  departureTime,
  loadWeight,
  checkpointInterval,
}) => {
  const response = await apiClient.post('/api/routes/analyze/', {
    origin,
    destination,
    departure_time: departureTime,
    load_weight: parseFloat(loadWeight) || 0,
    checkpoint_interval: parseFloat(checkpointInterval) || 50,
  });
  return response.data;
};

export default apiClient;
