"""
AI Credit Advisor Chatbot - OpenRouter API Version
Uses cloud-based LLM via OpenRouter - no local model download needed!
"""

import requests
import os
from typing import List, Dict, Optional

# OpenRouter API Configuration
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")
OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
# Switched to DeepSeek as per user request
MODEL_NAME = "deepseek/deepseek-chat"

if not OPENROUTER_API_KEY:
    print("[Chatbot] WARNING: OPENROUTER_API_KEY is missing. Chatbot will use fallback responses.")


# System prompt for AI Credit Advisor
SYSTEM_PROMPT = """You are an AI Credit Advisor for a digital banking loan application platform in India. 

Your role:
- Help users understand loan eligibility (income, credit score, employment)
- Provide credit score improvement tips  
- Explain EMI calculations and loan terms
- Answer questions about required documents (Aadhaar, PAN, salary slips)
- Guide through loan application process

Guidelines:
- Use Indian Rupee (₹) for currency
- Be concise: 2-4 sentences or bullet points
- Reference CIBIL score, Aadhaar, PAN
- Mention "Apply for Loan" section for detailed analysis
- Be encouraging and actionable

Quick Reference:
- Personal Loan: 10.5-24% interest, min income ₹25,000/month
- Home Loan: 8.5-11% interest
- Credit Score: 650+ required, 750+ for best rates
- EMI Rule: Keep below 40% of income"""


def generate_response(user_message: str, conversation_history: Optional[List[Dict[str, str]]] = None) -> str:
    """Generate response using OpenRouter API"""
    try:
        messages = [{"role": "system", "content": SYSTEM_PROMPT}]
        
        # Add conversation history
        if conversation_history:
            for msg in conversation_history[-4:]:
                role = "assistant" if msg.get("role") in ["bot", "assistant"] else "user"
                messages.append({"role": role, "content": msg.get("content", "")})
        
        messages.append({"role": "user", "content": user_message})
        
        response = requests.post(
            OPENROUTER_URL,
            headers={
                "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                "Content-Type": "application/json",
                "HTTP-Referer": os.getenv("RENDER_EXTERNAL_URL", "http://localhost:8000"),
                "X-Title": "AI Credit Advisor"
            },
            json={
                "model": MODEL_NAME,
                "messages": messages,
                "max_tokens": 300,
                "temperature": 0.7,
            },
            timeout=30
        )
        
        if response.status_code == 200:
            data = response.json()
            content = data.get("choices", [{}])[0].get("message", {}).get("content", "")
            if content:
                return content.strip()
            else:
                print(f"[Chatbot] Empty response: {data}")
                return fallback_response(user_message)
        else:
            print(f"[Chatbot] API Error {response.status_code}: {response.text}")
            return fallback_response(user_message)
                
    except Exception as e:
        print(f"[Chatbot] Error: {e}")
        return fallback_response(user_message)


def fallback_response(query: str) -> str:
    """Fallback responses when API fails"""
    return "⚠️ Internal Server Error: Unable to connect to AI service. The OpenRouter API may be down or the API key is missing/invalid. Please try again later or contact support."
