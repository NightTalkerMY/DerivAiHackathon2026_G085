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
        print(f"PASS: {msg}")
    else:
        print(f"FAIL: {msg}")
        sys.exit(1)


def step_1_health_check():
    header("STEP 1: HEALTH CHECK")
    try:
        res = requests.get(f"{BASE_URL}/health", timeout=5)
        print("Status Code:", res.status_code)
        assert_ok(res.status_code == 200, "Server is online")
    except Exception as e:
        print("Error:", e)
        sys.exit(1)


def step_2_curriculum_update():
    header("STEP 2: CURRICULUM UPDATE")

    payload = {
        "user_id": USER_ID,
        "chapter_id": "Trading tools"
    }

    res = requests.post(f"{BASE_URL}/curriculum/complete", json=payload)
    print("Status Code:", res.status_code)

    data = res.json()
    dump(data)

    score = data.get("new_competency", {}).get("foundations", 0)

    assert_ok(res.status_code == 200, "Chapter completion accepted")
    assert_ok(score > 0, f"Foundations score updated ({score})")


def step_3_chat():
    header("STEP 3: CHAT ENDPOINT")

    payload = {
        "user_id": USER_ID,
        "query": "What are some tools we can used trading master?",
        "user_state": {
            "current_chapter": "Trading tools",
            "finished_chapters": ["Trading tools"],
            "unfinished_chapters": [],
            "win_rate": "0%"
        }
    }

    start = time.time()
    res = requests.post(f"{BASE_URL}/chat", json=payload)
    latency = round(time.time() - start, 2)

    print("Status Code:", res.status_code)
    print("Latency:", latency, "seconds")

    data = res.json()
    dump(data)

    assert_ok(res.status_code == 200, "Chat response received")
    assert_ok("answer" in data and len(data["answer"]) > 0, "Answer present")
    assert_ok("sources" in data, "Sources present")


def step_4_live_trading():
    header("STEP 4: LIVE TRADING SIMULATION")

    for i in range(1, 13):
        win = random.choice([True, False])

        payload = {
            "user_id": USER_ID,
            "asset": "BINANCE:BTCUSDT",
            "side": "Buy",
            "entry_price": 65000.0,
            "exit_price": 66000.0 if win else 64000.0,
            "volume": 0.1,
            "open_time": time.time() - 120,
            "close_time": time.time(),
            "stop_loss": 64500.0,
            "take_profit": 66500.0
        }

        res = requests.post(f"{BASE_URL}/trade/close", json=payload)
        print(f"Trade {i}/12 Status:", res.status_code)

        data = res.json()

        if i == 1:
            print("First trade analysis:")
            dump(data.get("analysis", {}))

        assert_ok(res.status_code == 200, f"Trade {i} processed")

    print("All trades sent")


def step_5_dashboard_check():
    header("STEP 5: DASHBOARD VERIFICATION")

    res = requests.get(f"{BASE_URL}/dashboard/{USER_ID}")
    print("Status Code:", res.status_code)

    data = res.json()
    dump(data)

    history = data.get("recent_history", [])
    stats = data.get("performance_summary", {})
    radar = data.get("competency_radar", {})

    trade_count = stats.get("number of trades", stats.get("trade_count", 0))

    assert_ok(len(history) == 10, f"FIFO history count is 10 (got {len(history)})")
    assert_ok(trade_count == 10, f"Stats computed on 10 trades (got {trade_count})")
    assert_ok(radar.get("risk_management", 0) > 0, "Risk radar score persisted")


def main():
    random.seed(0)
    step_1_health_check()
    step_2_curriculum_update()
    step_3_chat()
    step_4_live_trading()
    step_5_dashboard_check()
    print("\nALL TESTS COMPLETED SUCCESSFULLY")


if __name__ == "__main__":
    main()
