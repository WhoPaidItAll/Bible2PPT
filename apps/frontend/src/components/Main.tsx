import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Presentation from './Presentation';
import TemplateEditor from './TemplateEditor';
import History from './History';

interface Book {
  id: number;
  name: string;
}

interface Chapter {
  id: string;
  number: number;
}

const Main: React.FC = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [selectedBookId, setSelectedBookId] = useState<number | null>(null);
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null);
  const [loadingBooks, setLoadingBooks] = useState<boolean>(true);
  const [loadingChapters, setLoadingChapters] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'bible' | 'presentation' | 'templates' | 'history'>('bible');

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const response = await axios.get('http://localhost:57038/api/bible-index/books');
        setBooks(response.data);
        setLoadingBooks(false);
      } catch (error) {
        console.error('Error fetching books:', error);
        setLoadingBooks(false);
      }
    };

    fetchBooks();
  }, []);

  useEffect(() => {
    if (selectedBookId !== null) {
      const fetchChapters = async () => {
        setLoadingChapters(true);
        try {
          const response = await axios.get(`http://localhost:57038/api/bible-index/books/${selectedBookId}/chapters`);
          setChapters(response.data);
          setLoadingChapters(false);
        } catch (error) {
          console.error('Error fetching chapters:', error);
          setLoadingChapters(false);
        }
      };

      fetchChapters();
    } else {
      setChapters([]);
    }
  }, [selectedBookId]);

  if (loadingBooks) {
    return <div>Loading books...</div>;
  }

  return (
    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <h1>Bible2PPT</h1>
      <div style={{ display: 'flex', gap: '10px' }}>
        <button
          onClick={() => setActiveTab('bible')}
          style={{ 
            padding: '10px', 
            backgroundColor: activeTab === 'bible' ? '#e0e0e0' : 'transparent',
            borderRadius: '4px'
          }}
        >
          Bible Content
        </button>
        <button
          onClick={() => setActiveTab('presentation')}
          style={{ 
            padding: '10px', 
            backgroundColor: activeTab === 'presentation' ? '#e0e0e0' : 'transparent',
            borderRadius: '4px'
          }}
        >
          Presentations
        </button>
        <button
          onClick={() => setActiveTab('templates')}
          style={{ 
            padding: '10px', 
            backgroundColor: activeTab === 'templates' ? '#e0e0e0' : 'transparent',
            borderRadius: '4px'
          }}
        >
          Templates
        </button>
        <button
          onClick={() => setActiveTab('history')}
          style={{ 
            padding: '10px', 
            backgroundColor: activeTab === 'history' ? '#e0e0e0' : 'transparent',
            borderRadius: '4px'
          }}
        >
          History
        </button>
      </div>
      {activeTab === 'bible' ? (
        <div style={{ display: 'flex', flexDirection: 'row', gap: '20px' }}>
          <div style={{ flex: 1, borderRight: '1px solid #ccc', paddingRight: '20px' }}>
            <h2>Books</h2>
            <ul style={{ listStyleType: 'none', padding: 0 }}>
              {books.map(book => (
                <li 
                  key={book.id} 
                  onClick={() => setSelectedBookId(book.id)}
                  style={{ 
                    cursor: 'pointer', 
                    padding: '5px', 
                    backgroundColor: selectedBookId === book.id ? '#e0e0e0' : 'transparent',
                    borderRadius: '4px'
                  }}
                >
                  {book.name}
                </li>
              ))}
            </ul>
          </div>
          <div style={{ flex: 1 }}>
            {selectedBookId !== null && (
              <>
                <h2>Chapters for {books.find(book => book.id === selectedBookId)?.name}</h2>
                {loadingChapters ? (
                  <div>Loading chapters...</div>
                ) : chapters.length > 0 ? (
                  <ul style={{ listStyleType: 'none', padding: 0 }}>
                    {chapters.map(chapter => (
                      <li 
                        key={chapter.id}
                        onClick={() => setSelectedChapterId(chapter.id)}
                        style={{ 
                          cursor: 'pointer', 
                          padding: '5px', 
                          backgroundColor: selectedChapterId === chapter.id ? '#e0e0e0' : 'transparent',
                          borderRadius: '4px'
                        }}
                      >
                        Chapter {chapter.number}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div>No chapters available.</div>
                )}
              </>
            )}
          </div>
        </div>
      ) : activeTab === 'presentation' ? (
        <Presentation bookId={selectedBookId} chapterId={selectedChapterId} />
      ) : activeTab === 'templates' ? (
        <TemplateEditor />
      ) : (
        <History />
      )}
    </div>
  );
};

export default Main;