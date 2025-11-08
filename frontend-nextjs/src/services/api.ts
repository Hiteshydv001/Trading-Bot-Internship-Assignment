import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios';

const apiClient: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    console.log('API Request:', config.method?.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    console.log('API Response:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error('Response error:', error.response?.status, error.message);
    return Promise.reject(error);
  }
);

// Market Data API
export const marketDataAPI = {
  getMarkPrice: (symbol: string) => apiClient.get(`/market/price/${symbol}`),
  getKlines: (symbol: string, interval: string, limit?: number) =>
    apiClient.get(`/market/klines/${symbol}`, { params: { interval, limit } }),
  getOrderBook: (symbol: string, limit?: number) =>
    apiClient.get(`/market/order-book/${symbol}`, { params: { limit } }),
};

// Account API
export const accountAPI = {
  getBalance: () => apiClient.get('/account/balances'),
  getAccountInfo: () => apiClient.get('/account/'),
  getPositions: (symbol?: string) => apiClient.get('/account/positions', { params: { symbol } }),
};

// Orders API
export const ordersAPI = {
  placeOrder: (orderData: any) => apiClient.post('/orders/', orderData),
  cancelOrder: (symbol: string, orderId: string) =>
    apiClient.delete(`/orders/${symbol}/${orderId}`),
  getOpenOrders: (symbol?: string) =>
    apiClient.get('/orders/open', { params: { symbol } }),
  getOrderHistory: (symbol?: string) =>
    apiClient.get('/orders/', { params: { symbol } }),
};

// Strategies API
export const strategiesAPI = {
  startStrategy: (strategyData: any) => apiClient.post('/strategies/', strategyData),
  stopStrategy: (strategyId: string) => apiClient.post(`/strategies/${strategyId}/stop`),
  getActiveStrategies: () => apiClient.get('/strategies/'),
};

// Status API
export const statusAPI = {
  getSystemStatus: () => apiClient.get('/status'),
};

export default apiClient;
