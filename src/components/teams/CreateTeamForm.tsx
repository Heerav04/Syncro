'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

type CreateTeamFormProps = {
  onSuccess?: () => void;
};

export default function CreateTeamForm({ onSuccess }: CreateTeamFormProps) {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Team name is required.');
      return;
    }
    
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          leadId: user?.uid,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create team');
      }

      setName('');
      setDescription('');
      onSuccess?.();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-2xl p-6 shadow-xl border border-gray-100 dark:border-gray-700 transition-all duration-300 hover:shadow-2xl">
      <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-4">
        Create New Team
      </h3>
      
      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm mb-4 border border-red-100 dark:border-red-800/50">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="teamName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Team Name
          </label>
          <input
            id="teamName"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
            placeholder="e.g. Engineering, Marketing..."
            disabled={loading}
          />
        </div>

        <div>
          <label htmlFor="teamDesc" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Description
          </label>
          <textarea
            id="teamDesc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none resize-none"
            placeholder="Optional team description..."
            disabled={loading}
          />
        </div>

        <button
          type="submit"
          disabled={loading || !name.trim()}
          className="w-full py-2.5 px-4 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-medium rounded-xl shadow-md transition-all duration-300 transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          {loading ? 'Creating...' : 'Create Team'}
        </button>
      </form>
    </div>
  );
}
