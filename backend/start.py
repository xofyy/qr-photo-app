#!/usr/bin/env python3
"""
Development server startup script for QR Photo App backend
"""
import uvicorn
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

if __name__ == "__main__":
    # Get port from environment or default to 8001
    port = int(os.getenv("PORT", 8001))
    
    print("🚀 Starting QR Photo App Backend...")
    print(f"📍 Server will be available at: http://localhost:{port}")
    print("📖 API docs will be available at: http://localhost:{port}/docs")
    print("🛑 Press Ctrl+C to stop the server")
    
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=port,
        reload=True,
        log_level="info"
    )