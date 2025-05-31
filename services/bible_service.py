import asyncio
from sqlalchemy import create_engine
from sqlalchemy.ext.asyncio import async_sessionmaker
from sqlalchemy.orm import declarative_base, sessionmaker
from typing import List
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))  # Add project root to sys.path
from bible2ppt_python.models import Base, Bible, Book, Chapter, Verse

class BibleService:
    def __init__(self, db_url: str, bible_index_service):
        self.engine = create_engine(db_url)
        Base.metadata.create_all(self.engine)  # Ensure tables are created
        self.Session = sessionmaker(bind=self.engine)
        self.async_session = async_sessionmaker(self.engine)  # For async operations
        self.bible_index_service = bible_index_service  # Dependency injection

    def find_bible(self, id: int):
        with self.Session() as session:
            return session.query(Bible).filter_by(id=id).first()

    async def clear_caches_async(self):
        with self.Session() as session:
            session.query(Bible).delete()
            session.query(Book).delete()
            session.commit()

    async def get_bibles_async(self, source_id: int) -> List:
        cached = self.get_cached_bibles(source_id)
        if cached:
            return cached
        bibles = await self.fetch_bibles_online(source_id)
        for bible in bibles:
            bible.source_id = source_id
        self.cache_bibles(bibles)
        return bibles

    async def fetch_bibles_online(self, source_id: int) -> List:
        return [Bible(id=1, source_id=source_id), Bible(id=2, source_id=source_id)]  # Dummy implementation

    def get_cached_bibles(self, source_id: int) -> List:
        with self.Session() as session:
            return session.query(Bible).filter_by(source_id=source_id).all()

    def cache_bibles(self, bibles: List):
        with self.Session() as session:
            session.add_all(bibles)
            session.commit()

    async def get_books_async(self, bible_id: int) -> List:
        cached = self.get_cached_books(bible_id)
        if cached:
            return cached
        books = await self.fetch_books_online(bible_id)
        self.cache_books(books, bible_id)
        return books