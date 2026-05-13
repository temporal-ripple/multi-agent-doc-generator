import json
import os
from doc_agent.agents.base import BaseAgent


class AnalyzerAgent(BaseAgent):
    def __init__(self):
        super().__init__("analyzer_prompt.md")

    async def analyze(self, module_info: dict, target_dir: str) -> dict:
        files_content = []
        for f in module_info.get("files", []):
            fpath = os.path.join(target_dir, f)
            try:
                with open(fpath, "r", encoding="utf-8") as fh:
                    content = fh.read()
            except Exception:
                content = "[unable to read]"
            files_content.append({"path": f, "content": content})

        prompt = json.dumps({
            "module_name": module_info["name"],
            "files": files_content,
        }, ensure_ascii=False, indent=2)

        result = await self.run(prompt[:200000])
        result = result.strip()
        if result.startswith("```"):
            lines = result.split("\n")
            result = "\n".join(lines[1:-1] if lines[-1].strip() == "```" else lines[1:])
        return json.loads(result)
