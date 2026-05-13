import json
import os
from doc_agent.agents.base import BaseAgent


class ScannerAgent(BaseAgent):
    def __init__(self):
        super().__init__("scanner_prompt.md")

    def collect_file_tree(self, target_dir: str) -> dict:
        """Scan disk for file listing and basic symbols, no AI needed."""
        modules = {}
        source_extensions = {".py", ".java"}
        ignore_dirs = {"__pycache__", ".git", "node_modules", "test", "tests",
                       "venv", ".venv", "output", "docs", ".claude"}

        for root, dirs, files in os.walk(target_dir):
            dirs[:] = [d for d in dirs if d not in ignore_dirs and not d.startswith(".")]
            for f in files:
                ext = os.path.splitext(f)[1]
                if ext not in source_extensions:
                    continue
                filepath = os.path.join(root, f)
                relpath = os.path.relpath(filepath, target_dir)
                parent_dir = os.path.dirname(relpath) or "root"

                if parent_dir not in modules:
                    modules[parent_dir] = []
                modules[parent_dir].append(relpath)

        return modules

    async def scan(self, target_dir: str) -> dict:
        modules = self.collect_file_tree(target_dir)
        if not modules:
            return {"modules": []}

        source_files = []
        for mod, files in modules.items():
            for f in files:
                fpath = os.path.join(target_dir, f)
                try:
                    with open(fpath, "r", encoding="utf-8") as fh:
                        content = fh.read()
                except Exception:
                    content = "[unable to read]"
                source_files.append({"path": f, "content": content})

        prompt = json.dumps({
            "target_directory": target_dir,
            "module_groups": {k: v for k, v in modules.items()},
            "source_files": source_files,
        }, ensure_ascii=False, indent=2)

        result = await self.run(prompt[:200000])
        result = result.strip()
        if result.startswith("```"):
            lines = result.split("\n")
            result = "\n".join(lines[1:-1] if lines[-1].strip() == "```" else lines[1:])
        return json.loads(result)
