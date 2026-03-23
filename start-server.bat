@echo off
title Recording Room Setup
cd /d "%~dp0"
echo.
echo  Recording Room Setup
echo  ====================
echo  Starting local server so the camera and mic work correctly...
echo  (Chrome requires a local server to remember your permissions)
echo.

REM ── Try Python 3 ──
python --version >nul 2>&1
if %ERRORLEVEL% == 0 (
    echo  Found Python. Starting server on http://localhost:8080
    echo  Close this window to stop the server.
    echo.
    timeout /t 1 /nobreak >nul
    start "" "http://localhost:8080"
    python -m http.server 8080
    goto :done
)

python3 --version >nul 2>&1
if %ERRORLEVEL% == 0 (
    echo  Found Python 3. Starting server on http://localhost:8080
    echo  Close this window to stop the server.
    echo.
    timeout /t 1 /nobreak >nul
    start "" "http://localhost:8080"
    python3 -m http.server 8080
    goto :done
)

REM ── Try Node.js ──
node --version >nul 2>&1
if %ERRORLEVEL% == 0 (
    echo  Found Node.js. Starting server on http://localhost:8080
    echo  Close this window to stop the server.
    echo.
    timeout /t 1 /nobreak >nul
    start "" "http://localhost:8080"
    npx --yes serve . --listen 8080 --no-clipboard
    goto :done
)

REM ── Nothing found ──
echo  ERROR: Python or Node.js is required but neither was found.
echo.
echo  Install Python (free) from: https://www.python.org/downloads/
echo  Then double-click this file again.
echo.
pause
:done
