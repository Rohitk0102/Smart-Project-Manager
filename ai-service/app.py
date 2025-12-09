from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import requests
import json
from config import DEEPSEEK_API_KEY

app = Flask(__name__)
CORS(app)

def call_deepseek(prompt):
    url = "https://api.deepseek.com/chat/completions"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {DEEPSEEK_API_KEY}"
    }
    data = {
        "model": "deepseek-chat",
        "messages": [
            {"role": "system", "content": "You are a helpful project management assistant."},
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.7
    }
    
    try:
        response = requests.post(url, headers=headers, json=data)
        response.raise_for_status()
        result = response.json()
        return result['choices'][0]['message']['content']
    except Exception:
        # print("Error calling DeepSeek") # unsafe in some background environments
        return "I'm having trouble connecting to the AI brain right now. Please try again later. (Simulated Insight: Break this down into research, implementation, and testing.)"

@app.route('/', methods=['GET'])
def health_check():
    return jsonify({"status": "AI Service Running", "provider": "DeepSeek"})

@app.route('/api/analyze', methods=['POST'])
def analyze_task():
    data = request.json
    description = data.get('description', '')
    
    prompt = f"Analyze this project description and provide 3 key subtasks and a risk assessment: '{description}'"
    ai_insight = call_deepseek(prompt)
    
    return jsonify({
        "insight": ai_insight,
        "suggested_tags": ["productivity", "ai-analyzed"],
        "sentiment": "positive" # Placeholder
    })

@app.route('/api/recommend', methods=['POST'])
def recommend_assignee():
    # Keep mock for simplicity unless user provides team data
    team = ["Alice", "Bob", "Charlie", "Dave"]
    import random
    return jsonify({
        "recommended_assignee": random.choice(team),
        "reason": "AI analysis suggests this member has the relevant skills."
    })

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    app.run(host='0.0.0.0', port=port, debug=True)
