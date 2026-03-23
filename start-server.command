#!/bin/bash
# Double-click this file in Finder to start the Recording Room Setup server.
# The app will open automatically in your default browser.

cd "$(dirname "$0")"

echo ""
echo " Recording Room Setup"
echo " ===================="
echo " Starting local server so the camera and mic work correctly..."
echo " (Safari/Chrome requires a local server to remember your permissions)"
echo ""

# ── Try Python 3 ──
if command -v python3 &>/dev/null; then
    echo " Found Python 3. Starting server on http://localhost:8080"
    echo " Close this window to stop the server."
    echo ""
    sleep 0.5
    open "http://localhost:8080"
    python3 -m http.server 8080
    exit 0
fi

# ── Try Python 2 ──
if command -v python &>/dev/null; then
    PY_VER=$(python -c 'import sys; print(sys.version_info[0])')
    if [ "$PY_VER" = "3" ]; then
        echo " Found Python. Starting server on http://localhost:8080"
        echo " Close this window to stop the server."
        echo ""
        sleep 0.5
        open "http://localhost:8080"
        python -m http.server 8080
        exit 0
    else
        echo " Found Python 2. Starting server on http://localhost:8080"
        echo " Close this window to stop the server."
        echo ""
        sleep 0.5
        open "http://localhost:8080"
        python -m SimpleHTTPServer 8080
        exit 0
    fi
fi

# ── Try Node.js ──
if command -v node &>/dev/null; then
    echo " Found Node.js. Starting server on http://localhost:8080"
    echo " Close this window to stop the server."
    echo ""
    sleep 0.5
    open "http://localhost:8080"
    npx --yes serve . --listen 8080 --no-clipboard
    exit 0
fi

# ── Nothing found ──
echo " ERROR: Python or Node.js is required but neither was found."
echo ""
echo " Install Python (free) from: https://www.python.org/downloads/"
echo " Then double-click this file again."
echo ""
read -p "Press Enter to exit..."
