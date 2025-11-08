from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
import os

from app.api.endpoints import market_data, orders, account, strategies, websocket, status
from app.core.config import settings

# Initialize FastAPI app
app = FastAPI(
    title="Binance Futures Testnet Bot API",
    description="Backend API for managing and monitoring a Binance Futures Testnet trading bot.",
    version="1.0.0",
)

# --- CORS Middleware ---
# Allows frontend (e.g., running on localhost:3000) to communicate with this backend.
# Configure comma-separated origins via CORS_ALLOWED_ORIGINS environment variable.
origins = settings.cors_origins or [
    "http://localhost",
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Include API Routers ---
app.include_router(market_data.router, prefix="/api/v1/market", tags=["Market Data"])
app.include_router(orders.router, prefix="/api/v1/orders", tags=["Orders"])
app.include_router(account.router, prefix="/api/v1/account", tags=["Account"])
app.include_router(strategies.router, prefix="/api/v1/strategies", tags=["Strategies"])
app.include_router(status.router, prefix="/api/v1/status", tags=["Status"])
app.include_router(websocket.router, prefix="/ws", tags=["WebSockets"]) # No prefix for WS generally, or make it /ws/v1

# --- Serve Frontend Static Files (Optional, for single deployment) ---
# If you build your frontend and want FastAPI to serve it, uncomment and configure this.
# This assumes your frontend build output is in a 'static' directory relative to 'main.py'
# For local development, you'll run frontend and backend separately.
# app.mount("/static", StaticFiles(directory=os.path.join(os.path.dirname(__file__), "static")), name="static")

# @app.get("/", response_class=HTMLResponse)
# async def read_root():
#     # This assumes an index.html is built into the 'static' folder
#     with open(os.path.join(os.path.dirname(__file__), "static", "index.html")) as f:
#         return f.read()

@app.get("/api/v1/health")
async def health_check():
    """
    Basic health check endpoint.
    """
    return {"status": "ok", "message": "Bot API is running!"}