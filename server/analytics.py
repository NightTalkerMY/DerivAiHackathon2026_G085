from typing import List, Dict, Optional

def analyze_batch(trades: List[Dict]) -> Dict:
    """
    Calculates aggregate performance metrics for the Dashboard.
    Restores ALL original signals (Capital Efficiency, PnL/Sec, Notional).
    """
    if not trades:
        return {
            "trade_count": 0, "total_pnl": 0.0, "avg_pnl_per_trade": 0.0,
            "avg_duration_sec": 0.0, "avg_notional": 0.0,
            "pnl_per_sec": 0.0, "capital_efficiency": 0.0,
            "direction_accuracy": 0.0, "risk_defined_rate": 0.0,
            "reward_defined_rate": 0.0, "structured_trade_rate": 0.0
        }

    total_pnl = 0.0
    total_duration = 0.0
    total_notional = 0.0
    correct_trades = 0
    risk_defined_count = 0
    reward_defined_count = 0

    for t in trades:
        # 1. basic extraction
        entry = t["entry_price"]
        exit_ = t["exit_price"]
        volume = t["volume"]
        side = t["side"].lower()
        
        # 2. PnL Calculation (Handle Shorts)
        price_delta = exit_ - entry
        pnl = price_delta * volume
        
        if side == "sell":
            pnl = pnl * -1 
            price_delta = price_delta * -1

        # 3. Time & Volume stats
        duration = t["close_time"] - t["open_time"]
        notional = entry * volume

        # 4. Aggregations
        total_pnl += pnl
        total_duration += duration
        total_notional += notional

        # 5. Counts
        if pnl > 0:
            correct_trades += 1
        
        if t.get("stop_loss") is not None:
            risk_defined_count += 1
        if t.get("take_profit") is not None:
            reward_defined_count += 1

    # --- DERIVED METRICS ---
    trade_count = len(trades)
    
    avg_pnl = total_pnl / trade_count
    avg_duration = total_duration / trade_count if trade_count > 0 else 0
    avg_notional = total_notional / trade_count if trade_count > 0 else 0
    
    # Avoid division by zero for time/capital
    pnl_per_sec = total_pnl / total_duration if total_duration > 0 else 0.0
    capital_efficiency = total_pnl / total_notional if total_notional > 0 else 0.0
    
    direction_accuracy = correct_trades / trade_count
    
    return {
        "number of trades": trade_count,
        "total profit and loss": round(total_pnl, 2),
        "average profit and loss per trade": round(avg_pnl, 2),
        "average trade duration in seconds": round(avg_duration, 2),
        "average trade notional value": round(avg_notional, 2),
        "profit and loss per second": round(pnl_per_sec, 4),
        "capital efficiency ratio": round(capital_efficiency, 6),
        "directional accuracy percentage": round(direction_accuracy * 100, 1),
        "risk definition rate percentage": round((risk_defined_count / trade_count) * 100, 1),
        "reward definition rate percentage": round((reward_defined_count / trade_count) * 100, 1),
        "structured trade rate percentage": round(
            ((risk_defined_count + reward_defined_count) / (trade_count * 2)) * 100, 1
        )
    }



def analyze_single_trade(t: Dict) -> Dict:
    """
    Analyzes ONE trade for the "Sensei" feedback loop.
    Focuses on Risk/Reward and Outcome.
    """
    entry = t["entry_price"]
    exit_ = t["exit_price"]
    vol = t["volume"]
    side = t["side"].lower()
    
    # PnL Logic
    price_delta = exit_ - entry
    if side == "sell":
        price_delta = price_delta * -1
        
    pnl = price_delta * vol
    outcome = "WIN" if pnl > 0 else "LOSS"
    if pnl == 0: outcome = "BREAKEVEN"

    # Duration
    duration = t["close_time"] - t["open_time"]

    # R-Multiple Calculation
    r_multiple = 0.0
    risk_defined = False
    
    if t.get("stop_loss"):
        risk_defined = True
        risk_per_share = abs(entry - t["stop_loss"])
        reward_per_share = abs(exit_ - entry)
        
        if risk_per_share > 0:
            raw_r = reward_per_share / risk_per_share
            r_multiple = raw_r if outcome == "WIN" else -raw_r

    return {
        "asset": t.get("asset", "Unknown Asset"),
        "side": side.upper(),
        "trade identifier": t.get("trade_id", "unknown"),
        "profit and loss": round(pnl, 2),
        "trade outcome": outcome,
        "trade duration in seconds": round(duration, 2),
        "risk is defined": risk_defined,
        "reward is defined": t.get("take_profit") is not None,
        "risk reward multiple": round(r_multiple, 2) if risk_defined else "Not Applicable"
    }
