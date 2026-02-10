# 🍳 Cooking Assistant Bot

A Python bot that uses your camera to see what you're cooking and provides step-by-step instructions using Claude's vision API and text-to-speech.

## Features

- 📸 Real-time camera feed analysis
- 🤖 Claude Vision API integration for intelligent cooking advice
- 🗣️ Text-to-speech instructions
- 💬 Interactive and automatic modes
- 📝 Context-aware cooking guidance

## Prerequisites

- Python 3.8 or higher
- Webcam/camera
- Anthropic API key (get one at https://console.anthropic.com/)

## Step-by-Step Setup Instructions

### Step 1: Install Python Dependencies

Open your terminal/console and navigate to the project directory:

```bash
cd cooking-assistant
```

Install the required packages:

```bash
pip install -r requirements.txt
```

**Note for Linux users:** You may need to install additional system packages for text-to-speech:

```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install espeak espeak-data libespeak1 libespeak-dev

# Fedora
sudo dnf install espeak espeak-devel

# Arch Linux
sudo pacman -S espeak
```

**Note for macOS users:** Text-to-speech should work out of the box using the built-in `nsss` engine.

**Note for Windows users:** Text-to-speech should work out of the box using the built-in SAPI5 engine.

### Step 2: Get Your Anthropic API Key

1. Go to https://console.anthropic.com/
2. Sign up or log in to your account
3. Navigate to API Keys section
4. Create a new API key
5. Copy the API key (it will look like: `sk-ant-api03-...`)

### Step 3: Configure the API Key

Open `config.json` in a text editor and replace the placeholder with your actual API key:

```json
{
  "api_key": "sk-ant-api03-YOUR-ACTUAL-KEY-HERE"
}
```

**Important:** Keep your API key secret! Don't share it or commit it to version control.

### Step 4: Test Your Camera

Make sure your camera is connected and working. You can test it with:

```bash
python3 -c "import cv2; cap = cv2.VideoCapture(0); print('Camera working!' if cap.isOpened() else 'Camera not found'); cap.release()"
```

### Step 5: Run the Bot

Start the cooking assistant:

```bash
python3 cooking_assistant.py
```

You'll be prompted to choose a mode:
- **Interactive Mode (1)**: Press SPACE to capture and analyze whenever you want
- **Automatic Mode (2)**: Automatically captures and analyzes every 30 seconds

## How to Use

### Interactive Mode

1. Position your camera to see your cooking area
2. Press SPACE when you want advice
3. Claude will analyze what you're cooking and speak instructions
4. Press 'q' to quit

### Automatic Mode

1. Position your camera to see your cooking area
2. The bot will automatically analyze every 30 seconds
3. Listen to the spoken instructions
4. Press 'q' to quit

## Usage Examples

**Scenario 1: Getting started**
- Point camera at your ingredients
- Press SPACE (or wait in automatic mode)
- Claude will identify ingredients and suggest recipes

**Scenario 2: Cooking guidance**
- Point camera at your cooking in progress
- Press SPACE
- Claude will see what you're doing and provide next steps

**Scenario 3: Troubleshooting**
- Point camera at your dish
- Press SPACE
- Claude can help identify issues and suggest fixes

## Troubleshooting

### Camera not working
- Make sure no other application is using the camera
- On Linux, you may need permissions: `sudo usermod -a -G video $USER`
- Try different camera indices if you have multiple cameras (edit line in code: `cv2.VideoCapture(0)` to `cv2.VideoCapture(1)`, etc.)

### Text-to-speech not working
- **Linux:** Install espeak (see Step 1)
- **Windows:** Should work by default
- **macOS:** Should work by default
- Check audio output is not muted

### API errors
- Verify your API key is correct in `config.json`
- Check you have API credits available
- Ensure you have internet connection

### Import errors
- Make sure all dependencies are installed: `pip install -r requirements.txt`
- Try upgrading pip: `pip install --upgrade pip`

## File Structure

```
cooking-assistant/
├── cooking_assistant.py  # Main bot script
├── config.json           # API key configuration
├── requirements.txt      # Python dependencies
└── README.md            # This file
```

## API Usage Notes

- Each analysis sends one image to the Claude API
- Cost depends on your Anthropic pricing tier
- Interactive mode is more cost-effective (analyze only when needed)
- Automatic mode costs more but provides continuous guidance

## Privacy & Security

- Camera feed is processed locally
- Only captured images are sent to Claude API when analyzing
- Keep your `config.json` file secure
- Never share your API key

## Customization

You can customize the bot by editing `cooking_assistant.py`:

- Change analysis interval (line with `interval=30`)
- Modify the prompts sent to Claude (in `analyze_cooking` method)
- Adjust speech rate (line with `setProperty('rate', 150)`)
- Change camera resolution or settings

## License

This project is provided as-is for educational and personal use.

## Support

For issues with:
- **Claude API:** Visit https://support.anthropic.com/
- **This bot:** Check the troubleshooting section above

Happy cooking! 🍳👨‍🍳👩‍🍳
