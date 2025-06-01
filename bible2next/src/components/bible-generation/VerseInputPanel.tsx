'use client';

import React, { useState } from 'react';
import { Book } from '@/types/bible';

interface VerseInputPanelProps {
  books: Book[];
  verseQuery: string;
  onVerseQueryChange: (query: string) => void;
  onGeneratePpt: () => void;
  isLoading: boolean;
}

const VerseInputPanel: React.FC<VerseInputPanelProps> = ({
  books, verseQuery, onVerseQueryChange, onGeneratePpt, isLoading
}) => {
  const [bookSearchTerm, setBookSearchTerm] = useState('');

  const filteredBooks = books.filter(book =>
    book.name.toLowerCase().includes(bookSearchTerm.toLowerCase()) ||
    book.abbreviation.toLowerCase().includes(bookSearchTerm.toLowerCase())
  );

  const handleBookClick = (book: Book) => {
    const newQueryPart = `${book.name} 1:1`; // Default to chapter 1, verse 1
    let updatedQuery = '';

    const trimmedQuery = verseQuery.trim();
    if (trimmedQuery === '' || trimmedQuery.endsWith(';')) {
      // If query is empty or ends with a semicolon, just append the new part.
      updatedQuery = `${trimmedQuery}${trimmedQuery ? ' ' : ''}${newQueryPart}`;
    } else {
      // If query has content and doesn't end with a semicolon, add a semicolon before the new part.
      updatedQuery = `${trimmedQuery}; ${newQueryPart}`;
    }

    onVerseQueryChange(updatedQuery);
    setBookSearchTerm(''); // Clear search after selection
  };

  return (
    <div className="space-y-6">
      <div>
        <label htmlFor="bookSearch" className="block text-sm font-medium text-gray-700 mb-1">Search Books (from primary selected Bible):</label>
        <input
          type="text"
          id="bookSearch"
          placeholder="Type to search books..."
          value={bookSearchTerm}
          onChange={(e) => setBookSearchTerm(e.target.value)}
          className="mt-1 block w-full pl-3 pr-3 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md shadow-sm"
          title="Search for Bible books by name or abbreviation from the first Bible you added to the PPT list."
        />
        {books.length === 0 && <p className="text-xs text-gray-500 mt-1">Select a Bible in the left panel to see books here.</p>}
        {bookSearchTerm && filteredBooks.length > 0 && (
          <ul className="mt-2 border border-gray-300 rounded-md max-h-40 overflow-y-auto text-sm shadow">
            {filteredBooks.map(book => (
              <li key={book.id}
                  onClick={() => handleBookClick(book)}
                  className="p-2 hover:bg-indigo-50 cursor-pointer"
                  title={`Click to add '${book.name} 1:1' to your verse query`}>
                {book.name} ({book.abbreviation}) - {book.chapterCount} chapters
              </li>
            ))}
          </ul>
        )}
         {bookSearchTerm && filteredBooks.length === 0 && books.length > 0 && (
            <p className="text-xs text-gray-500 mt-1">No books match your search.</p>
        )}
      </div>

      <div>
        <label htmlFor="verseQuery" className="block text-sm font-medium text-gray-700 mb-1">
          Verse Query (e.g., Genesis 1:1-5; John 3:16):
        </label>
        <textarea
          id="verseQuery"
          rows={4}
          value={verseQuery}
          onChange={(e) => onVerseQueryChange(e.target.value)}
          placeholder="Enter Bible verses here..."
          className="mt-1 block w-full pl-3 pr-3 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md shadow-sm"
          title="Enter verse query like 'Genesis 1:1-5; John 3:16'. Use semicolon (;) to separate multiple queries."
        />
      </div>

      <button
        onClick={onGeneratePpt}
        disabled={isLoading}
        className="w-full px-4 py-3 bg-green-600 text-white font-semibold rounded-md shadow-sm hover:bg-green-700 disabled:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
        title="Generate PowerPoint presentation with the selected Bibles, query, and options."
      >
        {isLoading ? 'Generating...' : 'Generate PowerPoint'}
      </button>
    </div>
  );
};
export default VerseInputPanel;
