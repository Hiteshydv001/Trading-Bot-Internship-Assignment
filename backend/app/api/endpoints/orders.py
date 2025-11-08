from fastapi import APIRouter, HTTPException, BackgroundTasks
from typing import List, Optional
from app.schemas.order import OrderRequest, OrderResponse
from app.services.trading_logic import trading_logic
from app.services.binance_client import binance_client_wrapper
from app.services.advanced_orders import advanced_order_manager
from binance.exceptions import BinanceAPIException
import uuid

router = APIRouter()

@router.post("/", response_model=dict)
async def place_new_order(order_request: OrderRequest, background_tasks: BackgroundTasks):
    """
    Place a new trading order on Binance Futures Testnet.
    Supports: MARKET, LIMIT, STOP_MARKET, STOP_LIMIT, TWAP, GRID, OCO
    """
    try:
        order_type = order_request.type.upper()
        
        # Handle standard order types
        if order_type in ['MARKET', 'LIMIT', 'STOP_MARKET']:
            order_data = await trading_logic.place_order(
                symbol=order_request.symbol.upper(),
                side=order_request.side.upper(),
                order_type=order_type,
                quantity=order_request.quantity,
                price=order_request.price,
                stop_price=order_request.stop_price
            )
            return {'order_type': order_type, 'order': order_data}
        
        # Handle STOP_LIMIT orders
        elif order_type == 'STOP_LIMIT':
            if not order_request.price or not order_request.stop_price:
                raise HTTPException(status_code=400, detail="STOP_LIMIT requires both price and stop_price")
            
            result = await advanced_order_manager.place_stop_limit_order(
                symbol=order_request.symbol.upper(),
                side=order_request.side.upper(),
                quantity=order_request.quantity,
                price=order_request.price,
                stop_price=order_request.stop_price
            )
            return result
        
        # Handle OCO orders
        elif order_type == 'OCO':
            if not order_request.oco_limit_price or not order_request.oco_stop_price:
                raise HTTPException(status_code=400, detail="OCO requires oco_limit_price and oco_stop_price")
            
            result = await advanced_order_manager.place_oco_order(
                symbol=order_request.symbol.upper(),
                side=order_request.side.upper(),
                quantity=order_request.quantity,
                limit_price=order_request.oco_limit_price,
                stop_price=order_request.oco_stop_price,
                stop_limit_price=order_request.oco_stop_limit_price or order_request.oco_stop_price
            )
            return result
        
        # Handle TWAP orders (execute in background)
        elif order_type == 'TWAP':
            if not order_request.twap_duration_minutes or not order_request.twap_interval_seconds:
                raise HTTPException(status_code=400, detail="TWAP requires twap_duration_minutes and twap_interval_seconds")
            
            order_id = str(uuid.uuid4())
            
            # Execute TWAP in background
            background_tasks.add_task(
                advanced_order_manager.execute_twap_order,
                order_id,
                order_request.symbol.upper(),
                order_request.side.upper(),
                order_request.quantity,
                order_request.twap_duration_minutes,
                order_request.twap_interval_seconds
            )
            
            return {
                'order_type': 'TWAP',
                'order_id': order_id,
                'status': 'started',
                'message': f'TWAP order started. Will execute {order_request.quantity} over {order_request.twap_duration_minutes} minutes',
                'duration_minutes': order_request.twap_duration_minutes,
                'interval_seconds': order_request.twap_interval_seconds
            }
        
        # Handle Grid Trading orders
        elif order_type == 'GRID':
            if not order_request.grid_lower_price or not order_request.grid_upper_price or not order_request.grid_levels:
                raise HTTPException(status_code=400, detail="GRID requires grid_lower_price, grid_upper_price, and grid_levels")
            
            order_id = str(uuid.uuid4())
            
            # Execute Grid in background
            background_tasks.add_task(
                advanced_order_manager.execute_grid_trading,
                order_id,
                order_request.symbol.upper(),
                order_request.side.upper(),
                order_request.quantity,
                order_request.grid_lower_price,
                order_request.grid_upper_price,
                order_request.grid_levels
            )
            
            return {
                'order_type': 'GRID',
                'order_id': order_id,
                'status': 'started',
                'message': f'Grid trading started with {order_request.grid_levels} levels',
                'lower_price': order_request.grid_lower_price,
                'upper_price': order_request.grid_upper_price,
                'grid_levels': order_request.grid_levels
            }
        
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported order type: {order_type}")
            
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except BinanceAPIException as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {e}")

@router.get("/open", response_model=List[OrderResponse])
async def get_open_orders(symbol: Optional[str] = None):
    """
    Get all currently open orders for a specific symbol or all symbols.
    """
    try:
        orders_data = await binance_client_wrapper.get_open_orders(symbol=symbol.upper() if symbol else None)
        return [OrderResponse(**order) for order in orders_data]
    except BinanceAPIException as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {e}")

@router.delete("/{symbol}/{order_id}", response_model=dict)
async def cancel_single_order(symbol: str, order_id: int):
    """
    Cancel a single open order by orderId.
    """
    try:
        response = await binance_client_wrapper.cancel_order(symbol.upper(), order_id)
        return {"message": "Order cancelled successfully", "details": response}
    except BinanceAPIException as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {e}")

@router.get("/twap/{order_id}", response_model=dict)
async def get_twap_order_status(order_id: str):
    """
    Get the status of a TWAP order.
    """
    status = advanced_order_manager.get_twap_status(order_id)
    if not status:
        raise HTTPException(status_code=404, detail=f"TWAP order {order_id} not found")
    return status

@router.delete("/twap/{order_id}", response_model=dict)
async def cancel_twap_order(order_id: str):
    """
    Cancel an active TWAP order.
    """
    if advanced_order_manager.cancel_twap_order(order_id):
        return {"message": f"TWAP order {order_id} cancelled"}
    raise HTTPException(status_code=404, detail=f"TWAP order {order_id} not found or not active")

@router.get("/grid/{order_id}", response_model=dict)
async def get_grid_order_status(order_id: str):
    """
    Get the status of a Grid trading order.
    """
    status = advanced_order_manager.get_grid_status(order_id)
    if not status:
        raise HTTPException(status_code=404, detail=f"Grid order {order_id} not found")
    return status

# Add more order endpoints as needed (e.g., /history, /cancel_all)