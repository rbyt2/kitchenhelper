// Cooking Assistant Web App - Frontend JavaScript

class CookingAssistant {
    constructor() {
        this.video = document.getElementById('video');
        this.canvas = document.getElementById('canvas');
        this.captureBtn = document.getElementById('capture-btn');
        this.autoModeBtn = document.getElementById('auto-mode-btn');
        this.speakToggleBtn = document.getElementById('speak-toggle-btn');
        this.clearBtn = document.getElementById('clear-btn');
        this.dialogueContainer = document.getElementById('dialogue-container');
        this.cameraStatus = document.getElementById('camera-status');
        this.loadingOverlay = document.getElementById('loading-overlay');
        this.countdownDisplay = document.getElementById('countdown-display');
        this.countdownSeconds = document.getElementById('countdown-seconds');
        
        this.stream = null;
        this.autoModeActive = false;
        this.autoModeInterval = null;
        this.countdownInterval = null;
        this.speakEnabled = true;
        this.speechSynthesis = window.speechSynthesis;
        
        this.init();
    }
    
    async init() {
        // Initialize camera
        await this.startCamera();
        
        // Setup event listeners
        this.captureBtn.addEventListener('click', () => this.captureAndAnalyze());
        this.autoModeBtn.addEventListener('click', () => this.toggleAutoMode());
        this.speakToggleBtn.addEventListener('click', () => this.toggleSpeak());
        this.clearBtn.addEventListener('click', () => this.clearHistory());
    }
    
    async startCamera() {
        try {
            this.stream = await navigator.mediaDevices.getUserMedia({ 
                video: { 
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                } 
            });
            this.video.srcObject = this.stream;
            
            this.updateCameraStatus(true, 'Camera ready');
            this.captureBtn.disabled = false;
            
        } catch (error) {
            console.error('Error accessing camera:', error);
            this.updateCameraStatus(false, 'Camera access denied');
            this.addMessage('system', 'Error: Could not access camera. Please grant camera permissions and refresh the page.');
        }
    }
    
    updateCameraStatus(active, text) {
        this.cameraStatus.querySelector('.status-text').textContent = text;
        if (active) {
            this.cameraStatus.classList.add('active');
        } else {
            this.cameraStatus.classList.remove('active');
        }
    }
    
    captureImage() {
        const context = this.canvas.getContext('2d');
        this.canvas.width = this.video.videoWidth;
        this.canvas.height = this.video.videoHeight;
        context.drawImage(this.video, 0, 0);
        
        // Get base64 image
        return this.canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
    }
    
    async captureAndAnalyze() {
        if (!this.stream) {
            alert('Camera not ready!');
            return;
        }
        
        this.showLoading(true);
        
        try {
            const imageBase64 = this.captureImage();
            
            // Send to backend
            const response = await fetch('/analyze', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ image: imageBase64 })
            });
            
            const data = await response.json();
            
            if (data.error) {
                this.addMessage('error', data.error);
            } else {
                this.addMessage('claude', data.response);
                
                // Speak the response if enabled
                if (this.speakEnabled) {
                    this.speak(data.response);
                }
            }
            
        } catch (error) {
            console.error('Error analyzing image:', error);
            this.addMessage('error', 'Failed to analyze image. Please check your connection and try again.');
        } finally {
            this.showLoading(false);
        }
    }
    
    toggleAutoMode() {
        this.autoModeActive = !this.autoModeActive;
        
        if (this.autoModeActive) {
            this.autoModeBtn.textContent = '⏸️ Stop Auto Mode';
            this.autoModeBtn.classList.add('active');
            this.countdownDisplay.style.display = 'block';
            this.startAutoMode();
        } else {
            this.autoModeBtn.innerHTML = '<span class="btn-icon">🔄</span> Auto Mode (30s)';
            this.autoModeBtn.classList.remove('active');
            this.countdownDisplay.style.display = 'none';
            this.stopAutoMode();
        }
    }
    
    startAutoMode() {
        let secondsRemaining = 30;
        
        // Immediate first capture
        this.captureAndAnalyze();
        
        // Countdown and capture every 30 seconds
        this.countdownInterval = setInterval(() => {
            secondsRemaining--;
            this.countdownSeconds.textContent = secondsRemaining;
            
            if (secondsRemaining <= 0) {
                this.captureAndAnalyze();
                secondsRemaining = 30;
            }
        }, 1000);
    }
    
    stopAutoMode() {
        if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
            this.countdownInterval = null;
        }
    }
    
    toggleSpeak() {
        this.speakEnabled = !this.speakEnabled;
        
        if (this.speakEnabled) {
            this.speakToggleBtn.innerHTML = '<span class="btn-icon">🔊</span> Sound On';
            this.speakToggleBtn.classList.add('active');
        } else {
            this.speakToggleBtn.innerHTML = '<span class="btn-icon">🔇</span> Sound Off';
            this.speakToggleBtn.classList.remove('active');
            this.speechSynthesis.cancel(); // Stop any ongoing speech
        }
    }
    
    speak(text) {
        // Cancel any ongoing speech
        this.speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.9;
        utterance.pitch = 1;
        utterance.volume = 1;
        
        this.speechSynthesis.speak(utterance);
    }
    
    addMessage(sender, content) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'dialogue-message';
        
        let icon = '🤖';
        let senderName = 'Claude';
        let borderColor = '#667eea';
        
        if (sender === 'error' || sender === 'system') {
            icon = '⚠️';
            senderName = 'System';
            borderColor = '#ff6b6b';
        }
        
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        messageDiv.innerHTML = `
            <div class="message-header">
                <span class="message-icon">${icon}</span>
                <span class="message-sender">${senderName}</span>
                <span class="message-time">${time}</span>
            </div>
            <div class="message-content">${this.formatMessage(content)}</div>
        `;
        
        messageDiv.style.borderLeftColor = borderColor;
        
        this.dialogueContainer.appendChild(messageDiv);
        this.dialogueContainer.scrollTop = this.dialogueContainer.scrollHeight;
    }
    
    formatMessage(text) {
        // Convert line breaks to paragraphs
        const paragraphs = text.split('\n\n');
        return paragraphs.map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`).join('');
    }
    
    clearHistory() {
        if (confirm('Are you sure you want to clear the conversation history?')) {
            // Keep only the welcome message
            const welcomeMessage = this.dialogueContainer.querySelector('.welcome-message');
            this.dialogueContainer.innerHTML = '';
            if (welcomeMessage) {
                this.dialogueContainer.appendChild(welcomeMessage);
            }
        }
    }
    
    showLoading(show) {
        this.loadingOverlay.style.display = show ? 'flex' : 'none';
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const app = new CookingAssistant();
});
