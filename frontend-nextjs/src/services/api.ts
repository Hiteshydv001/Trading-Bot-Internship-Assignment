import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import {
  MarkPrice,
  Kline,
  Balance,
  AccountInfo,
  Position,
  OrderRequest,
  StrategyRequest,
  Strategy,
  PlaceOrderResponse,
  StopStrategyResponse,
  SystemStatus,
  Order,
} from '../lib/types';

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
  getMarkPrice: (symbol: string) => apiClient.get<MarkPrice>(`/market/price/${symbol}`),
  getKlines: (symbol: string, interval: string, limit?: number) =>
    apiClient.get<Kline[]>(`/market/klines/${symbol}`, { params: { interval, limit } }),
  getOrderBook: (symbol: string, limit?: number) =>
    apiClient.get(`/market/order-book/${symbol}`, { params: { limit } }),
};

// Account API
export const accountAPI = {
  getBalance: () => apiClient.get<Balance[]>('/account/balances'),
  getAccountInfo: () => apiClient.get<AccountInfo>('/account/'),
  getPositions: (symbol?: string) =>
    apiClient.get<Position[]>('/account/positions', { params: { symbol } }),
};

// Orders API
export const ordersAPI = {
  placeOrder: (orderData: OrderRequest) =>
    apiClient.post<PlaceOrderResponse>('/orders/', orderData),
  cancelOrder: (symbol: string, orderId: string) =>
    apiClient.delete(`/orders/${symbol}/${orderId}`),
  getOpenOrders: (symbol?: string) =>
    apiClient.get<Order[]>('/orders/open', { params: { symbol } }),
  getOrderHistory: (symbol?: string) =>
    apiClient.get<Order[]>('/orders/', { params: { symbol } }),
};

// Strategies API
export const strategiesAPI = {
  startStrategy: (strategyData: StrategyRequest) =>
    apiClient.post<Strategy>('/strategies/', strategyData),
  stopStrategy: (strategyId: string) =>
    apiClient.post<StopStrategyResponse>(`/strategies/${strategyId}/stop`),
  getActiveStrategies: () => apiClient.get<Strategy[]>('/strategies/'),
};

// Status API
export const statusAPI = {
  getSystemStatus: () => apiClient.get<SystemStatus>('/status'),
};

export default apiClient;
