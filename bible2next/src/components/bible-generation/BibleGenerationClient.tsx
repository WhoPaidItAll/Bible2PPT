'use client';

import React, { useState, useEffect, useCallback } from 'react';
import BibleSelectorPanel from './BibleSelectorPanel';
import VerseInputPanel from './VerseInputPanel';
import { BibleSource, BibleVersion, Book, PptOptions, SelectedBible } from '@/types/bible';

const BibleGenerationClient: React.FC = () => {
  const [sources, setSources] = useState<BibleSource[]>([]);
  const [selectedSourceDbId, setSelectedSourceDbId] = useState<string | null>(null);

  const [versionsForSelectedSource, setVersionsForSelectedSource] = useState<BibleVersion[]>([]);
  const [selectedVersionDbId, setSelectedVersionDbId] = useState<string | null>(null);

  const [booksForPrimaryVersion, setBooksForPrimaryVersion] = useState<Book[]>([]);

  const [finalSelectedBibles, setFinalSelectedBibles] = useState<SelectedBible[]>([]);
  const [verseQuery, setVerseQuery] = useState<string>('');
  const [pptOptions, setPptOptions] = useState<PptOptions>({
    splitChaptersIntoFiles: false,
    maxLinesPerSlide: 0, // 0 for unlimited
    showBookNameOnSlide: 'firstOfChapter',
    showChapterNumberOnSlide: 'firstOfChapter',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('');

  // Fetch initial Bible sources
  useEffect(() => {
    const fetchSources = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const res = await fetch('/api/bibles');
        if (!res.ok) throw new Error(`Failed to fetch Bible sources: ${res.statusText}`);
        const data = await res.json();
        setSources(data);
        if (data.length > 0) {
          // setSelectedSourceDbId(data[0].dbSourceId); // Auto-select first source
        }
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSources();
  }, []);

  // Update versions when source changes
  useEffect(() => {
    if (selectedSourceDbId) {
      const source = sources.find(s => s.dbSourceId === selectedSourceDbId);
      setVersionsForSelectedSource(source?.versions || []);
      // setSelectedVersionDbId(null); // Reset version selection
      // if (source && source.versions.length > 0) {
      //   setSelectedVersionDbId(source.versions[0].id); // Auto-select first version
      // }
    } else {
      setVersionsForSelectedSource([]);
      // setSelectedVersionDbId(null);
    }
  }, [selectedSourceDbId, sources]);

  // Fetch books for the primary selected Bible (first in finalSelectedBibles)
  useEffect(() => {
    if (finalSelectedBibles.length > 0) {
      const primaryBibleDbId = finalSelectedBibles[0].dbVersionId;
      const fetchBooks = async () => {
        try {
          const res = await fetch(`/api/bibles/${primaryBibleDbId}/books`);
          if (!res.ok) throw new Error(`Failed to fetch books for version ${primaryBibleDbId}: ${res.statusText}`);
          const data = await res.json();
          setBooksForPrimaryVersion(data);
        } catch (e) {
          console.error("Error fetching books:", e);
          setBooksForPrimaryVersion([]); // Clear books on error
        }
      };
      fetchBooks();
    } else {
      setBooksForPrimaryVersion([]);
    }
  }, [finalSelectedBibles]);


  const handleGeneratePpt = async () => {
    if (finalSelectedBibles.length === 0 || !verseQuery) {
      setError("Please select at least one Bible version and enter a verse query.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setStatusMessage("Generating PPT, please wait...");

    try {
      const bibleVersionDbIds = finalSelectedBibles.map(b => b.dbVersionId);
      const response = await fetch('/api/generate-ppt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bibleVersionDbIds, query: verseQuery, options: pptOptions }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(`Failed to generate PPT: ${errorData.message || response.statusText}`);
      }

      const blob = await response.blob();
      const filenameHeader = response.headers.get('Content-Disposition');
      let filename = 'presentation.pptx';
      if (filenameHeader) {
        const parts = filenameHeader.split('filename=');
        if (parts.length > 1) {
          filename = parts[1].replace(/"/g, '');
        }
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      setStatusMessage("PPT generated successfully!");

    } catch (e) {
      setError((e as Error).message);
      setStatusMessage('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddBibleToFinalSelection = useCallback((bible: SelectedBible) => {
    setFinalSelectedBibles(prev => {
      if (prev.find(b => b.dbVersionId === bible.dbVersionId)) return prev; // Avoid duplicates
      return [...prev, bible];
    });
  }, []);

  const handleRemoveBibleFromFinalSelection = useCallback((dbVersionId: string) => {
    setFinalSelectedBibles(prev => prev.filter(b => b.dbVersionId !== dbVersionId));
  }, []);

  const handleReorderFinalBibles = useCallback((dbVersionId: string, direction: 'up' | 'down') => {
    setFinalSelectedBibles(prev => {
        const index = prev.findIndex(b => b.dbVersionId === dbVersionId);
        if (index === -1) return prev;
        const newArr = [...prev];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= newArr.length) return prev;
        [newArr[index], newArr[targetIndex]] = [newArr[targetIndex], newArr[index]]; // Swap
        return newArr;
    });
  }, []);


  if (isLoading && sources.length === 0) return <p className="text-center">Loading Bible data...</p>;
  if (error && sources.length === 0) return <p className="text-center text-red-500">Error loading initial data: {error}</p>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-1 bg-gray-50 p-4 rounded-lg shadow">
        <BibleSelectorPanel
          sources={sources}
          selectedSourceDbId={selectedSourceDbId}
          onSelectSource={setSelectedSourceDbId}
          versionsForSelectedSource={versionsForSelectedSource}
          selectedVersionDbId={selectedVersionDbId}
          onSelectVersion={setSelectedVersionDbId}
          onAddBible={handleAddBibleToFinalSelection}
          finalSelectedBibles={finalSelectedBibles}
          onRemoveBible={handleRemoveBibleFromFinalSelection}
          onReorderBibles={handleReorderFinalBibles}
          pptOptions={pptOptions}
          onPptOptionsChange={setPptOptions}
        />
      </div>
      <div className="md:col-span-2 bg-gray-50 p-4 rounded-lg shadow">
        <VerseInputPanel
          books={booksForPrimaryVersion}
          verseQuery={verseQuery}
          onVerseQueryChange={setVerseQuery}
          onGeneratePpt={handleGeneratePpt}
          isLoading={isLoading}
        />
      </div>
      {error && <p className="md:col-span-3 text-red-500 text-center mt-4 p-2 bg-red-100 rounded">{error}</p>}
      {statusMessage && <p className="md:col-span-3 text-blue-500 text-center mt-4 p-2 bg-blue-100 rounded">{statusMessage}</p>}
    </div>
  );
};
export default BibleGenerationClient;
