#!/bin/bash

# Function to kill all background processes on exit
cleanup() {
    echo "Shutting down services..."
    kill $(jobs -p) 2>/dev/null
    exit
}

# Trap SIGINT (Ctrl+C) to run cleanup
trap cleanup SIGINT

echo "🚀 Starting Smart Project Manager..."
echo ""

# Check if dependencies are installed
echo "🔍 Checking dependencies..."

# Check backend dependencies
if [ ! -d "backend/node_modules" ]; then
    echo "📦 Installing backend dependencies..."
    (cd backend && npm install)
fi

# Check frontend dependencies
if [ ! -d "frontend/node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    (cd frontend && npm install)
fi

# Check Python virtual environment
if [ ! -d "ai-service/.venv" ]; then
    echo "🐍 Creating Python virtual environment..."
    (cd ai-service && python3 -m venv .venv)
fi

# Check Python dependencies
if [ ! -f "ai-service/.venv/lib/python*/site-packages/fastapi/__init__.py" ]; then
    echo "📦 Installing Python dependencies..."
    (cd ai-service && .venv/bin/pip install -r requirements.txt)
fi

# Check and create .env files if they don't exist
if [ ! -f "backend/.env" ]; then
    echo "⚙️  Creating backend .env file..."
    cp backend/.env.example backend/.env
    echo "⚠️  Please configure backend/.env with your settings"
fi

if [ ! -f "ai-service/.env" ]; then
    echo "⚙️  Creating AI service .env file..."
    cp ai-service/.env.example ai-service/.env
    echo "⚠️  Please configure ai-service/.env with your API keys"
fi

# Uncomment dotenv in backend files
echo "🔧 Configuring environment loading..."
sed -i.bak 's|// require|require|g' backend/index.js 2>/dev/null || sed -i '' 's|// require|require|g' backend/index.js
sed -i.bak 's|// require|require|g' backend/app.js 2>/dev/null || sed -i '' 's|// require|require|g' backend/app.js
rm -f backend/*.bak

echo ""
echo "✅ Setup complete! Starting services..."
echo ""

# Start Backend
echo "📦 Starting Backend Server (Port 5005)..."
(cd backend && npm start) &

# Start AI Service
echo "🧠 Starting AI Service (Port 5001)..."
(cd ai-service && source .venv/bin/activate && python3 app.py) &

# Start Frontend
echo "🎨 Starting Frontend (Port 5173)..."
(cd frontend && npm run dev) &

echo ""
echo "🌐 Services starting..."
echo "   Frontend: http://localhost:5173"
echo "   Backend:  http://localhost:5005"
echo "   AI Service: http://localhost:5001"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Wait for all background processes
wait
