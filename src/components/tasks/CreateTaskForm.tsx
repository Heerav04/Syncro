'use client';

import { useState } from 'react';

type CreateTaskFormProps = {
  teamId: string;
  onSuccess: () => void;
};

export function CreateTaskForm({ teamId, onSuccess }: CreateTaskFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Task title is required.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamId, title, description, priority }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create task');

      setTitle('');
      setDescription('');
      setPriority('medium');
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Error creating task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl border border-gray-100 dark:border-gray-700">
      <h3 className="text-xl font-bold mb-4 dark:text-white">New Task</h3>
      
      {error && <div className="mb-4 text-red-500 text-sm">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="What needs to be done?"
            disabled={loading}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description (optional)</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            rows={3}
            placeholder="Add some details..."
            disabled={loading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Priority</label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
            disabled={loading}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={loading || !title.trim()}
          className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-all disabled:opacity-50"
        >
          {loading ? 'Creating...' : 'Create Task'}
        </button>
      </form>
    </div>
  );
}
