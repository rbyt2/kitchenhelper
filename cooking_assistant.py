
"""
Cooking Assistant Bot
Uses Claude Vision API to analyze what you're cooking via camera
and provides step-by-step instructions using text-to-speech.
"""

import cv2
import base64
import json
import time
from anthropic import Anthropic
import pyttsx3
from pathlib import Path
import sys

class CookingAssistant:
    def __init__(self, config_path="config.json"):
        """Initialize the cooking assistant with API credentials."""
        # Load API key from config
        with open(config_path, 'r') as f:
            config = json.load(f)
        
        self.api_key = config['api_key']
        if self.api_key == "YOUR_ANTHROPIC_API_KEY_HERE":
            print("ERROR: Please add your Anthropic API key to config.json")
            sys.exit(1)
        
        # Initialize Anthropic client
        self.client = Anthropic(api_key=self.api_key)
        
        # Initialize text-to-speech engine
        self.tts_engine = pyttsx3.init()
        self.tts_engine.setProperty('rate', 150)  # Speech rate
        
        # Initialize camera
        self.camera = cv2.VideoCapture(0)
        if not self.camera.isOpened():
            print("ERROR: Could not open camera")
            sys.exit(1)
        
        self.conversation_history = []
        
    def capture_image(self):
        """Capture an image from the camera."""
        ret, frame = self.camera.read()
        if not ret:
            print("ERROR: Failed to capture image")
            return None
        
        # Encode image to base64
        _, buffer = cv2.imencode('.jpg', frame)
        image_base64 = base64.b64encode(buffer).decode('utf-8')
        
        return image_base64
    
    def speak(self, text):
        """Convert text to speech."""
        print(f"\n🗣️ Claude: {text}\n")
        self.tts_engine.say(text)
        self.tts_engine.runAndWait()
    
    def analyze_cooking(self, image_base64, user_message=None):
        """Send image to Claude for analysis."""
        # Build the message content
        content = []
        
        # Add the image
        content.append({
            "type": "image",
            "source": {
                "type": "base64",
                "media_type": "image/jpeg",
                "data": image_base64
            }
        })
        
        # Add text prompt
        if user_message:
            prompt = user_message
        elif not self.conversation_history:
            prompt = """Look at this image and tell me what food or ingredients you see. 
            If it looks like I'm cooking something, provide helpful step-by-step cooking instructions.
            If you see ingredients, suggest what I could make with them.
            Keep your response concise and practical - remember this will be read aloud to me."""
        else:
            prompt = """Continue providing cooking guidance based on what you see now. 
            Has anything changed? What should I do next?"""
        
        content.append({
            "type": "text",
            "text": prompt
        })
        
        # Call Claude API
        try:
            response = self.client.messages.create(
                model="claude-sonnet-4-20250514",
                max_tokens=1000,
                messages=[
                    {
                        "role": "user",
                        "content": content
                    }
                ]
            )
            
            # Extract response text
            response_text = response.content[0].text
            return response_text
            
        except Exception as e:
            return f"Error calling Claude API: {str(e)}"
    
    def run_interactive(self):
        """Run the assistant in interactive mode."""
        print("=" * 60)
        print("🍳 COOKING ASSISTANT BOT")
        print("=" * 60)
        print("\nCommands:")
        print("  SPACE - Take a photo and get cooking advice")
        print("  'q' - Quit")
        print("  Any other text - Ask a specific question with the next photo")
        print("\nCamera feed starting...\n")
        
        custom_message = None
        
        try:
            while True:
                # Show camera feed
                ret, frame = self.camera.read()
                if ret:
                    cv2.imshow('Cooking Assistant Camera (Press SPACE to analyze)', frame)
                
                key = cv2.waitKey(1) & 0xFF
                
                # Space bar - capture and analyze
                if key == ord(' '):
                    print("\n📸 Capturing image...")
                    image_base64 = self.capture_image()
                    
                    if image_base64:
                        print("🤔 Analyzing with Claude...")
                        response = self.analyze_cooking(image_base64, custom_message)
                        self.speak(response)
                        custom_message = None  # Reset after use
                
                # 'q' - quit
                elif key == ord('q'):
                    print("\nExiting...")
                    break
        
        finally:
            self.cleanup()
    
    def run_automatic(self, interval=30):
        """Run the assistant in automatic mode - captures every N seconds."""
        print("=" * 60)
        print("🍳 COOKING ASSISTANT BOT - AUTOMATIC MODE")
        print("=" * 60)
        print(f"\nAnalyzing every {interval} seconds...")
        print("Press 'q' in the camera window to quit\n")
        
        try:
            while True:
                # Capture and analyze
                print(f"\n📸 Capturing image... ({time.strftime('%H:%M:%S')})")
                image_base64 = self.capture_image()
                
                if image_base64:
                    print("🤔 Analyzing with Claude...")
                    response = self.analyze_cooking(image_base64)
                    self.speak(response)
                
                # Wait and show camera feed
                start_time = time.time()
                while time.time() - start_time < interval:
                    ret, frame = self.camera.read()
                    if ret:
                        # Add countdown to frame
                        remaining = int(interval - (time.time() - start_time))
                        cv2.putText(frame, f"Next analysis in: {remaining}s", 
                                  (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 
                                  1, (0, 255, 0), 2)
                        cv2.imshow('Cooking Assistant Camera (Press q to quit)', frame)
                    
                    if cv2.waitKey(1) & 0xFF == ord('q'):
                        print("\nExiting...")
                        return
        
        finally:
            self.cleanup()
    
    def cleanup(self):
        """Clean up resources."""
        self.camera.release()
        cv2.destroyAllWindows()
        print("\n✅ Goodbye! Happy cooking!")


def main():
    """Main entry point."""
    print("\n" + "=" * 60)
    print("Welcome to the Cooking Assistant Bot!")
    print("=" * 60)
    
    # Check if config exists
    if not Path("config.json").exists():
        print("\nERROR: config.json not found!")
        print("Please create config.json with your Anthropic API key.")
        return
    
    # Initialize assistant
    assistant = CookingAssistant()
    
    # Choose mode
    print("\nSelect mode:")
    print("1. Interactive (press SPACE to analyze)")
    print("2. Automatic (analyzes every 30 seconds)")
    
    choice = input("\nEnter choice (1 or 2): ").strip()
    
    if choice == "1":
        assistant.run_interactive()
    elif choice == "2":
        assistant.run_automatic(interval=30)
    else:
        print("Invalid choice. Defaulting to interactive mode.")
        assistant.run_interactive()


if __name__ == "__main__":
    main()
