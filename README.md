# QR Photo Session App

A modern web application that allows users to create QR codes for photo sessions. Each QR code grants users the ability to take up to 10 photos using their device camera, with photos automatically uploaded to cloud storage.

## 🌐 Live Demo

**[https://qr-photo-app-eight.vercel.app/](https://qr-photo-app-eight.vercel.app/)**

Try the live application deployed on Vercel! The app includes full QR code generation, scanning, and photo session functionality.

### 🚀 Quick Start (Live App)

1. **For Event Organizers**: Visit the app → Sign in with Google → Create photo sessions
2. **For Participants**: Visit the app → Click "Scan QR Code" → Scan and upload photos
3. **Demo**: Create a test session and try the full workflow!

## Features

- 📱 **QR Code Generation**: Create unique QR codes for photo sessions
- 🔍 **QR Code Scanner**: Built-in camera scanner to scan any QR code and automatically navigate to photo sessions
- 📷 **Camera Integration**: Take photos directly using device camera (PC & Mobile)
- ☁️ **Cloud Storage**: Photos automatically uploaded to Cloudinary
- 👥 **Session Management**: Each QR code allows up to 10 photos per user
- 🔧 **Admin Dashboard**: View all sessions and manage photos
- 🔐 **Google Authentication**: Secure login for event organizers
- 📱 **Mobile Optimized**: Fully responsive design for all devices
- 🎨 **Modern UI**: Beautiful, intuitive interface with Tailwind CSS

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
- **QR Scanner** - Real-time QR code scanning library
- **QRCode.React** - QR code generation for React

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

### For Event Organizers

1. **Visit the Live App**: Go to [https://qr-photo-app-eight.vercel.app/](https://qr-photo-app-eight.vercel.app/)
2. **Sign in with Google**: Click "Sign in with Google" to access organizer features
3. **Create Photo Session**: Click "Create New Photo Session" from your dashboard
4. **Share QR Code**: Download or share the generated QR code with event participants
5. **Manage Photos**: View and download all uploaded photos from your dashboard

### For Photo Participants

1. **Scan QR Code**: Use the built-in scanner or your phone's camera app
   - **Option 1**: Visit [https://qr-photo-app-eight.vercel.app/](https://qr-photo-app-eight.vercel.app/) and click "Scan QR Code"
   - **Option 2**: Use your phone's native camera app to scan the QR code
2. **Take Photos**: Choose between mobile camera or PC camera interface
3. **Upload**: Photos are automatically uploaded to cloud storage (up to 10 per participant)
4. **View Gallery**: See all uploaded photos in the session gallery

### QR Code Scanner Features

- **Universal Scanner**: Scans any QR code, not just photo session codes
- **Smart Navigation**: Automatically detects and navigates to photo sessions
- **Flexible Options**: For non-session QR codes, offers to open URL or copy content
- **Camera Switching**: Switch between front/back cameras on supported devices
- **Real-time Detection**: Instant QR code recognition with visual feedback

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

### Live Production Deployment

**Frontend**: [https://qr-photo-app-eight.vercel.app/](https://qr-photo-app-eight.vercel.app/) (Vercel)  
**Backend**: Deployed on Railway with MongoDB Atlas and Cloudinary integration

### Vercel Deployment (Frontend)

The app is currently deployed on Vercel with the following configuration:

1. **Automatic Deployment**: Connected to GitHub for automatic deployments
2. **Environment Variables**: Set in Vercel dashboard
   ```env
   REACT_APP_API_URL=https://your-backend-url.railway.app
   ```
3. **Build Settings**: 
   - Build Command: `npm run build`
   - Output Directory: `build`
   - Node.js Version: 18.x

### Backend Deployment Options
- **Railway** (Current): Automatic deployment from GitHub
- **Render**: Easy deployment with PostgreSQL/MongoDB support  
- **AWS/Heroku**: Scalable cloud deployment options
- Set environment variables in deployment platform
- Ensure MongoDB and Cloudinary are accessible

### Local Development
- Build the frontend: `npm run build`
- Deploy build folder to Netlify, Vercel, or similar
- Update `REACT_APP_API_URL` to point to deployed backend

## Security Considerations

- **Camera Permissions**: Required for photo capture and QR code scanning
- **HTTPS Required**: Camera access requires HTTPS in production (automatically handled by Vercel)
- **Environment Variables**: Contain sensitive credentials (MongoDB, Cloudinary, Google OAuth)
- **Session Management**: Sessions expire after 24 hours by default
- **File Validation**: Upload validation for image types only
- **Authentication**: Google OAuth for secure organizer access
- **Rate Limiting**: Photo upload limits per user (10 photos per session)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.