from fastapi import APIRouter
import time
import os
import psutil # You might need to pip install psutil

router = APIRouter()

@router.get("/")
async def get_bot_status():
    """
    Returns general status information about the bot backend.
    """
    process = psutil.Process(os.getpid())
    return {
        "status": "running",
        "timestamp": time.time(),
        "uptime_seconds": time.time() - process.create_time(),
        "cpu_percent": process.cpu_percent(interval=None),
        "memory_info": process.memory_info()._asdict(),
        "python_version": f"{os.sys.version_info.major}.{os.sys.version_info.minor}.{os.sys.version_info.micro}",
        "fastapi_version": "0.104.1", # Or whatever version you have
        "active_connections": len(router.dependencies), # Placeholder, actual count for WS is in websocket.py
        # You can add more status info like background tasks, DB connection status (if any), etc.
    }