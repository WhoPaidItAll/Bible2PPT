import asyncio
from bible2ppt_python.services.bible_service import BibleService  # Import the service
from bible2ppt_python.models import Base  # For database setup
from bible2ppt_python.services.template_service import TemplateService
from sqlalchemy import create_engine
from bible2ppt_python.services.build_service import BuildService

# Placeholder for database URL and other configurations
DB_URL = 'sqlite:///bible_database.db'  # Example; adjust as needed

def main():
    # Initialize services and database
    engine = create_engine(DB_URL)
    Base.metadata.create_all(engine)  # Create database tables
    bible_service = BibleService(DB_URL, bible_index_service=None)  # Placeholder for bible_index_service
    template_service = TemplateService()  # Initialize TemplateService
    build_service = BuildService()  # Initialize BuildService
    
    # Example usage
    print("Starting application...")
    # Add your main logic here, e.g., run async tasks
    asyncio.run(run_app(bible_service, template_service, build_service))

async def run_app(bible_service, template_service, build_service):
    # Example: Fetch bibles and process a template
    bibles = await bible_service.get_bibles_async(1)  # Example source_id
    for bible in bibles:
        print(bible)
    
    # Test TemplateService
    sample_data = {"title": "Sample Bible Data"}
    rendered_template = template_service.process_template({"id": 1, "content": "Sample template"}, sample_data)
    print(f"Rendered template: {rendered_template}")
    
    # Test BuildService
    build_result = build_service.process_build_data(sample_data)
    print(f"Build service result: {build_result}")



if __name__ == '__main__':
    main()