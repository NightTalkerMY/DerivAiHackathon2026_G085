import json
import os
from typing import List, Dict

# Paths
USER_DB = "database/users.json"
TRADE_DB = "database/trades.json"

# Book Curriculum
CURRICULUM = {
    "foundations": [
        "Goals and objectives",
        "Trading structure",
        "Trading tools",
    ],
    "methodology": [
        "Trading style",
        "Trading instruments",
    ],
    "indicators": [
        "Indicators",
        "Moving averages",
        "MACD histogram",
        "Average true range",
        "Volume",
    ],
    "risk_management": [
        "Risk and money management",
        "Stop losses",
        "Market exposure guidelines",
    ],
    "system_development": [
        "The trading system",
        "The entry",
        "Trade management and the exit",
        "Trading routine",
    ],
    "analysis_backup": [
        "Trading performance and analysis",
        "Contingency plans",
        "Personal rules",
    ],
}

class Database:
    def __init__(self):
        os.makedirs("data", exist_ok=True)
        if not os.path.exists(USER_DB): self._write_json(USER_DB, {})
        if not os.path.exists(TRADE_DB): self._write_json(TRADE_DB, {"raw": []})

    def _read_json(self, path):
        try:
            with open(path, 'r') as f: return json.load(f)
        except: return {}

    def _write_json(self, path, data):
        with open(path, 'w') as f: json.dump(data, f, indent=2)

    #  TRADE HISTORY (FIFO LOGIC) 
    def get_raw_trades(self) -> List[Dict]:
        """Returns the raw list of trades for analysis."""
        data = self._read_json(TRADE_DB)
        return data.get("raw", [])

    def get_user_trades(self, user_id: str) -> List[Dict]:
        """Returns the specific trade history for a user."""
        data = self._read_json(TRADE_DB)
        return data.get(user_id, [])

    def add_trade(self, user_id: str, trade_dict: dict):
        """
        Adds a trade to the user's history.
        ENFORCES LIMIT: Keeps only the last 10 trades.
        """
        data = self._read_json(TRADE_DB)
        
        # Create user list if not exists
        if user_id not in data:
            data[user_id] = []
            
        # Append the NEW trade
        data[user_id].append(trade_dict)
        
        # THE FIFO LOGIC (First In, First Out)
        # If we have more than 10, slice the list to keep only the last 10
        if len(data[user_id]) > 10:
            data[user_id] = data[user_id][-10:]
            
        self._write_json(TRADE_DB, data)

    #  USER PROFILE & COMPETENCY 
    def recalculate_competency(self, user_id):
        """Calculates Radar Chart based on Book Progress"""
        data = self._read_json(USER_DB)
        user = data.get(user_id)
        if not user: return {}

        finished = set(user["learning"].get("finished_chapters", []))
        new_scores = {}

        for category, chapters in CURRICULUM.items():
            if not chapters:
                new_scores[category] = 0
                continue
            completed_count = sum(1 for ch in chapters if ch in finished)
            new_scores[category] = int((completed_count / len(chapters)) * 100)

        user["competency"] = new_scores
        self._write_json(USER_DB, data)
        return new_scores

    def get_user_profile(self, user_id):
        self.recalculate_competency(user_id)
        return self._read_json(USER_DB).get(user_id, {})

    def mark_chapter_complete(self, user_id, chapter):
        data = self._read_json(USER_DB)
        if user_id in data:
            if chapter not in data[user_id]["learning"]["finished_chapters"]:
                data[user_id]["learning"]["finished_chapters"].append(chapter)
                self._write_json(USER_DB, data)
                self.recalculate_competency(user_id)

db = Database()