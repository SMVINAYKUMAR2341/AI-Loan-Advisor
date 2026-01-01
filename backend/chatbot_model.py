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
MODEL_NAME = "phi-2-lora/optimized-instruct"

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
    q = query.lower()
    
    if any(w in q for w in ['eligible', 'qualify', 'can i get', 'loan']):
        return """Loan Eligibility Factors:
• Income: Min ₹25,000/month
• Credit Score: 650+ (750+ for best rates)
• Employment: Min 1 year stable job
• Age: 21-60 years

👉 Use our Apply for Loan section for instant AI-powered eligibility check!"""
    
    if any(w in q for w in ['credit score', 'cibil', 'improve']):
        return """Improve Your Credit Score:
• Keep utilization below 30%
• Pay all bills on time
• Don't close old credit cards
• Avoid multiple loan applications

Score 750+ = Best interest rates!"""
    
    if any(w in q for w in ['emi', 'monthly', 'payment', 'calculate']):
        return """EMI Calculation:
For ₹5 Lakh @ 12% for 3 years = ~₹16,607/month

Golden Rule: Total EMIs should be < 40% of income

Use our loan calculator for precise estimates!"""
    
    if any(w in q for w in ['document', 'required', 'papers', 'kyc']):
        return """Required Documents:
• Aadhaar & PAN Card
• Last 3 salary slips
• 6 months bank statements
• Address proof

Upload in the Documents section of your dashboard!"""
    
    if any(w in q for w in ['interest', 'rate']):
        return """Current Interest Rates:
• Personal Loan: 10.5-24%
• Home Loan: 8.5-11%
• Car Loan: 7.5-15%
• Education Loan: 8-14%

Higher credit score = Lower rate!"""
    
    if any(w in q for w in ['hi', 'hello', 'hey', 'help']):
        return """Hello! 👋 I'm your AI Credit Advisor. 

I can help with:
• Loan eligibility
• Credit score tips
• EMI calculations
• Document requirements
• Interest rates

What would you like to know?"""
    
    return """I'm your AI Credit Advisor! Ask me about:
• "Am I eligible for a loan?"
• "How to improve credit score?"
• "What documents do I need?"
• "Calculate my EMI"

For detailed analysis, try our Apply for Loan section!"""

