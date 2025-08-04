#!/usr/bin/env python3
"""
Development server startup script for QR Photo App backend
"""
import uvicorn
import os
from dotenv import load_dotenv
from app.utils.logger import safe_log

# Load environment variables
load_dotenv()

if __name__ == "__main__":
    # Get port from environment or default to 8001
    port = int(os.getenv("PORT", 8001))
    
    safe_log("🚀 Starting QR Photo App Backend...", 'info')
    safe_log(f"📍 Server will be available at: http://localhost:{port}", 'info')
    safe_log(f"📖 API docs will be available at: http://localhost:{port}/docs", 'info')
    safe_log("🛑 Press Ctrl+C to stop the server", 'info')
    
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=port,
        reload=True,
        log_level="info"
    )