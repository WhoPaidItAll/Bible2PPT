// src/app/history/page.tsx
import JobHistoryClient from '@/components/job-history/JobHistoryClient';
import Link from 'next/link';

export default function HistoryPage() {
  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Job History</h1>
        <Link href="/build" className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
          Back to Build Page
        </Link>
      </div>
      <JobHistoryClient />
    </div>
  );
}
