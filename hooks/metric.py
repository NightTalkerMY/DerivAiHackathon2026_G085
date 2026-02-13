import json

def analyze_trades(trades: list[dict]) -> dict:
    if not trades:
        return {}

    total_pnl = 0.0
    total_duration = 0.0
    total_notional = 0.0
    correct_trades = 0

    risk_defined_count = 0
    reward_defined_count = 0

    for t in trades:
        entry = t["entry_price"]
        exit_ = t["exit_price"]
        volume = t["volume"]

        price_delta = exit_ - entry
        pnl = price_delta * volume
        duration = t["close_time"] - t["open_time"]
        notional = entry * volume

        total_pnl += pnl
        total_duration += duration
        total_notional += notional

        side = t["side"].lower()
        direction_correct = (
            (side == "buy" and price_delta > 0) or
            (side == "sell" and price_delta < 0)
        )

        if direction_correct:
            correct_trades += 1

        if t["stop_loss"] is not None:
            risk_defined_count += 1
        if t["take_profit"] is not None:
            reward_defined_count += 1

    trade_count = len(trades)

    avg_pnl = total_pnl / trade_count
    avg_duration = total_duration / trade_count
    avg_notional = total_notional / trade_count
    pnl_per_sec = total_pnl / total_duration if total_duration > 0 else 0.0
    capital_efficiency = total_pnl / total_notional if total_notional > 0 else 0.0
    direction_accuracy = correct_trades / trade_count

    return {
        "trade_count": trade_count,
        "total_pnl": round(total_pnl, 2),
        "avg_pnl_per_trade": round(avg_pnl, 2),
        "avg_duration_sec": round(avg_duration, 2),
        "avg_notional": round(avg_notional, 2),
        "pnl_per_sec": round(pnl_per_sec, 2),
        "capital_efficiency": round(capital_efficiency, 6),
        "direction_accuracy": round(direction_accuracy, 2),
        "risk_defined_rate": round(risk_defined_count / trade_count, 2),
        "reward_defined_rate": round(reward_defined_count / trade_count, 2),
        "structured_trade_rate": round(
            (risk_defined_count + reward_defined_count) / trade_count, 2
        )
    }


def print_summary(summary: dict):
    print("\n=== Trading Session Summary ===")
    # Total number of trades in this session
    print(f"Trades Count           : {summary['trade_count']}")

    # Net profit or loss across all trades
    print(f"Total PnL              : {summary['total_pnl']}")

    # Average profit or loss per trade
    print(f"Avg PnL / Trade        : {summary['avg_pnl_per_trade']}")

    # Average holding time per trade (in seconds)
    print(f"Avg Duration (sec)     : {summary['avg_duration_sec']}")

    # Average capital exposure per trade (entry_price × volume)
    print(f"Avg Notional           : {summary['avg_notional']}")

    # Profit generated per second across the session
    print(f"PnL / sec              : {summary['pnl_per_sec']}")

    # Overall efficiency of capital usage (total PnL / total notional)
    print(f"Capital Efficiency     : {summary['capital_efficiency']}")

    # Proportion of trades with correct market direction
    print(f"Direction Accuracy     : {summary['direction_accuracy']}")

    # Fraction of trades that had a predefined stop loss
    print(f"Risk Defined Rate      : {summary['risk_defined_rate']}")

    # Fraction of trades that had a predefined take profit
    print(f"Reward Defined Rate    : {summary['reward_defined_rate']}")

    # Fraction of trades with any predefined exit structure (SL or TP)
    print(f"Structured Trade Rate  : {summary['structured_trade_rate']}")


def main():
    with open("trades_history.json", "r") as f:
        data = json.load(f)

    trades = data.get("raw", [])
    summary = analyze_trades(trades)
    print_summary(summary)


if __name__ == "__main__":
    main()
