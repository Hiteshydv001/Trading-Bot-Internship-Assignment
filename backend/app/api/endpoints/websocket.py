from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import Dict, List
import asyncio
import json
import websockets
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

# Store active WebSocket connections to broadcast messages
active_connections: List[WebSocket] = []

# Binance Futures Testnet WebSocket base URL
BINANCE_FUTURES_WS_URL = "wss://fstream.binancefuture.com/ws"

async def broadcast_message(message: str):
    """Broadcasts a message to all connected WebSocket clients."""
    for connection in active_connections:
        try:
            await connection.send_text(message)
        except WebSocketDisconnect:
            active_connections.remove(connection)
        except Exception as e:
            logger.error(f"Error broadcasting to WebSocket client: {e}")
            active_connections.remove(connection)

async def _listen_to_binance_websocket(symbol: str):
    """
    Connects to a Binance WebSocket stream and broadcasts updates to clients.
    This function should ideally run as a separate background task.
    """
    stream_url = f"{BINANCE_FUTURES_WS_URL}/{symbol.lower()}@markPrice" # Example: mark price stream
    
    while True:
        try:
            async with websockets.connect(stream_url) as ws:
                logger.info(f"Connected to Binance WebSocket stream: {stream_url}")
                while True:
                    data = await ws.recv()
                    # logger.debug(f"Received from Binance WS: {data}") # Too verbose, use debug
                    await broadcast_message(data)
        except websockets.exceptions.ConnectionClosedOK:
            logger.info(f"Binance WebSocket connection closed normally for {symbol}. Reconnecting...")
        except websockets.exceptions.ConnectionClosedError as e:
            logger.error(f"Binance WebSocket connection closed with error for {symbol}: {e}. Reconnecting in 5s...")
            await asyncio.sleep(5)
        except Exception as e:
            logger.error(f"Unexpected error in Binance WebSocket listener for {symbol}: {e}. Reconnecting in 10s...", exc_info=True)
            await asyncio.sleep(10)

# Global dictionary to hold running Binance WebSocket listener tasks
binance_ws_listeners: Dict[str, asyncio.Task] = {}

@router.websocket("/market_data/{symbol}")
async def websocket_endpoint(websocket: WebSocket, symbol: str):
    """
    FastAPI WebSocket endpoint for clients to subscribe to real-time market data.
    """
    await websocket.accept()
    active_connections.append(websocket)
    logger.info(f"New WebSocket connection established for symbol: {symbol}")

    # Start Binance listener if not already running for this symbol
    if symbol not in binance_ws_listeners or binance_ws_listeners[symbol].done():
        logger.info(f"Starting Binance WebSocket listener for {symbol}...")
        task = asyncio.create_task(_listen_to_binance_websocket(symbol))
        binance_ws_listeners[symbol] = task

    try:
        while True:
            # Keep the connection alive, potentially handle messages from client
            # (e.g., to change subscription, but for this example, it's just a push stream)
            await websocket.receive_text() # This will block until client sends something
    except WebSocketDisconnect:
        active_connections.remove(websocket)
        logger.info(f"WebSocket client disconnected for symbol: {symbol}")
    except Exception as e:
        logger.error(f"WebSocket connection error for symbol {symbol}: {e}", exc_info=True)
        try:
            active_connections.remove(websocket)
        except ValueError:
            pass # Already removed or not in list
    finally:
        # Check if no more clients are listening to this symbol, then stop Binance listener
        # This is a simplification; a more robust solution would track subscriptions per symbol.
        if not any(conn for conn in active_connections): # if no connections at all
             for s, task in binance_ws_listeners.items():
                 task.cancel()
                 logger.info(f"Cancelled Binance WS listener for {s} due to no active frontend connections.")
             binance_ws_listeners.clear()