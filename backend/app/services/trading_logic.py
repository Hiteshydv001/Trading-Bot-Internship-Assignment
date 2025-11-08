import logging
from decimal import Decimal, InvalidOperation, ROUND_DOWN
from typing import Optional, Union
from app.services.binance_client import binance_client_wrapper
from app.schemas.strategy import StrategyConfig, StrategyStatus
from binance.exceptions import BinanceAPIException
import asyncio
import time

logger = logging.getLogger(__name__)

# In a "No Auth" scenario, strategies might be hardcoded, loaded from a config file,
# or managed via simple API endpoints that modify a global in-memory state.
# For simplicity, we'll manage a global dictionary of active strategies.
active_strategies: dict[str, StrategyConfig] = {}
strategy_statuses: dict[str, StrategyStatus] = {}

class TradingLogic:
    """
    Manages the core trading logic, including executing orders and running simple strategies.
    """
    def __init__(self):
        self.client = binance_client_wrapper
        logger.info("TradingLogic initialized.")
        self._strategy_tasks = {} # To hold asyncio tasks for running strategies
        self._symbol_precision_cache: dict[str, dict[str, str]] = {}

    async def place_order(self, symbol: str, side: str, order_type: str, quantity: Union[float, str], price: float = None, stop_price: float = None, reduce_only: bool = False):
        """Places an order using the Binance client wrapper."""
        try:
            normalized_quantity = await self._normalize_quantity(symbol, quantity)
            order_response = await self.client.place_order(symbol, side, order_type, normalized_quantity, price, stop_price, reduce_only)
            logger.info(f"Order placed: {order_response}")
            return order_response
        except BinanceAPIException as e:
            logger.error(f"Failed to place order: {e.message}")
            raise
        except ValueError as e:
            logger.error(f"Invalid order parameters: {e}")
            raise

    async def get_current_price(self, symbol: str) -> float:
        """Fetches the current mark price for a symbol."""
        try:
            ticker = await self.client.get_mark_price(symbol)
            return float(ticker['markPrice'])
        except BinanceAPIException as e:
            logger.error(f"Failed to get price for {symbol}: {e.message}")
            raise

    async def _get_symbol_info(self, symbol: str):
        if symbol in self._symbol_precision_cache:
            return self._symbol_precision_cache[symbol]

        try:
            info = await self.client.get_symbol_info(symbol)
        except Exception as e:
            logger.warning(f"Unable to fetch symbol info for {symbol}: {e}")
            self._symbol_precision_cache[symbol] = {}
            return {}

        if info:
            self._symbol_precision_cache[symbol] = info
        else:
            self._symbol_precision_cache[symbol] = {}
        return self._symbol_precision_cache[symbol]

    async def _normalize_quantity(self, symbol: str, quantity: Union[float, str]) -> Union[str, float]:
        if quantity is None:
            raise ValueError("Quantity is required for order placement.")

        try:
            quantity_decimal = Decimal(str(quantity))
        except (InvalidOperation, TypeError):
            raise ValueError(f"Invalid quantity value: {quantity}")

        default_precision = max(0, -quantity_decimal.normalize().as_tuple().exponent)
        fallback_str = f"{quantity_decimal:.{default_precision}f}" if default_precision > 0 else f"{quantity_decimal:.0f}"

        symbol_info = await self._get_symbol_info(symbol)
        filters = symbol_info.get('filters', []) if isinstance(symbol_info, dict) else []
        lot_filter = next((f for f in filters if f.get('filterType') == 'LOT_SIZE'), None)

        if not lot_filter:
            # Fall back to original quantity when filters unavailable
            return fallback_str

        step_size_val = lot_filter.get('stepSize') or '1'
        min_qty_val = lot_filter.get('minQty') or '0'

        try:
            step_size = Decimal(step_size_val)
            min_qty = Decimal(min_qty_val)
        except (InvalidOperation, TypeError):
            logger.warning(f"Invalid lot size filters for {symbol}: stepSize={step_size_val}, minQty={min_qty_val}")
            return fallback_str

        if step_size == 0:
            logger.warning(f"Received zero step size for {symbol}; using raw quantity.")
            return fallback_str

        normalized = quantity_decimal.quantize(step_size, rounding=ROUND_DOWN)

        if normalized == 0:
            raise ValueError(f"Quantity {quantity_decimal} rounds down to zero with step size {step_size_val}.")

        if normalized < min_qty:
            raise ValueError(f"Quantity {normalized} is below Binance minimum {min_qty_val} for {symbol}.")

        precision = max(0, -step_size.normalize().as_tuple().exponent)
        normalized_str = f"{normalized:.{precision}f}" if precision > 0 else f"{normalized:.0f}"

        return normalized_str

    # --- Simple Strategy Management ---
    async def _run_simple_ema_crossover_strategy(self, config: StrategyConfig):
        """
        A placeholder for a simple EMA crossover strategy.
        This would run in a separate asyncio task or a background worker.
        """
        strategy_name = config.name
        strategy_statuses[strategy_name] = StrategyStatus(name=strategy_name, symbol=config.symbol, active=True, message="Initializing...")
        
        logger.info(f"Starting strategy '{strategy_name}' for {config.symbol}...")
        logger.info(f"Strategy config - Short EMA: {config.short_ema_period}, Long EMA: {config.long_ema_period}, Quantity: {config.quantity_per_trade}")
        
        # Placeholder for strategy logic
        # In a real scenario, this loop would fetch klines, calculate EMAs,
        # and place orders based on crossover signals.
        
        iteration = 0
        while strategy_name in active_strategies and active_strategies[strategy_name].active:
            iteration += 1
            logger.info(f"Strategy '{strategy_name}' - Iteration {iteration}")
            try:
                # Fetch recent klines
                klines = await self.client.get_klines(config.symbol, interval='1m', limit=max(config.short_ema_period, config.long_ema_period) + 5)
                
                if len(klines) < max(config.short_ema_period, config.long_ema_period):
                    strategy_statuses[strategy_name].message = "Not enough data for EMA calculation. Waiting..."
                    await asyncio.sleep(10) # Wait for more data
                    continue

                # --- Simplified EMA Calculation (Placeholder) ---
                # In a real scenario, you'd use a TA-lib library for this.
                closes = [float(k[4]) for k in klines] # Close prices
                
                # Simple moving average as placeholder for EMA
                short_sma = sum(closes[-config.short_ema_period:]) / config.short_ema_period if len(closes) >= config.short_ema_period else None
                long_sma = sum(closes[-config.long_ema_period:]) / config.long_ema_period if len(closes) >= config.long_ema_period else None

                if short_sma is None or long_sma is None:
                    strategy_statuses[strategy_name].message = "Not enough data for SMA calculation."
                    await asyncio.sleep(10)
                    continue

                current_price = await self.get_current_price(config.symbol)
                
                strategy_statuses[strategy_name].message = f"Short SMA: {short_sma:.2f}, Long SMA: {long_sma:.2f}, Price: {current_price:.2f}"
                
                # --- Basic Trading Logic (Placeholder) ---
                # Example: If short_ema crosses above long_ema, BUY
                # If long_ema crosses above short_ema, SELL
                # This is highly simplified and needs robust implementation.

                # This is just a conceptual framework. A real strategy needs
                # to track positions, avoid overtrading, manage risk, etc.

                # Get current position to avoid overtrading
                try:
                    positions = await self.client.get_positions(config.symbol)
                    position_amt = float(positions[0].get('positionAmt', 0)) if positions else 0
                except Exception as e:
                    logger.warning(f"Could not fetch position: {e}")
                    position_amt = 0

                # Execute trades based on signals
                if short_sma > long_sma and position_amt <= 0:
                    # BUY signal - only if we don't have a long position
                    try:
                        logger.info(f"Strategy '{strategy_name}': BUY signal! (Short SMA > Long SMA)")
                        order = await self.place_order(config.symbol, "BUY", "MARKET", config.quantity_per_trade)
                        strategy_statuses[strategy_name].last_action = f"BUY Order Placed: {order.get('orderId', 'N/A')}"
                        logger.info(f"Strategy '{strategy_name}': BUY order executed - {order}")
                    except Exception as e:
                        logger.error(f"Strategy '{strategy_name}': Failed to place BUY order - {e}")
                        strategy_statuses[strategy_name].last_action = f"BUY Signal (Order Failed: {e})"
                        
                elif long_sma > short_sma and position_amt >= 0:
                    # SELL signal - only if we don't have a short position
                    try:
                        logger.info(f"Strategy '{strategy_name}': SELL signal! (Long SMA > Short SMA)")
                        order = await self.place_order(config.symbol, "SELL", "MARKET", config.quantity_per_trade)
                        strategy_statuses[strategy_name].last_action = f"SELL Order Placed: {order.get('orderId', 'N/A')}"
                        logger.info(f"Strategy '{strategy_name}': SELL order executed - {order}")
                    except Exception as e:
                        logger.error(f"Strategy '{strategy_name}': Failed to place SELL order - {e}")
                        strategy_statuses[strategy_name].last_action = f"SELL Signal (Order Failed: {e})"
                else:
                    strategy_statuses[strategy_name].last_action = "Holding (No signal or already in position)"

                strategy_statuses[strategy_name].last_update = time.time()
                
            except Exception as e:
                logger.error(f"Error in strategy '{strategy_name}': {e}", exc_info=True)
                strategy_statuses[strategy_name].message = f"Error: {e}"
                
            await asyncio.sleep(30) # Check every 30 seconds

        strategy_statuses[strategy_name].message = "Strategy stopped."
        strategy_statuses[strategy_name].active = False
        logger.info(f"Strategy '{strategy_name}' has stopped.")


    async def _flatten_symbol_position(self, symbol: str):
        """Attempts to close any open futures position for the symbol."""
        if not symbol:
            logger.warning("No symbol provided for position flatten request.")
            return {"closed": False, "message": "No symbol provided for flatten request.", "position_size": None}

        try:
            positions = await self.client.get_positions(symbol)
        except Exception as e:
            logger.error(f"Failed to fetch positions for {symbol}: {e}")
            return {"closed": False, "message": f"Failed to fetch positions for {symbol}: {e}", "position_size": None}

        if not positions:
            return {"closed": False, "message": f"No position data returned for {symbol}.", "position_size": None}

        for position in positions:
            if position.get('symbol') != symbol:
                continue

            raw_amt = position.get('positionAmt', '0')
            try:
                position_amt = Decimal(raw_amt)
            except (InvalidOperation, TypeError):
                logger.warning(f"Unable to parse position amount '{raw_amt}' for {symbol}.")
                continue

            if position_amt == 0:
                continue

            side = 'SELL' if position_amt > 0 else 'BUY'
            quantity_decimal = abs(position_amt)
            quantity = float(quantity_decimal)

            try:
                order = await self.place_order(symbol, side, 'MARKET', quantity, reduce_only=True)
            except BinanceAPIException as e:
                logger.error(f"Failed to close position for {symbol}: {e.message}")
                return {
                    "closed": False,
                    "message": f"Failed to close position for {symbol}: {e.message}",
                    "position_size": format(position_amt, 'f'),
                    "details": {"code": e.code, "message": e.message},
                    "last_action": f"Auto-close failed ({side})"
                }
            except Exception as e:
                logger.error(f"Unexpected error while closing position for {symbol}: {e}", exc_info=True)
                return {
                    "closed": False,
                    "message": f"Unexpected error while closing position for {symbol}: {e}",
                    "position_size": format(position_amt, 'f'),
                    "last_action": "Auto-close failed"
                }

            logger.info(f"Closed {symbol} position via reduce-only {side} order: {order}")
            return {
                "closed": True,
                "message": f"Closed {symbol} position via reduce-only {side} order.",
                "position_size": format(position_amt, 'f'),
                "details": order,
                "last_action": f"Auto-close {side} {format(quantity_decimal, 'f')}"
            }

        return {"closed": False, "message": f"No open position found for {symbol}.", "position_size": None}


    def start_strategy(self, config: StrategyConfig):
        """Starts a trading strategy in a background asyncio task."""
        if config.name in self._strategy_tasks and not self._strategy_tasks[config.name].done():
            logger.warning(f"Strategy '{config.name}' is already running.")
            return False
        
        config.active = True
        active_strategies[config.name] = config
        
        # Create an asyncio task for the strategy
        loop = asyncio.get_event_loop()
        task = loop.create_task(self._run_simple_ema_crossover_strategy(config))
        self._strategy_tasks[config.name] = task
        logger.info(f"Started strategy '{config.name}'.")
        return True

    async def stop_strategy(self, name: str):
        """Stops a running trading strategy and attempts to flatten open positions."""
        if name not in active_strategies:
            logger.warning(f"Strategy '{name}' not found or not running.")
            return None

        config = active_strategies[name]
        symbol = getattr(config, 'symbol', None)

        # Signal the loop to stop
        active_strategies[name].active = False

        status = strategy_statuses.get(name)
        if status:
            status.active = False
            status.message = "Strategy stopped by user. Attempting to close open position..."

        task = self._strategy_tasks.get(name)
        if task:
            task.cancel()
            try:
                await task
            except asyncio.CancelledError:
                logger.debug(f"Strategy task for '{name}' cancelled.")
            except Exception as e:
                logger.warning(f"Unexpected error while awaiting strategy task '{name}': {e}")
            finally:
                del self._strategy_tasks[name]

        # Remove strategy from active registry after task cancellation
        del active_strategies[name]

        flatten_result = await self._flatten_symbol_position(symbol)

        if status:
            status.message = flatten_result.get("message", "Strategy stopped by user.")
            last_action = flatten_result.get("last_action")
            if last_action:
                status.last_action = last_action

        logger.info(f"Stopped strategy '{name}'. Flatten result: {flatten_result}")

        return {
            "message": f"Strategy '{name}' stopped.",
            "positionClosed": flatten_result.get("closed", False),
            "positionSize": flatten_result.get("position_size"),
            "closeDetails": flatten_result.get("details"),
            "notes": flatten_result.get("message")
        }
    
    def get_strategy_status(self, name: str) -> Optional[StrategyStatus]:
        return strategy_statuses.get(name)

    def get_all_strategy_statuses(self) -> dict[str, StrategyStatus]:
        return strategy_statuses

trading_logic = TradingLogic()