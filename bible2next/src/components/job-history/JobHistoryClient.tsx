'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { PptOptions, SelectedBible, ThemeName, AVAILABLE_THEMES, AVAILABLE_FONTS } from '@/types/bible'; // Import ThemeName and constants
import { JobStatus } from '@prisma/client';

// This interface should match SelectedBibleVersionInfoForHistory from the API
export interface JobHistoryItemBibleVersion {
    dbVersionId: string;
    versionName: string;
    identifier: string;
    language: string;
    dbSourceId: string;
    sourceName: string;
    sourceIdentifier: string;
}

// Updated to include new PptOptions fields explicitly
export interface JobHistoryItem {
  id: string;
  createdAt: string;
  queryString: string;
  bibleVersionsUsed: JobHistoryItemBibleVersion[];
  // PptOptions from '@/types/bible' already includes themeName, bodyFont, titleFont
  optionsUsed: PptOptions & { titleSlide?: { title: string; subtitle?: string } };
  status: JobStatus;
  outputFilename?: string | null;
  errorMessage?: string | null;
}

const SESSION_STORAGE_KEY_JOB_TO_LOAD = 'jobToLoad';

// Define default PptOptions for the client, matching API defaults for consistency
const CLIENT_DEFAULT_PPT_OPTIONS: PptOptions = {
  splitChaptersIntoFiles: false,
  maxLinesPerSlide: 0,
  showBookNameOnSlide: 'firstOfChapter',
  showChapterNumberOnSlide: 'firstOfChapter',
  themeName: 'defaultLight',
  bodyFont: 'Arial',
  titleFont: 'Arial',
};


