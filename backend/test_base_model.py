from transformers import AutoTokenizer, AutoModelForCausalLM
import torch

def test_base_model():
    base_model_name = "microsoft/Phi-3-mini-4k-instruct"
    print(f"Loading base model: {base_model_name}")
    try:
        tokenizer = AutoTokenizer.from_pretrained(base_model_name, trust_remote_code=True)
        model = AutoModelForCausalLM.from_pretrained(
            base_model_name,
            torch_dtype=torch.float32,
            trust_remote_code=True
        )
        print("Base model loaded successfully!")
        
        # Test generation
        inputs = tokenizer("Hello, how are you?", return_tensors="pt")
        outputs = model.generate(**inputs, max_new_tokens=10)
        print("Test generation successful!")
        print(tokenizer.decode(outputs[0]))
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_base_model()
