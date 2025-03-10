@echo off
echo Starting LibreTranslate Server...

REM Check if LibreTranslate-main directory exists
if not exist "LibreTranslate-main" (
  echo Error: LibreTranslate-main directory not found.
  echo Please make sure the LibreTranslate-main folder is in the same directory as this script.
  exit /b 1
)

REM Navigate to LibreTranslate directory
cd LibreTranslate-main

REM Check if Python is installed
python --version >nul 2>&1
if %ERRORLEVEL% neq 0 (
  echo Error: Python is not installed or not in PATH.
  exit /b 1
)

REM Check if pip is installed
pip --version >nul 2>&1
if %ERRORLEVEL% neq 0 (
  echo Error: pip is not installed or not in PATH.
  exit /b 1
)

REM Install dependencies if not already installed
if not exist "venv" (
  echo Setting up virtual environment...
  python -m venv venv
  call venv\Scripts\activate.bat
  pip install -e .
) else (
  call venv\Scripts\activate.bat
)

REM Start LibreTranslate server
echo Starting LibreTranslate server...
echo The server will be available at http://localhost:5000
echo Press Ctrl+C to stop the server
libretranslate --host 0.0.0.0 --port 5000

REM Deactivate virtual environment when done
call venv\Scripts\deactivate.bat 