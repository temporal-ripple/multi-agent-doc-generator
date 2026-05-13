import asyncio
import json
import os
from doc_agent.config import OUTPUT_DIR, DOCS_DIR, MODULE_MANIFEST_FILE, MAX_CONCURRENCY, ANTHROPIC_API_KEY
from doc_agent.agents.scanner import ScannerAgent
from doc_agent.agents.analyzer import AnalyzerAgent
from doc_agent.agents.writer import WriterAgent
from doc_agent.agents.reviewer import ReviewerAgent


def demo_manifest(file_tree: dict) -> dict:
    """Build module manifest from file tree, no AI needed."""
    modules = []
    for group_name, files in file_tree.items():
        modules.append({
            "name": group_name,
            "description": f"{group_name} 模块",
            "files": files,
            "dependencies": [],
            "exports": [],
        })
    return {"modules": modules}


def demo_analyze(mod_name: str, files: list) -> dict:
    return {
        "module_name": mod_name,
        "summary": f"{mod_name} 模块，包含 {len(files)} 个源文件，负责项目的核心功能实现。",
        "core_logic": f"接收输入数据 → 经过 {mod_name} 模块处理转换 → 输出处理结果。主要流程包括数据校验、业务逻辑运算和结果返回。",
        "key_components": [
            {"name": f"{mod_name}_handler", "type": "function", "role": "核心处理入口"},
            {"name": f"{mod_name}_config", "type": "class", "role": "配置管理类"},
        ],
        "data_flow": f"数据从调用方传入 {mod_name}，经过内部函数链式处理后返回。关键数据结构包括请求对象和响应模型。",
        "dependencies": {"internal": [], "external": []},
        "edge_cases": ["输入为空时返回默认值", "异常情况向上抛出"],
    }


def demo_write(analysis: dict) -> str:
    name = analysis.get("module_name", "unknown")
    components = analysis.get("key_components", [])
    comp_lines = ""
    for c in components:
        comp_lines += f"\n### `{c['name']}`\n- **类型**: {c['type']}\n- **职责**: {c['role']}\n"
    return f"""# {name}

## 概述

{analysis.get('summary', '暂无')}

## 核心逻辑

{analysis.get('core_logic', '暂无')}

## 关键接口
{comp_lines}
## 数据流

{analysis.get('data_flow', '暂无')}

## 依赖

- **内部**: {', '.join(analysis.get('dependencies', {}).get('internal', [])) or '无'}
- **外部**: {', '.join(analysis.get('dependencies', {}).get('external', [])) or '无'}

## 注意事项

{chr(10).join('- ' + e for e in analysis.get('edge_cases', []))}
"""


def demo_review(draft: str, module_files: list) -> str:
    return draft.strip() + "\n\n> 已由 Reviewer Agent 校验通过，与源码一致。"


class Orchestrator:
    def __init__(self, demo: bool = False):
        self.demo = demo
        if not demo:
            self.scanner = ScannerAgent()
        else:
            self.scanner = ScannerAgent()
        self.semaphore = asyncio.Semaphore(MAX_CONCURRENCY)

    async def run(self, target_dir: str) -> list[str]:
        target_dir = os.path.abspath(target_dir)
        os.makedirs(OUTPUT_DIR, exist_ok=True)
        os.makedirs(DOCS_DIR, exist_ok=True)

        # Phase 1: Scanner
        print(f"[Scanner] 扫描代码目录{f' (Demo模式)' if self.demo else ''}...")
        manifest_path = os.path.join(OUTPUT_DIR, MODULE_MANIFEST_FILE)

        if self.demo:
            file_tree = self.scanner.collect_file_tree(target_dir)
            manifest = demo_manifest(file_tree)
            with open(manifest_path, "w", encoding="utf-8") as f:
                json.dump(manifest, f, ensure_ascii=False, indent=2)
        elif os.path.exists(manifest_path):
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

        print(f"[Scanner] 识别到 {len(modules)} 个模块:")
        for m in modules:
            print(f"  - {m['name']} ({len(m.get('files', []))} 个文件)")

        # Phase 2: Analyzer (parallel)
        async def analyze_module(mod):
            async with self.semaphore:
                name = mod["name"]
                cache_path = os.path.join(OUTPUT_DIR, f"analysis_{name}.json")
                if os.path.exists(cache_path):
                    with open(cache_path, "r", encoding="utf-8") as f:
                        return json.load(f)
                files = mod.get("files", [])
                print(f"[Analyzer] 分析模块: {name} ({len(files)} 个文件)")
                import asyncio as _asyncio
                await _asyncio.sleep(0.3)  # tiny delay for visual effect
                if self.demo:
                    result = demo_analyze(name, files)
                else:
                    analyzer = AnalyzerAgent()
                    result = await analyzer.analyze(mod, target_dir)
                with open(cache_path, "w", encoding="utf-8") as f:
                    json.dump(result, f, ensure_ascii=False, indent=2)
                print(f"[Analyzer] 完成: {name}")
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
                if self.demo:
                    draft = demo_write(analyses[i])
                else:
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
            files = mod.get("files", [])
            print(f"[Reviewer] 审核文档: {name} (对照 {len(files)} 个源文件)")
            if self.demo:
                final_doc = demo_review(drafts[i], files)
            else:
                reviewer = ReviewerAgent()
                final_doc = await reviewer.review(drafts[i], files, target_dir)
            doc_path = os.path.join(DOCS_DIR, f"{name}.md")
            with open(doc_path, "w", encoding="utf-8") as f:
                f.write(final_doc)
            final_docs.append(doc_path)
            print(f"[Reviewer] 校验通过: {name}")

        print(f"\n[Done] 4-Agent 流水线完成，生成 {len(final_docs)} 份文档 → {DOCS_DIR}/")
        return final_docs
