import requests
import json

def test_chatbot():
    url = "http://localhost:8000/chat"
    payload = {
        "message": "Am I eligible for a loan with 25k salary?",
        "conversation_history": []
    }
    headers = {
        'Content-Type': 'application/json'
    }

    try:
        print(f"Sending request to {url}...")
        response = requests.post(url, headers=headers, data=json.dumps(payload))
        
        if response.status_code == 200:
            print("Chatbot Response:")
            print(json.dumps(response.json(), indent=2))
        else:
            print(f"Error: {response.status_code}")
            print(response.text)
            
    except Exception as e:
        print(f"Connection error: {e}")

if __name__ == "__main__":
    test_chatbot()
