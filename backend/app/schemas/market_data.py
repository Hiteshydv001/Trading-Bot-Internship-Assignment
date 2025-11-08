from pydantic import BaseModel, Field
from typing import List, Optional

class TickerPrice(BaseModel):
    symbol: str
    price: float = Field(..., description="Current mark price of the symbol")

class Kline(BaseModel):
    open_time: int
    open: float
    high: float
    low: float
    close: float
    volume: float
    close_time: int
    quote_asset_volume: float
    number_of_trades: int
    taker_buy_base_asset_volume: float
    taker_buy_quote_asset_volume: float
    ignore: float # Typically 0, ignore field

    @classmethod
    def from_binance_kline(cls, kline_data: List):
        return cls(
            open_time=kline_data[0],
            open=float(kline_data[1]),
            high=float(kline_data[2]),
            low=float(kline_data[3]),
            close=float(kline_data[4]),
            volume=float(kline_data[5]),
            close_time=kline_data[6],
            quote_asset_volume=float(kline_data[7]),
            number_of_trades=kline_data[8],
            taker_buy_base_asset_volume=float(kline_data[9]),
            taker_buy_quote_asset_volume=float(kline_data[10]),
            ignore=float(kline_data[11])
        )