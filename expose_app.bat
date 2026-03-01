@echo off
echo Starting LocalTunnel to expose port 5173...
echo.
echo NOTE: You might need to install localtunnel globally first if this fails: npm install -g localtunnel
echo.
npx localtunnel --port 5173
pause
