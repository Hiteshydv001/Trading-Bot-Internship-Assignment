from pydantic import BaseModel
from typing import List, Dict, Optional

class BalanceAsset(BaseModel):
    asset: str
    walletBalance: float
    crossWalletBalance: float
    crossUnPnl: float # Unrealized profit/loss

class PositionInfo(BaseModel):
    symbol: str
    positionAmt: float
    entryPrice: float
    markPrice: float
    unRealizedProfit: float
    liquidationPrice: float
    leverage: int
    positionSide: str
    
    @classmethod
    def from_binance_response(cls, data: dict):
        return cls(
            symbol=data['symbol'],
            positionAmt=float(data['positionAmt']),
            entryPrice=float(data['entryPrice']),
            markPrice=float(data['markPrice']),
            unRealizedProfit=float(data['unRealizedProfit']),
            liquidationPrice=float(data.get('liquidationPrice', 0)),
            leverage=int(data.get('leverage', 1)),
            positionSide=data.get('positionSide', 'BOTH')
        )

class AccountInfo(BaseModel):
    totalInitialMargin: float
    totalMaintMargin: float
    totalWalletBalance: float
    totalUnrealizedProfit: float
    totalMarginBalance: float
    assets: List[BalanceAsset] # Simplified, Binance returns more fields

    @classmethod
    def from_binance_response(cls, data: dict):
        # Convert string numbers to floats
        for key in ['totalInitialMargin', 'totalMaintMargin', 'totalWalletBalance',
                    'totalUnrealizedProfit', 'totalMarginBalance']:
            data[key] = float(data[key])
        
        # Convert assets
        data['assets'] = [
            BalanceAsset(
                asset=asset['asset'],
                walletBalance=float(asset['walletBalance']),
                crossWalletBalance=float(asset['crossWalletBalance']),
                crossUnPnl=float(asset['crossUnPnl'])
            ) for asset in data.get('assets', [])
        ]
        return cls(**data)