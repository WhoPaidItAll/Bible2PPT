import sys
import os
import pytest

import sys
sys.path.append('/workspace')  # Explicitly add workspace to sys.path
from bible2ppt_python.services.template_service import TemplateService  # Use absolute import

@pytest.fixture
def template_service():
    return TemplateService()

def test_process_template(template_service):
    template_data = {"content": "Hello, {name}!"}
    data = {"name": "World"}
    result = template_service.process_template(template_data, data)
    assert result == "Hello, World!"  # Test successful rendering

def test_process_template_error(template_service):
    template_data = {"content": "Hello, {name}!"}
    data = {}  # Missing key
    result = template_service.process_template(template_data, data)
    assert "Error: Missing key" in result  # Test error handling