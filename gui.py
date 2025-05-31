from flask import Flask, request, jsonify
import sys
sys.path.append('/workspace/bible2ppt_python')
from bible2ppt_python.services.bible_service import BibleService
from bible2ppt_python.services.template_service import TemplateService
from bible2ppt_python.services.build_service import BuildService

app = Flask(__name__)

# Initialize services
bible_service = BibleService(db_url='sqlite:///bible_database.db', bible_index_service=None)
template_service = TemplateService()
build_service = BuildService()

@app.route('/', methods=['GET'])
def index():
    return "Bible2PPT Python Port is running. Try POST to /run_services."

@app.route('/run_services', methods=['POST'])
async def run_services():
    try:
        data = request.json
        source_id = data.get('source_id', 0)  # Expect JSON with source_id
        bibles = await bible_service.get_bibles_async(source_id)
        rendered = template_service.process_template({"id": 1, "content": "Sample"}, {"title": "Data"})
        build_result = build_service.process_build_data({"data": "Build data"})
        return jsonify({"bibles": bibles, "rendered": rendered, "build": build_result})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    from flask_cors import CORS
CORS(app)  # Enable CORS for all origins
app.run(host='0.0.0.0', port=50446, debug=True)  # Use specified port for accessibility  # Automatically assign an available port