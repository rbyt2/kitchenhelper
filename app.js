// Cooking Assistant Web App - Frontend JavaScript

class CookingAssistant {
    constructor() {
        this.video = document.getElementById('video');
        this.canvas = document.getElementById('canvas');
        this.captureBtn = document.getElementById('capture-btn');
        this.autoModeBtn = document.getElementById('auto-mode-btn');
        this.flipCameraBtn = document.getElementById('flip-camera-btn');
        this.switchCameraBtn = document.getElementById('switch-camera-btn');
        this.speakToggleBtn = document.getElementById('speak-toggle-btn');
        this.clearBtn = document.getElementById('clear-btn');
        this.dialogueContainer = document.getElementById('dialogue-container');
        this.cameraStatus = document.getElementById('camera-status');
        this.loadingOverlay = document.getElementById('loading-overlay');
        this.countdownDisplay = document.getElementById('countdown-display');
        this.countdownSeconds = document.getElementById('countdown-seconds');
        this.mobileIndicator = document.getElementById('mobile-indicator');
        this.questionInput = document.getElementById('question-input');
        this.voiceBtn = document.getElementById('voice-btn');
        this.sendQuestionBtn = document.getElementById('send-question-btn');
        this.restartAiBtn = document.getElementById('restart-ai-btn');
        
        this.stream = null;
        this.autoModeActive = false;
        this.autoModeInterval = null;
        this.countdownInterval = null;
        this.speakEnabled = true;
        this.cameraFlipped = false;
        this.speechSynthesis = window.speechSynthesis;
        
        // Mobile and camera switching
        this.isMobile = this.detectMobile();
        this.facingMode = 'environment'; // 'user' for front, 'environment' for back
        this.cameras = [];
        this.currentCameraIndex = 0;

        // Voice input
        this.recognition = null;
        this.isListening = false;
        
        this.init();
    }
    
    detectMobile() {
        const userAgent = navigator.userAgent || navigator.vendor || window.opera;
        
        // Check for mobile devices
        const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
        
        // Also check for touch capability and screen size
        const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        const isSmallScreen = window.innerWidth <= 768;
        
        return isMobileDevice || (hasTouch && isSmallScreen);
    }
    
    async init() {
        // Show mobile indicator if on mobile
        if (this.isMobile) {
            this.mobileIndicator.style.display = 'inline-block';
            this.switchCameraBtn.style.display = 'flex';
            
            // Enumerate cameras on mobile
            await this.getCameraList();
        }
        
        // Initialize camera
        await this.startCamera();
        
        // Setup event listeners
        this.captureBtn.addEventListener('click', () => this.captureAndAnalyze());
        this.autoModeBtn.addEventListener('click', () => this.toggleAutoMode());
        this.flipCameraBtn.addEventListener('click', () => this.toggleFlipCamera());
        this.switchCameraBtn.addEventListener('click', () => this.switchCamera());
        this.speakToggleBtn.addEventListener('click', () => this.toggleSpeak());
        this.clearBtn.addEventListener('click', () => this.clearHistory());

        if (this.restartAiBtn) {
            this.restartAiBtn.addEventListener('click', () => this.restartAI());
        }

        if (this.sendQuestionBtn && this.questionInput) {
            this.sendQuestionBtn.addEventListener('click', () => this.sendQuestion(false));
            this.questionInput.addEventListener('keydown', (event) => {
                if (event.key === 'Enter') {
                    event.preventDefault();
                    this.sendQuestion(false);
                }
            });
        }

        if (this.voiceBtn) {
            this.voiceBtn.addEventListener('click', () => this.toggleVoiceInput());
        }

        this.setupSpeechRecognition();
    }

