'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { PptOptions, SelectedBible } from '@/types/bible'; // SelectedBible expects dbSourceId
import { JobStatus } from '@prisma/client';

// This interface should match SelectedBibleVersionInfoForHistory from the API route
export interface JobHistoryItemBibleVersion { // Renamed for clarity
    dbVersionId: string;
    versionName: string;
    identifier: string; // version identifier
    language: string;
    dbSourceId: string; // Actual DB ID of the source
    sourceName: string;
    sourceIdentifier: string; // source identifier
}

export interface JobHistoryItem { // Main interface for items displayed in this component
  id: string;
  createdAt: string;
  queryString: string;
  bibleVersionsUsed: JobHistoryItemBibleVersion[]; // Use the more detailed type
  optionsUsed: PptOptions & { titleSlide?: { title: string; subtitle?: string } };
  status: JobStatus;
  outputFilename?: string | null;
  errorMessage?: string | null;
}

const SESSION_STORAGE_KEY_JOB_TO_LOAD = 'jobToLoad';

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
      // Map JobHistoryItemBibleVersion[] to SelectedBible[]
      // SelectedBible type is defined in @/types/bible.ts
      const finalSelectedBiblesToLoad: SelectedBible[] = job.bibleVersionsUsed.map(bv => ({
          dbSourceId: bv.dbSourceId, // Now correctly populated from history
          sourceName: bv.sourceName,
          dbVersionId: bv.dbVersionId,
          versionName: bv.versionName,
          versionIdentifier: bv.identifier, // This is version's own identifier
          language: bv.language,
      }));

      const dataToLoad = {
        queryString: job.queryString,
        finalSelectedBibles: finalSelectedBiblesToLoad,
        pptOptions: job.optionsUsed,
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
    // Displaying sourceName along with versionName for clarity
    return versions.map(v => `${v.versionName} (${v.sourceName})`).join(', ');
  };

  const formatOptions = (options: JobHistoryItem['optionsUsed']): string => {
    let parts: string[] = [];
    if (options.maxLinesPerSlide && options.maxLinesPerSlide > 0) parts.push(`Lines/Slide: ${options.maxLinesPerSlide}`);
    if (options.splitChaptersIntoFiles) parts.push('Split Chapters');
    // Add more options if needed from PptOptions
    if (options.showBookNameOnSlide) parts.push(`Book Name: ${options.showBookNameOnSlide.replace('firstOf', '1st/')}`);
    if (options.showChapterNumberOnSlide) parts.push(`Chap #: ${options.showChapterNumberOnSlide.replace('firstOf', '1st/')}`);
    return parts.length > 0 ? parts.join(', ') : 'Defaults';
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
              <td className="px-4 py-2">{formatOptions(job.optionsUsed)}</td>
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
