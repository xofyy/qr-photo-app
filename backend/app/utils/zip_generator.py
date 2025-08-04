import io
import zipfile
import requests
from typing import List, Dict
import asyncio
from concurrent.futures import ThreadPoolExecutor
import tempfile
import os
import os
import logging

def safe_log(message: str, level: str = 'info'):
    """Simple logging that works in all environments"""
    # Check multiple environment indicators for production
    env = (os.getenv('NODE_ENV', '') or 
           os.getenv('RAILWAY_ENVIRONMENT', '') or 
           os.getenv('VERCEL_ENV', '') or 
           'development').lower()
    
    is_production = env in ('production', 'prod')
    if is_production and level in ('info', 'debug'):
        return
    
    if level == 'error':
        logging.error(message)
    elif level == 'warning':
        logging.warning(message)
    else:
        logging.info(message)


def download_image_from_url(url: str, filename: str) -> tuple:
    """Download an image from URL and return (filename, content)"""
    try:
        response = requests.get(url, timeout=30)
        response.raise_for_status()
        return filename, response.content
    except Exception as e:
        safe_log(f"Failed to download {url}: {e}", 'error')
        return filename, None


async def create_photos_zip(photos: List[Dict], session_id: str) -> io.BytesIO:
    """
    Create a ZIP file containing all photos from a session
    
    Args:
        photos: List of photo dictionaries with 'url' and 'filename' keys
        session_id: Session identifier for naming
    
    Returns:
        BytesIO object containing the ZIP file
    """
    zip_buffer = io.BytesIO()
    
    # Use ThreadPoolExecutor for concurrent downloads
    with ThreadPoolExecutor(max_workers=5) as executor:
        # Prepare download tasks
        download_tasks = []
        for i, photo in enumerate(photos):
            url = photo.get('url')
            original_filename = photo.get('filename', f'photo_{i+1}')
            
            # Create a clean filename with extension
            if '.' not in original_filename:
                # Try to get extension from URL or default to .jpg
                if url and '.' in url:
                    ext = url.split('.')[-1].split('?')[0]  # Remove query params
                    if ext.lower() in ['jpg', 'jpeg', 'png', 'gif', 'webp']:
                        filename = f"{original_filename}.{ext}"
                    else:
                        filename = f"{original_filename}.jpg"
                else:
                    filename = f"{original_filename}.jpg"
            else:
                filename = original_filename
            
            # Ensure unique filenames
            filename = f"photo_{i+1:03d}_{filename.split('/')[-1]}"
            
            if url:
                future = executor.submit(download_image_from_url, url, filename)
                download_tasks.append(future)
        
        # Create ZIP file
        with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
            # Add session info file
            session_info = f"""QR Photo Session: {session_id}
Generated on: {asyncio.get_event_loop().time()}
Total photos: {len(photos)}

This ZIP file contains all photos uploaded to your QR Photo Session.
"""
            zip_file.writestr(f"session_{session_id}_info.txt", session_info)
            
            # Process download results
            for future in download_tasks:
                try:
                    filename, content = future.result(timeout=60)
                    if content:
                        zip_file.writestr(f"photos/{filename}", content)
                        safe_log(f"Added {filename} to ZIP", 'debug')
                    else:
                        safe_log(f"Skipped {filename} - download failed", 'warning')
                except Exception as e:
                    safe_log(f"Error processing download result: {e}", 'error')
    
    zip_buffer.seek(0)
    return zip_buffer


def create_empty_session_zip(session_id: str) -> io.BytesIO:
    """Create a ZIP file for sessions with no photos"""
    zip_buffer = io.BytesIO()
    
    with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
        session_info = f"""QR Photo Session: {session_id}
Generated on: {asyncio.get_event_loop().time()}
Total photos: 0

This session currently has no photos uploaded.
"""
        zip_file.writestr(f"session_{session_id}_info.txt", session_info)
    
    zip_buffer.seek(0)
    return zip_buffer