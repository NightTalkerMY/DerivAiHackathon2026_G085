import requests
import json
import time
import random

#  CONFIGURATION 
BASE_URL = "http://localhost:8000"
USER_ID = "william"  

def print_json(data):
    """Helper to pretty-print JSON responses"""
    print(json.dumps(data, indent=2))

def step_1_get_dashboard():
    print(f"\n [STEP 1] Fetching Dashboard for {USER_ID} ")
    try:
        response = requests.get(f"{BASE_URL}/dashboard/{USER_ID}")
        if response.status_code == 200:
            print("Success! Dashboard Data:")
            data = response.json()
            print(f"User Balance: {data['user_info']['balance']}")
            print(f"Competency: {data['competency_radar']}")
            # print(f"Stats: {data['performance_summary']}") # Optional
            print(f"History Count: {len(data['recent_history'])}")
        else:
            print(f"Failed: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"Connection Error: {e}")

def step_2_simulate_trades():
    print(f"\n [STEP 2] Simulating 12 Trades (Testing FIFO Limit & Sensei Feedback) ")
    
    # We send 12 trades. The first 2 should eventually be DELETED by the backend.
    for i in range(1, 13):
        is_win = random.choice([True, False])
        entry = random.uniform(60000, 62000)
        exit_price = entry + 500 if is_win else entry - 300
        
        payload = {
            "user_id": USER_ID,
            "asset": "BINANCE:BTCUSDT",
            "side": "Buy",
            "entry_price": round(entry, 2),
            "exit_price": round(exit_price, 2),
            "volume": 0.1,
            "open_time": time.time() - 60,
            "close_time": time.time(),
            "stop_loss": round(entry - 500, 2),
            "take_profit": round(entry + 1000, 2)
        }

        try:
            res = requests.post(f"{BASE_URL}/trade/close", json=payload)
            if res.status_code == 200:
                data = res.json()
                # FIXED: access 'trade_id' instead of 'message'
                print(f"Trade #{i} [{data['analysis']['outcome']}] -> ID: {data['trade_id']}")
                
                # SHOWCASE: Print the "Sensei Feedback" for the first trade only
                if i == 1:
                    print("\n SENSEI SINGLE TRADE ANALYSIS (First Trade) ")
                    print_json(data['analysis'])
                    print("-\n")
            else:
                print(f"Trade #{i} FAILED: {res.text}")
        except Exception as e:
            print(f"Trade #{i} ERROR: {e}")
            
        time.sleep(0.1) 

def step_3_verify_results():
    print(f"\n [STEP 3] Verifying Data Integrity ")
    response = requests.get(f"{BASE_URL}/dashboard/{USER_ID}")
    data = response.json()
    
    history = data['recent_history']
    count = len(history)
    
    print(f"Total Trades Stored: {count}")
    
    if count == 10:
        print("PASS: Backend successfully limited history to 10 items.")
    elif count == 12:
        print("FAIL: Backend stored all 12 trades (FIFO Logic Broken).")
    else:
        print(f"WARNING: stored {count} trades.")

    # Check if stats updated
    stats = data['performance_summary']
    print("\nUpdated Stats (Check Capital Efficiency & PnL/Sec):")
    print_json(stats)

if __name__ == "__main__":
    try:
        requests.get(f"{BASE_URL}/health") 
    except:
        print("Server not found at localhost:8000. Please run 'server_main.py' first.")
        exit()

    step_1_get_dashboard()
    step_2_simulate_trades()
    step_3_verify_results()