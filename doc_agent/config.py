import os

DEFAULT_MODEL = os.getenv("DOC_AGENT_MODEL", "claude-sonnet-4-6")
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
MAX_CONCURRENCY = int(os.getenv("DOC_AGENT_CONCURRENCY", "3"))

PROMPT_DIR = os.path.join(os.path.dirname(__file__), "prompts")
OUTPUT_DIR = "output"
DOCS_DIR = "docs"

MODULE_MANIFEST_FILE = "module_manifest.json"
