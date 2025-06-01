'use client';

import React, { useState, useEffect, useCallback } from 'react';
import BibleSelectorPanel from './BibleSelectorPanel';
import VerseInputPanel from './VerseInputPanel';
import { BibleSource, BibleVersion, Book, PptOptions, SelectedBible } from '@/types/bible';

const SESSION_STORAGE_KEY_JOB_TO_LOAD = 'jobToLoad';

interface LoadedJobData {
  queryString: string;
  finalSelectedBibles: SelectedBible[];
  pptOptions: PptOptions;
}

const BibleGenerationClient: React.FC = () => {
  const [sources, setSources] = useState<BibleSource[]>([]);
  const [selectedSourceDbId, setSelectedSourceDbId] = useState<string | null>(null);
  const [versionsForSelectedSource, setVersionsForSelectedSource] = useState<BibleVersion[]>([]);
  const [selectedVersionDbId, setSelectedVersionDbId] = useState<string | null>(null);
  const [booksForPrimaryVersion, setBooksForPrimaryVersion] = useState<Book[]>([]);
  const [finalSelectedBibles, setFinalSelectedBibles] = useState<SelectedBible[]>([]);
  const [verseQuery, setVerseQuery] = useState<string>('');
  const [pptOptions, setPptOptions] = useState<PptOptions>({
    splitChaptersIntoFiles: false, maxLinesPerSlide: 0,
    showBookNameOnSlide: 'firstOfChapter', showChapterNumberOnSlide: 'firstOfChapter',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Ref to store loaded job data temporarily until sources are loaded
  const [loadedJobDataRef, setLoadedJobDataRef] = useState<LoadedJobData | null>(null);

  useEffect(() => {
    const storedJobDataString = sessionStorage.getItem(SESSION_STORAGE_KEY_JOB_TO_LOAD);
    if (storedJobDataString) {
      try {
        const jobData = JSON.parse(storedJobDataString) as LoadedJobData;
        setVerseQuery(jobData.queryString);
        setFinalSelectedBibles(jobData.finalSelectedBibles);
        setPptOptions(jobData.pptOptions);
        setLoadedJobDataRef(jobData); // Store for processing after sources load
        setStatusMessage("Loaded settings from history.");
        sessionStorage.removeItem(SESSION_STORAGE_KEY_JOB_TO_LOAD);
      } catch (e) {
        console.error("Error parsing job data from sessionStorage:", e);
        setError("Failed to load job settings from history. Data might be corrupted.");
        sessionStorage.removeItem(SESSION_STORAGE_KEY_JOB_TO_LOAD);
      }
    }

    setIsLoading(true);
    setError(null);
    fetch('/api/bibles')
      .then(res => {
        if (!res.ok) throw new Error(`Failed to fetch Bible sources: ${res.statusText}`);
        return res.json();
      })
      .then((data: BibleSource[]) => {
        setSources(data);
        // Process loaded job data *after* sources are set
        if (loadedJobDataRef) {
          if (loadedJobDataRef.finalSelectedBibles.length > 0) {
            const firstLoadedBible = loadedJobDataRef.finalSelectedBibles[0];
            if (firstLoadedBible.dbSourceId && data.some(s => s.dbSourceId === firstLoadedBible.dbSourceId)) {
              setSelectedSourceDbId(firstLoadedBible.dbSourceId);
              // Versions will be set by the following useEffect, which then tries to set selectedVersionDbId
            }
          }
          setLoadedJobDataRef(null); // Clear the ref
        }
      })
      .catch(e => setError((e as Error).message))
      .finally(() => setIsLoading(false));
  }, []); // Main effect for loading job and initial sources


  useEffect(() => { // Effect to set selectedVersionId after versionsForSelectedSource are populated
    if (loadedJobDataRef && loadedJobDataRef.finalSelectedBibles.length > 0 && versionsForSelectedSource.length > 0) {
      const firstLoadedBible = loadedJobDataRef.finalSelectedBibles[0];
      if (firstLoadedBible.dbVersionId && versionsForSelectedSource.some(v => v.id === firstLoadedBible.dbVersionId)) {
        setSelectedVersionDbId(firstLoadedBible.dbVersionId);
      }
       // Clear ref if it was only for this purpose (or handle more elegantly if multiple things depend on it)
       // For now, assume it's mainly for initial source/version selection.
       // If setSelectedSourceDbId didn't trigger this effect immediately because sources were not ready,
       // loadedJobDataRef might still be needed. Let's clear it after its use for source selection.
    }
  }, [versionsForSelectedSource, loadedJobDataRef]); // Depends on versionsForSelectedSource and the ref


  useEffect(() => {
    if (selectedSourceDbId) {
      const source = sources.find(s => s.dbSourceId === selectedSourceDbId);
      setVersionsForSelectedSource(source?.versions || []);
      // If not loading from history, or if the loaded version isn't in the new source, reset version
      if (!loadedJobDataRef || (loadedJobDataRef && source && !source.versions.find(v => v.id === loadedJobDataRef.finalSelectedBibles[0]?.dbVersionId))) {
         if (selectedVersionDbId && !source?.versions.find(v => v.id === selectedVersionDbId)) {
            setSelectedVersionDbId(null);
         }
      }
    } else {
      setVersionsForSelectedSource([]);
      setSelectedVersionDbId(null);
    }
  }, [selectedSourceDbId, sources, loadedJobDataRef]);

  useEffect(() => {
    if (finalSelectedBibles.length > 0) {
      const primaryBibleDbId = finalSelectedBibles[0].dbVersionId;
      // Fetch books only if primaryBibleDbId is valid
      if(primaryBibleDbId) {
        setIsLoading(true); // Indicate loading for books
        fetch(`/api/bibles/${primaryBibleDbId}/books`)
          .then(res => {
            if (!res.ok) throw new Error(`Failed to fetch books: ${res.statusText}`);
            return res.json();
          })
          .then(data => setBooksForPrimaryVersion(data))
          .catch(e => { console.error("Error fetching books:", e); setBooksForPrimaryVersion([]); setError((e as Error).message);})
          .finally(() => setIsLoading(false));
        } else {
            setBooksForPrimaryVersion([]); // Clear books if no valid primary Bible
        }
    } else {
      setBooksForPrimaryVersion([]);
    }
  }, [finalSelectedBibles]);

  const handleGeneratePpt = async () => {
    if (finalSelectedBibles.length === 0 || !verseQuery) {
      setError("Please select at least one Bible version and enter a verse query.");
      return;
    }
    setIsLoading(true); setError(null); setStatusMessage("Generating PPT, please wait...");
    try {
      const bibleVersionDbIds = finalSelectedBibles.map(b => b.dbVersionId);
      const response = await fetch('/api/generate-ppt', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
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
        if (parts.length > 1) filename = parts[1].replace(/"/g, '');
      }
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = filename; document.body.appendChild(a);
      a.click(); a.remove(); window.URL.revokeObjectURL(url);
      setStatusMessage("PPT generated successfully!");
    } catch (e) { setError((e as Error).message); setStatusMessage('');
    } finally { setIsLoading(false); }
  };

  const handleAddBibleToFinalSelection = useCallback((bible: SelectedBible) => {
    setFinalSelectedBibles(prev => {
      if (prev.find(b => b.dbVersionId === bible.dbVersionId)) return prev;
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
        [newArr[index], newArr[targetIndex]] = [newArr[targetIndex], newArr[index]];
        return newArr;
    });
  }, []);

  useEffect(() => {
    if (statusMessage && statusMessage !== "Generating PPT, please wait..." && statusMessage !== "Loaded settings from history.") {
      const timer = setTimeout(() => setStatusMessage(null), 3000);
      return () => clearTimeout(timer);
    }
     if (statusMessage === "Loaded settings from history.") {
        const timer = setTimeout(() => {
            setStatusMessage(null);
            // Attempt to clear the ref one last time if it wasn't cleared by other effects
            if (loadedJobDataRef) setLoadedJobDataRef(null);
        }, 5000); // Keep it a bit longer
        return () => clearTimeout(timer);
    }
  }, [statusMessage, loadedJobDataRef]);

  if (isLoading && sources.length === 0 && !loadedJobDataRef ) return <p className="text-center">Loading Bible data...</p>;

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
          isLoading={isLoading && statusMessage === "Generating PPT, please wait..."}
        />
      </div>
      {error && <p className="md:col-span-3 text-red-500 text-center mt-4 p-2 bg-red-100 rounded">{error}</p>}
      {statusMessage && <p className={`md:col-span-3 text-center mt-4 p-2 rounded ${statusMessage.includes("successfully") || statusMessage.includes("Loaded") ? 'bg-blue-100 text-blue-700' : (statusMessage.includes("Generating") ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700')}`}>{statusMessage}</p>}
    </div>
  );
};
export default BibleGenerationClient;
