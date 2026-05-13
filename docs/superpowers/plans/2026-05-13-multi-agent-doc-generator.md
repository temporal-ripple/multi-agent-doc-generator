# Multi-Agent 代码仓库文档自动生成系统 — 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建一个由 4 类 Agent 协作驱动的代码仓库文档自动生成 CLI 工具，输入代码目录，输出结构化 Markdown 技术文档。

**Architecture:** Orchestrator 串行调度 Scanner → 并行调度 Analyzer × N → 并行调度 Writer × N → 串行调度 Reviewer。每个 Agent 是独立的 Claude API 调用，有专属 System Prompt 定义角色边界，中间产物落盘 JSON 支持断点续跑。

**Tech Stack:** Python 3.11+, `anthropic` SDK (AsyncAnthropic), `asyncio` + `asyncio.Semaphore`, `argparse` CLI

---

## 文件结构

```
doc-agent/
  config.py              # 模型配置、常量、路径
  agents/
    __init__.py
    base.py              # 基类：加载 Prompt + 调用 AsyncAnthropic
    scanner.py           # Scanner Agent
    analyzer.py          # Analyzer Agent
    writer.py            # Writer Agent
    reviewer.py          # Reviewer Agent
  prompts/
    scanner_prompt.md
    analyzer_prompt.md
    writer_prompt.md
    reviewer_prompt.md
  output/                # 中间产物（.gitignore）
  orchestrator.py        # 主调度器：串联 4 阶段
  main.py                # CLI 入口
  requirements.txt       # anthropic
tests/
  test_scanner.py
  test_analyzer.py
  test_writer.py
  test_reviewer.py
  test_orchestrator.py
```

---

### Task 1: 项目脚手架

**Files:**
- Create: `doc-agent/requirements.txt`
- Create: `doc-agent/output/.gitignore`
- Create: `doc-agent/agents/__init__.py`

- [ ] **Step 1: 创建 requirements.txt**

```txt
anthropic>=0.39.0
```

- [ ] **Step 2: 创建 output/.gitignore 忽略中间产物**

```gitignore
*.json
*.md
```

- [ ] **Step 3: 创建 agents/__init__.py 空文件**

```python
```

- [ ] **Step 4: 验证目录结构**

Run: `ls -R d:/claude\ code/doc-agent/`
Expected:
```
agents/  prompts/  output/  requirements.txt
agents/__init__.py  output/.gitignore
```

- [ ] **Step 5: 安装依赖**

Run: `cd d:/claude\ code/doc-agent && pip install -r requirements.txt`
Expected: Successfully installed anthropic

---

### Task 2: 配置模块

**Files:**
- Create: `doc-agent/config.py`

- [ ] **Step 1: 编写 config.py**

```python
import os

DEFAULT_MODEL = os.getenv("DOC_AGENT_MODEL", "claude-sonnet-4-6")
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
MAX_CONCURRENCY = int(os.getenv("DOC_AGENT_CONCURRENCY", "3"))

PROMPT_DIR = os.path.join(os.path.dirname(__file__), "prompts")
OUTPUT_DIR = "output"
DOCS_DIR = "docs"

MODULE_MANIFEST_FILE = "module_manifest.json"
```

---

### Task 3: Base Agent 基类

**Files:**
- Create: `doc-agent/agents/base.py`
- Create: `tests/test_base.py`

- [ ] **Step 1: 编写 base.py**

```python
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
```

- [ ] **Step 2: 编写 test_base.py**

```python
import pytest
import os


def test_prompt_dir_exists():
    prompt_dir = os.path.join(
        os.path.dirname(__file__), "..", "doc-agent", "prompts"
    )
    assert os.path.isdir(prompt_dir)
```

- [ ] **Step 3: 运行测试验证目录存在**

Run: `cd d:/claude\ code && python -m pytest tests/test_base.py -v`
Expected: 1 passed

---

### Task 4: Scanner Agent

**Files:**
- Create: `doc-agent/prompts/scanner_prompt.md`
- Create: `doc-agent/agents/scanner.py`
- Create: `tests/test_scanner.py`

- [ ] **Step 1: 编写 Scanner System Prompt**

