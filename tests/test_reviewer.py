import pytest
from doc_agent.agents.reviewer import ReviewerAgent


def test_reviewer_has_system_prompt():
    agent = ReviewerAgent()
    assert len(agent.system_prompt) > 100


def test_reviewer_inherits_base():
    agent = ReviewerAgent()
    from doc_agent.agents.base import BaseAgent
    assert isinstance(agent, BaseAgent)
