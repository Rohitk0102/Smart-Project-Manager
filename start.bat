@echo off
REM Start Smart Project Manager on Windows

setlocal enabledelayedexpansion

echo.
echo 🚀 Starting Smart Project Manager...
echo.

REM Check if dependencies are installed
echo 🔍 Checking dependencies...
echo.

REM Check backend dependencies
if not exist "backend\node_modules\" (
    echo 📦 Installing backend dependencies...
    cd backend
    call npm install
    cd ..
)

REM Check frontend dependencies
if not exist "frontend\node_modules\" (
    echo 📦 Installing frontend dependencies...
    cd frontend
    call npm install
    cd ..
)

REM Check Python virtual environment
if not exist "ai-service\.venv\" (
    echo 🐍 Creating Python virtual environment...
    cd ai-service
    python -m venv .venv
    cd ..
)

REM Check Python dependencies
if not exist "ai-service\.venv\Lib\site-packages\fastapi\" (
    echo 📦 Installing Python dependencies...
    cd ai-service
    call .venv\Scripts\activate.bat
    pip install -r requirements.txt
    cd ..
)

REM Check and create .env files if they don't exist
if not exist "backend\.env" (
    echo ⚙️  Creating backend .env file...
    copy backend\.env.example backend\.env
    echo ⚠️  Please configure backend\.env with your settings
)

if not exist "ai-service\.env" (
    echo ⚙️  Creating AI service .env file...
    copy ai-service\.env.example ai-service\.env
    echo ⚠️  Please configure ai-service\.env with your API keys
)

echo.
echo ✅ Setup complete! Starting services...
echo.

REM Start Backend Server
echo 📦 Starting Backend Server (Port 5005)...
start "Backend" cmd /k "cd /d backend && npm start"

REM Wait a moment before starting next service
timeout /t 2 /nobreak >nul

REM Start AI Service (Python)
echo 🧠 Starting AI Service (Port 5001)...
start "AI Service" cmd /k "cd /d ai-service && .venv\Scripts\activate.bat && python app.py"

REM Wait a moment before starting next service
timeout /t 2 /nobreak >nul

REM Start Frontend
echo 🎨 Starting Frontend (Port 5173)...
start "Frontend" cmd /k "cd /d frontend && npm run dev"

echo.
echo ✅ All services are starting in separate windows.
echo.
echo 🌐 Services:
echo    Frontend: http://localhost:5173
echo    Backend:  http://localhost:5005
echo    AI Service: http://localhost:5001
echo.
echo Press Ctrl+C in each window to stop that service.
echo.
pause
