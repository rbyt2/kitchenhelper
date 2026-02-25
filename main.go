package main

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"log"
	"net"
	"net/http"
	"os"
	"strings"

	"google.golang.org/genai"
)

type AnalyzeRequest struct {
	Image    string `json:"image"`
	Question string `json:"question"`
}

type AnalyzeResponse struct {
	Success  bool   `json:"success,omitempty"`
	Response string `json:"response,omitempty"`
	Error    string `json:"error,omitempty"`
}

type Server struct {
	geminiClient *genai.Client
	history      []string
}

func NewServer() *Server {
	return &Server{
		history: make([]string, 0),
	}
}

// SetAPIKey initializes or replaces the Gemini client using the provided API key.
func (s *Server) SetAPIKey(apiKey string) error {
	if apiKey == "" {
		return fmt.Errorf("API key cannot be empty")
	}

	ctx := context.Background()
	client, err := genai.NewClient(ctx, &genai.ClientConfig{
		APIKey:  apiKey,
		Backend: genai.BackendGeminiAPI,
	})
	if err != nil {
		return fmt.Errorf("failed to create Gemini client: %w", err)
	}

	s.geminiClient = client
	return nil
}

func (s *Server) Close() {}

// Enable CORS
func enableCORS(w http.ResponseWriter) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
}

// Serve the main HTML page
func (s *Server) handleIndex(w http.ResponseWriter, r *http.Request) {
	// Serve the root index.html (no templates directory in this project)
	http.ServeFile(w, r, "index.html")
}

// Handle image analysis
func (s *Server) handleAnalyze(w http.ResponseWriter, r *http.Request) {
	enableCORS(w)

	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}

	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req AnalyzeRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		s.sendError(w, fmt.Sprintf("Invalid request: %v", err), http.StatusBadRequest)
		return
	}

	if req.Image == "" && strings.TrimSpace(req.Question) == "" {
		s.sendError(w, "No image or question provided", http.StatusBadRequest)
		return
	}

	var imageData []byte
	var err error

	if req.Image != "" {
		log.Println("📸 Received image, analyzing with Gemini...")

		// Decode base64 image
		imageData, err = base64.StdEncoding.DecodeString(req.Image)
		if err != nil {
			s.sendError(w, fmt.Sprintf("Failed to decode image: %v", err), http.StatusBadRequest)
			return
		}
	} else {
		log.Println("💬 Received question without image, analyzing with Gemini...")
	}

	// Analyze with Gemini
	response, err := s.analyzeWithGemini(imageData, strings.TrimSpace(req.Question))
	if err != nil {
		s.sendError(w, fmt.Sprintf("Error analyzing image: %v", err), http.StatusInternalServerError)
		return
	}

	log.Printf("✅ Gemini responded: %s...\n", truncate(response, 100))

	// Send success response
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(AnalyzeResponse{
		Success:  true,
		Response: response,
	})
}

// Analyze with Gemini API (image + optional question, or question-only)
func (s *Server) analyzeWithGemini(imageData []byte, question string) (string, error) {
	if s.geminiClient == nil {
		return "", fmt.Errorf("API key not set. Please enter your API key in the web app and try again.")
	}

	ctx := context.Background()

	// Build base prompt based on conversation history
	var basePrompt string
	if len(s.history) == 0 {
		basePrompt = `You are a friendly cooking assistant. 
If an image is provided, look at it and describe the food or ingredients you see.
If it looks like the user is cooking something, provide helpful step-by-step cooking instructions.
If you see ingredients, suggest what they could make with them.
If the user also asks a question (for example via text or voice), answer it directly while keeping the cooking context in mind.
Keep your response concise and practical - remember this will be read aloud.`
	} else {
		basePrompt = `Continue providing cooking guidance based on the latest information.
If there is a new image, describe any changes you see and what the user should do next.
If the user asks a question, answer it directly while staying within the cooking context.
Keep it concise and easy to follow.`
	}

	// Add explicit question if provided
	if strings.TrimSpace(question) != "" {
		basePrompt += "\n\nUser question: " + question
	}

	// Prepare parts for Gemini: text-only or text + image
	parts := []*genai.Part{
		{Text: basePrompt},
	}

	if len(imageData) > 0 {
		parts = append(parts, &genai.Part{
			InlineData: &genai.Blob{
				Data:     imageData,
				MIMEType: "image/jpeg",
			},
		})
	}

	// Use a current multimodal Gemini model (free tier friendly)
	resp, err := s.geminiClient.Models.GenerateContent(ctx, "gemini-2.5-flash", []*genai.Content{
		{Parts: parts},
	}, nil)
	if err != nil {
		return "", fmt.Errorf("failed to generate content: %w", err)
	}

	// Extract text from response
	if len(resp.Candidates) == 0 || resp.Candidates[0].Content == nil {
		return "", fmt.Errorf("no response from Gemini")
	}

	var responseText strings.Builder
	for _, part := range resp.Candidates[0].Content.Parts {
		if part.Text != "" {
			responseText.WriteString(part.Text)
		}
	}

	result := responseText.String()
	s.history = append(s.history, result)

	return result, nil
}