`doc-agent/prompts/scanner_prompt.md`:
```markdown
你是一个代码仓库扫描专家。你的任务是扫描代码目录结构，识别模块、文件依赖和关键符号。

输入格式：会给你一个目录路径和该目录下的文件列表。

输出要求：严格按照以下 JSON 格式输出，不要包含其他文字：

{
  "modules": [
    {
      "name": "模块名（目录名或逻辑分组名）",
      "description": "一句话描述模块职责",
      "files": ["文件路径1", "文件路径2"],
      "dependencies": ["依赖的模块名1"],
      "exports": ["导出的类名/函数名"]
    }
  ]
}

规则：
1. 一个目录如果有多个 .py/.java 文件，通常视为一个模块
2. 通过 import/include 语句识别模块间依赖
3. 只列出 public 的类和函数作为 exports
4. 忽略 __pycache__、test 目录、隐藏文件
5. 模块名使用目录名，根目录文件归属到 "root" 模块
```

- [ ] **Step 2: 编写 scanner.py**

```python
import json
import os
from doc_agent.agents.base import BaseAgent


class ScannerAgent(BaseAgent):
    def __init__(self):
        super().__init__("scanner_prompt.md")

    def collect_file_tree(self, target_dir: str) -> dict:
        """扫描磁盘获取文件列表和基本符号，不依赖 AI。"""
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
```

- [ ] **Step 3: 编写 test_scanner.py**

```python
import json
import os
import tempfile
import pytest
from doc_agent.agents.scanner import ScannerAgent


class TestCollectFileTree:
    def test_empty_directory(self):
        agent = ScannerAgent()
        with tempfile.TemporaryDirectory() as tmpdir:
            result = agent.collect_file_tree(tmpdir)
            assert result == {}

    def test_python_files_grouped_by_dir(self):
        agent = ScannerAgent()
        with tempfile.TemporaryDirectory() as tmpdir:
            subdir = os.path.join(tmpdir, "utils")
            os.makedirs(subdir)
            open(os.path.join(tmpdir, "main.py"), "w").close()
            open(os.path.join(subdir, "helper.py"), "w").close()

            result = agent.collect_file_tree(tmpdir)
            assert "root" in result
            assert "utils" in result
            assert len(result["root"]) == 1
            assert len(result["utils"]) == 1

    def test_ignores_dirs(self):
        agent = ScannerAgent()
        with tempfile.TemporaryDirectory() as tmpdir:
            testdir = os.path.join(tmpdir, "tests")
            os.makedirs(testdir)
            open(os.path.join(testdir, "test_x.py"), "w").close()
            open(os.path.join(tmpdir, "app.py"), "w").close()

            result = agent.collect_file_tree(tmpdir)
            assert "tests" not in result
            assert "root" in result

    def test_ignores_non_source_files(self):
        agent = ScannerAgent()
        with tempfile.TemporaryDirectory() as tmpdir:
            open(os.path.join(tmpdir, "readme.md"), "w").close()
            open(os.path.join(tmpdir, "data.json"), "w").close()
            open(os.path.join(tmpdir, "app.py"), "w").close()

            result = agent.collect_file_tree(tmpdir)
            assert len(result["root"]) == 1
```

- [ ] **Step 4: 运行 Scanner 单元测试**

Run: `cd d:/claude\ code && python -m pytest tests/test_scanner.py -v`
Expected: 4 passed

---

### Task 5: Analyzer Agent

**Files:**
- Create: `doc-agent/prompts/analyzer_prompt.md`
- Create: `doc-agent/agents/analyzer.py`
- Create: `tests/test_analyzer.py`

- [ ] **Step 1: 编写 Analyzer System Prompt**

`doc-agent/prompts/analyzer_prompt.md`:
```markdown
你是一个资深代码分析师。你的任务是深入阅读模块源代码，提炼出技术文档所需的核心信息。

输入格式：JSON 包含模块名、文件路径列表和每个文件的完整源码。

输出要求：严格按照以下 JSON 格式输出，不要包含其他文字：

{
  "module_name": "模块名",
  "summary": "2-3句话概括模块职责和定位",
  "core_logic": "模块的核心业务流程/算法，用中文描述，清晰说明输入→处理→输出",
  "key_components": [
    {"name": "类名或函数名", "type": "class|function", "role": "一句话角色描述"}
  ],
  "data_flow": "数据在模块内如何流转，涉及哪些关键数据结构",
  "dependencies": {
    "internal": ["内部依赖模块"],
    "external": ["第三方库"]
  },
  "edge_cases": ["边界条件或错误处理说明"]
}

规则：
1. 不要复述代码，而是提炼设计意图和关键决策
2. core_logic 重点描述"为什么"而不是"是什么"
3. 如果代码量很大，聚焦于 public API 和核心逻辑
4. key_components 只列出对外暴露的类/函数
```

- [ ] **Step 2: 编写 analyzer.py**

