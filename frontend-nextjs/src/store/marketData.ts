import { create } from 'zustand';
import axios from 'axios';
import { marketDataAPI } from '@/services/api';
import WebSocketClient from '@/services/websocket';
import { MarkPrice, Kline, PriceUpdate } from '../lib/types';

interface MarketDataState {
  currentSymbol: string;
  markPrice: MarkPrice | null;
  klines: Kline[];
  lastPrice: string;
  priceChange: number;
  wsConnected: boolean;
  loading: boolean;
  error: string | null;
  ws: WebSocketClient | null;
  
  // Actions
  setCurrentSymbol: (symbol: string) => void;
  fetchMarkPrice: (symbol: string) => Promise<void>;
  fetchKlines: (symbol: string, interval: string, limit?: number) => Promise<void>;
  connectWebSocket: (url: string) => void;
  disconnectWebSocket: () => void;
  updatePrice: (data: PriceUpdate) => void;
}

export const useMarketDataStore = create<MarketDataState>((set, get) => ({
  currentSymbol: 'BTCUSDT',
  markPrice: null,
  klines: [],
  lastPrice: '0',
  priceChange: 0,
  wsConnected: false,
  loading: false,
  error: null,
  ws: null,

  setCurrentSymbol: (symbol: string) => {
    set({ currentSymbol: symbol, markPrice: null, lastPrice: '0', priceChange: 0, loading: true });
    get().fetchMarkPrice(symbol);
    get().fetchKlines(symbol, '1h', 100);
  },

  fetchMarkPrice: async (symbol: string) => {
    set({ loading: true, error: null });
    try {
      const response = await marketDataAPI.getMarkPrice(symbol);
      const markPrice = response.data;
      const lastPrice = markPrice.price;
      const oldPrice = parseFloat(get().lastPrice);
      const priceChange = oldPrice > 0 ? ((lastPrice - oldPrice) / oldPrice) * 100 : 0;
      
      set({ 
        markPrice,
        lastPrice: lastPrice.toString(),
        priceChange,
        loading: false 
      });
    } catch (error: unknown) {
      console.error('Error fetching mark price:', error);
      const message = axios.isAxiosError(error)
        ? error.response?.data?.detail ?? error.message
        : error instanceof Error
        ? error.message
        : 'Failed to fetch mark price';
      set({ error: message, loading: false });
    }
  },

  fetchKlines: async (symbol: string, interval: string, limit: number = 100) => {
    set({ loading: true, error: null });
    try {
      const response = await marketDataAPI.getKlines(symbol, interval, limit);
      set({ klines: response.data, loading: false });
    } catch (error: unknown) {
      console.error('Error fetching klines:', error);
      const message = axios.isAxiosError(error)
        ? error.response?.data?.detail ?? error.message
        : error instanceof Error
        ? error.message
        : 'Failed to fetch klines';
      set({ error: message, loading: false });
    }
  },

  connectWebSocket: (url: string) => {
    const ws = new WebSocketClient(url);

    const isMarkPriceMessage = (value: unknown): value is { e: string; s: string; p: string } =>
      typeof value === 'object' &&
      value !== null &&
      'e' in value &&
      's' in value &&
      'p' in value &&
      typeof (value as { e: unknown }).e === 'string' &&
      typeof (value as { s: unknown }).s === 'string' &&
      typeof (value as { p: unknown }).p === 'string';
    
    ws.on('connected', () => {
      set({ wsConnected: true });
    });

    ws.on('disconnected', () => {
      set({ wsConnected: false });
    });

    ws.on('message', (data: unknown) => {
      // Handle Binance mark price updates
      // Binance markPrice stream sends: { e: "markPriceUpdate", s: "BTCUSDT", p: "50000.00", ... }
      if (isMarkPriceMessage(data) && data.e === 'markPriceUpdate') {
        if (data.s !== get().currentSymbol) {
          return;
        }
        const newPrice = parseFloat(data.p);
        const oldPrice = parseFloat(get().lastPrice);
        const priceChange = oldPrice > 0 ? ((newPrice - oldPrice) / oldPrice) * 100 : 0;
        
        set({
          markPrice: {
            symbol: data.s,
            price: newPrice,
          },
          lastPrice: data.p,
          priceChange
        });
      }
    });

    ws.connect();
    set({ ws });
  },

  disconnectWebSocket: () => {
    const { ws } = get();
    if (ws) {
      ws.disconnect();
      set({ ws: null, wsConnected: false });
    }
  },

  updatePrice: (data: PriceUpdate) => {
    if (data.symbol === get().currentSymbol) {
      const newPrice = parseFloat(data.price);
      const oldPrice = parseFloat(get().lastPrice);
      const priceChange = oldPrice > 0 ? ((newPrice - oldPrice) / oldPrice) * 100 : 0;
      
      set({ 
        lastPrice: data.price,
        priceChange 
      });
    }
  },
}));
