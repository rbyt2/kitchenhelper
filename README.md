#  Cooking Assistant Bot using GO

AI-powered cooking guidance using **Go** and **Google Gemini** (FREE tier).

Built by Rishi and Yash for a school project.

##  Features

- ✅ **100% Go backend** - Fast, efficient, compiled binary
- ✅ **Google Gemini API** - Completely FREE tier (no credit card needed)
- ✅ **Mobile support** - Automatic detection with front/back camera switching
- ✅ **Real-time AI cooking guidance** - Vision-based recipe suggestions
- ✅ **Text-to-speech** - Spoken instructions while cooking
- ✅ **Auto mode** - Analyzes every 30 seconds automatically

##  Prerequisites

- **Go 1.21 or higher** - [Download here](https://go.dev/dl/)
- **Google Gemini API key** (FREE) - [Get one here](https://ai.google.dev/)

##  Quick Setup

### Step 1: Install Go

**Windows:**
1. Download from https://go.dev/dl/
2. Run installer
3. Verify: `go version`

**Mac:**
```bash
brew install go
```

**Linux:**
```bash
wget https://go.dev/dl/go1.21.0.linux-amd64.tar.gz
sudo tar -C /usr/local -xzf go1.21.0.linux-amd64.tar.gz
export PATH=$PATH:/usr/local/go/bin
```

### Step 2: Get FREE Google Gemini API Key

1. Go to **https://ai.google.dev/**
2. Click **"Get API key in Google AI Studio"**
3. Click **"Create API key"**
4. Copy your key (starts with `AIza...`)

 **No credit card required!** Completely free.

### Step 3: Clone and Setup

```bash
# Navigate to project directory
cd go-cooking-assistant

# Download Go dependencies
go mod download

# Set your API key (choose one method):

# Method 1: Environment variable (temporary)
export GOOGLE_API_KEY='your-api-key-here'

# Method 2: Add to your shell profile (permanent)
echo 'export GOOGLE_API_KEY="your-api-key-here"' >> ~/.bashrc
source ~/.bashrc

# Method 3: Create a .env file (see below)
```

### Step 4: Run the Server

```bash
# Run directly
go run main.go

# OR compile and run
go build -o cooking-assistant
./cooking-assistant
```

You should see:
```
============================================================
🍳 COOKING ASSISTANT WEB SERVER (Go + Gemini)
============================================================

Starting web server...

📱 Mobile Access:  http://192.168.1.XXX:5000
💻 Desktop Access: http://localhost:5000

Press Ctrl+C to stop the server
============================================================
```

### Step 5: Open in Browser

**Desktop:** http://localhost:5000
**Mobile:** Use the IP address shown (e.g., http://192.168.1.XXX:5000)

Make sure your phone and computer are on the same WiFi!

## 📁 Project Structure

```
go-cooking-assistant/
├── main.go              # Go web server + Gemini integration
├── go.mod              # Go dependencies
├── go.sum              # Dependency checksums (auto-generated)
├── templates/
│   └── index.html      # Main web page
├── static/
│   ├── style.css       # Styling
│   └── app.js          # Frontend JavaScript
└── README.md           # This file
```

## 🌐 Environment Variables

You can set the API key using environment variables:

**Linux/Mac:**
```bash
export GOOGLE_API_KEY='AIza...'
```

**Windows (Command Prompt):**
```cmd
set GOOGLE_API_KEY=AIza...
```

**Windows (PowerShell):**
```powershell
$env:GOOGLE_API_KEY="AIza..."
```

## 🔨 Building for Production

### Build executable:
```bash
# Build for current platform
go build -o cooking-assistant

# Build for Linux
GOOS=linux GOARCH=amd64 go build -o cooking-assistant-linux

# Build for Windows
GOOS=windows GOARCH=amd64 go build -o cooking-assistant.exe

# Build for Mac
GOOS=darwin GOARCH=amd64 go build -o cooking-assistant-mac
```

### Run the executable:
```bash
# Linux/Mac
./cooking-assistant

# Windows
cooking-assistant.exe
```

##  Mobile Usage

1. **Start server** on your computer
2. **Note the IP address** shown in terminal (e.g., 192.168.1.100)
3. **Connect phone** to same WiFi as computer
4. **Open browser** on phone
5. **Navigate to:** http://YOUR_COMPUTER_IP:5000
6. **Tap camera switch button** (📷) to toggle front/back camera

##  Troubleshooting

### "GOOGLE_API_KEY environment variable not set"
**Solution:** Set the environment variable:
```bash
export GOOGLE_API_KEY='your-key-here'
```

### "Failed to create Gemini client"
**Solution:** 
- Check your API key is correct
- Verify you have internet connection
- Make sure you copied the full key (starts with `AIza`)

### "Failed to analyze image"
**Solution:**
- Check server console for detailed error
- Verify API key is valid
- Check you haven't exceeded free tier limits (60 requests/minute)

### Can't access from mobile
**Solution:**
- Ensure phone and computer on same WiFi
- Check firewall isn't blocking port 5000
- Use IP address shown by server, not localhost

### Port 5000 already in use
**Solution:** Change port in `main.go`:
```go
// Change this line:
port := "5000"
// To:
port := "8080"  // or any other port
```

##  Why Go Instead of Python?

| Feature | Go | Python |
|---------|-----|---------|
| Speed |  **Very Fast** | Slower |
| Binary |  Single executable |  Needs Python installed |
| Memory |  Low usage | Higher usage |
| Deployment |  Easy (just copy binary) | Complex (dependencies) |
| Mobile-friendly |  Better performance | OK |

##  Google Gemini Free Tier Limits

- **60 requests per minute**
- **1,500 requests per day**
- **1 million tokens per day**

Perfect for a school project! 🎓

##  Security Notes

- **Never commit API keys** to GitHub
- Use environment variables for API keys
- Add `.env` files to `.gitignore`
- For production, use proper secret management

## 💡 Advanced Features

### Run on different port:
Edit `main.go` and change:
```go
port := "5000"  // Change to any port
```

### Add HTTPS (for production):
```go
log.Fatal(http.ListenAndServeTLS(":443", "cert.pem", "key.pem", nil))
```

### Deploy to cloud:
```bash
# Build for Linux
GOOS=linux GOARCH=amd64 go build -o cooking-assistant

# Upload to server
scp cooking-assistant user@server:/path/
ssh user@server
export GOOGLE_API_KEY='your-key'
./cooking-assistant
```

##  Resources

- **Go Documentation:** https://go.dev/doc/
- **Gemini API Docs:** https://ai.google.dev/docs
- **Free Gemini API Key:** https://ai.google.dev/


##  FAQ

**Q: Do I need to pay for Gemini API?**
A: No! The free tier is generous enough for this project.

**Q: Can I deploy this online?**
A: Yes! You can deploy the compiled binary to any server that supports Go.

**Q: Does this work offline?**
A: No, you need internet to call the Gemini API.

**Q: Why is Go better than Python here?**
A: Faster, single binary deployment, lower memory usage, better for mobile performance.

---

Happy cooking! 🍳👨‍🍳👩‍🍳
