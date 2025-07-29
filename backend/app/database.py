from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()

MONGODB_URL = os.getenv("MONGODB_URL", "mongodb+srv://dumanmurat9:L4G3fx2CYd3Una36@cluster0.xzbrgw5.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0")
DATABASE_NAME = os.getenv("DATABASE_NAME", "qr_photo_app")

client = AsyncIOMotorClient(MONGODB_URL)
database = client[DATABASE_NAME]

def get_database():
    return database

def get_sessions_collection():
    return database.sessions

def get_photos_collection():
    return database.photos

def get_users_collection():
    return database.users

def get_user_uploads_collection():
    return database.user_uploads
