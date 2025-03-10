#!/bin/bash

# Check if LibreTranslate-main directory exists
if [ ! -d "LibreTranslate-main" ]; then
  echo "Error: LibreTranslate-main directory not found."
  echo "Please make sure the LibreTranslate-main folder is in the same directory as this script."
  exit 1
fi

# Navigate to LibreTranslate directory
cd LibreTranslate-main

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
  echo "Error: Python 3 is not installed."
  exit 1
fi

# Check if pip is installed
if ! command -v pip3 &> /dev/null; then
  echo "Error: pip3 is not installed."
  exit 1
fi

# Install dependencies if not already installed
if [ ! -d "venv" ]; then
  echo "Setting up virtual environment..."
  python3 -m venv venv
  source venv/bin/activate
  pip3 install -e .
else
  source venv/bin/activate
fi

# Start LibreTranslate server
echo "Starting LibreTranslate server..."
echo "The server will be available at http://localhost:5000"
echo "Press Ctrl+C to stop the server"
libretranslate --host 0.0.0.0 --port 5000

# Deactivate virtual environment when done
deactivate 