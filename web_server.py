#!/usr/bin/env python3
"""
Cooking Assistant Web Server
Flask backend that connects the web interface to Claude Vision API
"""

from flask import Flask, render_template, request, jsonify
import base64
import json
from anthropic import Anthropic
from pathlib import Path
import sys
import os

app = Flask(__name__)
CORS(app) # Enabling CORS for all routes, basically

# Load configuration
config_path = Path(__file__).parent / 'config.json'

# Try to get API key from environment variable first (for GitHub secrets)
api_key = os.environ.get('ANTHROPIC_API_KEY')

# If not in environment, try to load from config.json
if not api_key:
    try:
        with open(config_path, 'r') as f:
            config = json.load(f)
        api_key = config.get('api_key')
    except FileNotFoundError:
        print("ERROR: config.json not found and ANTHROPIC_API_KEY environment variable not set!")
        sys.exit(1)

# Check if we got a valid API key
if not api_key or api_key == "ANTHROPIC_API_KEY" or api_key == "YOUR_ANTHROPIC_API_KEY_HERE":
    print("ERROR: Please set the ANTHROPIC_API_KEY environment variable or add your API key to config.json")
    sys.exit(1)

# Initialize Anthropic client
client = Anthropic(api_key=api_key)

# Conversation history (stored per session - in production, use proper session management)
conversation_history = []


@app.route('/')
def index():
    """Serve the main web page"""
    return render_template('index.html')


@app.route('/analyze', methods=['POST'])
def analyze():
    """Analyze an image from the camera"""
    try:
        data = request.get_json()
        image_base64 = data.get('image')
        
        if not image_base64:
            return jsonify({'error': 'No image provided'}), 400
        
        # Build the prompt
        if not conversation_history:
            prompt = """Look at this image and tell me what food or ingredients you see. 
            If it looks like I'm cooking something, provide helpful step-by-step cooking instructions.
            If you see ingredients, suggest what I could make with them.
            Keep your response concise and practical - remember this will be read aloud."""
        else:
            prompt = """Continue providing cooking guidance based on what you see now. 
            Has anything changed? What should I do next? Keep it concise."""
        
        # Call Claude API
        response = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=1000,
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "image",
                            "source": {
                                "type": "base64",
                                "media_type": "image/jpeg",
                                "data": image_base64
                            }
                        },
                        {
                            "type": "text",
                            "text": prompt
                        }
                    ]
                }
            ]
        )
        
        # Extract response text
        response_text = response.content[0].text
        
        # Store in conversation history
        conversation_history.append({
            'role': 'user',
            'content': 'Image captured'
        })
        conversation_history.append({
            'role': 'assistant',
            'content': response_text
        })
        
        return jsonify({
            'success': True,
            'response': response_text
        })
        
    except Exception as e:
        print(f"Error in analyze endpoint: {str(e)}")
        return jsonify({
            'error': f'Error analyzing image: {str(e)}'
        }), 500


@app.route('/clear-history', methods=['POST'])
def clear_history():
    """Clear the conversation history"""
    global conversation_history
    conversation_history = []
    return jsonify({'success': True})


if __name__ == '__main__':
    print("\n" + "=" * 60)
    print("🍳 COOKING ASSISTANT WEB SERVER")
    print("=" * 60)
    print("\nStarting web server...")
    print("Open your browser and go to: http://localhost:5000")
    print("Press Ctrl+C to stop the server\n")
    print("=" * 60 + "\n")
    
    # Run the Flask app
    app.run(host='0.0.0.0', port=5000, debug=True)
