import pytest
import os


def test_prompt_dir_exists():
    prompt_dir = os.path.join(
        os.path.dirname(__file__), "..", "doc_agent", "prompts"
    )
    assert os.path.isdir(prompt_dir)
