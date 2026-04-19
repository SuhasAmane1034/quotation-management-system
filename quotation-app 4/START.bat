@echo off
echo ==========================================
echo   QuoteFlow v3.0 - LED Quotation Manager
echo ==========================================
echo.

if not exist "server\node_modules" (
    echo [1/2] Installing server dependencies...
    cd server && npm install && cd ..
    echo.
)

if not exist "client\node_modules" (
    echo [2/2] Installing client dependencies...
    cd client && npm install && cd ..
    echo.
)

echo Starting backend on port 3001...
start "QuoteFlow Backend" cmd /k "cd server && node index.js"
timeout /t 2 /nobreak > nul

echo Starting frontend on port 3000...
start "QuoteFlow Frontend" cmd /k "cd client && npm start"

echo.
echo ==========================================
echo  App : http://localhost:3000
echo  API : http://localhost:3001
echo ==========================================
echo  First time? Visit /register to sign up.
echo ==========================================
echo.
pause
