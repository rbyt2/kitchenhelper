@echo off
echo ============================================
echo 🍳 Cooking Assistant Setup (Go + Gemini)
echo ============================================
echo.

REM Check if Go is installed
go version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Go is not installed!
    echo Please install Go from: https://go.dev/dl/
    pause
    exit /b 1
)

echo ✅ Go is installed
go version
echo.

REM Check if API key is set
if "%GOOGLE_API_KEY%"=="" (
    echo ⚠️  GOOGLE_API_KEY environment variable is not set
    echo.
    echo To get a FREE API key:
    echo 1. Visit: https://ai.google.dev/
    echo 2. Click 'Get API key in Google AI Studio'
    echo 3. Create a new API key
    echo.
    set /p api_key="Enter your Google API key: "
    set GOOGLE_API_KEY=%api_key%
    echo.
    echo ✅ API key set for this session
    echo.
    echo To make it permanent, run this in PowerShell as Administrator:
    echo [System.Environment]::SetEnvironmentVariable('GOOGLE_API_KEY', '%api_key%', 'User')
    echo.
) else (
    echo ✅ GOOGLE_API_KEY is already set
    echo.
)

REM Download dependencies
echo 📦 Downloading Go dependencies...
go mod download

if %errorlevel% equ 0 (
    echo ✅ Dependencies downloaded successfully
) else (
    echo ❌ Failed to download dependencies
    pause
    exit /b 1
)

echo.
echo ============================================
echo ✅ Setup Complete!
echo ============================================
echo.
echo To run the server:
echo   go run main.go
echo.
echo Or build and run:
echo   go build -o cooking-assistant.exe
echo   cooking-assistant.exe
echo.
pause
