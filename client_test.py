import requests
import json

# 1. Define the Endpoint
API_URL = "http://localhost:8000/chat"

# 2. Define the Payload (Updated with new UserState fields)
payload = {
    "user_id": "william",
    "query": "Am I a good fit now for trading?", 
    "user_state": {
        "current_chapter": "1. Psychology",
        "finished_chapters": ["Introduction", "Risk Management"],   
        "unfinished_chapters": ["Technical Analysis"], 
        "win_rate": "80%"
    }
}

print(f"Sending request to {API_URL}...")

try:
    # 3. Send POST Request
    response = requests.post(API_URL, json=payload)
    
    # 4. Handle Response
    if response.status_code == 200:
        data = response.json()
        
        print("\nSUCCESS!\n")
        print(f"Sensei's Answer: {data['answer']}")
        print(f"Sources Used:    {data['sources']}")
        
        # --- NEW: Print the Retrieval Context ---
        if data.get('context'):
            print(f"\n[RAG Context Retrieved]")
            print(f"   Text Snippet: {data['context']['text']}...")
            print(f"   Metadata:     {data['context']['metadata']}")
            print(f"   Relevance Score: {data['context']['score']:.4f}")
        else:
            print("\n[No Context Retrieval]")
            
        print(f"\nTime Taken:      {data['latency_ms']}ms")
    else:
        print(f"\nError {response.status_code}: {response.text}")

except requests.exceptions.ConnectionError:
    print("\nCould not connect. Make sure 'main.py' is running!")