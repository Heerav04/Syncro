'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ScreenshotUploader } from '@/components/logs/ScreenshotUploader';
import { WorkLog } from '@/types';

export default function LogsPage() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<WorkLog[]>([]);
  const [text, setText] = useState('');
  const [screenshotUrls, setScreenshotUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/logs');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch logs');
      setLogs(data.logs || []);
    } catch (err: any) {
      setError(err.message || 'Error fetching logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchLogs();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) {
      setError('Log description cannot be empty.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, screenshotUrls }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to submit log');
      }
      setText('');
      setScreenshotUrls([]);
      fetchLogs();
    } catch (err: any) {
      setError(err.message || 'Error submitting log');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
          Daily Work Logs
        </h1>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Track your daily progress and share updates with the team.
        </p>
      </div>

      {error && <div className="mb-6 bg-red-50 text-red-600 p-4 rounded-xl">{error}</div>}

      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl border border-gray-100 dark:border-gray-700 mb-10">
        <h3 className="text-xl font-bold mb-4 dark:text-white">Submit Today's Log</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={4}
            className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            placeholder="What did you work on today?"
            disabled={submitting}
          />
          
          <div className="flex flex-col sm:flex-row gap-4 sm:items-end">
            <div className="flex-1">
              <ScreenshotUploader 
                onUploadSuccess={(url) => setScreenshotUrls([...screenshotUrls, url])} 
              />
            </div>
            <button
              type="submit"
              disabled={submitting || !text.trim()}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-all disabled:opacity-50 sm:w-auto w-full"
            >
              {submitting ? 'Submitting...' : 'Save Log'}
            </button>
          </div>

          {screenshotUrls.length > 0 && (
            <div className="mt-4 flex gap-4 overflow-x-auto pb-2">
              {screenshotUrls.map((url, i) => (
                <div key={i} className="relative flex-shrink-0 group">
                  <img src={url} alt={`Screenshot ${i+1}`} className="h-24 w-auto rounded-lg shadow-sm border border-gray-200 dark:border-gray-600" />
                  <button
                    type="button"
                    onClick={() => setScreenshotUrls(screenshotUrls.filter(u => u !== url))}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </form>
      </div>

      <div className="space-y-6">
        <h3 className="text-xl font-bold dark:text-white">Past Logs</h3>
        {loading ? (
          <div className="animate-pulse flex space-x-4">
            <div className="flex-1 space-y-4 py-1">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              </div>
            </div>
          </div>
        ) : logs.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400">No logs found.</p>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold">
                    {log.userId.substring(0, 2).toUpperCase()}
                  </div>
                  <span className="font-semibold text-gray-900 dark:text-white">{log.date}</span>
                </div>
              </div>
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{log.text}</p>
              {log.screenshotUrls && log.screenshotUrls.length > 0 && (
                <div className="mt-4 flex gap-4 overflow-x-auto">
                  {log.screenshotUrls.map((url, i) => (
                    <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                      <img src={url} alt={`Screenshot ${i+1}`} className="h-32 w-auto rounded-lg shadow-sm border border-gray-200 dark:border-gray-600 hover:opacity-80 transition-opacity" />
                    </a>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
