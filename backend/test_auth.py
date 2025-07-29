#!/usr/bin/env python3
import asyncio
import os
from starlette.applications import Starlette
from starlette.requests import Request
from starlette.responses import RedirectResponse
from authlib.integrations.starlette_client import OAuth

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

# OAuth setup
oauth = OAuth()
oauth.register(
    name='google',
    client_id=os.getenv("GOOGLE_CLIENT_ID"),
    client_secret=os.getenv("GOOGLE_CLIENT_SECRET"),
    server_metadata_url='https://accounts.google.com/.well-known/openid_configuration',
    client_kwargs={
        'scope': 'openid email profile'
    }
)

async def test_google_redirect():
    """Test Google OAuth redirect"""
    try:
        app = Starlette()
        oauth.init_app(app)
        
        # Create a mock request
        scope = {
            'type': 'http',
            'method': 'GET',
            'path': '/auth/google',
            'query_string': b'',
            'headers': [],
        }
        
        async def receive():
            return {'type': 'http.request', 'body': b''}
        
        async def send(message):
            print(f"Response: {message}")
        
        request = Request(scope, receive=receive)
        
        redirect_uri = f"{os.getenv('BACKEND_URL', 'http://localhost:8001')}/auth/google/callback"
        print(f"Redirect URI: {redirect_uri}")
        
        # Test the OAuth redirect
        response = await oauth.google.authorize_redirect(request, redirect_uri)
        print(f"OAuth response type: {type(response)}")
        print(f"OAuth response: {response}")
        
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_google_redirect())