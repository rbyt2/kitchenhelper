#!/bin/bash

echo "============================================"
echo "🍳 Cooking Assistant Setup (Go + Gemini)"
echo "============================================"
echo ""

# Check if Go is installed
if ! command -v go &> /dev/null; then
    echo "❌ Go is not installed!"
    echo "Please install Go from: https://go.dev/dl/"
    exit 1
fi

echo "✅ Go is installed: $(go version)"
echo ""

# Check if API key is set
if [ -z "$GOOGLE_API_KEY" ]; then
    echo "⚠️  GOOGLE_API_KEY environment variable is not set"
    echo ""
    echo "To get a FREE API key:"
    echo "1. Visit: https://ai.google.dev/"
    echo "2. Click 'Get API key in Google AI Studio'"
    echo "3. Create a new API key"
    echo ""
    read -p "Enter your Google API key: " api_key
    export GOOGLE_API_KEY="$api_key"
    echo ""
    echo "✅ API key set for this session"
    echo ""
    echo "To make it permanent, add this to your ~/.bashrc or ~/.zshrc:"
    echo "export GOOGLE_API_KEY='$api_key'"
    echo ""
else
    echo "✅ GOOGLE_API_KEY is already set"
    echo ""
fi

# Download dependencies
echo "📦 Downloading Go dependencies..."
go mod download

if [ $? -eq 0 ]; then
    echo "✅ Dependencies downloaded successfully"
else
    echo "❌ Failed to download dependencies"
    exit 1
fi

echo ""
echo "============================================"
echo "✅ Setup Complete!"
echo "============================================"
echo ""
echo "To run the server:"
echo "  go run main.go"
echo ""
echo "Or build and run:"
echo "  go build -o cooking-assistant"
echo "  ./cooking-assistant"
echo ""
