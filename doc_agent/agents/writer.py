import json
from doc_agent.agents.base import BaseAgent


class WriterAgent(BaseAgent):
    def __init__(self):
        super().__init__("writer_prompt.md")

    async def write(self, analysis: dict) -> str:
        prompt = json.dumps(analysis, ensure_ascii=False, indent=2)
        result = await self.run(prompt)
        return result.strip()
