@echo off
cd /d "%~dp0"
if not exist ".venv\Scripts\python.exe" (
  echo First complete the Python setup in companion\README.md.
  echo Then run this launcher again.
  pause
  exit /b 1
)
".venv\Scripts\python.exe" companion\server.py
if errorlevel 1 (
  echo See companion\README.md for setup and troubleshooting.
  pause
)
