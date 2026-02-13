import json
import os
import config
from google import genai
from google.genai import types
from gemini_client import ResilientClient

# File to store chat history
HISTORY_FILE = "chat_sessions.json"

class SenseiBrain:
    def __init__(self):
        # Initialize the resilient client with keys from config
        self.client = ResilientClient(api_keys=config.GOOGLE_KEYS)
        
        # Load existing history from JSON file
        self.user_memories = self._load_history_from_disk()

    def analyze_trade_entry(self, asset, side, rag_context):
        """
        Provides immediate feedback when a user OPENS a trade.
        """
        system_instruction = f"""
        You are "The Sensei". The student is about to enter a {side.upper()} position on {asset}.
        
        REFERENCE INTEL:
        {rag_context['text'] if rag_context else 'General Market Wisdom'}
        
        TASK:
        Give a 1-sentence warning or tip.
        Speak as a strict mentor watching their student step onto the battlefield.
        Focus on what typically goes wrong with this specific asset or setup.
        """
        
        response = self.client.chat(
            user_input=f"I am entering {side} on {asset}. What should I watch out for?",
            system_instruction=system_instruction
        )
        return response

    def recommend_next_module(self, trade_analysis, curriculum_list):
            """
            Analyzes the trade outcome and picks the BEST chapter from the list.
            """
            curriculum_str = ", ".join(curriculum_list)
            
            system_instruction = f"""
            You are "The Sensei". You must assign the student's next lesson based on their recent performance.
            
            AVAILABLE SCROLLS (MODULES):
            [{curriculum_str}]
            
            TASK:
            Based on the student's recent trade, pick ONE module they must study next.
            
            RULES:
            1. Return ONLY a JSON object: {{"module": "Exact Module Name", "reason": "Strict, personalized explanation"}}
            2. The "reason" MUST reference the specific ASSET and the MISTAKE.
            - Bad Example: "You need to study risk."
            - Good Example: "You longed XAUUSD without a shield (Stop Loss) and paid the price. Review risk protocols immediately."
            3. If the trade was a LOSS, pick a module related to the mistake.
            4. The "module" value MUST match one of the Available Scrolls exactly.
            """
            
            # We pass the NEW personalized details here
            user_input = f"""
            Asset Traded: {trade_analysis.get('asset')}
            Position: {trade_analysis.get('side')}
            Trade Outcome: {trade_analysis['trade outcome']}
            PnL: ${trade_analysis['profit and loss']}
            Risk Defined (Stop Loss): {trade_analysis['risk is defined']}
            """

            response = self.client.chat(
                user_input=user_input,
                system_instruction=system_instruction
            )
            
            try:
                clean_text = response.replace("```json", "").replace("```", "").strip()
                return json.loads(clean_text)
            except:
                return {"module": "Trading performance and analysis", "reason": "Review your discipline."}
        

    def generate_dashboard_summary(self, user_stats, rag_context, recent_event_desc):
        """
        Generates a concise, high-level summary for the Dashboard UI.
        """
        system_instruction = f"""
        You are "The Sensei".
        
        TASK: Write a 2-sentence 'Daily Briefing' for the student's dashboard.
        
        INPUT CONTEXT:
        1. Recent Event: {recent_event_desc}
        2. Reference Knowledge: {rag_context['text'] if rag_context else 'General Wisdom'}
        3. Student Stats: WinRate {user_stats.get('directional accuracy percentage', 'N/A')}%, PnL ${user_stats.get('total profit and loss', 'N/A')}
        
        GUIDELINES:
        - Be insightful, authoritative, and concise.
        - Connect their recent action (Event) to the educational concept (Reference).
        - If they just lost money, be encouraging but firm about the lesson.
        - If they just finished a module, congratulate them and link it to their stats.
        """

        response = self.client.chat(
            user_input="Generate my Dashboard Summary.",
            system_instruction=system_instruction
        )
        return response
    
    def explain_learning_concept(self, text_highlight, rag_context, current_chapter):
        """
        Explains a specific concept highlighted by the user.
        """
        system_instruction = f"""
        You are "The Sensei".
        The student is reading Chapter: "{current_chapter}" and is confused by a specific concept.
        
        TASK: Explain the HIGHLIGHTED TEXT clearly but with wisdom.
        
        REFERENCE CONTEXT:
        {rag_context['text'] if rag_context else 'General Knowledge'}
        
        GUIDELINES:
        1. Definition: Define the concept simply.
        2. Example: Give a 1-sentence trading example.
        3. Keep it under 100 words.
        4. Be helpful, but maintain the persona of a wise mentor.
        """

        response = self.client.chat(
            user_input=f"Explain this concept: '{text_highlight}'",
            system_instruction=system_instruction
        )
        return response
        
    def generate_response(self, user_id, user_query, rag_context, user_state):
        """
        Orchestrates the Sensei's response generation with PERSISTENT MEMORY.
        """
        
        # 1. Check for "Out of Scope" (Strict guardrail)
        if not rag_context:
            return self._reject_with_humour(user_query)

        # 2. Retrieve history for this specific User
        # We need to convert the stored JSON dicts back into Google's 'types.Content' objects
        raw_history = self.user_memories.get(user_id, [])
        
        # Convert JSON -> Gemini Object
        gemini_history = []
        for turn in raw_history:
            gemini_history.append(types.Content(
                role=turn["role"],
                parts=[types.Part(text=turn["text"])]
            ))

        # 3. Build Input
        system_instruction = self._build_system_prompt(user_state)
        
        # We combine context + query here so it appears as one user block
        full_input = (
            f"REFERENCE CONTEXT:\n{rag_context['text']}\n\n"
            f"USER QUESTION:\n{user_query}"
        )
        
        # 4. Send to Gemini
        # Note: We pass the reconstructed gemini_history
        response_text = self.client.chat(
            user_input=full_input,
            history=gemini_history, 
            system_instruction=system_instruction
        )
        
        # 5. UPDATE MEMORY & SAVE TO DISK
        # Append the new interaction to our local state
        new_user_turn = {"role": "user", "text": full_input}
        new_model_turn = {"role": "model", "text": response_text}
        
        if user_id not in self.user_memories:
            self.user_memories[user_id] = []
            
        self.user_memories[user_id].append(new_user_turn)
        self.user_memories[user_id].append(new_model_turn)
        
        # Sync to JSON file immediately
        self._save_history_to_disk()
        
        return response_text

    def _load_history_from_disk(self):
        """Loads the JSON database into memory on startup."""
        if os.path.exists(HISTORY_FILE):
            try:
                with open(HISTORY_FILE, "r", encoding="utf-8") as f:
                    print(f"[System] Loading chat history from {HISTORY_FILE}...")
                    return json.load(f)
            except Exception as e:
                print(f"[System] Error loading history: {e}. Starting fresh.")
                return {}
        return {}

    def _save_history_to_disk(self):
        """Saves the current memory state to JSON."""
        try:
            with open(HISTORY_FILE, "w", encoding="utf-8") as f:
                json.dump(self.user_memories, f, indent=2, ensure_ascii=False)
        except Exception as e:
            print(f"[System] Failed to save history: {e}")

    def _build_system_prompt(self, user_state):
        """
        Dynamically builds the prompt based on user progress.
        UPDATED: Matches the verbose keys from analytics.py
        """
        metrics = user_state.get('trade_metrics', {})
        
        # Extract using YOUR specific keys
        # We default to 0 or "N/A" if the user has no trades yet
        
        win_rate = metrics.get("directional accuracy percentage", "N/A")
        total_pnl = metrics.get("total profit and loss", "N/A")
        trade_count = metrics.get("number of trades", 0)
        avg_pnl = metrics.get("average profit and loss per trade", "N/A")
        
        # Only grab these if they exist (to avoid errors on empty state)
        risk_rate = metrics.get("risk definition rate percentage", "N/A")

        progress = user_state.get('learning_progress', {})
        current = progress.get('current_chapter', 'Unknown')
        
        finished_list = progress.get('finished_chapters', [])
        finished_str = ", ".join(finished_list) if finished_list else "None"
        
        unfinished_list = progress.get('unfinished_chapters', [])
        unfinished_str = ", ".join(unfinished_list) if unfinished_list else "None"
        
        return f"""
        You are "The Sensei", a wise, slightly strict, but caring trading mentor.
        
        === STUDENT PROFILE ===
        • Current Lesson:    {current}
        • Win Rate:          {win_rate}%
        • Total PnL:         ${total_pnl}
        • Avg PnL/Trade:     ${avg_pnl}
        • Total Trades:      {trade_count}
        • Risk Discipline:   {risk_rate}% (How often they use Stop Losses)
        • Completed Modules: [{finished_str}]
        
        === INSTRUCTIONS ===
        1. **Source of Truth:** Answer using ONLY the provided REFERENCE CONTEXT.
        2. **Contextual Coaching:**
        - **If Win Rate is high (>60%) but Avg PnL is negative:** SCOLD them! Tell them they are "picking up pennies in front of a steamroller" (taking small wins, big losses).
        - **If Risk Discipline is low (<50%):** IGNORE their question and tell them to start using Stop Losses immediately.
        - **If Win Rate is low (<40%):** Be encouraging. Tell them to focus on "Market Structure" and not to give up.
        3. **Tone:** Concise (under 150 words), authoritative, using trading metaphors (e.g., "Market is a battlefield," "Price is truth").
        """

    def _reject_with_humour(self, user_query):
        """
        Uses the LLM to generate a dynamic, humorous rejection.
        """
        print(f"[Sensei] Rejecting query: '{user_query}'")
        
        rejection_instruction = """
        You are "The Sensei". The student has asked a question that is OUTSIDE the "Scrolls of Knowledge" (your database).
        
        TASK:
        Refuse to answer. You must be HUMOROUS, STERN, and use TRADING METAPHORS.
        
        Examples of style:
        - "Focus! That question is like buying the top of a meme coin - foolish."
        - "We are here to study charts, not the weather. Your focus is drifting like a loose stop-loss."
        
        Do NOT answer the question. Just scold them wittily.
        """
        
        # We assume rejection doesn't need history, just the current query
        response = self.client.chat(
            user_input=f"The student asked this off-topic question: '{user_query}'. Reject it.",
            system_instruction=rejection_instruction
        )
        
        return response