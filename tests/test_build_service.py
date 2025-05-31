import sys
import os
import pytest

import os
import sys
sys.path.append('/workspace')  # Explicitly add workspace to sys.path
from bible2ppt_python.services.build_service import BuildService  # Use absolute import
from pptx import Presentation  # Ensure it's imported if needed for mocks

@pytest.fixture
def build_service():
    return BuildService()

def test_process_build_data(build_service):
    build_data = {"title": "Test Title", "data": ["Item 1", "Item 2"]}
    result = build_service.process_build_data(build_data)
    assert result["processed"] == "Success"  # Test successful PPT generation
    assert "output_path" in result  # Check if output path is returned
    assert os.path.exists(result["output_path"])  # Verify if file is created

def test_process_build_data_error(build_service):
    build_data = {}  # Invalid data
    result = build_service.process_build_data(build_data)
    assert result["processed"] == "Error"  # Test error handling