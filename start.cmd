@echo off
REM CoachBoard starten (Windows). Doppelklick oder: start.cmd
REM Optionen: set PORT=3001 ^& start.cmd   ^|   set PORT_STRICT=1 ^& start.cmd
setlocal
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo [CoachBoard] FEHLER: Node.js nicht gefunden. Bitte Node.js 20+ installieren: https://nodejs.org
  pause
  exit /b 1
)

node scripts\start.mjs
if errorlevel 1 pause