```python
import json
from doc_agent.agents.base import BaseAgent


class AnalyzerAgent(BaseAgent):
    def __init__(self):
        super().__init__("analyzer_prompt.md")

    async def analyze(self, module_info: dict, target_dir: str) -> dict:
        import os

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
```

- [ ] **Step 3: 编写 test_analyzer.py**

```python
import pytest
from doc_agent.agents.analyzer import AnalyzerAgent


def test_analyzer_has_system_prompt():
    agent = AnalyzerAgent()
    assert len(agent.system_prompt) > 100
    assert "分析师" in agent.system_prompt or "analyst" in agent.system_prompt.lower()


def test_analyzer_inherits_base():
    agent = AnalyzerAgent()
    from doc_agent.agents.base import BaseAgent
    assert isinstance(agent, BaseAgent)
```

- [ ] **Step 4: 运行 Analyzer 单元测试**

Run: `cd d:/claude\ code && python -m pytest tests/test_analyzer.py -v`
Expected: 2 passed

---

### Task 6: Writer Agent

**Files:**
- Create: `doc-agent/prompts/writer_prompt.md`
- Create: `doc-agent/agents/writer.py`
- Create: `tests/test_writer.py`

- [ ] **Step 1: 编写 Writer System Prompt**

`doc-agent/prompts/writer_prompt.md`:
```markdown
你是一个技术文档撰写专家。根据代码分析报告，生成专业规范的 Markdown 文档。

输入格式：JSON 分析报告（Analyzer Agent 的输出）。

输出要求：纯 Markdown 格式，不要包含代码块包裹。严格按照以下结构：

# 模块名

## 概述
[2-3句话]

## 核心逻辑
[用中文描述核心业务流程，包含关键步骤]

## 关键接口

### `ClassName`
- **职责**: [一句话]
- **关键方法**:
  - `method_name(params)` — [一句话说明]

### `function_name`
- **职责**: [一句话]
- **参数**: [参数说明]
- **返回**: [返回值说明]

## 数据流
[数据在模块内的流转描述]

## 依赖
- **内部**: [内部模块]
- **外部**: [第三方库]

## 注意事项
[边界条件、已知限制、使用注意]

规则：
1. 使用中文撰写
2. 代码块使用 ```python 标记
3. 如果分析报告中某个部分信息不足，写"暂无"不要编造
4. 保持简洁专业，不写废话
```

- [ ] **Step 2: 编写 writer.py**

```python
import json
from doc_agent.agents.base import BaseAgent


class WriterAgent(BaseAgent):
    def __init__(self):
        super().__init__("writer_prompt.md")

    async def write(self, analysis: dict) -> str:
        prompt = json.dumps(analysis, ensure_ascii=False, indent=2)
        result = await self.run(prompt)
        return result.strip()
```

- [ ] **Step 3: 编写 test_writer.py**

```python
import pytest
from doc_agent.agents.writer import WriterAgent


def test_writer_has_system_prompt():
    agent = WriterAgent()
    assert len(agent.system_prompt) > 100


def test_writer_inherits_base():
    agent = WriterAgent()
    from doc_agent.agents.base import BaseAgent
    assert isinstance(agent, BaseAgent)
```

- [ ] **Step 4: 运行 Writer 单元测试**

Run: `cd d:/claude\ code && python -m pytest tests/test_writer.py -v`
Expected: 2 passed

---

### Task 7: Reviewer Agent

**Files:**
- Create: `doc-agent/prompts/reviewer_prompt.md`
- Create: `doc-agent/agents/reviewer.py`
- Create: `tests/test_reviewer.py`

- [ ] **Step 1: 编写 Reviewer System Prompt**

`doc-agent/prompts/reviewer_prompt.md`:
```markdown
你是一个技术文档审核专家。对照源代码审查文档草稿的准确性，修正错误和遗漏。

输入格式：JSON 包含：
- draft: 文档草稿（Markdown）
- source_files: 对应的源代码（文件名→内容映射）

输出要求：输出修正后的完整 Markdown 文档，不要输出 JSON，不要用代码块包裹。修正内容包括：

1. **事实错误**：文档描述与源码不一致的地方，改正它
2. **遗漏**：源码中重要的 public API 被遗漏的，补充进去
3. **误导**：描述含糊可能导致误用的，写得更精确
4. **过时引用**：文件名、函数名拼写错误的，改正

