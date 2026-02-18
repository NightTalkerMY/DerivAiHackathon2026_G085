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

    def analyze_pre_trade_risk(self, user_history, proposed_trade, rag_context):
        """
        True Generative Analysis.
        Adaptively analyzes risk based on available history (0 to 3+ trades).
        """
        
        # --- 1. SAFE RAG EXTRACTION ---
        rag_text = "No specific reference intel available."
        if rag_context and isinstance(rag_context, dict):
            rag_text = rag_context.get('text', rag_text)
        
        # --- 2. ADAPTIVE HISTORY FORMATTING ---
        # Gracefully handle None or empty lists
        available_history = user_history if user_history else []
        
        # Slice the last 3, but Python handles it if len < 3 (e.g. returns 1 or 0 items)
        recent_trades = available_history[-3:] 
        
        history_str = ""
        if not recent_trades:
            history_str = "• No prior trades (New User / First Trade of Session)"
        else:
            # We iterate in reverse to show the most recent first
            for i, t in enumerate(reversed(recent_trades)):
                # Safe PnL Calculation (Fixes your KeyError)
                pnl = t.get('profit_and_loss')
                if pnl is None:
                    # Fallback calc
                    entry = t.get('entry_price', 0)
                    exit_price = t.get('exit_price', 0)
                    vol = t.get('volume', 0)
                    side = t.get('side', 'buy').lower()
                    price_delta = exit_price - entry
                    if side == 'sell': price_delta = -price_delta
                    pnl = price_delta * vol
                
                outcome = "WIN" if pnl > 0 else "LOSS"
                # Format: "Trade -1 (Last One): ..."
                history_str += f"Trade -{i+1}: {t.get('side')} {t.get('asset')} (Vol: {t.get('volume')}) -> Result: {outcome} (${pnl:.2f})\n"

        # --- 3. ADAPTIVE SYSTEM PROMPT ---
        # We explicitly tell the AI how to handle the "New User" vs "Veteran" case
        system_instruction = f"""
        You are "The Sensei", an expert trading psychologist.
        
        YOUR GOAL:
        Analyze the user's *intent* and *mental state* before they open this new trade.
        
        === DATA STREAM ===
        [User's Recent History]
        {history_str}
        
        [Proposed Trade Action]
        Asset: {proposed_trade['asset']}
        Side: {proposed_trade['side']}
        Volume: {proposed_trade['volume']}
        Time since last trade: {proposed_trade['time_since_last']} seconds
        
        === ANALYSIS PROTOCOL ===
        
        SCENARIO A: NO HISTORY (First Trade)
        - If the history says "No prior trades", be welcoming but sharp.
        - Say: "Fresh start. Eyes open."
        - Give a strategic tip for {proposed_trade['asset']} based on the Reference Intel.
        
        SCENARIO B: HISTORY EXISTS
        - Compare the 'Proposed Trade' Volume to the 'Recent History'.
        - **Gambling Check:** Is the new volume 2x larger than the last loss? (Martingale?)
        - **Revenge Check:** Is the time gap < 120 seconds after a loss?
        - **Tilt Check:** Are they on a 3-trade losing streak?
        
        === OUTPUT RULES ===
        1. If DANGER detected (Scenario B): 
           - Start with "WARNING:" 
           - Explain the psychological trap clearly.
        
        2. If NORMAL (Scenario A or Safe B): 
           - Do NOT use a prefix.
           - Just give a concise, strategic tip for the asset.
        
        REFERENCE INTEL (RAG):
        {rag_text}
        """

        return self.client.chat(
            user_input="I am about to take this trade. Scan for psychological risks.",
            system_instruction=system_instruction
        )

    def generate_post_trade_insight(self, trade_analysis, recommendations, rag_context):
        """
        Synthesizes trade results + specific module recommendations + RAG wisdom
        into a cohesive dashboard insight.
        """
        # 1. Format the recommendations for the LLM to read
        rec_str = "No specific modules assigned."
        if recommendations:
            rec_str = "\n".join([f"- Module: {r.get('module')}\n  Reason: {r.get('reason')}" for r in recommendations])

        # 2. Extract RAG text
        rag_text = "General trading discipline."
        if rag_context and isinstance(rag_context, list):
            # Take the top 2 chunks to avoid overloading context
            rag_text = "\n".join([str(item.get('text', '') or item.get('content', '')) for item in rag_context[:2]])

        # 3. Build the Prompt
        system_instruction = """
        You are "The Sensei", a wise and experienced trading mentor.
        
        CONTEXT:
        A student just closed a trade. Based on their performance, you have already assigned them specific learning modules.
        
        TASK:
        Write a **concise, high-impact Insight** (2-3 sentences max) for their dashboard.
        
        GUIDELINES:
        - **Connect the Dots:** Explain *why* the trade result (Win/Loss) leads to the recommended study topic.
        - **Use the Wisdom:** Incorporate the provided "Context/Wisdom" (RAG) to sound authoritative.
        - **Tone:** Encouraging but firm. Focus on growth.
        - **Format:** Plain text. Do NOT use markdown lists or bullet points. Do NOT say "I recommend..." (because the UI already shows the recommendation cards).
        """

        user_input = f"""
        --- TRADE DATA ---
        Outcome: {trade_analysis.get('trade outcome')}
        PnL: {trade_analysis.get('profit and loss')}
        Entry Notes: {trade_analysis.get('entry_notes', 'N/A')}

        --- ASSIGNED STUDY MODULES ---
        {rec_str}

        --- RELEVANT WISDOM (RAG) ---
        {rag_text}
        """

        # 4. Generate
        response = self.client.chat(
            user_input=user_input,
            system_instruction=system_instruction
        )
        
        return response.strip()

    def recommend_next_module(self, trade_analysis, curriculum_list):
        """
        Analyzes the trade outcome and picks TOP 1-3 chapters from the list.
        """
        # Flatten the list for the prompt so the LLM sees all options
        curriculum_str = ", ".join(curriculum_list) 
        
        system_instruction = f"""
        You are "The Sensei". You are analyzing a student's recent trade to assign a study plan.
        
        AVAILABLE SCROLLS (MODULES):
        [{curriculum_str}]
        
        TASK:
        Analyze the trade and identify **up to 3** relevant modules to fix their behavior. 
        
        RULES:
        1. Return ONLY a valid JSON object with this EXACT structure:
           {{
             "recommendations": [
                {{"module": "Exact Module Name", "reason": "Specific explanation..."}},
                {{"module": "Exact Module Name", "reason": "Specific explanation..."}}
             ]
           }}
        2. The "module" value MUST match one of the Available Scrolls exactly.
        """
        
        # PRO TIP: You need to pass more context if you want it to recommend 'Indicators'.
        # If the LLM doesn't know WHY they entered, it can't blame the indicator.
        # I added 'Entry Logic' to the input below as an example.
        user_input = f"""
        Asset Traded: {trade_analysis.get('asset')}
        Position: {trade_analysis.get('side')}
        Trade Outcome: {trade_analysis.get('trade outcome')}
        PnL: ${trade_analysis.get('profit and loss')}
        Risk Defined (Stop Loss): {trade_analysis.get('risk is defined')}
        Entry Logic/Notes: {trade_analysis.get('entry_notes', 'Not provided')} 
        """

        response = self.client.chat(
            user_input=user_input,
            system_instruction=system_instruction
        )
        
        try:
            # Clean up potential markdown formatting from the LLM
            clean_text = response.replace("```json", "").replace("```", "").strip()
            data = json.loads(clean_text)
            
            # Return the list of recommendations
            return data.get("recommendations", [])
            
        except json.JSONDecodeError:
            # Fallback if JSON fails
            return [{
                "module": "Trading performance and analysis", 
                "type": "Fallback",
                "reason": "Sensei could not parse the trade data. Review discipline."
            }]

    def generate_dashboard_summary(self, user_stats, rag_context, recent_event_desc, competency_snapshot=None, gap_analysis=None):
        """
        Generates a concise, high-level summary for the Dashboard UI.
        Now includes Competency (Theory) vs Performance (Reality) analysis.
        """
        # Handle defaults if arguments are missing
        competency_snapshot = competency_snapshot or {}
        gap_analysis = gap_analysis or "Reviewing general performance."

        system_instruction = f"""
        You are "The Sensei".
        
        TASK: Write a 2-sentence 'Daily Briefing' for the student's dashboard.
        
        INPUT CONTEXT:
        1. Recent Event: {recent_event_desc}
        2. Insight/Gap Analysis: {gap_analysis}
        3. Reference Knowledge: {rag_context['text'] if rag_context else 'General Wisdom'}
        
        STUDENT PROFILE:
        - Win Rate: {user_stats.get('directional accuracy percentage', 'N/A')}%
        - Total PnL: ${user_stats.get('total profit and loss', 'N/A')}
        - Risk Management Knowledge: {competency_snapshot.get('risk_management', 0)}/100
        - Methodology Knowledge: {competency_snapshot.get('methodology', 0)}/100
        
        GUIDELINES:
        - Be insightful, authoritative, and concise.
        - **CRITICAL:** Look at the 'Insight/Gap Analysis'. 
            - If it says "Discipline Issue" (High Knowledge, Low Execution), scold them gently: "You know better than this."
            - If it says "Knowledge Gap" (Low Knowledge, Low Execution), guide them: "You are trading blindly. Study the module."
        - Connect their recent stats to the educational concept (Reference).
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
        
        if not rag_context:
            return self._reject_with_humour(user_query)

        raw_history = self.user_memories.get(user_id, [])
        
        gemini_history = []
        for turn in raw_history:
            gemini_history.append(types.Content(
                role=turn["role"],
                parts=[types.Part(text=turn["text"])]
            ))

        clean_query = user_query.lower().strip()
        is_highlight = "explain this" in clean_query or "explain:" in clean_query

        # if is_highlight:
        #     display_query = user_query.replace('Can you explain this: "', '').rstrip('"?')
        # else:
        #     display_query = user_query

        # --- KEY CHANGE: Passing clean_query to prompt builder ---
        system_instruction = self._build_system_prompt(user_state, is_highlight, clean_query)

        full_input = (
            f"REFERENCE CONTEXT:\n{rag_context['text']}\n\n"
            f"USER QUESTION:\n{user_query}" 
        )
        
        response_text = self.client.chat(
            user_input=full_input,
            history=gemini_history, 
            system_instruction=system_instruction
        )
        
        new_user_turn = {"role": "user", "text": full_input}
        new_model_turn = {"role": "model", "text": response_text}
        
        if user_id not in self.user_memories:
            self.user_memories[user_id] = []
            
        self.user_memories[user_id].append(new_user_turn)
        self.user_memories[user_id].append(new_model_turn)
        
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

    def _build_system_prompt(self, user_state, is_highlight, user_query):
        """
        Dynamically builds the prompt based on user progress.
        Handles Intent Detection to HIDE stats if the user is just asking a question.
        """
        # --- 1. DETECT INTENT MANUALLY ---
        # If server.py says it's a highlight, OR if we see common question patterns
        is_knowledge_query = is_highlight or any(k in user_query for k in [
            "what is", "define", "explain", "how do", "tell me about", "mean by", "concept of"
        ])

        metrics = user_state.get('trade_metrics', {})
        progress = user_state.get('learning_progress', {})
        current = progress.get('current_chapter', 'Unknown')
        
        # --- 2. BRANCHING LOGIC FOR STATS VISIBILITY ---
        if is_knowledge_query:
            # HIDE STATS SO AI CANNOT CRITIQUE THEM
            student_profile = f"""
            • Current Lesson:    {current}
            • Mode:              KNOWLEDGE ACQUISITION (Stats Hidden)
            """
            
            instructions = """
            PRIORITY: PURE TEACHING
            1. The user is asking a definition or concept question.
            2. Answer ONLY using the REFERENCE CONTEXT provided.
            3. Do NOT reference their trading stats (they are hidden).
            4. Be concise and wise.
            """
        else:
            # SHOW STATS FOR GENERAL CHAT / REVIEW
            win_rate = metrics.get("directional accuracy percentage", "N/A")
            total_pnl = metrics.get("total profit and loss", "N/A")
            
            student_profile = f"""
            • Current Lesson:    {current}
            • Win Rate:          {win_rate}%
            • Total PnL:         ${total_pnl}
            """
            
            instructions = f"""
            PRIORITY: GENERAL MENTORSHIP
            
            1. FIRST: Answer the user's specific text input.
            
            2. SECOND (PERFORMANCE CHECK):
               - Your Win Rate is {win_rate}% and PnL is ${total_pnl}.
               - IF AND ONLY IF the user asks "How am I doing?" or "Review me":
                 - Critique the high win rate / low PnL anomaly ("picking up pennies").
               - OTHERWISE: Keep silent about the stats.
            """

        return f"""
        You are "The Sensei", a wise, slightly strict, but caring trading mentor.
        
        === STUDENT PROFILE ===
        {student_profile}
        
        === INSTRUCTIONS ===
        {instructions}
        
        === STYLE GUIDE ===
        - Tone: Wise, authoritative, concise (under 140 words).
        - Source of Truth: Use ONLY the provided REFERENCE CONTEXT for definitions.
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