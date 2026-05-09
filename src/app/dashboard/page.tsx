'use client';

import { useAuth } from '@/contexts/AuthContext';
import { RequireAuth, RoleText } from '@/components/RoleGate';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
  const { user, claims, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push('/auth/login');
  };

  return (
    <RequireAuth>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        {/* Header */}
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-slate-900">CollabWork</h1>
                <p className="text-slate-600 mt-1">Dashboard</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm font-medium text-slate-900">{user?.displayName}</p>
                  <p className="text-sm text-slate-500">{user?.email}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Welcome Card */}
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">
              Welcome, {user?.displayName}!
            </h2>
            <p className="text-slate-600 mb-4">
              You are logged in as <strong><RoleText role={claims?.role || 'member'} /></strong> in company <strong>{claims?.companyId}</strong>
            </p>

            {/* User Info Box */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <div className="bg-slate-50 rounded-lg p-4">
                <p className="text-xs text-slate-500 uppercase tracking-wide">Role</p>
                <p className="text-lg font-semibold text-slate-900 mt-1">
                  <RoleText role={claims?.role || 'member'} />
                </p>
              </div>
              <div className="bg-slate-50 rounded-lg p-4">
                <p className="text-xs text-slate-500 uppercase tracking-wide">Company</p>
                <p className="text-lg font-semibold text-slate-900 mt-1">{claims?.companyId}</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-4">
                <p className="text-xs text-slate-500 uppercase tracking-wide">Email</p>
                <p className="text-lg font-semibold text-slate-900 mt-1">{user?.email}</p>
              </div>
            </div>
          </div>

          {/* Phase 2 Status */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 mb-8">
            <h3 className="text-xl font-bold text-blue-900 mb-4">✅ Phase 2: Authentication Complete</h3>
            <p className="text-blue-700 mb-4">
              You have successfully authenticated! The following Phase 2 features are now available:
            </p>
            <ul className="list-disc list-inside text-blue-700 space-y-2">
              <li>User registration with multi-tenant support</li>
              <li>Firebase Authentication integration</li>
              <li>Custom claims for role-based access control</li>
              <li>Secure Firestore Security Rules</li>
              <li>Auth context with useAuth() hook</li>
            </ul>
          </div>

          {/* Features by Role */}
          {claims?.role === 'companyAdmin' && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-8">
              <h3 className="text-xl font-bold text-purple-900 mb-4">Company Admin Features</h3>
              <p className="text-purple-700 mb-4">
                As a Company Admin, you have access to:
              </p>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <li className="flex items-start">
                  <span className="mr-3 text-lg">👥</span>
                  <span className="text-purple-700">User management (Invite, deactivate, reset roles)</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-3 text-lg">🏢</span>
                  <span className="text-purple-700">Company settings and configuration</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-3 text-lg">🔍</span>
                  <span className="text-purple-700">View all company data and reports</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-3 text-lg">🎯</span>
                  <span className="text-purple-700">Team and project management (Phase 3)</span>
                </li>
              </ul>
            </div>
          )}

          {/* Next Phases */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Coming Next: Phase 3</h3>
              <p className="text-slate-600 mb-4">
                <strong>Team Management Module</strong>
              </p>
              <ul className="text-sm text-slate-600 space-y-2">
                <li>✓ Create and manage teams</li>
                <li>✓ Invite team members</li>
                <li>✓ Designate task editors</li>
                <li>✓ Team-level permissions</li>
              </ul>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Phase 4 & Beyond</h3>
              <p className="text-slate-600 mb-4">
                <strong>Task Management & Work Logging</strong>
              </p>
              <ul className="text-sm text-slate-600 space-y-2">
                <li>✓ Task board with Kanban view</li>
                <li>✓ Daily work logging with screenshots</li>
                <li>✓ Audit trails and reporting</li>
                <li>✓ Real-time collaboration</li>
              </ul>
            </div>
          </div>
        </main>
      </div>
    </RequireAuth>
  );
}
