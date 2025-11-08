# Trading Bot Fullstack

A full-stack cryptocurrency trading bot dashboard that pairs a FastAPI backend with a Next.js 14 frontend. The system connects to the Binance Futures Testnet to stream market data, manage automated strategies, and let operators supervise accounts through a real-time web UI.

## Architecture

- **Frontend (`frontend-nextjs/`)**: Next.js (App Router) + React 18 + TypeScript. Uses Zustand for client state, Axios for REST calls, and lightweight-charts for visualizations. Communicates with the backend through REST and a WebSocket channel.
- **Backend (`backend/`)**: FastAPI application orchestrating Binance Futures Testnet interactions, order execution, strategy life cycle, and a broadcast WebSocket. Includes reduce-only safety logic, advanced order types (TWAP, Grid, OCO, Stop-Limit), and automatic position flattening when strategies stop.
- **Data Flow**: Frontend polls the REST API for balances, positions, and configuration, while subscribing to backend WebSocket streams for live ticker updates. Orders and strategy commands travel via authenticated REST requests, and backend relays fills/status back over REST/WebSocket endpoints.
- **Deployment Targets**: Frontend is Vercel-ready; backend ships with a Dockerfile for container-first deployment on platforms such as Render, Fly.io, or any host that can reach Binance Futures Testnet (note: Binance blocks traffic from some regions).

## Key Features

- Real-time candlestick charting with live WebSocket mark price feed.
- Unified dashboard for balances, positions, open orders, and P&L.
- Manual order ticket supporting market, limit, stop-market, stop-limit, OCO, grid, and TWAP orders with Binance precision guards and $20 notional validation.
- Configurable EMA crossover strategy runner with background tasks, status polling, and reduce-only flattening on stop.
- Hardened REST layer with typed payloads, centralized Binance client wrapper, and structured error responses for the frontend.
- Dockerized backend, shared environment templates, and lint/type-safe frontend build (no `any` usage).

## Tech Stack

| Layer     | Technologies |
|-----------|--------------|
| Frontend  | Next.js 14, React 18, TypeScript 5, Tailwind CSS, Zustand, Axios, lightweight-charts |
| Backend   | FastAPI, Uvicorn, python-binance, Pydantic, asyncio |
| Tooling   | Docker, npm, Python 3.11, WebSockets |

## Prerequisites

- Node.js 18+ and npm (or Yarn/PNPM) for the frontend.
- Python 3.11 for the backend (venv recommended).
- Binance Futures Testnet API key/secret.
- (Optional) Docker Desktop for containerized backend deployment.

## Quick Start

### 1. Clone and prepare

```bash
cd trading_bot_fullstack
```

### 2. Backend setup (`backend/`)

```bash
cd backend
python -m venv .venv
. .venv/Scripts/activate  # Windows PowerShell: .venv\Scripts\Activate.ps1
pip install --upgrade pip
pip install -r requirements.txt
copy .env.example .env
```

Fill `.env` with your Binance Testnet credentials and adjust `CORS_ALLOWED_ORIGINS` to match the frontend origin. Then run:

```bash
uvicorn app.main:app --reload
```

The API becomes available at `http://localhost:8000`, with docs at `http://localhost:8000/docs`.

### 3. Frontend setup (`frontend-nextjs/`)

```bash
cd ../frontend-nextjs
npm install
copy .env.example .env
```

Update `.env` with the backend URLs, for example:

```
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_WS_URL=ws://localhost:8000/ws
```

Start the dashboard:

```bash
npm run dev
```

Visit `http://localhost:3000` to access the app.

## Running with Docker (Backend)

A ready-to-use Dockerfile lives in `backend/Dockerfile`.

```bash
cd backend
docker build -t trading-bot-backend .
docker run -p 8000:8000 --env-file .env trading-bot-backend
```

Ensure the host/IP where the container runs is permitted by Binance Futures Testnet; some hosted regions (e.g., specific Render data centers) are blocked.

## Environment Variables

### Backend (`backend/.env`)

