import json
import os
from doc_agent.agents.base import BaseAgent


class ReviewerAgent(BaseAgent):
    def __init__(self):
        super().__init__("reviewer_prompt.md")

    async def review(self, draft: str, module_files: list[str], target_dir: str) -> str:
        sources = {}
        for f in module_files:
            fpath = os.path.join(target_dir, f)
            try:
                with open(fpath, "r", encoding="utf-8") as fh:
                    sources[f] = fh.read()
            except Exception:
                sources[f] = "[unable to read]"

        prompt = json.dumps({
            "draft": draft,
            "source_files": sources,
        }, ensure_ascii=False, indent=2)

        result = await self.run(prompt[:200000])
        return result.strip()
