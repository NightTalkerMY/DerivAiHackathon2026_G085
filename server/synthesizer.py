import json
from groq import Groq
import config

class QuerySynthesizer:
    def __init__(self):
        self.client = Groq(api_key=config.GROQ_API_KEY)

    def generate_synthetic_query(self, event_type: str, data: dict) -> str:
        """
        Input: event_type="trade_close", data={"pnl": -100, "asset": "XAUUSD"}
        Output: "How to handle drawdown in volatile assets"
        """
        system_prompt = (
            "You are a Trading Analyst Assistant. "
            "Your job is to convert raw event data into a specific SEARCH QUERY for a vector database.\n"
            "The goal is to find educational content relevant to the user's recent action.\n"
            "Output ONLY the search query string. No quotes, no explanations."
        )

        # Craft the prompt based on event type
        if event_type == "trade_close":
            user_prompt = f"""
            EVENT: User closed a trade.
            DETAILS: {json.dumps(data)}
            
            TASK: Generate a search query to find advice on what they did right or wrong. 
            If PnL is negative, focus on risk management or psychology.
            If PnL is positive, focus on consistency or scaling.
            """

        elif event_type == "trade_open":
            # Data: {"asset": "BTCUSD", "side": "buy"}
            user_prompt = f"""
            EVENT: User is opening a NEW trade.
            DETAILS: {json.dumps(data)}
            
            TASK: Generate a search query to find specific "Watch outs" or "Key levels" 
            for this asset class or general entry rules.
            Example: "Gold volatility trading rules" or "Bitcoin breakout strategies"
            """

        elif event_type == "module_complete":
            user_prompt = f"""
            EVENT: User finished a learning module.
            DETAILS: {json.dumps(data)}
            
            TASK: Generate a search query to find advanced concepts related to this module 
            to suggest 'what's next'.
            """

        elif event_type == "concept_highlight":
            user_prompt = f"""
            EVENT: User highlighted text in a learning module.
            TEXT: "{data.get('highlighted_text')}"
            CONTEXT: Chapter "{data.get('current_chapter')}"
            
            TASK: Extract the CORE TRADING CONCEPT from the highlighted text.
            Convert it into a search query to find the definition and examples.
            """
        else:
            return "general trading principles"

        try:
            completion = self.client.chat.completions.create(
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                model=config.ROUTER_LLM_MODEL_NAME, # You might want to rename this constant in config too
                temperature=0.3, 
            )
            return completion.choices[0].message.content.strip()

        except Exception as e:
            print(f"Synthesizer Error: {e}")
            return "trading psychology and risk management"