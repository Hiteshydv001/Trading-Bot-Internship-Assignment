import logging
from typing import Union
from binance.client import Client
from binance.exceptions import BinanceAPIException, BinanceOrderException
from app.core.config import settings

logger = logging.getLogger(__name__)

class BinanceClientWrapper:
    """
    A wrapper around the python-binance client to centralize API interaction,
    logging, and error handling for the testnet environment.
    """
    def __init__(self):
        self.client = Client(
            settings.BINANCE_API_KEY,
            settings.BINANCE_API_SECRET,
            testnet=True
        )
        logger.info(f"BinanceClientWrapper initialized for Testnet: {settings.BINANCE_FUTURES_TESTNET_URL}")
        self._symbol_info_cache = {}

    async def _execute_api_call(self, api_method, *args, **kwargs):
        """
        Helper to execute any Binance API call with centralized error handling and logging.
        """
        method_name = api_method.__name__
        logger.debug(f"Calling Binance API: {method_name} with args={args}, kwargs={kwargs}")
        try:
            # Binance client methods are synchronous, so we run them in a thread pool
            # to avoid blocking the FastAPI event loop.
            # In a real async application, you'd use a truly async Binance client if available.
            # For now, FastAPI's default executor is fine for small calls.
            result = await self.client.loop.run_in_executor(None, lambda: api_method(*args, **kwargs))
            logger.debug(f"Binance API Response ({method_name}): {result}")
            return result
        except BinanceAPIException as e:
            logger.error(f"Binance API Error ({method_name}): Status={e.status_code}, Message={e.message}, Code={e.code}")
            raise
        except BinanceOrderException as e:
            logger.error(f"Binance Order Error ({method_name}): Status={e.status_code}, Message={e.message}, Code={e.code}")
            raise
        except Exception as e:
            logger.error(f"An unexpected error occurred during Binance API call ({method_name}): {e}", exc_info=True)
            raise

    # --- Market Data Endpoints ---
    async def get_mark_price(self, symbol: str):
        return await self._execute_api_call(self.client.futures_mark_price, symbol=symbol)

    async def get_klines(self, symbol: str, interval: str, limit: int = 500):
        return await self._execute_api_call(self.client.futures_klines, symbol=symbol, interval=interval, limit=limit)

    # --- Account Endpoints ---
    async def get_account_info(self):
        return await self._execute_api_call(self.client.futures_account)

    async def get_position_info(self, symbol: str = None):
        """Get position information for symbol or all positions"""
        if symbol:
            return await self._execute_api_call(self.client.futures_position_information, symbol=symbol)
        else:
            return await self._execute_api_call(self.client.futures_position_information)

    async def get_positions(self, symbol: str = None):
        """Alias to get_position_info for compatibility with existing callers."""
        positions = await self.get_position_info(symbol)

        # Binance returns a list even when filtered; ensure consistent list output
        if positions is None:
            return []

        if isinstance(positions, list):
            if symbol:
                return [p for p in positions if p.get('symbol') == symbol] or positions
            return positions

        # In case a single dict is returned, wrap it for downstream consumers expecting iterables
        return [positions]

    async def get_open_orders(self, symbol: str = None):
        return await self._execute_api_call(self.client.futures_get_open_orders, symbol=symbol)

    async def get_all_orders(self, symbol: str, limit: int = 500):
        return await self._execute_api_call(self.client.futures_all_orders, symbol=symbol, limit=limit)

    async def get_symbol_info(self, symbol: str):
        if symbol in self._symbol_info_cache:
            return self._symbol_info_cache[symbol]

        exchange_info = await self._execute_api_call(self.client.futures_exchange_info)
        for sym_info in exchange_info.get('symbols', []):
            if sym_info.get('symbol') == symbol:
                self._symbol_info_cache[symbol] = sym_info
                return sym_info
        logger.warning(f"Symbol info not found for {symbol} in exchange info response.")
        return None

    # --- Trading Endpoints ---
    async def place_order(self, symbol: str, side: str, order_type: str, quantity: Union[float, str], price: float = None, stop_price: float = None, reduce_only: bool = False):
        params = {
            'symbol': symbol,
            'side': side,
            'type': order_type,
            'quantity': quantity
        }
        if price:
            params['price'] = price
            params['timeInForce'] = 'GTC' # Good Till Cancel is standard for limit
        if stop_price:
            params['stopPrice'] = stop_price

        # Specific handling for order types if needed
        if order_type == 'MARKET':
            if 'price' in params:
                del params['price']  # Market orders don't take price
            if 'timeInForce' in params:
                del params['timeInForce']
        
        if order_type == 'STOP_MARKET' and not stop_price:
            raise ValueError("stopPrice is required for STOP_MARKET orders.")
        if order_type == 'LIMIT' and not price:
            raise ValueError("price is required for LIMIT orders.")

        if reduce_only:
            params['reduceOnly'] = True

        return await self._execute_api_call(self.client.futures_create_order, **params)

    async def cancel_order(self, symbol: str, order_id: int):
        return await self._execute_api_call(self.client.futures_cancel_order, symbol=symbol, orderId=order_id)

    async def place_oco_order(self, symbol: str, side: str, quantity: float, price: float, stop_price: float, stop_limit_price: float):
        """
        Place an OCO (One-Cancels-Other) order.
        Note: Binance Futures doesn't have native OCO, so we simulate it by placing both orders
        and manually canceling when one fills.
        """
        params = {
            'symbol': symbol,
            'side': side,
            'quantity': quantity,
            'price': str(price),
            'stopPrice': str(stop_price),
            'stopLimitPrice': str(stop_limit_price),
            'stopLimitTimeInForce': 'GTC'
        }
        # Note: Binance Spot has OCO, but Futures doesn't. We'll need to manage this manually.
        # For now, we'll place two separate orders and track them
        logger.warning("OCO orders are simulated for Futures. Placing separate orders.")
        
        # Place limit order (take profit)
        limit_order = await self.place_order(symbol, side, 'LIMIT', quantity, price=price)
        
        # Place stop limit order (stop loss)
        opposite_side = 'SELL' if side == 'BUY' else 'BUY'
        stop_order = await self.place_order(symbol, opposite_side, 'STOP_MARKET', quantity, stop_price=stop_price)
        
        return {
            'oco_type': 'SIMULATED',
            'limit_order': limit_order,
            'stop_order': stop_order,
            'message': 'OCO simulated with two separate orders. Manual management required.'
        }

    # --- WebSocket Stream (for listening to data, not placing orders) ---
    def start_futures_mark_price_ws(self, symbol: str, callback):
        """Starts a WebSocket stream for mark price updates."""
        # This part is illustrative. The actual WebSocket client logic usually lives in main.py
        # or a dedicated websocket handler in endpoints.
        # python-binance's websockets are blocking, so they need to run in a separate thread/process.
        # For FastAPI, you'd typically have a WebSocket endpoint (see websocket.py)
        # that handles incoming client connections and pushes data from Binance streams.
        # For simplicity, we won't implement the full client.start_symbol_mark_price_ws here
        # directly, but rather use the raw websocket endpoint in FastAPI.
        logger.warning("BinanceClientWrapper.start_futures_mark_price_ws is illustrative; "
                       "actual WS stream handling is done via FastAPI's /ws endpoint.")

# Initialize the client wrapper globally or via dependency injection
binance_client_wrapper = BinanceClientWrapper()