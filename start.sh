#!/bin/bash

# Function to kill all background processes on exit
cleanup() {
    echo "Shutting down services..."
    kill $(jobs -p)
    exit
}

# Trap SIGINT (Ctrl+C) to run cleanup
trap cleanup SIGINT

echo "🚀 Starting Smart Project Manager..."

# Start Backend
echo "📦 Starting Backend Server (Port 5005)..."
(cd backend && PORT=5005 npm start) &

# Start AI Service
echo "🧠 Starting AI Service (Port 5001)..."
(cd ai-service && source .venv/bin/activate && python3 app.py) &

# Start Frontend
echo "🎨 Starting Frontend (Port 5173)..."
(cd frontend && npm run dev) &

# Wait for all background processes
wait
