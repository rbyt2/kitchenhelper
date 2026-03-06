# ⚡ Quick Start Guide

Get your cooking assistant running in 5 minutes!

## 🎯 Step-by-Step Commands

### 1️⃣ Install Go

**Already have Go?** Skip to step 2.

**Don't have Go?**
- Download from: https://go.dev/dl/
- Install and verify: `go version`

### 2️⃣ Get FREE API Key

1. Go to: https://ai.google.dev/
2. Click: "Get API key in Google AI Studio"
3. Click: "Create API key"
4. Copy the key (starts with `AIza...`)

### 3️⃣ Run Setup Script

**Linux/Mac:**
```bash
cd go-cooking-assistant
./setup.sh
```

**Windows:**
```cmd
cd go-cooking-assistant
setup.bat
```

### 4️⃣ Start Server

```bash
go run main.go
```

### 5️⃣ Open Browser

**Desktop:** http://localhost:5000

**Mobile:** Use IP shown in terminal (e.g., http://192.168.1.100:5000)

---

## 🚀 Alternative: Manual Setup

```bash
# Navigate to project
cd go-cooking-assistant

# Set API key
export GOOGLE_API_KEY='your-key-here'

# Download dependencies
go mod download

# Run server
go run main.go
```

---

## 📱 Mobile Access

1. **Same WiFi** - Connect phone to same network as computer
2. **Find IP** - Server shows IP when it starts (e.g., 192.168.1.100)
3. **Open browser** on phone
4. **Navigate to** http://YOUR_IP:5000

---

## 🆘 Common Issues

### "Go is not installed"
→ Install from https://go.dev/dl/

### "API key not set"
→ Run: `export GOOGLE_API_KEY='your-key'`

### "Can't access from mobile"
→ Make sure phone is on same WiFi

### "Port 5000 already in use"
→ Change port in main.go (line with `port := "5000"`)

---

## ✅ For Easy Startup

```bash
# Build standalone executable (no Go needed to run)
go build -o cooking-assistant

# Run it
./cooking-assistant

# Now you can run it on any computer without installing Go!
```

---

## 💡 Pro Tips

- **Build once, run anywhere** - The compiled binary works without Go installed
- **Cross-platform builds** - Build for Windows from Mac, etc.
- **Free tier** - Gemini API is completely free (no credit card)
- **Fast** - Go is much faster than Python

---

That's it! You're ready to cook with AI! 🍳
