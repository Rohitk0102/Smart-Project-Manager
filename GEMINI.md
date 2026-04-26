# Smart Project Manager

## Project Overview

Smart Project Manager is a full-stack project management application featuring AI-powered task analysis, real-time collaboration via WebSockets, and Google Calendar integration. The architecture consists of three main services:

- **Frontend (`/frontend`)**: A modern React application built with Vite, TailwindCSS, and framer-motion for animations. It includes features like a Kanban board (using `@dnd-kit`), calendar view (`react-big-calendar`), and integrated real-time sockets.
- **Backend (`/backend`)**: A Node.js and Express REST API backend using MongoDB (Mongoose) for data persistence. It supports Socket.io for real-time collaboration (chat and notifications), JWT/Clerk for authentication, and Google APIs for calendar synchronization. It uses CommonJS modules.
- **AI Service (`/ai-service`)**: A Python-based FastAPI microservice responsible for AI-powered task analysis and recommendations. It utilizes LangChain, HuggingFace models, and vector stores (FAISS) for its intelligent features.

## Architecture & Technologies

- **Frontend**: React 19, Vite, TailwindCSS, `@dnd-kit`, Recharts, Socket.io-client.
- **Backend**: Node.js, Express, MongoDB (Mongoose), Socket.io, Clerk.
- **AI Service**: Python, FastAPI, LangChain, HuggingFace Hub, FAISS.
- **Monorepo Structure**: The project is structured as a collection of services in the same repository but managed independently with their own dependency files (`package.json` and `requirements.txt`).

## Building and Running

The project includes convenient startup scripts that install dependencies, setup environments, and run all three services concurrently.

### Quick Start
- **macOS/Linux**:
  ```bash
  cd Smart-Project-Manager1
  chmod +x start.sh
  ./start.sh
  ```
- **Windows**:
  ```cmd
  cd Smart-Project-Manager1
  start.bat
  ```

### Manual Start
If you prefer running services independently:
- **Frontend** (Runs on port 5173 by default):
  ```bash
  cd Smart-Project-Manager1/frontend
  npm install
  npm run dev
  ```
- **Backend** (Runs on port 5005 by default):
  ```bash
  cd Smart-Project-Manager1/backend
  npm install
  npm start
  ```
- **AI Service** (Runs on port 5001 by default):
  ```bash
  cd Smart-Project-Manager1/ai-service
  python -m venv .venv
  source .venv/bin/activate  # On Windows: .venv\Scripts\activate
  pip install -r requirements.txt
  uvicorn app:app --port 5001 --reload
  ```

## Development Conventions

- **Frontend**: Uses ES Modules (`type: "module"`), functional React components, hooks, and TailwindCSS for styling.
- **Backend**: Uses CommonJS modules (`require`/`module.exports`). Controllers and Routes are separated clearly (e.g., `controllers/`, `routes/`, `models/`).
- **AI Service**: Uses standard Python practices, relies on `.env` files for secrets (like `HUGGINGFACEHUB_API_TOKEN`), and provides AI functionalities via a FastAPI REST API.
- **Environment Variables**: Both Node and Python services rely heavily on `.env` files. Ensure you copy `.env.example` templates to `.env` and fill in necessary values (MongoDB URI, Google Client ID/Secret, HuggingFace Tokens, etc.) before running locally.
