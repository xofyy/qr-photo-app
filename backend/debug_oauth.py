#!/usr/bin/env python3
import asyncio
import os
import traceback
from dotenv import load_dotenv
load_dotenv()

from app.auth import exchange_code_for_token, get_google_user_info, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
from app import crud
from app.schemas.user import UserCreate

async def test_oauth_callback():
    print("=== OAuth Debug Test ===")
    print(f"Google Client ID: {GOOGLE_CLIENT_ID}")
    print(f"Google Client Secret: {'***' if GOOGLE_CLIENT_SECRET else 'NOT SET'}")
    print(f"Backend URL: {os.getenv('BACKEND_URL')}")
    
    # Test the functions individually
    print("\n1. Testing exchange_code_for_token function...")
    try:
        # This will fail with a fake code, but we can see if the function structure is correct
        await exchange_code_for_token("fake_code")
    except Exception as e:
        print(f"Expected error with fake code: {e}")
    
    print("\n2. Testing get_google_user_info function...")
    try:
        # This will fail with a fake token, but we can see if the function structure is correct
        await get_google_user_info("fake_token")
    except Exception as e:
        print(f"Expected error with fake token: {e}")
    
    print("\n3. Testing CRUD user functions...")
    try:
        # Test if user creation works
        user_data = UserCreate(
            email="test@example.com",
            name="Test User",
            avatar_url="https://example.com/avatar.jpg",
            provider="google",
            provider_id="123456789"
        )
        print(f"User creation data structure: {user_data}")
        
        # Test if we can call the CRUD function (this will fail due to DB connection, but shows if import works)
        print("Testing crud.create_user...")
        await crud.create_user(user_data)
        
    except Exception as e:
        print(f"CRUD test error (expected): {e}")
        traceback.print_exc()
    
    print("\n=== Debug Test Complete ===")

if __name__ == "__main__":
    asyncio.run(test_oauth_callback())