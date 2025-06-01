'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { BibleSource, BibleVersion, PptOptions, UserSettings, UserDefaultBible, AVAILABLE_THEMES, AVAILABLE_FONTS, ThemeName } from '@/types/bible';
import { SettingsService } from '@/services/settings.service';

// Define application default PPT options (could also be imported if centralized)
const APP_DEFAULT_PPT_OPTIONS: PptOptions = {
  splitChaptersIntoFiles: false,
  maxLinesPerSlide: 0,
  showBookNameOnSlide: 'firstOfChapter',
  showChapterNumberOnSlide: 'firstOfChapter',
  themeName: 'defaultLight',
  bodyFont: 'Arial',
  titleFont: 'Arial',
};

const SettingsClient: React.FC = () => {
  // State for fetched Bible data
  const [sources, setSources] = useState<BibleSource[]>([]);
  const [selectedSourceDbId, setSelectedSourceDbId] = useState<string | undefined>(undefined); // For the dropdown selection
  const [versionsForSelectedSource, setVersionsForSelectedSource] = useState<BibleVersion[]>([]);

  // State for user settings form
  const [defaultBible, setDefaultBible] = useState<UserDefaultBible | undefined>(undefined);
  const [defaultPptOptions, setDefaultPptOptions] = useState<PptOptions>(APP_DEFAULT_PPT_OPTIONS);

  const [isLoadingSources, setIsLoadingSources] = useState(true);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load sources and existing settings on mount
  useEffect(() => {
    setIsLoadingSources(true);
    fetch('/api/bibles')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch Bible sources');
        return res.json();
      })
      .then((data: BibleSource[]) => {
        setSources(data);
        // Load existing user settings after sources are available
        const userSettings = SettingsService.getUserSettings();
        if (userSettings) {
          if (userSettings.defaultBible) {
            setDefaultBible(userSettings.defaultBible);
            // Trigger version loading based on saved default source
            // This will also correctly set the selectedSourceDbId for the dropdown
            setSelectedSourceDbId(userSettings.defaultBible.dbSourceId);
          }
          setDefaultPptOptions({ ...APP_DEFAULT_PPT_OPTIONS, ...(userSettings.defaultPptOptions || {}) });
        }
      })
      .catch(err => {
        console.error("Error loading initial data for settings:", err);
        setErrorMessage((err as Error).message);
      })
      .finally(() => setIsLoadingSources(false));
  }, []);

  // Update versions when selectedSourceDbId changes (either by user or from loaded settings)
  useEffect(() => {
    if (selectedSourceDbId) {
      const source = sources.find(s => s.dbSourceId === selectedSourceDbId);
      const currentVersions = source?.versions || [];
      setVersionsForSelectedSource(currentVersions);

      // If a defaultBible is set and its source matches the currently selected source,
      // ensure its version is selected in the version dropdown.
      // Otherwise, if the defaultBible's version doesn't belong to the new source,
      // or if the user just changed the source (and defaultBible is not yet updated),
      // we might want to clear the version part of defaultBible or auto-select the first version.
      if (defaultBible && defaultBible.dbSourceId === selectedSourceDbId) {
        // defaultBible.dbVersionId is already set, this effect just populates the dropdown.
        // Ensure this version is actually in currentVersions. If not, clear it.
        if (!currentVersions.find(v => v.id === defaultBible.dbVersionId)) {
            // This case means the saved default version is not in the newly selected source.
            // Clear the version part of defaultBible or pick the first from currentVersions.
            if (currentVersions.length > 0) {
                const firstVersion = currentVersions[0];
                 setDefaultBible(prev => ({
                    ...prev!, // It must exist if dbSourceId matches
                    dbVersionId: firstVersion.id,
                    versionName: firstVersion.name,
                    versionIdentifier: firstVersion.identifier,
                    language: firstVersion.language,
                }));
            } else {
                 // No versions in this source, clear defaultBible version details
                 setDefaultBible(prev => prev ? {...prev, dbVersionId: '', versionName: '', versionIdentifier: '', language: ''} : undefined);
            }
        }
      } else if (currentVersions.length > 0 && selectedSourceDbId) {
        // If source changed by user, and no defaultBible is set for this source, or defaultBible is for another source
        // then auto-select first version of newly selected source.
        // This path is taken if user changes source dropdown after initial load.
        const firstVersion = currentVersions[0];
        const currentSource = sources.find(s => s.dbSourceId === selectedSourceDbId);
        if (currentSource) {
            setDefaultBible({
                dbSourceId: currentSource.dbSourceId,
                sourceName: currentSource.sourceName,
                dbVersionId: firstVersion.id,
                versionName: firstVersion.name,
                versionIdentifier: firstVersion.identifier,
                language: firstVersion.language,
            });
        }
      } else if (!selectedSourceDbId) { // Source is cleared
        setDefaultBible(undefined);
      }

    } else { // No source selected
      setVersionsForSelectedSource([]);
      // If defaultBible was set, and user clears source, clear defaultBible too.
      if (defaultBible) setDefaultBible(undefined);
    }
  }, [selectedSourceDbId, sources]); // Removed defaultBible from dep array to avoid loops, manage through selectedSourceDbId


  const handleDefaultBibleSourceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSourceDbId = e.target.value;
    setSelectedSourceDbId(newSourceDbId); // This will trigger the useEffect above
                                         // which will then update defaultBible based on the new source.
  };

  const handleDefaultBibleVersionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newVersionDbId = e.target.value;
    const source = sources.find(s => s.dbSourceId === selectedSourceDbId); // selectedSourceDbId should be current
    const version = versionsForSelectedSource.find(v => v.id === newVersionDbId);
    if (source && version) {
      setDefaultBible({
        dbSourceId: source.dbSourceId,
        sourceName: source.sourceName,
        dbVersionId: version.id,
        versionName: version.name,
        versionIdentifier: version.identifier,
        language: version.language,
      });
    } else {
      // If version or source somehow becomes undefined (e.g. user selects "-- Select --")
      // then clear the default bible or handle as appropriate.
      // For now, this state should be prevented by dropdown logic if "-- Select --" has value ""
       if (!newVersionDbId && defaultBible) { // Version cleared
           setDefaultBible(prev => prev ? {...prev, dbVersionId: '', versionName: '', versionIdentifier: '', language: ''} : undefined);
       }
    }
  };

  const handlePptOptionChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    const { name, value, type } = e.target;
    let newValue: string | number | boolean | ThemeName = value;
    if (type === 'checkbox') {
      newValue = (e.target as HTMLInputElement).checked;
    } else if (type === 'number') {
      newValue = parseInt(value, 10);
    } else if (name === 'themeName') {
      newValue = value as ThemeName;
    }
    setDefaultPptOptions(prev => ({ ...prev, [name]: newValue }));
  };

  const handleSaveSettings = () => {
    const settingsToSave: UserSettings = {
      defaultBible: defaultBible,
      defaultPptOptions: defaultPptOptions,
    };
    SettingsService.saveUserSettings(settingsToSave);
    setStatusMessage("Settings saved successfully!");
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleClearSettings = () => {
    if (window.confirm("Are you sure you want to clear all your stored settings? This will reset them to application defaults.")) {
      SettingsService.clearUserSettings();
      setDefaultBible(undefined);
      setSelectedSourceDbId(undefined); // This will clear versionsForSelectedSource via useEffect
      setDefaultPptOptions(APP_DEFAULT_PPT_OPTIONS);
      setStatusMessage("Settings cleared and reset to defaults.");
      setTimeout(() => setStatusMessage(null), 3000);
    }
  };

  if (isLoadingSources) return <p className="text-center">Loading available Bibles...</p>;

  return (
    <div className="space-y-8 max-w-2xl mx-auto bg-white p-6 rounded-lg shadow-md">
      {errorMessage && <p className="text-red-500 p-2 bg-red-100 rounded-md text-center">{errorMessage}</p>}
      {statusMessage && <p className="text-blue-500 p-2 bg-blue-100 rounded-md text-center">{statusMessage}</p>}

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-700">Default Bible Selection</h2>
        <div>
          <label htmlFor="defaultSourceSelect" className="block text-sm font-medium text-gray-700 mb-1">Default Source:</label>
          <select
            id="defaultSourceSelect"
            value={selectedSourceDbId || ""}
            onChange={handleDefaultBibleSourceChange}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md shadow-sm"
          >
            <option value="">-- Select Default Source --</option>
            {sources.map(source => (
              <option key={source.dbSourceId} value={source.dbSourceId}>{source.sourceName}</option>
            ))}
          </select>
        </div>
        {selectedSourceDbId && versionsForSelectedSource.length > 0 && (
          <div>
            <label htmlFor="defaultVersionSelect" className="block text-sm font-medium text-gray-700 mb-1">Default Version:</label>
            <select
              id="defaultVersionSelect"
              value={defaultBible?.dbVersionId || ""}
              onChange={handleDefaultBibleVersionChange}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md shadow-sm"
            >
              <option value="">-- Select Default Version --</option>
              {versionsForSelectedSource.map(version => (
                <option key={version.id} value={version.id}>{version.name} ({version.identifier})</option>
              ))}
            </select>
          </div>
        )}
      </section>

      <section className="space-y-4 pt-6 border-t">
        <h2 className="text-xl font-semibold text-gray-700">Default Presentation Options</h2>
        {/* Theme Selection */}
        <div>
          <label htmlFor="themeName" className="block text-sm font-medium text-gray-700">Theme:</label>
          <select name="themeName" id="themeName" value={defaultPptOptions.themeName} onChange={handlePptOptionChange}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md shadow-sm">
            {AVAILABLE_THEMES.map(theme => (
              <option key={theme} value={theme}>{theme.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</option>
            ))}
          </select>
        </div>
        {/* Body Font */}
        <div>
          <label htmlFor="bodyFont" className="block text-sm font-medium text-gray-700">Body Font:</label>
          <select name="bodyFont" id="bodyFont" value={defaultPptOptions.bodyFont} onChange={handlePptOptionChange}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md shadow-sm">
            {AVAILABLE_FONTS.map(font => (<option key={font} value={font}>{font}</option>))}
          </select>
        </div>
        {/* Title Font */}
         <div>
          <label htmlFor="titleFont" className="block text-sm font-medium text-gray-700">Title Font:</label>
          <select name="titleFont" id="titleFont" value={defaultPptOptions.titleFont} onChange={handlePptOptionChange}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md shadow-sm">
            {AVAILABLE_FONTS.map(font => (<option key={font} value={font}>{font}</option>))}
          </select>
        </div>
        {/* Max Lines Per Slide */}
        <div>
          <label htmlFor="maxLinesPerSlide" className="block text-sm font-medium text-gray-700">Max Lines Per Slide (0 for unlimited):</label>
          <input type="number" name="maxLinesPerSlide" id="maxLinesPerSlide" min="0" max="20"
                 value={defaultPptOptions.maxLinesPerSlide} onChange={handlePptOptionChange}
                 className="mt-1 block w-full pl-3 pr-3 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md shadow-sm"/>
        </div>
        {/* Show Book Name */}
        <div>
          <label htmlFor="showBookNameOnSlide" className="block text-sm font-medium text-gray-700">Show Book Name:</label>
          <select name="showBookNameOnSlide" id="showBookNameOnSlide" value={defaultPptOptions.showBookNameOnSlide} onChange={handlePptOptionChange}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md shadow-sm">
            <option value="firstOfChapter">First verse of chapter</option>
            <option value="firstOfBook">First verse of book</option>
            <option value="always">Always on slide</option>
          </select>
        </div>
        {/* Show Chapter Number */}
         <div>
          <label htmlFor="showChapterNumberOnSlide" className="block text-sm font-medium text-gray-700">Show Chapter Number:</label>
          <select name="showChapterNumberOnSlide" id="showChapterNumberOnSlide" value={defaultPptOptions.showChapterNumberOnSlide} onChange={handlePptOptionChange}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md shadow-sm">
            <option value="firstOfChapter">First verse of chapter</option>
            <option value="firstOfBook">First verse of book (implies chapter too)</option>
            <option value="always">Always on slide</option>
          </select>
        </div>
        {/* Split Chapters */}
        <div>
            <label htmlFor="splitChaptersIntoFiles" className="flex items-center text-sm font-medium text-gray-700">
                <input type="checkbox" name="splitChaptersIntoFiles" id="splitChaptersIntoFiles"
                       checked={defaultPptOptions.splitChaptersIntoFiles} onChange={handlePptOptionChange}
                       className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 mr-2"/>
                Split chapters into separate files (default)
            </label>
        </div>
      </section>

      <div className="flex justify-end space-x-4 pt-6 border-t">
        <button
          onClick={handleClearSettings}
          className="px-4 py-2 border border-red-500 text-red-500 font-semibold rounded-md shadow-sm hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-400"
        >
          Clear My Stored Settings
        </button>
        <button
          onClick={handleSaveSettings}
          className="px-6 py-2 bg-green-600 text-white font-semibold rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
        >
          Save Settings
        </button>
      </div>
    </div>
  );
};

export default SettingsClient;