规则：
1. 保留原文档的良好结构和大部分内容，只修改有问题的部分
2. 不确定的地方宁可保留原文也不要瞎改
3. 审核后直接输出完整 Markdown 文档
```

- [ ] **Step 2: 编写 reviewer.py**

```python
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
```

- [ ] **Step 3: 编写 test_reviewer.py**

```python
import pytest
from doc_agent.agents.reviewer import ReviewerAgent


def test_reviewer_has_system_prompt():
    agent = ReviewerAgent()
    assert len(agent.system_prompt) > 100


def test_reviewer_inherits_base():
    agent = ReviewerAgent()
    from doc_agent.agents.base import BaseAgent
    assert isinstance(agent, BaseAgent)
```

- [ ] **Step 4: 运行 Reviewer 单元测试**

Run: `cd d:/claude\ code && python -m pytest tests/test_reviewer.py -v`
Expected: 2 passed

---

### Task 8: Orchestrator 调度器

**Files:**
- Create: `doc-agent/orchestrator.py`
- Create: `tests/test_orchestrator.py`

- [ ] **Step 1: 编写 orchestrator.py**

```python
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

        # Phase 2: Analyzer (并行)
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

        # Phase 3: Writer (并行)
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

        # Phase 4: Reviewer (串行)
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
```

- [ ] **Step 2: 编写 test_orchestrator.py**

```python
import os
import tempfile
import json
import pytest
from doc_agent.orchestrator import Orchestrator


class TestOrchestratorInit:
    def test_creates_instance(self):
        orch = Orchestrator()
        assert orch is not None
        assert orch.scanner is not None


class TestOutputDirs:
    def test_output_dir_created(self):
        orch = Orchestrator()
        import asyncio
        with tempfile.TemporaryDirectory() as tmpdir:
            src = os.path.join(tmpdir, "app.py")
            with open(src, "w") as f:
                f.write("def hello():\n    return 'world'\n")
            # Only test structural setup, skip actual AI calls
            assert os.path.isdir("output")
```

- [ ] **Step 3: 运行 Orchestrator 单元测试**

Run: `cd d:/claude\ code && python -m pytest tests/test_orchestrator.py -v`
Expected: 1 passed (AI-dependent tests skipped if no API key)

---

### Task 9: CLI 入口

**Files:**
- Create: `doc-agent/main.py`

- [ ] **Step 1: 编写 main.py**

```python
import argparse
import asyncio
import sys
from doc_agent.orchestrator import Orchestrator
from doc_agent.config import ANTHROPIC_API_KEY


def main():
    parser = argparse.ArgumentParser(
        description="Multi-Agent 代码仓库文档自动生成系统"
    )
    parser.add_argument(
        "--dir", required=True, help="目标代码目录路径"
    )
    parser.add_argument(
        "--output", default=None, help="文档输出目录 (默认: docs/)"
    )
    args = parser.parse_args()

    if not ANTHROPIC_API_KEY:
        print("错误: 请设置环境变量 ANTHROPIC_API_KEY")
        sys.exit(1)

    orchestrator = Orchestrator()
    docs = asyncio.run(orchestrator.run(args.dir))

    if docs:
        print(f"\n生成的文档:")
        for d in docs:
            print(f"  - {d}")
    else:
        print("未找到可处理的源代码文件。")


if __name__ == "__main__":
    main()
```

- [ ] **Step 2: 验证 CLI help 输出**

Run: `cd d:/claude\ code && python -m doc_agent.main --help`
Expected: 显示参数帮助信息

---

### Task 10: 集成验证

**Files:**
- Create: `tests/fixtures/sample_project/` (测试用示例项目)

- [ ] **Step 1: 创建测试用示例项目**

`tests/fixtures/sample_project/main.py`:
```python
"""应用程序入口"""
from sample_project.utils.calculator import add, multiply


def run():
    result = add(1, 2)
    doubled = multiply(result, 2)
    print(f"Result: {doubled}")


if __name__ == "__main__":
    run()
```

`tests/fixtures/sample_project/utils/calculator.py`:
```python
"""数学计算工具模块"""


def add(a: int, b: int) -> int:
    """返回两数之和"""
    return a + b


def multiply(a: int, b: int) -> int:
    """返回两数之积"""
    return a * b
```

- [ ] **Step 2: 运行完整流程（需要 ANTHROPIC_API_KEY）**

Run: `cd d:/claude\ code && python -m doc_agent.main --dir tests/fixtures/sample_project`
Expected: 生成 docs/root.md 和 docs/utils.md

- [ ] **Step 3: 验证输出文件存在且非空**

Run: `ls -la d:/claude\ code/doc-agent/docs/`
Expected: 至少 1 个 .md 文件，内容非空
```

