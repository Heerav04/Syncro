'use client';

import { useEffect, useState, use } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { KanbanBoard } from '@/components/tasks/KanbanBoard';
import { CreateTaskForm } from '@/components/tasks/CreateTaskForm';
import { Task } from '@/types';

type PageProps = {
  params: Promise<{ teamId: string }>;
};

export default function TasksPage({ params }: PageProps) {
  const { teamId } = use(params);
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);

  const fetchTasks = async () => {
    try {
      const res = await fetch(`/api/tasks?teamId=${teamId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch tasks');
      setTasks(data.tasks || []);
    } catch (err: any) {
      setError(err.message || 'Error fetching tasks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (teamId) fetchTasks();
  }, [teamId, user]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Team Tasks
          </h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Manage your project tasks visually.
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl font-medium shadow-sm transition-colors"
        >
          {showForm ? 'Close Form' : 'New Task'}
        </button>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 text-red-600 p-4 rounded-xl border border-red-200">
          {error}
        </div>
      )}

      {showForm && (
        <div className="mb-8 max-w-lg">
          <CreateTaskForm 
            teamId={teamId} 
            onSuccess={() => {
              setShowForm(false);
              fetchTasks();
            }} 
          />
        </div>
      )}

      <KanbanBoard tasks={tasks} teamId={teamId} onUpdate={fetchTasks} />
    </div>
  );
}
