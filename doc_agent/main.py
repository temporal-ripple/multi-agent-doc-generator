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
    parser.add_argument(
        "--demo", action="store_true",
        help="演示模式：无需 API Key，模拟多 Agent 协作流程"
    )
    args = parser.parse_args()

    if not args.demo and not ANTHROPIC_API_KEY:
        print("错误: 请设置环境变量 ANTHROPIC_API_KEY，或使用 --demo 进入演示模式")
        sys.exit(1)

    orchestrator = Orchestrator(demo=args.demo)
    docs = asyncio.run(orchestrator.run(args.dir))

    if docs:
        print(f"\n生成的文档:")
        for d in docs:
            print(f"  - {d}")
    else:
        print("未找到可处理的源代码文件。")


if __name__ == "__main__":
    main()
