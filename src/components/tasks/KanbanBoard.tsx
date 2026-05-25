'use client';

import { useState } from 'react';
import { Task } from '@/types';

type KanbanBoardProps = {
  tasks: Task[];
  teamId: string;
  onUpdate: () => void;
};

const statuses = [
  { id: 'todo', label: 'To Do', color: 'bg-gray-100 dark:bg-gray-800' },
  { id: 'in-progress', label: 'In Progress', color: 'bg-blue-50 dark:bg-blue-900/20' },
  { id: 'done', label: 'Done', color: 'bg-green-50 dark:bg-green-900/20' },
] as const;

export function KanbanBoard({ tasks, teamId, onUpdate }: KanbanBoardProps) {
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, status: string) => {
    e.preventDefault();
    if (!draggedTaskId) return;

    const task = tasks.find((t) => t.id === draggedTaskId);
    if (!task || task.status === status) {
      setDraggedTaskId(null);
      return;
    }

    setUpdating(draggedTaskId);
    setDraggedTaskId(null);

    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamId, status }),
      });
      if (res.ok) {
        onUpdate();
      }
    } catch (error) {
      console.error('Failed to update task status', error);
    } finally {
      setUpdating(null);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400';
      case 'medium': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'low': return 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-800';
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {statuses.map((status) => {
        const columnTasks = tasks.filter((t) => t.status === status.id);

        return (
          <div
            key={status.id}
            className={`rounded-2xl p-4 min-h-[500px] border border-gray-200 dark:border-gray-700 transition-colors ${status.color}`}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, status.id)}
          >
            <div className="flex justify-between items-center mb-4 px-2">
              <h3 className="font-bold text-gray-700 dark:text-gray-200">{status.label}</h3>
              <span className="bg-white dark:bg-gray-700 text-gray-500 text-xs py-1 px-2 rounded-full font-semibold shadow-sm">
                {columnTasks.length}
              </span>
            </div>

            <div className="space-y-3">
              {columnTasks.map((task) => (
                <div
                  key={task.id}
                  draggable={!updating}
                  onDragStart={(e) => handleDragStart(e, task.id)}
                  className={`bg-white dark:bg-gray-700 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-600 cursor-grab active:cursor-grabbing hover:shadow-md transition-all ${
                    updating === task.id ? 'opacity-50' : ''
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${getPriorityColor(task.priority)}`}>
                      {task.priority}
                    </span>
                  </div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-1 leading-tight">
                    {task.title}
                  </h4>
                  {task.description && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-3">
                      {task.description}
                    </p>
                  )}
                  <div className="flex justify-between items-center text-xs text-gray-400">
                    {task.assigneeId ? (
                      <div className="flex items-center gap-1">
                        <div className="w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center text-white text-[10px] font-bold">
                          {task.assigneeId.substring(0, 2).toUpperCase()}
                        </div>
                      </div>
                    ) : (
                      <span>Unassigned</span>
                    )}
                    {task.dueDate && <span>{new Date(task.dueDate).toLocaleDateString()}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
