'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import CreateTeamForm from '@/components/teams/CreateTeamForm';
import TeamRoster from '@/components/teams/TeamRoster';
import { RoleGate } from '@/components/RoleGate';

type Team = {
  id: string;
  name: string;
  description: string;
  leadId: string;
  editorIds: string[];
  memberIds: string[];
};

export default function TeamsPage() {
  const { user } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchTeams = async () => {
    try {
      const res = await fetch('/api/teams');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch teams');
      setTeams(data.teams || []);
    } catch (err: any) {
      setError(err.message || 'Error fetching teams');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, [user]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
          Team Management
        </h1>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Create and manage organizational teams, roles, and members.
        </p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-600 rounded-xl p-4">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {teams.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No teams</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Get started by creating a new team.</p>
            </div>
          ) : (
            teams.map(team => (
              <TeamRoster key={team.id} team={team} onUpdate={fetchTeams} />
            ))
          )}
        </div>

        <RoleGate role={['companyAdmin', 'superAdmin', 'teamLead']}>
          <div className="lg:col-span-1">
            <div className="sticky top-6">
              <CreateTeamForm onSuccess={fetchTeams} />
            </div>
          </div>
        </RoleGate>
      </div>
    </div>
  );
}
