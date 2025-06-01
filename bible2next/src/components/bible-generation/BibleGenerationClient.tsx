'use client';

import React, { useState, useEffect, useCallback } from 'react';
import BibleSelectorPanel from './BibleSelectorPanel';
import VerseInputPanel from './VerseInputPanel';
import { BibleSource, BibleVersion, Book, PptOptions, SelectedBible, UserSettings, UserDefaultBible } from '@/types/bible';
import { SettingsService } from '@/services/settings.service'; // Import SettingsService

const SESSION_STORAGE_KEY_JOB_TO_LOAD = 'jobToLoad';

// Application default PPT options
const APP_DEFAULT_PPT_OPTIONS: PptOptions = {
  splitChaptersIntoFiles: false,
  maxLinesPerSlide: 0,
  showBookNameOnSlide: 'firstOfChapter',
  showChapterNumberOnSlide: 'firstOfChapter',
  themeName: 'defaultLight',
  bodyFont: 'Arial',
  titleFont: 'Arial',
};

interface LoadedJobData { // From history load via sessionStorage
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

  // Initialize state with application defaults
  const [finalSelectedBibles, setFinalSelectedBibles] = useState<SelectedBible[]>([]);
  const [verseQuery, setVerseQuery] = useState<string>('');
  const [pptOptions, setPptOptions] = useState<PptOptions>(APP_DEFAULT_PPT_OPTIONS);

  const [isLoading, setIsLoading] = useState(true); // Unified loading state
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Ref to store data that needs to be applied after sources load (either from history or user defaults)
  const pendingSettingsToApplyRef = React.useRef<{ defaultBible?: UserDefaultBible | SelectedBible, pptOptions?: PptOptions } | null>(null);

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    let settingsAppliedFromStorage = false; // Flag to see if any settings (history or user) were applied

    // Priority 1: Job Loaded from History (sessionStorage)
    const storedJobDataString = sessionStorage.getItem(SESSION_STORAGE_KEY_JOB_TO_LOAD);
    if (storedJobDataString) {
      try {
        const jobData = JSON.parse(storedJobDataString) as LoadedJobData;
        setVerseQuery(jobData.queryString);
        setFinalSelectedBibles(jobData.finalSelectedBibles); // This will trigger book loading
        setPptOptions(jobData.pptOptions);

        if (jobData.finalSelectedBibles.length > 0) {
          // Store the first bible from history to set dropdowns after sources load
          pendingSettingsToApplyRef.current = { defaultBible: jobData.finalSelectedBibles[0], pptOptions: jobData.pptOptions };
        } else if (jobData.pptOptions) { // If only options were saved (unlikely for history)
          pendingSettingsToApplyRef.current = { pptOptions: jobData.pptOptions };
        }
        setStatusMessage("Loaded settings from history.");
        sessionStorage.removeItem(SESSION_STORAGE_KEY_JOB_TO_LOAD);
        settingsAppliedFromStorage = true;
      } catch (e) {
        console.error("Error parsing job data from sessionStorage:", e);
        setError("Failed to load job settings from history. Data might be corrupted.");
        sessionStorage.removeItem(SESSION_STORAGE_KEY_JOB_TO_LOAD); // Clean up on error too
      }
    }

    // Priority 2: User Settings from localStorage (if no job from history)
    if (!settingsAppliedFromStorage) {
      const userSettings = SettingsService.getUserSettings();
      if (userSettings) {
        pendingSettingsToApplyRef.current = { // Store for application after sources load
            defaultBible: userSettings.defaultBible,
            pptOptions: userSettings.defaultPptOptions
        };
        if (userSettings.defaultPptOptions) {
          setPptOptions({ ...APP_DEFAULT_PPT_OPTIONS, ...userSettings.defaultPptOptions });
        }
        if (userSettings.defaultBible) {
          const defaultSelectedBible: SelectedBible = { // Convert UserDefaultBible to SelectedBible
            dbSourceId: userSettings.defaultBible.dbSourceId,
            sourceName: userSettings.defaultBible.sourceName,
            dbVersionId: userSettings.defaultBible.dbVersionId,
            versionName: userSettings.defaultBible.versionName,
            versionIdentifier: userSettings.defaultBible.versionIdentifier,
            language: userSettings.defaultBible.language,
          };
          setFinalSelectedBibles([defaultSelectedBible]); // This will trigger book loading
        }
        setStatusMessage("Loaded your saved default settings.");
        settingsAppliedFromStorage = true;
      }
    }

