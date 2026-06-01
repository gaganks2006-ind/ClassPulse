@echo off
title ClassPulse Launcher
echo ===================================================
echo               CLASSPULSE LAUNCHER
echo     (FastAPI Backend + React/Vite Frontend)
echo ===================================================
echo.

:: Add Node.js to PATH environment for this session
set PATH=%PATH%;C:\Program Files\nodejs

echo [1/4] Checking Python backend environment...
cd backend
if exist .venv\Scripts\activate.bat goto install_deps
echo Creating virtual environment (.venv)...
python -m venv .venv

:install_deps
echo Installing Python backend dependencies...
call .venv\Scripts\activate
pip install -r requirements.txt
echo Initializing local SQLite database...
python database.py
cd ..
echo [SUCCESS] Backend ready!
echo.

echo [2/4] Preparing React frontend...
cd frontend
echo Installing Node frontend packages...
call npm install
cd ..
echo [SUCCESS] Frontend ready!
echo.

echo [3/4] Starting FastAPI backend on http://127.0.0.1:8000...
start cmd /k "title ClassPulse - Backend Server && cd backend && call .venv\Scripts\activate && uvicorn main:app --reload --port 8000"

echo [4/4] Starting Vite frontend server...
start cmd /k "title ClassPulse - Frontend Server && cd frontend && npm run dev"

echo.
echo ===================================================
echo    Done! Both servers have been launched in separate
echo    terminal windows. 
echo    - Backend: http://127.0.0.1:8000
echo    - Frontend: View the terminal output for port
echo ===================================================
echo.
pause