    setupSpeechRecognition() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            // Gracefully degrade if not supported
            this.recognition = null;
            if (this.voiceBtn) {
                this.voiceBtn.disabled = true;
                this.voiceBtn.title = 'Voice input not supported in this browser';
            }
            return;
        }

        this.recognition = new SpeechRecognition();
        this.recognition.lang = 'en-US';
        this.recognition.interimResults = false;
        this.recognition.maxAlternatives = 1;

        this.recognition.addEventListener('result', (event) => {
            const transcript = Array.from(event.results)
                .map(result => result[0].transcript)
                .join(' ')
                .trim();

            if (transcript && this.questionInput) {
                this.questionInput.value = transcript;
                // Auto-send after voice input
                this.sendQuestion(false);
            }
        });

        this.recognition.addEventListener('end', () => {
            // Automatically stop listening state when recognition ends
            if (this.isListening) {
                this.isListening = false;
                this.updateVoiceButton();
            }
        });

        this.recognition.addEventListener('error', (event) => {
            console.error('Speech recognition error:', event.error);
            this.addMessage('system', 'Voice input error. Please try again or type your question instead.');
            this.isListening = false;
            this.updateVoiceButton();
        });
    }

    toggleVoiceInput() {
        if (!this.recognition) {
            this.addMessage('system', 'Your browser does not support voice input. Please use the text box instead.');
            return;
        }

        if (this.isListening) {
            this.recognition.stop();
            this.isListening = false;
        } else {
            try {
                this.recognition.start();
                this.isListening = true;
            } catch (e) {
                console.error('Error starting speech recognition:', e);
                this.addMessage('system', 'Could not start voice input. Please try again.');
                this.isListening = false;
            }
        }

        this.updateVoiceButton();
    }

    updateVoiceButton() {
        if (!this.voiceBtn) return;

        if (this.isListening) {
            this.voiceBtn.classList.add('active');
            this.voiceBtn.innerHTML = '<span class="btn-icon">🛑</span>';
            this.voiceBtn.title = 'Stop listening';
        } else {
            this.voiceBtn.classList.remove('active');
            this.voiceBtn.innerHTML = '<span class="btn-icon">🎙️</span>';
            this.voiceBtn.title = 'Ask by voice';
        }
    }
    
    async getCameraList() {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            this.cameras = devices.filter(device => device.kind === 'videoinput');
            console.log(`Found ${this.cameras.length} cameras`);
        } catch (error) {
            console.error('Error enumerating cameras:', error);
        }
    }
    
    async startCamera() {
        try {
            // Stop existing stream if any
            if (this.stream) {
                this.stream.getTracks().forEach(track => track.stop());
            }
            
            let constraints;
            
            if (this.isMobile && this.cameras.length > 0) {
                // On mobile, use specific camera or facingMode
                constraints = {
                    video: {
                        facingMode: this.facingMode,
                        width: { ideal: 1280 },
                        height: { ideal: 720 }
                    }
                };
            } else {
                // On desktop, use default camera
                constraints = {
                    video: {
                        width: { ideal: 1280 },
                        height: { ideal: 720 }
                    }
                };
            }
            
            this.stream = await navigator.mediaDevices.getUserMedia(constraints);
            this.video.srcObject = this.stream;
            
            const cameraType = this.facingMode === 'user' ? 'Front' : 'Back';
            this.updateCameraStatus(true, this.isMobile ? `${cameraType} camera ready` : 'Camera ready');
            this.captureBtn.disabled = false;
            
        } catch (error) {
            console.error('Error accessing camera:', error);
            this.updateCameraStatus(false, 'Camera access denied');
            this.addMessage('system', 'Error: Could not access camera. Please grant camera permissions and refresh the page.');
        }
    }
    
    async switchCamera() {
        if (!this.isMobile) return;
        
        // Toggle between front and back camera
        this.facingMode = this.facingMode === 'user' ? 'environment' : 'user';
        
        // Show a brief message
        const cameraType = this.facingMode === 'user' ? 'front' : 'back';
        this.updateCameraStatus(true, `Switching to ${cameraType} camera...`);
        
        // Restart camera with new facing mode
        await this.startCamera();
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
        
        // If camera is flipped, flip the captured image too
        if (this.cameraFlipped) {
            context.translate(this.canvas.width, 0);
            context.scale(-1, 1);
        }
        
        context.drawImage(this.video, 0, 0);
        
        // Reset transformation for next capture
        if (this.cameraFlipped) {
            context.setTransform(1, 0, 0, 1, 0, 0);
        }
        
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
            const question = this.questionInput ? this.questionInput.value.trim() : '';
            
            // Send to backend
            const response = await fetch('/analyze', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ image: imageBase64, question })
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

    async sendQuestion(forceTextOnly = false) {
        if (!this.questionInput) return;

        const question = this.questionInput.value.trim();
        if (!question) {
            return;
        }

        // Decide whether to include an image:
        // - If forceTextOnly is true, skip image.
        // - Otherwise, include a fresh camera capture if the camera is ready.
        let imageBase64 = '';
        if (!forceTextOnly && this.stream) {
            imageBase64 = this.captureImage();
        }

        this.showLoading(true);

        try {
            const response = await fetch('/analyze', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    image: imageBase64,
                    question
                })
            });

            const data = await response.json();

            if (data.error) {
                this.addMessage('error', data.error);
            } else {
                this.addMessage('claude', data.response);

                if (this.speakEnabled) {
                    this.speak(data.response);
                }
            }
            // Clear the question box after a successful send
            this.questionInput.value = '';
        } catch (error) {
            console.error('Error sending question:', error);
            this.addMessage('error', 'Failed to send question. Please check your connection and try again.');
        } finally {
            this.showLoading(false);
        }
    }

    async restartAI() {
        if (!confirm('Restart AI and clear its memory and conversation history?')) {
            return;
        }

        this.showLoading(true);

        try {
            const response = await fetch('/clear-history', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json().catch(() => ({}));
            if (!response.ok || data.error) {
                const msg = data && data.error ? data.error : 'Failed to restart AI.';
                this.addMessage('error', msg);
            } else {
                this.resetConversationUI();
                this.addMessage('system', 'AI has been restarted and its memory cleared.');
            }
        } catch (error) {
            console.error('Error restarting AI:', error);
            this.addMessage('error', 'Failed to restart AI. Please check your connection and try again.');
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
    
    toggleFlipCamera() {
        this.cameraFlipped = !this.cameraFlipped;
        
        if (this.cameraFlipped) {
            this.video.classList.add('flipped');
            this.flipCameraBtn.classList.add('active');
        } else {
            this.video.classList.remove('flipped');
            this.flipCameraBtn.classList.remove('active');
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
    
    async clearHistory() {
        if (!confirm('Are you sure you want to clear the conversation history?')) {
            return;
        }

        this.showLoading(true);

        try {
            const response = await fetch('/clear-history', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json().catch(() => ({}));
            if (!response.ok || data.error) {
                const msg = data && data.error ? data.error : 'Failed to clear AI history.';
                this.addMessage('error', msg);
                return;
            }

            this.resetConversationUI();
        } catch (error) {
            console.error('Error clearing history:', error);
            this.addMessage('error', 'Failed to clear history. Please check your connection and try again.');
        } finally {
            this.showLoading(false);
        }
    }

    resetConversationUI() {
        const welcomeMessage = this.dialogueContainer.querySelector('.welcome-message');
        this.dialogueContainer.innerHTML = '';
        if (welcomeMessage) {
            this.dialogueContainer.appendChild(welcomeMessage);
        }
    }
    
    showLoading(show) {
        this.loadingOverlay.style.display = show ? 'flex' : 'none';
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('api-key-modal');
    const input = document.getElementById('api-key-input');
    const submitBtn = document.getElementById('api-key-submit');
    const errorEl = document.getElementById('api-key-error');

    if (!modal || !input || !submitBtn) {
        // Fallback: if modal is missing for some reason, start app directly
        new CookingAssistant();
        return;
    }

    const showError = (message) => {
        if (!errorEl) {
            alert(message);
            return;
        }
        errorEl.textContent = message;
        errorEl.style.display = 'block';
    };

    const clearError = () => {
        if (!errorEl) return;
        errorEl.textContent = '';
        errorEl.style.display = 'none';
    };

    const submitApiKey = async () => {
        const apiKey = input.value.trim();
        clearError();

        if (!apiKey) {
            showError('Please enter your Gemini API key.');
            return;
        }

        submitBtn.disabled = true;
        submitBtn.textContent = 'Saving...';

        try {
            const response = await fetch('/set-api-key', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ apiKey })
            });

            const data = await response.json().catch(() => ({}));

            if (!response.ok || !data.success) {
                const msg = (data && data.error) ? data.error : 'Failed to save API key. Please try again.';
                showError(msg);
                return;
            }

            // Hide modal and start the main app
            modal.style.display = 'none';
            new CookingAssistant();
        } catch (error) {
            console.error('Error setting API key:', error);
            showError('Network error while setting API key. Please check your connection and try again.');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Save & Start Cooking Assistant';
        }
    };

    submitBtn.addEventListener('click', submitApiKey);
    input.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            submitApiKey();
        }
    });

    // Show modal on load
    modal.style.display = 'flex';
    input.focus();
});
