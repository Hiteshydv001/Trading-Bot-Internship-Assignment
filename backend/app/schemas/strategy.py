from pydantic import BaseModel, Field
from typing import Optional

class StrategyConfig(BaseModel):
    name: str = Field(..., example="My Simple EMA Crossover")
    symbol: str = Field(..., example="BTCUSDT")
    active: bool = Field(False, description="Whether the strategy is currently active")
    # Add more fields specific to your strategy
    short_ema_period: Optional[int] = Field(None, gt=0, example=9)
    long_ema_period: Optional[int] = Field(None, gt=0, example=20)
    quantity_per_trade: Optional[float] = Field(None, gt=0, example=0.001)

class StrategyStatus(BaseModel):
    name: str
    symbol: str
    active: bool
    last_action: Optional[str] = None
    last_update: Optional[float] = None
    message: Optional[str] = None