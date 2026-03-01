@echo off
setlocal
echo ========================================================
echo   Exposing Smart Project Manager Globally (LocalTunnel)
echo ========================================================
echo.
echo This script will launch 3 separate windows to expose your services.
echo.

echo 1. Exposing Frontend (Port 5173)...
start "Public URL - Frontend" cmd /k "echo Waiting for tunnel... & npx localtunnel --port 5173"

echo 2. Exposing Backend (Port 5005)...
start "Public URL - Backend" cmd /k "echo Waiting for tunnel... & npx localtunnel --port 5005"

echo 3. Exposing AI Service (Port 5001)...
start "Public URL - AI Service" cmd /k "echo Waiting for tunnel... & npx localtunnel --port 5001"

echo.
echo ========================================================
echo   INSTRUCTIONS
echo ========================================================
echo.
echo 1. Look at the 3 new windows that opened.
echo 2. Copy the URL from the 'Frontend' window (e.g., https://wild-goose-22.loca.lt).
echo 3. Open that URL in any browser.
echo.
echo NOTE: Since we hardcoded 'localhost' in the code earlier,
echo the App might complain if accessed from a different network
echo because it will still try to hit 'localhost:5005' for the API.
echo.
echo If you need it to work fully on other devices, you might need
echo to temporarily update 'api.js' with the Backend Public URL.
echo.
pause
