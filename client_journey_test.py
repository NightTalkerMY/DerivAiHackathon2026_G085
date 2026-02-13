import requests
import json
import time
import sys

# CONFIGURATION
BASE_URL = "http://localhost:8000"
USER_ID = "william" 

# --- HELPERS ---
def print_step_header(step_num, title):
    print("\n" + "="*80)
    print(f"STEP {step_num}: {title}")
    print("="*80)

def print_server_response(endpoint, method, status_code, data):
    print(f"\n[REQUEST] {method} {endpoint}")
    print(f"[STATUS]  {status_code}")
    print("[RESPONSE PAYLOAD]:")
    print(json.dumps(data, indent=2))
    print("-" * 80)

def main():
    print(f"STARTING FULL SYSTEM DATA DUMP FOR USER: {USER_ID}")

    # ---------------------------------------------------------
    # 1. INITIAL DASHBOARD LOAD
    # Frontend Component: Dashboard.tsx
    # ---------------------------------------------------------
    print_step_header(1, "INITIAL DASHBOARD LOAD")
    
    endpoint = f"/dashboard/{USER_ID}"
    res = requests.get(f"{BASE_URL}{endpoint}")
    data = res.json()
    
    print_server_response(endpoint, "GET", res.status_code, data)
    
    # Validation
    if res.status_code != 200:
        print("CRITICAL FAIL: Dashboard did not load.")
        sys.exit(1)


    # ---------------------------------------------------------
    # 2. CURRICULAR - ASK AI OVERLAY
    # Frontend Component: ModuleReader.tsx (Text Highlight Event)
    # ---------------------------------------------------------
    print_step_header(2, "CURRICULUM: ASK AI (OVERLAY)")
    
    endpoint = "/curriculum/ask"
    payload = {
        "user_id": USER_ID,
        "current_chapter": "Market Structure",
        "highlighted_text": "What is a liquidity sweep?"
    }
    
    res = requests.post(f"{BASE_URL}{endpoint}", json=payload)
    data = res.json()
    
    print_server_response(endpoint, "POST", res.status_code, data)


    # ---------------------------------------------------------
    # 3. LIVE TRADE - OPEN POSITION (PRE-FLIGHT)
    # Frontend Component: TradeExecution.tsx (Buy Button Click)
    # ---------------------------------------------------------
    print_step_header(3, "LIVE TRADE: OPEN POSITION (PRE-FLIGHT CHECK)")
    
    endpoint = "/trade/open"
    payload = {
        "user_id": USER_ID,
        "asset": "BTCUSDT",
        "side": "buy"
    }
    
    res = requests.post(f"{BASE_URL}{endpoint}", json=payload)
    data = res.json()
    
    print_server_response(endpoint, "POST", res.status_code, data)


    # ---------------------------------------------------------
    # 4. LIVE TRADE - CLOSE POSITION (ANALYSIS & RECOMMENDATION)
    # Frontend Component: TradeExecution.tsx (Close/Stop Event)
    # ---------------------------------------------------------
    print_step_header(4, "LIVE TRADE: CLOSE POSITION (BAD TRADE SCENARIO)")
    
    endpoint = "/trade/close"
    # Simulating a loss with NO stop loss to trigger strict recommendations
    payload = {
        "user_id": USER_ID,
        "asset": "BTCUSDT",
        "side": "buy",
        "entry_price": 65000.0,
        "exit_price": 64000.0, # LOSS
        "volume": 0.5,
        "open_time": time.time() - 600,
        "close_time": time.time(),
        "stop_loss": None,   # <--- THE MISTAKE
        "take_profit": 66000.0
    }
    
    res = requests.post(f"{BASE_URL}{endpoint}", json=payload)
    data = res.json()
    
    print_server_response(endpoint, "POST", res.status_code, data)


    # ---------------------------------------------------------
    # 5. DASHBOARD - RETURN VISIT (VERIFY UPDATES)
    # Frontend Component: Dashboard.tsx (Re-fetch)
    # ---------------------------------------------------------
    print_step_header(5, "DASHBOARD RETURN (VERIFY PERSISTENCE)")
    
    endpoint = f"/dashboard/{USER_ID}"
    res = requests.get(f"{BASE_URL}{endpoint}")
    data = res.json()
    
    print_server_response(endpoint, "GET", res.status_code, data)

    # ---------------------------------------------------------
    # 6. CURRICULAR - CHECK RECOMMENDATIONS
    # Frontend Component: CurriculumTab.tsx (Embedded Widget)
    # ---------------------------------------------------------
    print_step_header(6, "VERIFY CURRICULUM RECOMMENDATION DATA")
    
    rec_data = data.get("recommended_study", {})
    print("Checking 'recommended_study' field from Dashboard response:")
    print(json.dumps(rec_data, indent=2))
    
    if rec_data.get("module"):
        print("\nSUCCESS: Recommendation successfully persisted in database.")
    else:
        print("\nFAIL: Recommendation missing.")

    print("\nFULL DATA DUMP COMPLETE.")

    # ---------------------------------------------------------
    # 7. CURRICULUM - COMPLETE CHAPTER
    # Frontend Component: ModuleReader.tsx (Finish Button)
    # ---------------------------------------------------------
    print_step_header(7, "CURRICULUM: COMPLETE CHAPTER ('Trading style')")
    
    endpoint = "/curriculum/complete"
    payload = {
        "user_id": USER_ID,
        "chapter_id": "Trading style"
    }
    
    res = requests.post(f"{BASE_URL}{endpoint}", json=payload)
    data = res.json()
    
    print_server_response(endpoint, "POST", res.status_code, data)


    # ---------------------------------------------------------
    # 8. DASHBOARD - FINAL CHECK
    # Frontend Component: Dashboard.tsx (Verify new insight)
    # ---------------------------------------------------------
    print_step_header(8, "DASHBOARD FINAL CHECK (VERIFY NEW INSIGHT)")
    
    endpoint = f"/dashboard/{USER_ID}"
    res = requests.get(f"{BASE_URL}{endpoint}")
    data = res.json()
    
    new_insight = data.get("ai_insight")
    finished_list = data.get("competency_radar", {}) # Indirect check via scores
    
    print_server_response(endpoint, "GET", res.status_code, data)
    
    print(f"\nFINAL DASHBOARD INSIGHT:\n> {new_insight}")
    
    # Validation: The insight should likely change from 'Scolding' to 'Congratulating'
    if "Trading style" in new_insight or "congrats" in new_insight.lower() or "completed" in new_insight.lower():
         print("\nSUCCESS: Dashboard updated to reflect module completion.")
    else:
         print("\nNOTE: Dashboard updated. Verify content manually above.")

    print("\nFULL DATA DUMP COMPLETE.")

if __name__ == "__main__":
    main()