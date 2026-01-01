"""
Test script for Phi-3 LoRA chatbot integration
"""

import sys
import os

# Add backend to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:
    print("Testing Phi-3 LoRA Chatbot Integration...")
    print("=" * 60)
    
    # Import the chatbot module
    import chatbot_model_phi3
    
    print("\n1. Testing basic query...")
    response = chatbot_model_phi3.generate_response("What is the minimum income for a loan?")
    print(f"Response: {response}")
    
    print("\n2. Testing credit score query...")
    response = chatbot_model_phi3.generate_response("How can I improve my credit score?")
    print(f"Response: {response}")
    
    print("\n3. Testing EMI calculation query...")
    response = chatbot_model_phi3.generate_response("Calculate EMI for 5 lakh loan")
    print(f"Response: {response}")
    
    print("\n" + "=" * 60)
    print("✅ Chatbot integration test completed successfully!")
    
except Exception as e:
    print(f"\n❌ Error during testing: {e}")
    import traceback
    traceback.print_exc()