    // If no settings were applied from storage, states retain their initial APP_DEFAULT_PPT_OPTIONS
    if (!settingsAppliedFromStorage) {
        // Message for app defaults can be added if desired
        // setStatusMessage("Using application default settings.");
    }

    // Fetch Bible sources (always needed)
    fetch('/api/bibles')
      .then(res => {
        if (!res.ok) throw new Error(`Failed to fetch Bible sources: ${res.statusText}`);
        return res.json();
      })
      .then((data: BibleSource[]) => {
        setSources(data);
        // After sources are loaded, if we have pending settings (from history or user defaults), try to set source dropdown
        if (pendingSettingsToApplyRef.current?.defaultBible?.dbSourceId) {
          const bibleToSelect = pendingSettingsToApplyRef.current.defaultBible;
          if (data.some(s => s.dbSourceId === bibleToSelect.dbSourceId)) {
            setSelectedSourceDbId(bibleToSelect.dbSourceId);
            // Version selection will be handled by the next useEffect hook
          } else {
            // The saved source ID doesn't exist in fetched sources. Clear ref or handle error.
            pendingSettingsToApplyRef.current = null; // Or just the defaultBible part
          }
        } else {
           // No default/history bible to select, or missing dbSourceId in it.
           // If there are sources, maybe select the first one? Or leave as is (user selects).
           // For now, do nothing, user will select manually.
        }
      })
      .catch(e => {
        console.error("Error fetching sources:", e);
        setError((e as Error).message);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []); // Main effect for loading settings and initial sources

  // Effect to set selectedVersionDbId after versionsForSelectedSource are populated,
  // particularly when settings were loaded (history/user).
  useEffect(() => {
    if (selectedSourceDbId && versionsForSelectedSource.length > 0 && pendingSettingsToApplyRef.current?.defaultBible) {
      const bibleToSelect = pendingSettingsToApplyRef.current.defaultBible;
      if (bibleToSelect.dbSourceId === selectedSourceDbId &&
          bibleToSelect.dbVersionId && // Ensure dbVersionId exists on the bibleToSelect object
          versionsForSelectedSource.some(v => v.id === bibleToSelect.dbVersionId)) {
        setSelectedVersionDbId(bibleToSelect.dbVersionId);
      }
      // Whether version was set or not, defaultBible from ref has served its purpose for initial UI selection
      // unless other parts of the component need to distinguish between history-loaded and user-selected.
      // For now, let's clear it to prevent re-application on unrelated changes.
      // However, if sources load very fast, this effect might run before the one that sets selectedSourceDbId from ref.
      // It's safer to clear it in the primary useEffect once sources are set and it's used.
      // Or, only clear if selections were successfully made.
      if (selectedVersionDbId) { // If we successfully set the version
        pendingSettingsToApplyRef.current = null;
      }
    }
  }, [selectedSourceDbId, versionsForSelectedSource]); // Removed ref from deps, it's read here

  // Update available versions when selectedSourceDbId changes (user interaction or loaded settings)
  useEffect(() => {
    if (selectedSourceDbId) {
      const source = sources.find(s => s.dbSourceId === selectedSourceDbId);
      const newVersions = source?.versions || [];
      setVersionsForSelectedSource(newVersions);

      // If the currently selected version ID is not in the new list of versions, reset it.
      // This handles cases where user changes source, and old selectedVersionId is no longer valid.
      // This should NOT clear a version that was just set by pendingSettingsToApplyRef,
      // so we check if pendingSettingsToApplyRef still holds a value for the current source.
      if (selectedVersionDbId && !newVersions.some(v => v.id === selectedVersionDbId)) {
        if (pendingSettingsToApplyRef.current?.defaultBible?.dbSourceId === selectedSourceDbId &&
            pendingSettingsToApplyRef.current?.defaultBible?.dbVersionId === selectedVersionDbId) {
            // Do nothing, it's being set from loaded settings
        } else {
            setSelectedVersionDbId(null);
        }
      }
    } else {
      setVersionsForSelectedSource([]);
      setSelectedVersionDbId(null);
    }
  }, [selectedSourceDbId, sources]);

  // Fetch books for the primary selected Bible (first in finalSelectedBibles)
  useEffect(() => {
    if (finalSelectedBibles.length > 0) {
      const primaryBibleDbId = finalSelectedBibles[0].dbVersionId;
      if(primaryBibleDbId && typeof primaryBibleDbId === 'string') {
        // No setIsLoading(true) here to avoid UI flicker for book list, can be added if preferred
        fetch(`/api/bibles/${primaryBibleDbId}/books`)
          .then(res => {
            if (!res.ok) throw new Error(`Failed to fetch books for ${primaryBibleDbId}: ${res.statusText}`);
            return res.json();
          })
          .then(data => setBooksForPrimaryVersion(data))
          .catch(e => { console.error("Error fetching books:", e); setBooksForPrimaryVersion([]); });
      } else {
        setBooksForPrimaryVersion([]);
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
      if (prev.length === 0) { // If adding the first Bible
          setSelectedSourceDbId(bible.dbSourceId); // Set UI to this Bible's source
          setSelectedVersionDbId(bible.dbVersionId); // Set UI to this Bible's version
      }
      return [...prev, bible];
    });
  }, []);

  const handleRemoveBibleFromFinalSelection = useCallback((dbVersionId: string) => {
    setFinalSelectedBibles(prev => {
        const newSelection = prev.filter(b => b.dbVersionId !== dbVersionId);
        if (newSelection.length === 0) {
            setSelectedSourceDbId(null); // Clear source/version dropdowns if no bibles left
            setSelectedVersionDbId(null);
        } else if (selectedVersionDbId === dbVersionId) { // If the active selection was removed
            // Set dropdowns to the first Bible remaining in the list
            setSelectedSourceDbId(newSelection[0].dbSourceId);
            setSelectedVersionDbId(newSelection[0].dbVersionId);
        }
        return newSelection;
    });
  }, [selectedVersionDbId]);

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

  useEffect(() => { // Effect for clearing status messages
    if (statusMessage && !["Generating PPT, please wait..."].includes(statusMessage) ) {
      const timer = setTimeout(() => setStatusMessage(null), 5000); // Keep "Loaded..." messages a bit longer
      return () => clearTimeout(timer);
    }
  }, [statusMessage]);

  if (isLoading && sources.length === 0 ) return <p className="text-center">Loading Bible data...</p>;
  if (error && sources.length === 0 && !error.startsWith("Failed to load job settings") ) {
      return <p className="text-center text-red-500 p-3 my-3 bg-red-100 rounded-md">Error loading initial Bible sources: {error}</p>;
  }

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
          // isLoading prop for VerseInputPanel's button should reflect PPT generation specifically
          isLoading={isLoading && statusMessage === "Generating PPT, please wait..."}
        />
      </div>
      {error && (!error.startsWith("Failed to load job settings") || sources.length > 0 ) && // Show general errors, or job load error if sources are loaded
        <p className="md:col-span-3 text-red-500 text-center mt-4 p-2 bg-red-100 rounded">{error}</p>}
      {statusMessage &&
        <p className={`md:col-span-3 text-center mt-4 p-2 rounded ${
            statusMessage.includes("successfully") || statusMessage.includes("Loaded") ? "bg-blue-100 text-blue-600"
            : (statusMessage.includes("Generating") ? "bg-yellow-100 text-yellow-700" : "bg-gray-100 text-gray-700")
        }`}>{statusMessage}</p>}
    </div>
  );
};
export default BibleGenerationClient;
