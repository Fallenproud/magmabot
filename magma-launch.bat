@echo off
setlocal enabledelayedexpansion

title MagmaBot Command Center - Universal Launcher

echo.
echo    ^|￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣^|
echo    ^|   MAGMABOT COMMAND CENTER - INITIALIZING CORE   ^|
echo    ^|___________________________________________________^|
echo.
echo    [SYSTEM] Booting MagmaBot Gateway...
echo.

:: Check for dependencies
where pnpm >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] pnpm not found. Please install pnpm.
    pause
    exit /b 1
)

:: Load environment variables from .env
if exist "%~dp0.env" (
    echo    [SYSTEM] Loading environment from .env...
    for /f "usebackq tokens=1,* delims==" %%A in ("%~dp0.env") do (
        set "%%A=%%B"
    )
) else (
    echo    [WARNING] .env not found — using defaults
)

:: Use env var or fall back to default
if not defined MAGMABOT_TOKEN set "MAGMABOT_TOKEN=magbot123"
set "TOKEN=!MAGMABOT_TOKEN!"
set "PORT=18789"

:: Start Gateway in background
start "MagmaBot Gateway" /min node scripts/run-node.mjs --dev gateway --port !PORT! --auth token --token !TOKEN!

echo    [SYSTEM] Launching Database Explorer...
start "MagmaBot DB Explorer" /min node scripts/db-viewer.js

echo    [SYSTEM] Launching Control Interface...
:: Wait a bit for the gateway to initialize
timeout /t 3 /nobreak >nul
start "" "http://localhost:!PORT!/?token=!TOKEN!"

echo.
echo    ^|￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣^|
echo    ^|   MAGMABOT CORE SYSTEMS OPERATIONAL           ^|
echo    ^|   - Gateway: http://localhost:18789           ^|
echo    ^|   - DB Explorer: http://localhost:18790       ^|
echo    ^|___________________________________________________^|
echo.
echo    Close this window to terminate the Command Center monitoring.
echo.

echo [INFO] Press any key to stop all services...
pause >nul

:: Cleanup
echo [SYSTEM] Shutting down services...
taskkill /FI "WINDOWTITLE eq MagmaBot Gateway*" /T /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq MagmaBot DB Explorer*" /T /F >nul 2>&1

echo [SYSTEM] MagmaBot Offline.
timeout /t 2 /nobreak >nul
exit
