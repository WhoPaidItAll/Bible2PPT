from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import declarative_base

Base = declarative_base()

class Bible(Base):
    __tablename__ = 'bibles'
    id = Column(Integer, primary_key=True)
    source_id = Column(Integer)
    # Add other fields as needed, e.g., name, language, etc.

class Book(Base):
    __tablename__ = 'books'
    id = Column(Integer, primary_key=True)
    bible_id = Column(Integer, ForeignKey('bibles.id'))
    # Add other fields, e.g., key, name, etc.

class Chapter(Base):
    __tablename__ = 'chapters'
    id = Column(Integer, primary_key=True)
    book_id = Column(Integer, ForeignKey('books.id'))
    number = Column(Integer)
    # Add other fields

class Verse(Base):
    __tablename__ = 'verses'
    id = Column(Integer, primary_key=True)
    chapter_id = Column(Integer, ForeignKey('chapters.id'))
    number = Column(Integer)
    text = Column(String)
    # Add other fields