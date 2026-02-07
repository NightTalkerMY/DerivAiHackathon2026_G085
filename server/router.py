import json
from groq import Groq
import config  # Import settings from config.py

class SemanticRouter:
    def __init__(self):
        self.client = Groq(api_key=config.GROQ_API_KEY)
        
        # Load glossary keys only (we don't need definitions for routing)
        try:
            with open(config.GLOSSARY_PATH, 'r', encoding='utf-8') as f:
                self.valid_tags = list(json.load(f).keys())
        except FileNotFoundError:
            print(f"Warning: {config.GLOSSARY_PATH} not found. Router has no tags.")
            self.valid_tags = []

    def get_relevant_tags(self, user_query: str) -> list:
        """
        Input: "I keep losing money, help!"
        Output: ["risk management", "psychology"]
        """ 
        if not self.valid_tags:
            return []

        # Construct Prompt
        glossary_string = ", ".join(self.valid_tags)
        
        system_prompt = (
            "You are a strict query classifier. "
            "Your job is to map the USER QUERY to the most relevant tags from the GLOSSARY list.\n"
            f"GLOSSARY: {glossary_string}\n\n"
            "RULES:\n"
            "1. Return ONLY a JSON list of strings (e.g. [\"tag1\", \"tag2\"]).\n"
            "2. Use ONLY tags from the glossary.\n"
            "3. If unrelated, return []."
        )

        try:
            completion = self.client.chat.completions.create(
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"USER QUERY: {user_query}"}
                ],
                model=config.ROUTER_LLM_MODEL_NAME,
                temperature=0.0,
            )

            response = completion.choices[0].message.content.strip()
            
            # Basic cleanup if the model chats too much
            if "```" in response:
                response = response.replace("```json", "").replace("```", "")
            
            return json.loads(response)

        except Exception as e:
            print(f"Router Error: {e}")
            return []