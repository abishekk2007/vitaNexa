import axios from 'axios';

const API_BASE = '/api';

let requestCount = 0;
const requestLog: Record<string, number> = {};
const requestTimestamps: number[] = [];

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});
console.log("API URL:", api.defaults?.baseURL);

api.interceptors.request.use((config) => {
  requestCount++;
  const url = config.url || 'unknown';
  requestLog[url] = (requestLog[url] || 0) + 1;
  requestTimestamps.push(Date.now());

  // Log every 10th request or first request to each endpoint
  const freq = requestTimestamps.length > 1
    ? `${(requestTimestamps.length / ((requestTimestamps[requestTimestamps.length - 1] - requestTimestamps[0]) / 1000)).toFixed(1)} req/sec`
    : 'N/A';

  console.log(
    `[API] ${config.method?.toUpperCase()} ${url}` +
    ` (total: ${requestCount}, this endpoint: ${requestLog[url]}, freq: ${freq})`
  );

  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry && !original.url?.includes('/auth/login')) {
      original._retry = true;
      try {
        const { data } = await axios.post(`${API_BASE}/auth/refresh`, {}, { withCredentials: true });
        localStorage.setItem('accessToken', data.accessToken);
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(original);
      } catch {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export { API_BASE };
export default api;
