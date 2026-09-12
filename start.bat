@echo off
echo ===================================================
echo   SentinelFlow - Autonomous SOC Agent Startup
echo ===================================================
echo.

cd /d "%~dp0"

echo [1/3] Checking environment...
if not exist "backend\.venv" (
    echo Creating virtual environment...
    py -3.13 -m venv backend\.venv
    backend\.venv\Scripts\pip.exe install -r backend\requirements.txt
)

echo [2/3] Starting FastAPI Backend on http://localhost:8000 ...
start "SentinelFlow Backend" cmd /c "backend\.venv\Scripts\python.exe -m uvicorn app.main:app --app-dir backend --host 0.0.0.0 --port 8000"

echo [3/3] Starting Vite Frontend on http://localhost:5173 ...
cd frontend
start "SentinelFlow Frontend" cmd /c "npm.cmd run dev -- --host 0.0.0.0 --port 5173"

echo.
echo ===================================================
echo   SentinelFlow is now running!
echo   - Web Console: http://localhost:5173
echo   - Backend API: http://localhost:8000/docs
echo ===================================================
pause
