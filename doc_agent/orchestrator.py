import asyncio
import json
import os
from doc_agent.config import OUTPUT_DIR, DOCS_DIR, MODULE_MANIFEST_FILE, MAX_CONCURRENCY
from doc_agent.agents.scanner import ScannerAgent
from doc_agent.agents.analyzer import AnalyzerAgent
from doc_agent.agents.writer import WriterAgent
from doc_agent.agents.reviewer import ReviewerAgent


class Orchestrator:
    def __init__(self):
        self.scanner = ScannerAgent()
        self.semaphore = asyncio.Semaphore(MAX_CONCURRENCY)

    async def run(self, target_dir: str) -> list[str]:
        target_dir = os.path.abspath(target_dir)
        os.makedirs(OUTPUT_DIR, exist_ok=True)
        os.makedirs(DOCS_DIR, exist_ok=True)

        # Phase 1: Scanner
        print("[Scanner] 扫描代码目录...")
        manifest_path = os.path.join(OUTPUT_DIR, MODULE_MANIFEST_FILE)
        if os.path.exists(manifest_path):
            with open(manifest_path, "r", encoding="utf-8") as f:
                manifest = json.load(f)
            print("[Scanner] 从缓存加载模块清单")
        else:
            manifest = await self.scanner.scan(target_dir)
            with open(manifest_path, "w", encoding="utf-8") as f:
                json.dump(manifest, f, ensure_ascii=False, indent=2)

        modules = manifest.get("modules", [])
        if not modules:
            print("[Scanner] 未找到可处理的模块")
            return []

        print(f"[Scanner] 识别到 {len(modules)} 个模块")

        # Phase 2: Analyzer (parallel)
        async def analyze_module(mod):
            async with self.semaphore:
                name = mod["name"]
                cache_path = os.path.join(OUTPUT_DIR, f"analysis_{name}.json")
                if os.path.exists(cache_path):
                    with open(cache_path, "r", encoding="utf-8") as f:
                        return json.load(f)
                print(f"[Analyzer] 分析模块: {name}")
                analyzer = AnalyzerAgent()
                result = await analyzer.analyze(mod, target_dir)
                with open(cache_path, "w", encoding="utf-8") as f:
                    json.dump(result, f, ensure_ascii=False, indent=2)
                return result

        analyses = await asyncio.gather(*[analyze_module(m) for m in modules])

        # Phase 3: Writer (parallel)
        async def write_module(i):
            async with self.semaphore:
                name = modules[i]["name"]
                cache_path = os.path.join(OUTPUT_DIR, f"draft_{name}.md")
                if os.path.exists(cache_path):
                    with open(cache_path, "r", encoding="utf-8") as f:
                        return f.read()
                print(f"[Writer] 撰写文档: {name}")
                writer = WriterAgent()
                draft = await writer.write(analyses[i])
                with open(cache_path, "w", encoding="utf-8") as f:
                    f.write(draft)
                return draft

        drafts = await asyncio.gather(*[write_module(i) for i in range(len(modules))])

        # Phase 4: Reviewer (sequential)
        final_docs = []
        for i, mod in enumerate(modules):
            name = mod["name"]
            print(f"[Reviewer] 审核文档: {name}")
            reviewer = ReviewerAgent()
            final_doc = await reviewer.review(
                drafts[i], mod.get("files", []), target_dir
            )
            doc_path = os.path.join(DOCS_DIR, f"{name}.md")
            with open(doc_path, "w", encoding="utf-8") as f:
                f.write(final_doc)
            final_docs.append(doc_path)

        print(f"[Done] 生成 {len(final_docs)} 份文档 → {DOCS_DIR}/")
        return final_docs
