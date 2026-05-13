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
