'use client';

import React from 'react';
import { BibleSource, BibleVersion, PptOptions, SelectedBible, AVAILABLE_THEMES, AVAILABLE_FONTS, ThemeName } from '@/types/bible';

interface BibleSelectorPanelProps {
  sources: BibleSource[];
  selectedSourceDbId: string | null;
  onSelectSource: (dbSourceId: string) => void;
  versionsForSelectedSource: BibleVersion[];
  selectedVersionDbId: string | null;
  onSelectVersion: (dbVersionId: string) => void;
  onAddBible: (bible: SelectedBible) => void;
  finalSelectedBibles: SelectedBible[];
  onRemoveBible: (dbVersionId: string) => void;
  onReorderBibles: (dbVersionId: string, direction: 'up' | 'down') => void;
  pptOptions: PptOptions;
  onPptOptionsChange: (options: PptOptions) => void;
}

const BibleSelectorPanel: React.FC<BibleSelectorPanelProps> = ({
  sources, selectedSourceDbId, onSelectSource,
  versionsForSelectedSource, selectedVersionDbId, onSelectVersion,
  onAddBible, finalSelectedBibles, onRemoveBible, onReorderBibles,
  pptOptions, onPptOptionsChange,
}) => {

  const handleAddCurrentSelection = () => {
    const source = sources.find(s => s.dbSourceId === selectedSourceDbId);
    const version = versionsForSelectedSource.find(v => v.id === selectedVersionDbId);
    if (source && version) {
      onAddBible({
        dbSourceId: source.dbSourceId,
        sourceName: source.sourceName,
        dbVersionId: version.id,
        versionName: version.name,
        versionIdentifier: version.identifier,
        language: version.language,
      });
    }
  };

  const handleOptionChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    const { name, value, type } = e.target;
    let newValue: string | number | boolean | ThemeName = value; // Ensure ThemeName is possible type

    if (type === 'checkbox') {
        newValue = (e.target as HTMLInputElement).checked;
    } else if (type === 'number') {
        newValue = parseInt(value, 10);
    }
    // For themeName, ensure it's cast to ThemeName type
    if (name === 'themeName') {
        newValue = value as ThemeName;
    }

    onPptOptionsChange({ ...pptOptions, [name]: newValue });
  };

  return (
    <div className="space-y-6"> {/* Main container for spacing sections */}
      {/* Section 1: Source Selection */}
      <div>
        <label htmlFor="sourceSelect" className="block text-sm font-medium text-gray-700 mb-1">Bible Source:</label>
        <select
          id="sourceSelect"
          value={selectedSourceDbId || ''}
          onChange={(e) => onSelectSource(e.target.value)}
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md shadow-sm"
          title="Select the source of Bible data (e.g., Godpeople, Godpia)"
        >
          <option value="" disabled>Select a source</option>
          {sources.map(source => (
            <option key={source.dbSourceId} value={source.dbSourceId}>{source.sourceName}</option>
          ))}
        </select>
      </div>

      {/* Section 2: Version Selection (conditional) */}
      {selectedSourceDbId && (
        <div>
          <label htmlFor="versionSelect" className="block text-sm font-medium text-gray-700 mb-1">Bible Version:</label>
          <select
            id="versionSelect"
            value={selectedVersionDbId || ''}
            onChange={(e) => onSelectVersion(e.target.value)}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md shadow-sm"
            title="Select the specific Bible translation or version"
          >
            <option value="" disabled>Select a version</option>
            {versionsForSelectedSource.map(version => (
              <option key={version.id} value={version.id}>{version.name} ({version.identifier})</option>
            ))}
          </select>
        </div>
      )}

      {/* Section 3: Add Button */}
      <div> {/* Wrapped button in a div to ensure space-y-6 applies correctly if other elements were here */}
        <button
          onClick={handleAddCurrentSelection}
          disabled={!selectedVersionDbId}
          className="w-full px-4 py-2 bg-blue-600 text-white font-semibold rounded-md shadow-sm hover:bg-blue-700 disabled:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          title="Add the currently selected Source and Version to the list below for PPT generation"
        >
          Add Selected Bible to PPT List
        </button>
      </div>

      {/* Section 4: Selected Bibles List (conditional) */}
      {finalSelectedBibles.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-md font-medium text-gray-800">Bibles for this PPT:</h3>
          <ul className="border border-gray-300 rounded-md divide-y divide-gray-300 pb-1"> {/* Added pb-1 for slight padding if items are removed */}
            {finalSelectedBibles.map((bible, index) => (
              <li key={bible.dbVersionId} className="p-2 flex justify-between items-center text-sm">
                <span>{index + 1}. {bible.versionName} ({bible.sourceName})</span>
                <div className="space-x-1">
                   <button onClick={() => onReorderBibles(bible.dbVersionId, 'up')} disabled={index === 0} className="text-gray-500 hover:text-gray-700 p-1 disabled:opacity-50" title="Move up">▲</button>
                   <button onClick={() => onReorderBibles(bible.dbVersionId, 'down')} disabled={index === finalSelectedBibles.length - 1} className="text-gray-500 hover:text-gray-700 p-1 disabled:opacity-50" title="Move down">▼</button>
                   <button onClick={() => onRemoveBible(bible.dbVersionId)} className="text-red-500 hover:text-red-700 p-1" title="Remove Bible">✕</button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Section 5: Presentation Options */}
      <div className="space-y-4 pt-4 border-t border-gray-200"> {/* This already has pt-4 and border-t */}
        <h3 className="text-md font-medium text-gray-800 mb-3">Presentation Options:</h3> {/* Increased mb-2 to mb-3 */}

        {/* Theme, Fonts, and other options follow, each in their own div, spaced by space-y-4 */}
        <div>
          <label htmlFor="themeName" className="block text-sm font-medium text-gray-700">Theme:</label>
          <select name="themeName" id="themeName" value={pptOptions.themeName || 'defaultLight'} onChange={handleOptionChange}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md shadow-sm"
                  title="Choose a presentation theme">
            {AVAILABLE_THEMES.map(theme => (
              <option key={theme} value={theme}>
                {theme.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="bodyFont" className="block text-sm font-medium text-gray-700">Body Font:</label>
          <select name="bodyFont" id="bodyFont" value={pptOptions.bodyFont || AVAILABLE_FONTS[0]} onChange={handleOptionChange}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md shadow-sm"
                  title="Select the main font for verse text">
            {AVAILABLE_FONTS.map(font => (
              <option key={font} value={font}>{font}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="titleFont" className="block text-sm font-medium text-gray-700">Title Font:</label>
          <select name="titleFont" id="titleFont" value={pptOptions.titleFont || AVAILABLE_FONTS[0]} onChange={handleOptionChange}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md shadow-sm"
                  title="Select the font for book/chapter titles on slides">
            {AVAILABLE_FONTS.map(font => (
              <option key={font} value={font}>{font}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="maxLinesPerSlide" className="block text-sm font-medium text-gray-700">Max Lines Per Slide (0 for unlimited):</label>
          <input type="number" name="maxLinesPerSlide" id="maxLinesPerSlide" min="0" max="20"
                 value={pptOptions.maxLinesPerSlide} onChange={handleOptionChange}
                 className="mt-1 block w-full pl-3 pr-3 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md shadow-sm"
                 title="Set maximum lines of verse text per slide. 0 means no limit."/>
        </div>
        <div>
          <label htmlFor="showBookNameOnSlide" className="block text-sm font-medium text-gray-700">Show Book Name:</label>
          <select name="showBookNameOnSlide" id="showBookNameOnSlide" value={pptOptions.showBookNameOnSlide} onChange={handleOptionChange}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md shadow-sm"
                  title="Control when the book name appears on slides">
            <option value="firstOfChapter">First verse of chapter</option>
            <option value="firstOfBook">First verse of book</option>
            <option value="always">Always on slide</option>
          </select>
        </div>
         <div>
          <label htmlFor="showChapterNumberOnSlide" className="block text-sm font-medium text-gray-700">Show Chapter Number:</label>
          <select name="showChapterNumberOnSlide" id="showChapterNumberOnSlide" value={pptOptions.showChapterNumberOnSlide} onChange={handleOptionChange}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md shadow-sm"
                  title="Control when the chapter number appears on slides">
            <option value="firstOfChapter">First verse of chapter</option>
            <option value="firstOfBook">First verse of book (implies chapter too)</option>
            <option value="always">Always on slide</option>
          </select>
        </div>
        <div>
            <label htmlFor="splitChaptersIntoFiles" className="flex items-center text-sm font-medium text-gray-700" title="If checked, generates a ZIP file with one PPTX per chapter. Otherwise, a single PPTX file.">
                <input type="checkbox" name="splitChaptersIntoFiles" id="splitChaptersIntoFiles"
                       checked={pptOptions.splitChaptersIntoFiles} onChange={handleOptionChange}
                       className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 mr-2"/>
                Split chapters into separate files
            </label>
        </div>
      </div>
    </div>
  );
};
export default BibleSelectorPanel;
