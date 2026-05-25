'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

type Team = {
  id: string;
  name: string;
  description: string;
  leadId: string;
  editorIds: string[];
  memberIds: string[];
};

type TeamRosterProps = {
  team: Team;
  onUpdate?: () => void;
};

export default function TeamRoster({ team, onUpdate }: TeamRosterProps) {
  const { user, claims } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const canManage = claims?.role === 'companyAdmin' || claims?.role === 'superAdmin' || claims?.role === 'teamLead';

  // Helper method for demo purposes. In real app we'd map memberIds to user profiles.
  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('Are you sure you want to remove this member?')) return;
    
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/teams/${team.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberIds: team.memberIds.filter(id => id !== memberId),
          editorIds: team.editorIds.filter(id => id !== memberId)
        }),
      });
      if (!res.ok) throw new Error('Failed to update team');
      onUpdate?.();
    } catch (err: any) {
      setError(err.message || 'Error updating team');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-2xl p-6 shadow-xl border border-gray-100 dark:border-gray-700">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            {team.name}
            <span className="text-xs px-2 py-1 bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300 rounded-full font-medium">
              {team.memberIds.length} Members
            </span>
          </h3>
          {team.description && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{team.description}</p>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-4 text-sm text-red-600 bg-red-50 rounded-lg p-3">{error}</div>
      )}

      <div className="space-y-3">
        {team.memberIds.map(memberId => {
          const isLead = memberId === team.leadId;
          const isEditor = team.editorIds.includes(memberId);
          
          return (
            <div 
              key={memberId} 
              className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold shadow-sm">
                  {memberId.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    User {memberId.substring(0, 5)}...
                  </div>
                  <div className="text-xs text-gray-500 flex gap-2 mt-0.5">
                    {isLead && <span className="text-purple-600 dark:text-purple-400 font-medium">Lead</span>}
                    {isEditor && !isLead && <span className="text-blue-600 dark:text-blue-400">Editor</span>}
                    {!isLead && !isEditor && <span>Member</span>}
                  </div>
                </div>
              </div>
              
              {canManage && !isLead && (
                <button 
                  onClick={() => handleRemoveMember(memberId)}
                  disabled={loading}
                  className="text-gray-400 hover:text-red-500 transition-colors p-2"
                  title="Remove from team"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
