from pydantic import BaseModel, Field
from typing import Optional

class OrderRequest(BaseModel):
    symbol: str = Field(..., example="BTCUSDT")
    side: str = Field(..., example="BUY", pattern="^(BUY|SELL)$")
    quantity: float = Field(..., gt=0, example=0.001)
    type: str = Field(..., example="MARKET", pattern="^(MARKET|LIMIT|STOP_MARKET|STOP_LIMIT|TWAP|GRID|OCO)$")
    price: Optional[float] = Field(None, gt=0, example=30000.0) # Required for LIMIT, STOP_LIMIT
    stop_price: Optional[float] = Field(None, gt=0, example=29500.0) # Required for STOP_MARKET, STOP_LIMIT
    
    # TWAP specific parameters
    twap_duration_minutes: Optional[int] = Field(None, gt=0, example=60, description="Duration to execute TWAP order in minutes")
    twap_interval_seconds: Optional[int] = Field(None, gt=0, example=60, description="Interval between TWAP slices in seconds")
    
    # Grid Trading specific parameters
    grid_lower_price: Optional[float] = Field(None, gt=0, example=95000.0, description="Lower bound for grid")
    grid_upper_price: Optional[float] = Field(None, gt=0, example=105000.0, description="Upper bound for grid")
    grid_levels: Optional[int] = Field(None, gt=1, example=10, description="Number of grid levels")
    
    # OCO specific parameters
    oco_stop_price: Optional[float] = Field(None, gt=0, example=95000.0, description="Stop price for OCO order")
    oco_stop_limit_price: Optional[float] = Field(None, gt=0, example=94900.0, description="Stop limit price for OCO")
    oco_limit_price: Optional[float] = Field(None, gt=0, example=105000.0, description="Take profit limit price for OCO")

class OrderResponse(BaseModel):
    orderId: int
    symbol: str
    status: str
    clientOrderId: str
    price: str
    avgPrice: str
    origQty: str
    executedQty: str
    cumQty: str
    cumQuote: str
    timeInForce: str
    type: str
    reduceOnly: bool
    closePosition: bool
    side: str
    positionSide: str
    stopPrice: str
    workingType: str
    priceProtect: bool
    origType: str
    updateTime: int
    # Add other fields as needed based on Binance's response