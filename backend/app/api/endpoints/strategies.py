from fastapi import APIRouter, HTTPException, BackgroundTasks
from typing import List, Dict, Optional
from app.schemas.strategy import StrategyConfig, StrategyStatus
from app.services.trading_logic import trading_logic, active_strategies, strategy_statuses
import asyncio

router = APIRouter()

@router.post("/", response_model=StrategyStatus)
async def create_and_start_strategy(config: StrategyConfig):
    """
    Create and start a new trading strategy.
    Note: For this "No Auth" setup, strategies are managed in-memory.
    """
    if config.name in active_strategies:
        raise HTTPException(status_code=400, detail=f"Strategy '{config.name}' already exists.")
    
    # Simple validation for the example EMA strategy
    if config.short_ema_period is None or config.long_ema_period is None or config.quantity_per_trade is None:
        raise HTTPException(status_code=400, detail="EMA strategy requires short_ema_period, long_ema_period, and quantity_per_trade.")

    trading_logic.start_strategy(config)
    
    # Return initial status
    return strategy_statuses.get(config.name, StrategyStatus(name=config.name, symbol=config.symbol, active=True, message="Started"))

@router.post("/{name}/stop", response_model=dict)
async def stop_running_strategy(name: str):
    """
    Stop an active trading strategy and auto-close any open positions.
    """
    result = await trading_logic.stop_strategy(name)
    if result:
        return result
    raise HTTPException(status_code=404, detail=f"Strategy '{name}' not found or not running.")

@router.get("/", response_model=List[StrategyStatus])
async def get_all_strategy_statuses():
    """
    Get the status of all active and inactive strategies.
    """
    return list(trading_logic.get_all_strategy_statuses().values())

@router.get("/{name}", response_model=StrategyStatus)
async def get_strategy_status(name: str):
    """
    Get the status of a specific strategy.
    """
    status = trading_logic.get_strategy_status(name)
    if status:
        return status
    raise HTTPException(status_code=404, detail=f"Strategy '{name}' not found.")