# Multi-Agent 代码仓库文档自动生成系统 — 设计规格

## 概述

由 4 类 Agent 协作，输入代码目录，输出结构化的 Markdown 技术文档。解决代码库文档滞后、缺失的现实痛点。

## 架构

```
用户输入(代码目录)
    |
    v
Orchestrator（调度器）
    |
    +---> Scanner Agent        扫描目录结构 → 模块清单.json
    |
    +---> Analyzer Agent × N   并行读代码逻辑 → 分析报告.json
    |
    +---> Writer Agent × N     基于报告写文档 → 文档草稿.md
    |
    v
Reviewer Agent                 对照源码校验 → 最终文档.md
```

## Agent 角色定义

### Scanner Agent
- 输入：目标目录路径
- 职责：扫描文件树，识别 Python/Java 源文件，提取 import 关系、类/函数签名，输出模块依赖图
- 输出：`output/module_manifest.json` — 模块列表、依赖关系、文件清单

### Analyzer Agent
- 输入：单个模块的文件内容
- 职责：阅读理解代码逻辑，提取核心业务流程、数据结构、边界条件、设计意图
- 输出：`output/analysis_{module}.json` — 模块职责、核心流程、关键类/函数说明

### Writer Agent
- 输入：某模块的分析报告
- 职责：按标准模板生成 Markdown 文档，包含模块概述、核心逻辑流、API 接口、使用示例
- 输出：`output/draft_{module}.md`

### Reviewer Agent
- 输入：文档草稿 + 对应源码
- 职责：对照源码逐条核对文档准确性，修正描述错误、补充遗漏
- 输出：`docs/{module}.md` — 最终文档

## Orchestrator 调度逻辑

1. 调用 Scanner → 获取模块清单
2. 对模块列表并发调用 Analyzer（最多 3 个并发）
3. Analyzer 完成后，并发调用对应 Writer（最多 3 个并发）
4. 所有 Writer 完成后，逐模块调用 Reviewer 校验
5. 收集最终文档到 `docs/` 目录

## 技术栈

| 层面 | 选择 |
|------|------|
| 语言 | Python 3.11+ |
| AI 调用 | `anthropic` SDK（Claude API） |
| 异步并发 | `asyncio` + `asyncio.Semaphore` |
| 配置 | 环境变量 `ANTHROPIC_API_KEY` |
| 输入 | 本地目录路径 |
| 输出 | Markdown 文件到 `docs/` |

## 项目文件结构

```
doc-agent/
  orchestrator.py       # 主调度器
  agents/
    scanner.py          # Scanner Agent
    analyzer.py         # Analyzer Agent
    writer.py           # Writer Agent
    reviewer.py         # Reviewer Agent
  prompts/
    scanner_prompt.md   # Scanner 的 System Prompt
    analyzer_prompt.md   # Analyzer 的 System Prompt
    writer_prompt.md     # Writer 的 System Prompt
    reviewer_prompt.md   # Reviewer 的 System Prompt
  output/               # 中间产物（.gitignore）
  docs/                 # 最终文档输出
  main.py               # CLI 入口
  requirements.txt
```

## 使用方式

```bash
# 设置 API Key
export ANTHROPIC_API_KEY=sk-ant-...

# 对本地目录生成文档
python main.py --dir /path/to/project

# 指定输出目录
python main.py --dir /path/to/project --output ./my-docs
```

## 非功能约束

- 每个 Agent 调用是独立无状态的 Claude API 请求
- 中间产物（JSON）落盘，支持断点续跑
- Scanner 阶段必须成功后才能进入 Analyzer 阶段
- 模型默认使用 `claude-sonnet-4-6`，可通过环境变量覆写
