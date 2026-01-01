import sys
import os

# Add backend to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

try:
    import chatbot_model_phi3
    print("Attempting to load model...")
    model, tokenizer, device = chatbot_model_phi3.load_model()
    
    if model is None:
        print("Model failed to load (returned None)")
    else:
        print(f"Model loaded successfully on {device}")
        
except Exception as e:
    print(f"Import or execution error: {e}")
    import traceback
    traceback.print_exc()
