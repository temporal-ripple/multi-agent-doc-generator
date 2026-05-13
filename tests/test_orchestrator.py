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
