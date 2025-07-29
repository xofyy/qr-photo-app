# QR Photo Session App

A modern web application that allows users to create QR codes for photo sessions. Each QR code grants users the ability to take up to 10 photos using their device camera, with photos automatically uploaded to cloud storage.

## Features

- 📱 **QR Code Generation**: Create unique QR codes for photo sessions
- 📷 **Camera Integration**: Take photos directly using device camera
- ☁️ **Cloud Storage**: Photos automatically uploaded to Cloudinary
- 👥 **Session Management**: Each QR code allows up to 10 photos
- 🔧 **Admin Dashboard**: View all sessions and manage photos
- 📱 **Mobile Optimized**: Works seamlessly on mobile devices

## Tech Stack

### Backend
- **FastAPI** - Modern Python web framework
- **MongoDB** - NoSQL database with Motor async driver
- **Cloudinary** - Cloud image storage and management
- **QRCode** - QR code generation library

### Frontend
- **React 18** - Modern React with hooks
- **Tailwind CSS** - Utility-first CSS framework
- **React Router** - Client-side routing
- **Axios** - HTTP client for API calls

## Project Structure

```
qr-photo-app/
├── backend/
│   ├── app/
│   │   ├── models/          # Pydantic models
│   │   ├── schemas/         # Data schemas
│   │   ├── crud.py          # Database operations
│   │   ├── database.py      # Database connection
│   │   ├── main.py          # FastAPI application
│   │   └── utils.py         # Utility functions
│   ├── requirements.txt     # Python dependencies
│   └── .env.example         # Environment variables template
└── frontend/
    ├── src/
    │   ├── components/      # React components
    │   ├── pages/           # Page components
    │   ├── services/        # API services
    │   └── utils/           # Utility functions
    ├── package.json         # Node.js dependencies
    └── .env.example         # Environment variables template
```

## Setup Instructions

### Prerequisites

- Python 3.8+
- Node.js 14+
- MongoDB Atlas account (or local MongoDB)
- Cloudinary account

### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Create virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\\Scripts\\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` file with your credentials:
   ```env
   MONGODB_URL=mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
   DATABASE_NAME=qr_photo_app
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   FRONTEND_URL=http://localhost:3000
   ```

5. **Start the backend server**
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` file:
   ```env
   REACT_APP_API_URL=http://localhost:8000
   ```

4. **Start the development server**
   ```bash
   npm start
   ```

## Usage

### Creating a Photo Session

1. Visit `http://localhost:3000`
2. Click "Create New Photo Session"
3. A QR code will be generated
4. Share the QR code or link with users

### Taking Photos

1. Scan the QR code or visit the session link
2. Click "Start Camera" to access device camera
3. Take photos (up to 10 per session)
4. Photos are automatically uploaded to cloud storage

### Admin Dashboard

1. Visit `http://localhost:3000/admin`
2. View all active sessions
3. Browse photos for each session
4. Delete sessions if needed

## API Endpoints

### Sessions
- `POST /sessions/` - Create new session
- `GET /sessions/{session_id}` - Get session details
- `GET /sessions/{session_id}/qr` - Get QR code for session
- `GET /sessions/{session_id}/photos` - Get all photos for session
- `POST /sessions/{session_id}/photos` - Upload photo to session

### Admin
- `GET /admin/sessions/` - Get all sessions
- `DELETE /admin/sessions/{session_id}` - Delete session

## Environment Variables

### Backend (.env)
| Variable | Description | Required |
|----------|-------------|----------|
| `MONGODB_URL` | MongoDB connection string | Yes |
| `DATABASE_NAME` | Database name | Yes |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | Yes |
| `CLOUDINARY_API_KEY` | Cloudinary API key | Yes |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | Yes |
| `FRONTEND_URL` | Frontend URL for QR codes | Yes |

### Frontend (.env)
| Variable | Description | Required |
|----------|-------------|----------|
| `REACT_APP_API_URL` | Backend API URL | Yes |

## Development

### Running Tests
```bash
# Backend tests
cd backend
python -m pytest

# Frontend tests
cd frontend
npm test
```

### Building for Production
```bash
# Frontend build
cd frontend
npm run build
```

## Deployment

### Backend Deployment
- Deploy to platforms like Railway, Render, or AWS
- Set environment variables in deployment platform
- Ensure MongoDB and Cloudinary are accessible

### Frontend Deployment
- Build the project: `npm run build`
- Deploy build folder to Netlify, Vercel, or similar
- Update `REACT_APP_API_URL` to point to deployed backend

## Security Considerations

- Camera permissions required for photo capture
- HTTPS recommended for production (required for camera access)
- Environment variables contain sensitive credentials
- Sessions expire after 24 hours by default
- File upload validation for image types only

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.