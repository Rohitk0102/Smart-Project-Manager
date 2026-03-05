# Smart Project Manager

A full-stack project management application with AI-powered features, real-time collaboration, and Google Calendar integration.

## Features

- 🤖 AI-powered task analysis and recommendations
- 📊 Kanban board with drag-and-drop
- 📅 Google Calendar integration
- 💬 Real-time chat and notifications
- 📈 Project analytics and insights
- 👥 Team collaboration
- 🎯 Task management with priorities

## Tech Stack

- **Frontend**: React + Vite + TailwindCSS
- **Backend**: Node.js + Express + Socket.io
- **AI Service**: Python + FastAPI + LangChain
- **Database**: MongoDB

## Quick Start (One Command!)

### Prerequisites

- Node.js (v16 or higher)
- Python 3.8+
- MongoDB Atlas account (or local MongoDB)

### Automatic Setup & Start

**On macOS/Linux:**
```bash
chmod +x start.sh
./start.sh
```

**On Windows:**
```bash
start.bat
```

The script will automatically:
✅ Install all dependencies (npm and Python packages)
✅ Create Python virtual environment
✅ Copy .env.example files to .env (if not exists)
✅ Start all three services

## 🌐 Access the Application

Once started, access:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5005
- **AI Service**: http://localhost:5001

> **⚠️ Note:** Please wait up to **5 minutes** for all services to fully start, especially the AI service which loads ML models.

## Configuration

### Required Environment Variables

After first run, configure these files:

**backend/.env:**
```env
PORT=5005
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
NODE_ENV=development
```

**ai-service/.env:**
```env
HUGGINGFACEHUB_API_TOKEN=your_huggingface_token
DEEPSEEK_API_KEY=your_deepseek_key (optional)
```

### Setup Instructions

#### 1. MongoDB Setup
1. Create a free account at https://www.mongodb.com/cloud/atlas
2. Create a cluster and get your connection string
3. Add to `backend/.env` as `MONGO_URI`

#### 2. Google OAuth Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable Google+ API and Google Calendar API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `http://localhost:5005/api/auth/google/callback`
6. Copy Client ID and Secret to `backend/.env`

#### 3. HuggingFace API Token
1. Create account at https://huggingface.co/
2. Go to Settings → Access Tokens
3. Create a new token
4. Add to `ai-service/.env` as `HUGGINGFACEHUB_API_TOKEN`

## Manual Installation (Optional)

If you prefer manual setup:

```bash
# Backend
cd backend && npm install && cd ..

# Frontend
cd frontend && npm install && cd ..

# AI Service
cd ai-service
python3 -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cd ..
```

## Project Structure

```
Smart-Project-Manager1/
├── backend/          # Node.js Express API
├── frontend/         # React frontend
├── ai-service/       # Python FastAPI AI service
├── start.sh          # Unix startup script
└── start.bat         # Windows startup script
```

## Troubleshooting

**Port already in use:**
- Kill processes on ports 5005, 5001, or 5173
- Or change ports in configuration files

**MongoDB connection failed:**
- Verify `MONGO_URI` in `backend/.env`
- Check network access in MongoDB Atlas

**Python dependencies fail:**
- Ensure Python 3.8+ is installed
- Try: `python3 -m pip install --upgrade pip`

**Google OAuth not working:**
- Verify redirect URI matches exactly in Google Console
- Check credentials in `backend/.env`

## Stopping Services

Press `Ctrl+C` in the terminal where services are running.

## License

MIT