| Variable | Purpose |
|----------|---------|
| `BINANCE_API_KEY` | Binance Futures Testnet API key |
| `BINANCE_API_SECRET` | Binance Futures Testnet API secret |
| `BINANCE_FUTURES_TESTNET_URL` | Base URL for the testnet API (defaults to `https://testnet.binancefuture.com`) |
| `CORS_ALLOWED_ORIGINS` | Comma-separated origins allowed to call the API |

### Frontend (`frontend-nextjs/.env`)

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_API_BASE_URL` | REST base URL (must include `/api/v1`) |
| `NEXT_PUBLIC_WS_URL` | WebSocket endpoint exposed by the backend |

## API Overview (selected endpoints)

All endpoints are namespaced under `/api/v1`.

- `GET /market/price/{symbol}` – Current mark price.
- `GET /market/klines/{symbol}` – Historical klines (interval configurable).
- `POST /orders/` – Place market/limit/stop-limit/OCO/grid/TWAP orders.
- `GET /orders/open` – List open orders (optionally filtered by symbol).
- `DELETE /orders/{symbol}/{orderId}` – Cancel an order.
- `GET /orders/twap/{id}` & `DELETE /orders/twap/{id}` – Manage TWAP jobs.
- `GET /account/balance` – Account balances.
- `GET /account/positions` – Open futures positions.
- `POST /strategies/start` – Launch EMA strategy with config payload.
- `POST /strategies/stop/{name}` – Stop strategy and auto-flatten the position.
- `GET /strategies/status` – Retrieve all strategy statuses.
- `GET /status/health` – Service health check.
- `GET /ws` – WebSocket channel broadcasting mark price updates.

Interactive documentation: `http://localhost:8000/docs` (Swagger) and `http://localhost:8000/redoc`.

## Frontend Commands

- `npm run dev` – Start development server.
- `npm run build` – Production build (runs TypeScript and lint checks).
- `npm run lint` – ESLint with strict TypeScript settings.

## Backend Commands

- `uvicorn app.main:app --reload` – Local development server.
- `pytest` – (If tests are added) run backend tests.

## Deployment Notes

1. **Frontend (Vercel)**
   - Set environment variables in Vercel project settings (`NEXT_PUBLIC_API_BASE_URL`, `NEXT_PUBLIC_WS_URL`).
   - Provide a custom backend hostname reachable over HTTPS/WSS.

2. **Backend (Render / alternative)**
   - Use the Docker deploy option or Render Blueprint. Set env vars in the dashboard.
   - If Binance rejects outbound traffic from the platform’s region, relocate the service (e.g., Fly.io, Railway, or VPS in allowed geography).

3. **Secrets hygiene**
   - Rotate any keys committed to version control immediately.
   - Use platform secret stores rather than committing `.env` files.

## Troubleshooting

- **WebSocket fails to connect**: Verify backend is reachable, CORS/WebSocket origins include the frontend host, and URLs use the correct ws/wss scheme.
- **Order placement errors**: Binance enforces min notional and step size limits. The backend normalizes quantity but still surfaces validation errors when inputs violate exchange rules.
- **Strategy stop leaves positions open**: Confirm backend logs; reduce-only flattening requires the Binance position call to succeed. Check API key permissions.
- **Deployment blocked by Binance**: Switch to a region/provider not geo-blocked by Binance Futures Testnet.

## Project Structure

```
trading_bot_fullstack/
├── backend/             # FastAPI service
│   ├── app/
│   │   ├── api/         # REST & WebSocket routers
│   │   ├── services/    # Binance wrapper, trading logic, schedulers
│   │   ├── schemas/     # Pydantic models
│   │   └── core/        # Settings, logging, middleware
│   ├── Dockerfile
│   └── requirements.txt
├── frontend-nextjs/     # Next.js dashboard
│   ├── src/app/         # App Router entrypoint
│   ├── src/components/  # UI components
│   ├── src/services/    # REST/WebSocket helpers
│   └── src/store/       # Zustand slices
└── README.md            # (This file)
```

## Next Steps

- Add automated tests (unit + integration) covering trading logic and store behaviors.
- Extend strategy engine with persistent storage and analytics.
- Harden deployment with HTTPS termination, logging, and monitoring.

---

For questions or support, open an issue or reach out to the maintainer. Securely manage your Binance credentials and avoid committing them to the repository.
