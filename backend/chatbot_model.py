"""
AI Credit Advisor Chatbot - Hybrid Model
Primary: OpenRouter API (DeepSeek)
Fallback: Local pretrained financial knowledge base
"""

import requests
import os
import re
from typing import List, Dict, Optional

# OpenRouter API Configuration
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")
OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
MODEL_NAME = "deepseek/deepseek-chat"

if not OPENROUTER_API_KEY:
    print("[Chatbot] WARNING: OPENROUTER_API_KEY is missing. Using local pretrained model.")


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


# =============================================================================
# LOCAL PRETRAINED FINANCIAL KNOWLEDGE BASE
# =============================================================================

FINANCIAL_KNOWLEDGE = {
    "loan_eligibility": {
        "keywords": ["eligible", "eligibility", "qualify", "can i get", "am i eligible", "loan approval"],
        "response": """📊 **Loan Eligibility Factors:**
• **CIBIL Score**: 650+ required, 750+ for best rates
• **Income**: Minimum ₹25,000/month for personal loans
• **Employment**: 1+ year work experience preferred
• **Age**: 21-60 years
• **Debt-to-Income**: EMI should be <40% of income

💡 Use our 'Apply for Loan' feature for a detailed AI-powered eligibility check!"""
    },
    "credit_score": {
        "keywords": ["credit score", "cibil", "credit rating", "improve score", "increase score", "bad credit"],
        "response": """📈 **Credit Score Guide (CIBIL):**
• **750-900**: Excellent - Best interest rates
• **700-749**: Good - Most loans approved
• **650-699**: Fair - Higher interest rates
• **Below 650**: Poor - May need secured loans

**Tips to Improve:**
1. Pay bills on time (35% impact)
2. Keep credit utilization below 30%
3. Don't close old credit cards
4. Limit new credit applications
5. Check for errors in credit report"""
    },
    "emi_calculation": {
        "keywords": ["emi", "monthly payment", "installment", "calculate emi", "emi formula"],
        "response": """💰 **EMI Calculation:**
EMI = P × r × (1+r)^n / ((1+r)^n - 1)

Where:
• P = Principal loan amount
• r = Monthly interest rate
• n = Loan tenure in months

**Example**: ₹5,00,000 loan at 12% for 5 years
• Monthly EMI ≈ ₹11,122
• Total Interest ≈ ₹1,67,320

💡 Our AI calculates this automatically when you apply!"""
    },
    "documents": {
        "keywords": ["document", "documents", "papers", "kyc", "aadhaar", "pan", "proof"],
        "response": """📄 **Required Documents for Loan:**

**Identity Proof (any one):**
• Aadhaar Card
• PAN Card
• Passport

**Income Proof:**
• Last 3 months salary slips
• 6 months bank statement
• Form 16 / ITR

**Address Proof:**
• Utility bills
• Rental agreement

✅ All documents can be uploaded digitally in our app!"""
    },
    "interest_rates": {
        "keywords": ["interest", "rate", "interest rate", "roi", "percentage"],
        "response": """📊 **Current Interest Rates (2024-25):**

| Loan Type | Rate Range |
|-----------|------------|
| Personal Loan | 10.5% - 24% |
| Home Loan | 8.5% - 11% |
| Car Loan | 8.5% - 14% |
| Education Loan | 8% - 15% |
| Business Loan | 14% - 24% |

💡 Your actual rate depends on credit score, income, and loan amount."""
    },
    "loan_types": {
        "keywords": ["types of loan", "loan types", "personal loan", "home loan", "car loan", "business loan"],
        "response": """🏦 **Types of Loans Available:**

1. **Personal Loan**: For any personal need, no collateral
2. **Home Loan**: For property purchase, longest tenure
3. **Car Loan**: Vehicle financing, car as security
4. **Education Loan**: Study expenses, moratorium period
5. **Business Loan**: Working capital, expansion

Each has different eligibility criteria and interest rates."""
    },
    "rejection": {
        "keywords": ["rejected", "rejection", "denied", "not approved", "loan refused"],
        "response": """❌ **Common Reasons for Loan Rejection:**

1. Low credit score (<650)
2. High existing debt (FOIR >50%)
3. Unstable employment
4. Incomplete documentation
5. Too many recent credit inquiries

**What to do next:**
• Wait 3-6 months before reapplying
• Improve credit score
• Reduce existing debts
• Ensure stable income source"""
    },
    "greeting": {
        "keywords": ["hi", "hello", "hey", "good morning", "good evening", "namaste"],
        "response": """👋 Hello! I'm your AI Credit Advisor.

I can help you with:
• Loan eligibility checks
• Credit score tips
• EMI calculations
• Document requirements
• Interest rate information

How can I assist you today?"""
    },
    "thanks": {
        "keywords": ["thank", "thanks", "thank you", "thx", "appreciate"],
        "response": """😊 You're welcome! Happy to help.

If you need anything else regarding loans or credit, feel free to ask. 

For a complete AI-powered loan analysis, use the 'Apply for Loan' section!"""
    }
}


def local_pretrained_response(query: str) -> str:
    """Generate response using local pretrained financial knowledge base"""
    query_lower = query.lower()
    
    # Find best matching category
    best_match = None
    best_score = 0
    
    for category, data in FINANCIAL_KNOWLEDGE.items():
        score = 0
        for keyword in data["keywords"]:
            if keyword in query_lower:
                score += len(keyword)  # Longer matches get higher score
        
        if score > best_score:
            best_score = score
            best_match = category
    
    if best_match and best_score > 0:
        return FINANCIAL_KNOWLEDGE[best_match]["response"]
    
    # Default response if no match
    return """🤖 I'm your AI Credit Advisor, trained on financial data.

I can help with:
• Loan eligibility & requirements
• Credit score improvement tips
• EMI calculations
• Document requirements
• Interest rate information

Please ask a specific question about loans or credit, or use our 'Apply for Loan' feature for a detailed AI analysis!"""


def generate_response(user_message: str, conversation_history: Optional[List[Dict[str, str]]] = None) -> str:
    """Generate response - tries API first, falls back to local model"""
    
    # If no API key, use local pretrained model directly
    if not OPENROUTER_API_KEY:
        print("[Chatbot] Using local pretrained model (no API key)")
        return local_pretrained_response(user_message)
    
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
            timeout=15  # Reduced timeout for faster fallback
        )
        
        if response.status_code == 200:
            data = response.json()
            content = data.get("choices", [{}])[0].get("message", {}).get("content", "")
            if content:
                return content.strip()
            else:
                print(f"[Chatbot] Empty API response, using local model")
                return local_pretrained_response(user_message)
        else:
            print(f"[Chatbot] API Error {response.status_code}, using local model")
            return local_pretrained_response(user_message)
                
    except requests.exceptions.Timeout:
        print("[Chatbot] API timeout, using local model")
        return local_pretrained_response(user_message)
    except Exception as e:
        print(f"[Chatbot] Error: {e}, using local model")
        return local_pretrained_response(user_message)


def fallback_response(query: str) -> str:
    """Ultimate fallback - uses local pretrained model"""
    return local_pretrained_response(query)
