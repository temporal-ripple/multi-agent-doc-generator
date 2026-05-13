import anthropic
from doc_agent.config import DEFAULT_MODEL, ANTHROPIC_API_KEY, PROMPT_DIR
import os


class BaseAgent:
    def __init__(self, prompt_filename: str):
        prompt_path = os.path.join(PROMPT_DIR, prompt_filename)
        with open(prompt_path, "r", encoding="utf-8") as f:
            self.system_prompt = f.read()
        self.client = anthropic.AsyncAnthropic(api_key=ANTHROPIC_API_KEY)

    async def run(self, user_message: str, model: str | None = None) -> str:
        response = await self.client.messages.create(
            model=model or DEFAULT_MODEL,
            max_tokens=8192,
            system=self.system_prompt,
            messages=[{"role": "user", "content": user_message}],
        )
        return response.content[0].text