const JobHistoryClient: React.FC = () => {
  const [history, setHistory] = useState<JobHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const fetchHistory = useCallback(async () => {
    setIsLoading(true); setError(null);
    try {
      const res = await fetch('/api/history');
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to fetch history: ${res.statusText}`);
      }
      const data: JobHistoryItem[] = await res.json();
      setHistory(data);
    } catch (e) { setError((e as Error).message); } finally { setIsLoading(false); }
  }, []);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  const handleDeleteJob = async (jobId: string) => {
    if (!window.confirm('Are you sure you want to delete this history entry?')) return;
    try {
      setError(null);
      const res = await fetch(`/api/history/${jobId}`, { method: 'DELETE' });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to delete job ${jobId}: ${res.statusText}`);
      }
      fetchHistory();
    } catch (e) { setError((e as Error).message); }
  };

  const handleLoadToBuild = (job: JobHistoryItem) => {
    try {
      // Ensure optionsUsed has all potential fields from PptOptions for safety when loading
      // Merge saved options with client-side defaults to ensure all UI fields can be populated
      const loadedPptOptions: PptOptions = {
        ...CLIENT_DEFAULT_PPT_OPTIONS, // Start with client defaults
        ...(job.optionsUsed || {}),    // Spread saved options over them
        // Ensure themeName and fonts are valid, fallback to default if not.
        // This is important if data was saved with invalid values or if available options change.
        themeName: AVAILABLE_THEMES.includes(job.optionsUsed.themeName as ThemeName) ? job.optionsUsed.themeName : CLIENT_DEFAULT_PPT_OPTIONS.themeName,
        bodyFont: AVAILABLE_FONTS.includes(job.optionsUsed.bodyFont!) ? job.optionsUsed.bodyFont : CLIENT_DEFAULT_PPT_OPTIONS.bodyFont,
        titleFont: AVAILABLE_FONTS.includes(job.optionsUsed.titleFont!) ? job.optionsUsed.titleFont : CLIENT_DEFAULT_PPT_OPTIONS.titleFont,
      };

      // titleSlide needs to be handled carefully if it's part of PptOptions,
      // or if it's only in JobHistoryItem.optionsUsed directly.
      // PptOptions in types/bible.ts does not define titleSlide. It's added via intersection type in JobHistoryItem.
      // So, loadedPptOptions will have it if job.optionsUsed had it.
      if (job.optionsUsed.titleSlide) {
        (loadedPptOptions as any).titleSlide = job.optionsUsed.titleSlide;
      }


      const dataToLoad = {
        queryString: job.queryString,
        finalSelectedBibles: job.bibleVersionsUsed.map(bv => ({
            dbSourceId: bv.dbSourceId, sourceName: bv.sourceName,
            dbVersionId: bv.dbVersionId, versionName: bv.versionName,
            versionIdentifier: bv.identifier, language: bv.language,
        })),
        pptOptions: loadedPptOptions,
      };
      sessionStorage.setItem(SESSION_STORAGE_KEY_JOB_TO_LOAD, JSON.stringify(dataToLoad));
      router.push('/build');
    } catch (e) {
      console.error("Error preparing data for build page:", e);
      setError("Could not load job settings. Data might be incompatible.");
    }
  };

  const formatBibleVersions = (versions: JobHistoryItem['bibleVersionsUsed']): string => {
    if (!versions || versions.length === 0) return 'N/A';
    return versions.map(v => `${v.versionName} (${v.sourceName})`).join(', ');
  };

  // Updated formatOptions to include theme and fonts, handling undefined or default values
  const formatOptions = (options: JobHistoryItem['optionsUsed']): string => {
    let parts: string[] = [];
    if (options.themeName && options.themeName !== CLIENT_DEFAULT_PPT_OPTIONS.themeName) {
        const themeDisplayName = options.themeName.replace('default','').replace('theme','').replace(/([A-Z])/g, ' $1').trim();
        parts.push(`Theme: ${themeDisplayName || options.themeName}`);
    }
    if (options.bodyFont && options.bodyFont !== CLIENT_DEFAULT_PPT_OPTIONS.bodyFont) parts.push(`Body Font: ${options.bodyFont}`);
    if (options.titleFont && options.titleFont !== CLIENT_DEFAULT_PPT_OPTIONS.titleFont) parts.push(`Title Font: ${options.titleFont}`);
    if (options.maxLinesPerSlide && options.maxLinesPerSlide !== CLIENT_DEFAULT_PPT_OPTIONS.maxLinesPerSlide) parts.push(`Lines/S: ${options.maxLinesPerSlide}`);
    if (options.splitChaptersIntoFiles !== CLIENT_DEFAULT_PPT_OPTIONS.splitChaptersIntoFiles && options.splitChaptersIntoFiles) parts.push('Split Ch.'); // Only show if true

    return parts.length > 0 ? parts.join('; ') : 'Defaults';
  };

  if (isLoading) return <p className="text-center text-gray-600">Loading history...</p>;
  if (error) return <p className="text-center text-red-500 p-4 bg-red-100 rounded-md">Error: {error}</p>;
  if (history.length === 0) return <p className="text-center text-gray-600">No job history found.</p>;

  return (
    <div className="overflow-x-auto shadow-md rounded-lg">
      <table className="min-w-full text-sm text-left text-gray-700 bg-white">
        <thead className="text-xs text-gray-700 uppercase bg-gray-100">
          <tr>
            <th scope="col" className="px-4 py-3">Date</th>
            <th scope="col" className="px-4 py-3">Query</th>
            <th scope="col" className="px-4 py-3">Bibles Used</th>
            <th scope="col" className="px-4 py-3">Options</th>
            <th scope="col" className="px-4 py-3">Status</th>
            <th scope="col" className="px-4 py-3">Filename/Error</th>
            <th scope="col" className="px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {history.map((job) => (
            <tr key={job.id} className="border-b hover:bg-gray-50">
              <td className="px-4 py-2">{new Date(job.createdAt).toLocaleString()}</td>
              <td className="px-4 py-2 truncate max-w-xs" title={job.queryString}>{job.queryString}</td>
              <td className="px-4 py-2">{formatBibleVersions(job.bibleVersionsUsed)}</td>
              <td className="px-4 py-2 max-w-[200px] truncate" title={formatOptions(job.optionsUsed)}>{formatOptions(job.optionsUsed)}</td>
              <td className="px-4 py-2">
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                  job.status === JobStatus.COMPLETED ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {job.status}
                </span>
              </td>
              <td className="px-4 py-2 truncate max-w-xs" title={job.status === JobStatus.COMPLETED ? job.outputFilename || '' : job.errorMessage || ''}>
                {job.status === JobStatus.COMPLETED ? job.outputFilename : job.errorMessage}
              </td>
              <td className="px-4 py-2 space-x-2">
                <button onClick={() => handleLoadToBuild(job)} className="font-medium text-blue-600 hover:underline">Load</button>
                <button onClick={() => handleDeleteJob(job.id)} className="font-medium text-red-600 hover:underline">Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
export default JobHistoryClient;
