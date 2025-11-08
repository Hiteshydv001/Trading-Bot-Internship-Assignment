# Trading Bot - Next.js Frontend

A modern, real-time cryptocurrency trading bot dashboard built with Next.js 14, React 18, TypeScript, and Tailwind CSS.

## 🚀 Features

- **Real-time Market Data**: Live price updates via WebSocket connection
- **Order Management**: Place MARKET, LIMIT, and STOP_MARKET orders
- **Account Dashboard**: View balances, positions, and P&L in real-time
- **Trading Strategies**: Configure and run automated trading strategies (Grid, DCA, Momentum)
- **Interactive Charts**: Real-time candlestick charts with lightweight-charts
- **Responsive Design**: Mobile-friendly interface with Tailwind CSS
- **TypeScript**: Full type safety throughout the application

## 📋 Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- Backend API running on `http://localhost:8000` (FastAPI)
- Binance Futures Testnet API credentials

## 🛠️ Installation

1. Navigate to the frontend-nextjs directory:
```bash
cd frontend-nextjs
```

2. Install dependencies:
```bash
npm install
# or
yarn install
# or
pnpm install
```

3. Create a `.env` file (copy from `.env.example`):
```bash
cp .env.example .env
```

4. Update the `.env` file with your configuration:
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_WS_URL=ws://localhost:8000/ws
```

## 🚀 Running the Application

### Development Mode

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

The application will start on [http://localhost:3000](http://localhost:3000)

### Production Build

```bash
# Build the application
npm run build

# Start the production server
npm start
```

## 📁 Project Structure

```
frontend-nextjs/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── layout.tsx         # Root layout
│   │   ├── page.tsx           # Dashboard page
│   │   ├── error.tsx          # Error boundary
│   │   └── globals.css        # Global styles
│   ├── components/            # React components
│   │   ├── AppHeader.tsx      # Header with connection status
│   │   ├── MarketWatch.tsx    # Market data display
│   │   ├── OrderPlacement.tsx # Order entry form
│   │   ├── AccountSummary.tsx # Account balances & positions
│   │   ├── StrategyControls.tsx # Strategy management
│   │   └── RealtimeChart.tsx  # Candlestick chart
│   ├── services/              # API and WebSocket clients
│   │   ├── api.ts            # REST API client (Axios)
│   │   └── websocket.ts      # WebSocket client
│   ├── store/                 # Zustand state management
│   │   ├── marketData.ts     # Market data store
│   │   ├── account.ts        # Account store
│   │   └── trading.ts        # Trading store
│   └── lib/
│       └── types.ts          # TypeScript type definitions
├── public/                    # Static assets
├── package.json
├── tsconfig.json             # TypeScript configuration
├── tailwind.config.js        # Tailwind CSS configuration
├── next.config.js            # Next.js configuration
└── README.md
```

## 🔧 Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript 5
- **UI Library**: React 18
- **Styling**: Tailwind CSS 3
- **State Management**: Zustand 4
- **HTTP Client**: Axios 1.5
- **Charts**: lightweight-charts 4.1
- **WebSocket**: Native WebSocket API

## 📊 Available Components

### AppHeader
- Displays connection status, current symbol, price, and account balance
- Symbol selector dropdown for switching trading pairs

### MarketWatch
- Shows mark price, index price, funding rate, and next funding time
- Real-time updates via WebSocket

### OrderPlacement
- Order entry form supporting multiple order types:
  - MARKET: Instant execution at current price
  - LIMIT: Execute at specific price
  - STOP_MARKET: Trigger at stop price
- Side selection (BUY/SELL)
- Time-in-force options for LIMIT orders (GTC, IOC, FOK)

### AccountSummary
- Displays account balances for all assets
- Shows open positions with P&L
- Real-time balance and position updates

### StrategyControls
- Configure and start trading strategies
- View active strategies with status
- Stop running strategies
- Supported strategies:
  - Grid Trading: Buy/sell at intervals
  - DCA (Dollar Cost Averaging): Regular time-based purchases
  - Momentum Trading: Follow market trends

### RealtimeChart
- Interactive candlestick chart using lightweight-charts
- Real-time price updates
- Zoom and pan functionality
- Responsive design

## 🔌 API Integration

The frontend connects to the FastAPI backend via:

### REST API Endpoints
- `GET /market/mark-price/{symbol}` - Get current mark price
- `GET /market/klines/{symbol}` - Get candlestick data
- `POST /orders/place` - Place an order
- `DELETE /orders/cancel/{symbol}/{orderId}` - Cancel an order
- `GET /account/balance` - Get account balance
- `GET /account/positions` - Get open positions
- `POST /strategies/start` - Start a trading strategy
- `POST /strategies/stop/{strategyId}` - Stop a strategy

### WebSocket
- Real-time price updates
- Market data streaming
- Auto-reconnect on connection loss

## 🎨 Styling

The application uses Tailwind CSS with custom color scheme:
- Primary: `#667eea` (Purple)
- Secondary: `#764ba2` (Dark Purple)
- Success: `#10b981` (Green) - For buy orders and positive P&L
- Danger: `#ef4444` (Red) - For sell orders and negative P&L
- Warning: `#f59e0b` (Amber)

## 🔒 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_BASE_URL` | Backend API base URL | `http://localhost:8000/api/v1` |
| `NEXT_PUBLIC_WS_URL` | WebSocket URL | `ws://localhost:8000/ws` |

**Note**: All environment variables used in browser code must be prefixed with `NEXT_PUBLIC_`.

## 🚨 Common Issues

### TypeScript Errors Before Installation
The TypeScript errors you see in the IDE are normal before running `npm install`. They will be resolved once dependencies are installed.

### WebSocket Connection Failed
- Ensure the backend server is running on the correct port
- Check the `NEXT_PUBLIC_WS_URL` in your `.env` file
- Verify CORS settings in the backend allow connections from `http://localhost:3000`

### API Request Errors
- Confirm backend is running on `http://localhost:8000`
- Check network tab in browser DevTools for error details
- Verify Binance API credentials are configured in backend

## 📝 Development Notes

### State Management with Zustand
The application uses Zustand for lightweight state management:
- `marketData`: Current symbol, prices, klines, WebSocket connection
- `account`: Balances, positions, P&L
- `trading`: Orders, strategies

### Client-Side Rendering
All components use the `'use client'` directive as they require:
- Browser APIs (WebSocket, localStorage)
- React hooks (useState, useEffect)
- Interactive event handlers

### SSR Considerations
While Next.js supports Server-Side Rendering (SSR), this trading dashboard is primarily client-rendered due to:
- Real-time WebSocket connections
- Browser-specific APIs
- Dynamic, user-specific data

For production deployment with SSR, consider:
- Moving API calls to Server Components where possible
- Using Next.js API routes as a proxy to backend
- Implementing proper loading states

## 📚 Further Documentation

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Zustand](https://github.com/pmndrs/zustand)
- [lightweight-charts](https://tradingview.github.io/lightweight-charts/)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is part of a trading bot system. See the main repository for license information.
