from fastapi import APIRouter, HTTPException
from typing import List, Dict
from app.schemas.account import AccountInfo, BalanceAsset, PositionInfo
from app.services.binance_client import binance_client_wrapper
from binance.exceptions import BinanceAPIException

router = APIRouter()

@router.get("/", response_model=AccountInfo)
async def get_futures_account_info():
    """
    Get current Binance Futures Testnet account information and balances.
    """
    try:
        data = await binance_client_wrapper.get_account_info()
        return AccountInfo.from_binance_response(data)
    except BinanceAPIException as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {e}")

@router.get("/balances", response_model=List[BalanceAsset])
async def get_futures_balances():
    """
    Get current Binance Futures Testnet balances for all assets.
    """
    try:
        data = await binance_client_wrapper.get_account_info()
        # Filter out assets with zero balance for cleaner response if desired
        return [BalanceAsset(
            asset=asset['asset'],
            walletBalance=float(asset['walletBalance']),
            crossWalletBalance=float(asset['crossWalletBalance']),
            crossUnPnl=float(asset['crossUnPnl'])
        ) for asset in data['assets'] if float(asset['walletBalance']) > 0 or float(asset['crossUnPnl']) != 0]
    except BinanceAPIException as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {e}")

@router.get("/positions", response_model=List[PositionInfo])
async def get_futures_positions(symbol: str = None):
    """
    Get current Binance Futures positions for all symbols or a specific symbol.
    Only returns positions with non-zero position amount.
    """
    try:
        if symbol:
            data = await binance_client_wrapper.get_position_info(symbol)
        else:
            data = await binance_client_wrapper.get_position_info()
        
        # Filter to only show positions with non-zero amount
        positions = [PositionInfo.from_binance_response(pos) for pos in data 
                     if float(pos.get('positionAmt', 0)) != 0]
        return positions
    except BinanceAPIException as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Internal server error: {e}")