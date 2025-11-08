import logging
import asyncio
from typing import Dict, List
from app.services.binance_client import binance_client_wrapper
from binance.exceptions import BinanceAPIException

logger = logging.getLogger(__name__)

# Store active TWAP and Grid orders
active_twap_orders: Dict[str, dict] = {}
active_grid_orders: Dict[str, dict] = {}

class AdvancedOrderManager:
    """
    Manages advanced order types: TWAP, Grid Trading, Stop-Limit, and OCO orders.
    """
    
    def __init__(self):
        self.client = binance_client_wrapper
        logger.info("AdvancedOrderManager initialized.")
    
    async def place_stop_limit_order(self, symbol: str, side: str, quantity: float, price: float, stop_price: float):
        """
        Place a STOP_LIMIT order.
        When market price reaches stop_price, a limit order is placed at price.
        """
        try:
            params = {
                'symbol': symbol,
                'side': side,
                'type': 'STOP',
                'quantity': quantity,
                'price': str(price),
                'stopPrice': str(stop_price),
                'timeInForce': 'GTC'
            }
            
            result = await self.client._execute_api_call(
                self.client.client.futures_create_order,
                **params
            )
            
            logger.info(f"STOP_LIMIT order placed: {result}")
            return {
                'order_type': 'STOP_LIMIT',
                'order': result,
                'message': f'Stop-Limit order placed. Will trigger at {stop_price} and execute at {price}'
            }
        except BinanceAPIException as e:
            logger.error(f"Failed to place STOP_LIMIT order: {e.message}")
            raise
    
    async def place_oco_order(self, symbol: str, side: str, quantity: float, 
                             limit_price: float, stop_price: float, stop_limit_price: float):
        """
        Place an OCO (One-Cancels-Other) order.
        Simulated for Futures by placing two orders and tracking them.
        """
        try:
            result = await self.client.place_oco_order(
                symbol, side, quantity, limit_price, stop_price, stop_limit_price
            )
            logger.info(f"OCO order placed (simulated): {result}")
            return result
        except BinanceAPIException as e:
            logger.error(f"Failed to place OCO order: {e.message}")
            raise
    
    async def execute_twap_order(self, order_id: str, symbol: str, side: str, total_quantity: float, 
                                 duration_minutes: int, interval_seconds: int):
        """
        Execute a TWAP (Time-Weighted Average Price) order.
        Splits the order into smaller chunks over time.
        """
        try:
            # Calculate number of slices
            total_seconds = duration_minutes * 60
            num_slices = max(1, total_seconds // interval_seconds)
            quantity_per_slice = total_quantity / num_slices
            
            logger.info(f"Starting TWAP order {order_id}: {num_slices} slices of {quantity_per_slice} {symbol}")
            
            active_twap_orders[order_id] = {
                'symbol': symbol,
                'side': side,
                'total_quantity': total_quantity,
                'executed_quantity': 0,
                'num_slices': num_slices,
                'current_slice': 0,
                'status': 'active',
                'orders': []
            }
            
            for i in range(num_slices):
                if active_twap_orders[order_id]['status'] != 'active':
                    logger.info(f"TWAP order {order_id} cancelled at slice {i}/{num_slices}")
                    break
                
                try:
                    # Place market order for this slice
                    order = await self.client.place_order(
                        symbol=symbol,
                        side=side,
                        order_type='MARKET',
                        quantity=quantity_per_slice
                    )
                    
                    active_twap_orders[order_id]['orders'].append(order)
                    active_twap_orders[order_id]['executed_quantity'] += quantity_per_slice
                    active_twap_orders[order_id]['current_slice'] = i + 1
                    
                    logger.info(f"TWAP order {order_id}: Executed slice {i+1}/{num_slices}")
                    
                    # Wait before next slice (unless it's the last one)
                    if i < num_slices - 1:
                        await asyncio.sleep(interval_seconds)
                        
                except BinanceAPIException as e:
                    logger.error(f"TWAP order {order_id} slice {i} failed: {e.message}")
                    active_twap_orders[order_id]['status'] = 'error'
                    raise
            
            active_twap_orders[order_id]['status'] = 'completed'
            logger.info(f"TWAP order {order_id} completed successfully")
            
            return {
                'order_type': 'TWAP',
                'order_id': order_id,
                'status': 'completed',
                'total_quantity': total_quantity,
                'executed_quantity': active_twap_orders[order_id]['executed_quantity'],
                'num_slices': num_slices,
                'orders': active_twap_orders[order_id]['orders']
            }
            
        except Exception as e:
            logger.error(f"TWAP order {order_id} error: {e}")
            if order_id in active_twap_orders:
                active_twap_orders[order_id]['status'] = 'error'
            raise
    
    async def execute_grid_trading(self, order_id: str, symbol: str, side: str, quantity: float,
                                   lower_price: float, upper_price: float, grid_levels: int):
        """
        Execute Grid Trading strategy.
        Places multiple limit orders at evenly spaced price levels.
        """
        try:
            # Calculate grid spacing
            price_range = upper_price - lower_price
            price_step = price_range / (grid_levels - 1) if grid_levels > 1 else 0
            quantity_per_level = quantity / grid_levels
            
            logger.info(f"Starting Grid Trading {order_id}: {grid_levels} levels from {lower_price} to {upper_price}")
            
            active_grid_orders[order_id] = {
                'symbol': symbol,
                'side': side,
                'quantity': quantity,
                'lower_price': lower_price,
                'upper_price': upper_price,
                'grid_levels': grid_levels,
                'status': 'active',
                'orders': []
            }
            
            orders = []
            
            for i in range(grid_levels):
                # Calculate price for this grid level
                if grid_levels == 1:
                    grid_price = lower_price
                else:
                    grid_price = lower_price + (i * price_step)
                
                try:
                    # Place limit order at this grid level
                    order = await self.client.place_order(
                        symbol=symbol,
                        side=side,
                        order_type='LIMIT',
                        quantity=quantity_per_level,
                        price=grid_price
                    )
                    
                    orders.append({
                        'level': i + 1,
                        'price': grid_price,
                        'order': order
                    })
                    
                    active_grid_orders[order_id]['orders'].append(order)
                    
                    logger.info(f"Grid order {order_id}: Placed level {i+1}/{grid_levels} at {grid_price}")
                    
                except BinanceAPIException as e:
                    logger.error(f"Grid order {order_id} level {i} failed: {e.message}")
                    # Continue with other levels even if one fails
                    continue
            
            active_grid_orders[order_id]['status'] = 'completed'
            
            return {
                'order_type': 'GRID',
                'order_id': order_id,
                'status': 'completed',
                'grid_levels': grid_levels,
                'lower_price': lower_price,
                'upper_price': upper_price,
                'orders_placed': len(orders),
                'orders': orders,
                'message': f'Grid trading setup complete with {len(orders)} orders'
            }
            
        except Exception as e:
            logger.error(f"Grid trading order {order_id} error: {e}")
            if order_id in active_grid_orders:
                active_grid_orders[order_id]['status'] = 'error'
            raise
    
    def cancel_twap_order(self, order_id: str) -> bool:
        """Cancel an active TWAP order."""
        if order_id in active_twap_orders and active_twap_orders[order_id]['status'] == 'active':
            active_twap_orders[order_id]['status'] = 'cancelled'
            logger.info(f"TWAP order {order_id} marked for cancellation")
            return True
        return False
    
    def get_twap_status(self, order_id: str) -> dict:
        """Get status of a TWAP order."""
        return active_twap_orders.get(order_id, {})
    
    def get_grid_status(self, order_id: str) -> dict:
        """Get status of a Grid trading order."""
        return active_grid_orders.get(order_id, {})

# Global instance
advanced_order_manager = AdvancedOrderManager()
