from fastapi import APIRouter, HTTPException
from typing import List
from app.schemas.market_data import TickerPrice, Kline
from app.services.binance_client import binance_client_wrapper
from binance.exceptions import BinanceAPIException

router = APIRouter()

@router.get("/price/{symbol}", response_model=TickerPrice)
async def get_current_mark_price(symbol: str):
    """
    Get the current mark price for a given trading symbol.
    """
    try:
        data = await binance_client_wrapper.get_mark_price(symbol.upper())
        return TickerPrice(symbol=data['symbol'], price=float(data['markPrice']))
    except BinanceAPIException as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {e}")

@router.get("/klines/{symbol}", response_model=List[Kline])
async def get_klines_data(symbol: str, interval: str = "1h", limit: int = 100):
    """
    Get historical kline (candlestick) data for a given symbol and interval.
    """
    try:
        data = await binance_client_wrapper.get_klines(symbol.upper(), interval, limit)
        return [Kline.from_binance_kline(kline) for kline in data]
    except BinanceAPIException as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {e}")

# Add more market data endpoints as needed (e.g., /ticker/24hr, /depth)