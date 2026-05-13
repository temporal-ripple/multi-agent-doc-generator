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
