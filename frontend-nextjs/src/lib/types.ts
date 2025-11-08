// Market Data Types
export interface MarkPrice {
  symbol: string;
  price: number;
}

export interface Kline {
  open_time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  close_time: number;
  quote_asset_volume: number;
  number_of_trades: number;
  taker_buy_base_asset_volume: number;
  taker_buy_quote_asset_volume: number;
  ignore: number;
}

export interface OrderBookEntry {
  price: string;
  quantity: string;
}

export interface OrderBook {
  lastUpdateId: number;
  bids: OrderBookEntry[];
  asks: OrderBookEntry[];
}

// Account Types
export interface Balance {
  asset: string;
  walletBalance: number;
  crossWalletBalance: number;
  crossUnPnl: number;
}

export interface AccountInfo {
  totalInitialMargin: number;
  totalMaintMargin: number;
  totalWalletBalance: number;
  totalUnrealizedProfit: number;
  totalMarginBalance: number;
  assets: Balance[];
}

export interface Position {
  symbol: string;
  positionSide: string;
  positionAmt: number;
  entryPrice: number;
  markPrice: number;
  unRealizedProfit: number;
  liquidationPrice: number;
  leverage: number;
}

// Order Types
export type OrderType = 'MARKET' | 'LIMIT' | 'STOP' | 'STOP_MARKET' | 'STOP_LIMIT' | 'TAKE_PROFIT' | 'TAKE_PROFIT_MARKET' | 'TWAP' | 'GRID' | 'OCO';
export type OrderSide = 'BUY' | 'SELL';
export type OrderStatus = 'NEW' | 'PARTIALLY_FILLED' | 'FILLED' | 'CANCELED' | 'REJECTED' | 'EXPIRED';
export type TimeInForce = 'GTC' | 'IOC' | 'FOK';

export interface OrderRequest {
  symbol: string;
  side: OrderSide;
  type: OrderType;
  quantity: string;
  price?: string;
  stopPrice?: string;
  timeInForce?: TimeInForce;
  
  // TWAP parameters
  twap_duration_minutes?: number;
  twap_interval_seconds?: number;
  
  // Grid parameters
  grid_lower_price?: number;
  grid_upper_price?: number;
  grid_levels?: number;
  
  // OCO parameters
  oco_stop_price?: number;
  oco_stop_limit_price?: number;
  oco_limit_price?: number;
}

export interface Order {
  orderId: string;
  symbol: string;
  status: OrderStatus;
  clientOrderId: string;
  price: string;
  avgPrice: string;
  origQty: string;
  executedQty: string;
  cumQuote: string;
  timeInForce: TimeInForce;
  type: OrderType;
  side: OrderSide;
  stopPrice: string;
  time: number;
  updateTime: number;
}

// Strategy Types
export interface StrategyRequest {
  name: string;
  symbol: string;
  short_ema_period: number;
  long_ema_period: number;
  quantity_per_trade: number;
}

export interface Strategy {
  name: string;
  symbol: string;
  active: boolean;
  message?: string;
  last_action?: string;
  last_update?: number;
}

// System Status Types
export interface SystemStatus {
  status: string;
  timestamp: number;
  uptime: number;
  cpu_usage: number;
  memory_usage: number;
  active_connections: number;
  active_strategies: number;
}

// WebSocket Message Types
export interface WSMessage {
  type: string;
  data: unknown;
}

export interface PlaceOrderResponse {
  order_type: string;
  [key: string]: unknown;
}

export interface StopStrategyResponse {
  message: string;
  positionClosed: boolean;
  positionSize?: string | null;
  closeDetails?: unknown;
  notes?: string;
}

export interface PriceUpdate {
  symbol: string;
  price: string;
  timestamp: number;
}