// Clear conversation history
func (s *Server) handleClearHistory(w http.ResponseWriter, r *http.Request) {
	enableCORS(w)

	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}

	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	s.history = make([]string, 0)
	log.Println("🗑️ Conversation history cleared")

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]bool{"success": true})
}

// Handle setting the API key from the frontend for this server session only.
type APIKeyRequest struct {
	APIKey string `json:"apiKey"`
}

func (s *Server) handleSetAPIKey(w http.ResponseWriter, r *http.Request) {
	enableCORS(w)

	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}

	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req APIKeyRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		s.sendError(w, fmt.Sprintf("Invalid request: %v", err), http.StatusBadRequest)
		return
	}

	apiKey := strings.TrimSpace(req.APIKey)
	if apiKey == "" {
		s.sendError(w, "API key cannot be empty", http.StatusBadRequest)
		return
	}

	// Set environment variable for this process/session only.
	if err := os.Setenv("GOOGLE_API_KEY", apiKey); err != nil {
		s.sendError(w, fmt.Sprintf("Failed to set API key: %v", err), http.StatusInternalServerError)
		return
	}

	if err := s.SetAPIKey(apiKey); err != nil {
		s.sendError(w, fmt.Sprintf("Failed to initialize Gemini client: %v", err), http.StatusInternalServerError)
		return
	}

	displayKey := apiKey
	if len(displayKey) > 10 {
		displayKey = apiKey[:10]
	}
	log.Printf("🔑 API key set from web UI: %s...\n", displayKey)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]bool{"success": true})
}

// Helper function to send error response
func (s *Server) sendError(w http.ResponseWriter, message string, statusCode int) {
	log.Printf("❌ Error: %s\n", message)
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	json.NewEncoder(w).Encode(AnalyzeResponse{
		Error: message,
	})
}

// Helper function to truncate strings
func truncate(s string, maxLen int) string {
	if len(s) <= maxLen {
		return s
	}
	return s[:maxLen] + "..."
}

// Get local IP address for mobile access
func getLocalIP() string {
	conn, err := net.Dial("udp", "8.8.8.8:80")
	if err != nil {
		return "localhost"
	}
	defer conn.Close()

	localAddr := conn.LocalAddr().(*net.UDPAddr)
	return localAddr.IP.String()
}

func main() {
	// Create server
	server := NewServer()
	defer server.Close()

	// Optionally load API key from environment if already set
	apiKey := os.Getenv("GOOGLE_API_KEY")
	if apiKey != "" {
		if err := server.SetAPIKey(apiKey); err != nil {
			log.Printf("❌ Failed to create server with existing API key: %v\n", err)
		} else {
			displayKey := apiKey
			if len(displayKey) > 10 {
				displayKey = apiKey[:10]
			}
			log.Printf("✅ API key loaded from environment: %s...\n", displayKey)
		}
	} else {
		log.Println("ℹ️ GOOGLE_API_KEY not set at startup. It can be provided via the web UI.")
	}

	// Set up routes
	http.HandleFunc("/", server.handleIndex)
	http.HandleFunc("/analyze", server.handleAnalyze)
	http.HandleFunc("/clear-history", server.handleClearHistory)
	http.HandleFunc("/set-api-key", server.handleSetAPIKey)

	// Serve static files; index.html references paths under /static/,
	// but the actual files (style.css, app.js) live in the project root.
	// FileServer root is ".", and /static/ is stripped so /static/style.css -> ./style.css.
	fs := http.FileServer(http.Dir("."))
	http.Handle("/static/", http.StripPrefix("/static/", fs))

	// Print startup information
	localIP := getLocalIP()
	port := "5000"

	fmt.Println("\n" + strings.Repeat("=", 60))
	fmt.Println("🍳 COOKING ASSISTANT WEB SERVER (Go + Gemini)")
	fmt.Println(strings.Repeat("=", 60))
	fmt.Println("\nStarting web server...")
	fmt.Printf("\n📱 Mobile Access:  http://%s:%s\n", localIP, port)
	fmt.Printf("💻 Desktop Access: http://localhost:%s\n", port)
	fmt.Println("\nPress Ctrl+C to stop the server")
	fmt.Println(strings.Repeat("=", 60) + "\n")

	// Start server
	log.Fatal(http.ListenAndServe(":"+port, nil))
}
