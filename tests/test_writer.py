import pytest
from doc_agent.agents.writer import WriterAgent


def test_writer_has_system_prompt():
    agent = WriterAgent()
    assert len(agent.system_prompt) > 100


def test_writer_inherits_base():
    agent = WriterAgent()
    from doc_agent.agents.base import BaseAgent
    assert isinstance(agent, BaseAgent)
