import requests
import json
import time
import random
import sys

BASE_URL = "http://localhost:8000"
USER_ID = "william" 

def header(title: str):
    print("\n" + "=" * 60)
    print(title)
    print("=" * 60)

def dump(data):
    print(json.dumps(data, indent=2))

def assert_ok(cond: bool, msg: str):
    if cond:
        print(f"✅ PASS: {msg}")
    else:
        print(f"❌ FAIL: {msg}")
        sys.exit(1)

# --- 1. HEALTH ---
def step_1_health_check():
    header("STEP 1: HEALTH CHECK")
    try:
        res = requests.get(f"{BASE_URL}/health", timeout=5)
        print("Status Code:", res.status_code)
        assert_ok(res.status_code == 200, "Server is online")
    except Exception as e:
        print("Error:", e)
        sys.exit(1)

# --- 2. CURRICULUM (Learning) ---
def step_2_curriculum_features():
    header("STEP 2: CURRICULUM & ASK AI")

    # A. Mark Chapter Complete
    print(">>> Testing /curriculum/complete...")
    payload_complete = {
        "user_id": USER_ID,
        "chapter_id": "Trading style" # Finishing a relevant chapter
    }
    res = requests.post(f"{BASE_URL}/curriculum/complete", json=payload_complete)
    data = res.json()
    
    assert_ok(res.status_code == 200, "Chapter completion accepted")
    assert_ok(data.get("new_competency", {}).get("methodology", 0) > 0, "Methodology Radar Updated")

    # B. Ask AI (Highlight Text)
    print("\n>>> Testing /curriculum/ask (Overlay)...")
    payload_ask = {
        "user_id": USER_ID,
        "current_chapter": "Risk and money management",
        "highlighted_text": "What is the 2% rule?"
    }
    res_ask = requests.post(f"{BASE_URL}/curriculum/ask", json=payload_ask)
    data_ask = res_ask.json()
    
    print(f"Explanation: {data_ask.get('explanation')[:100]}...")
    assert_ok("explanation" in data_ask, "AI Tutor returned explanation")

# --- 3. CHAT ---
def step_3_chat():
    header("STEP 3: CHAT ENDPOINT")

    payload = {
            "user_id": USER_ID,
            "query": "How do I calculate position size?",
            "user_state": {
                "current_chapter": "Risk and money management"
            }
        }

    start = time.time()
    res = requests.post(f"{BASE_URL}/chat", json=payload)
    latency = round(time.time() - start, 2)

    data = res.json()
    print(f"Sensei Response: {data.get('answer')[:100]}...")
    
    assert_ok(res.status_code == 200, "Chat response received")
    assert_ok(latency < 5.0, f"Latency acceptable ({latency}s)")

# --- 4. LIVE TRADE (Open) ---
def step_4_trade_open():
    header("STEP 4: LIVE TRADE OPEN (PRE-FLIGHT CHECK)")
    
    payload = {
        "user_id": USER_ID,
        "asset": "XAUUSD", 
        "side": "buy"
    }
    
    res = requests.post(f"{BASE_URL}/trade/open", json=payload)
    data = res.json()
    
    print(f"Overlay Message: {data.get('ai_overlay_message')}")
    assert_ok("ai_overlay_message" in data, "Pre-flight check received")

# --- 5. LIVE TRADE (Close) ---
def step_5_trade_simulation():
    header("STEP 5: LIVE TRADE CLOSE & ANALYSIS")

    # Simulate a LOSS to trigger 'Scold' logic and Recommendations
    payload = {
        "user_id": USER_ID,
        "asset": "XAUUSD",
        "side": "Buy",
        "entry_price": 2000.0,
        "exit_price": 2100.0, 
        "volume": 1.0,
        "open_time": time.time() - 300,
        "close_time": time.time(),
        "stop_loss": 1000.0,
        "take_profit": 3000.0
    }

    res = requests.post(f"{BASE_URL}/trade/close", json=payload)
    data = res.json()
    
    print("\n--- Trade Analysis ---")
    dump(data.get("analysis"))
    
    print("\n--- Immediate Insight (Overlay) ---")
    print(data.get("insight"))
    
    print("\n--- Recommended Study (Curricular) ---")
    dump(data.get("recommendation"))

    assert_ok(data.get("dashboard_updated") is True, "Dashboard Triggered")
    assert_ok("insight" in data, "Insight returned for Overlay")
    assert_ok("recommendation" in data, "Recommendation generated")

# --- 6. DASHBOARD (Persistence) ---
def step_6_dashboard_verification():
    header("STEP 6: DASHBOARD PERSISTENCE CHECK")

    res = requests.get(f"{BASE_URL}/dashboard/{USER_ID}")
    data = res.json()

    print(f"AI Insight Stored: {data.get('ai_insight')[:100]}...")
    print(f"Recommended Module: {data.get('recommended_study')}")

    # Verify the recommendation from Step 5 was actually saved to DB
    rec_module = data.get("recommended_study", {}).get("module")
    
    assert_ok(rec_module is not None, "Recommendation persisted in DB")
    assert_ok(len(data.get("recent_history")) > 0, "Trade history updated")

def main():
    random.seed(0)
    step_1_health_check()
    step_2_curriculum_features()
    step_3_chat()
    step_4_trade_open()
    step_5_trade_simulation()
    step_6_dashboard_verification()
    print("\nALL SYSTEM TESTS PASSED SUCCESSFULLY 🚀")

if __name__ == "__main__":
    main()