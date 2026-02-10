#!/bin/bash

echo "========================================"
echo "Cooking Assistant Bot Setup"
echo "========================================"
echo ""

# Check if Python 3 is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Error: Python 3 is not installed"
    echo "Please install Python 3.8 or higher first"
    exit 1
fi

echo "✅ Python 3 found: $(python3 --version)"
echo ""

# Check if pip is installed
if ! command -v pip3 &> /dev/null; then
    echo "❌ Error: pip3 is not installed"
    echo "Please install pip3 first"
    exit 1
fi

echo "✅ pip3 found"
echo ""

# Install Python dependencies
echo "📦 Installing Python dependencies..."
pip3 install -r requirements.txt

if [ $? -eq 0 ]; then
    echo "✅ Dependencies installed successfully"
else
    echo "❌ Error installing dependencies"
    exit 1
fi

echo ""

# Check for espeak on Linux
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    if ! command -v espeak &> /dev/null; then
        echo "⚠️  Warning: espeak not found"
        echo "Text-to-speech may not work without it"
        echo ""
        echo "To install espeak:"
        echo "  Ubuntu/Debian: sudo apt-get install espeak"
        echo "  Fedora: sudo dnf install espeak"
        echo "  Arch: sudo pacman -S espeak"
        echo ""
    else
        echo "✅ espeak found (text-to-speech ready)"
    fi
fi

echo ""
echo "========================================"
echo "✅ Setup Complete!"
echo "========================================"
echo ""
echo "Next steps:"
echo "1. Get your Anthropic API key from: https://console.anthropic.com/"
echo "2. Edit config.json and add your API key"
echo "3. Run: python3 main.py"
echo ""
echo "Happy cooking!"
