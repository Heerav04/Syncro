"use client";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-slate-900 mb-4">CollabWork</h1>
          <p className="text-2xl text-slate-600 mb-8">
            Next-Gen Collaborative Task Management Platform
          </p>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto mb-12">
            Empower your distributed teams with secure, scalable work logging
            and accountability.
          </p>

          <div className="bg-white rounded-lg shadow-lg p-8 max-w-3xl mx-auto mb-12">
            <h2 className="text-2xl font-semibold text-slate-900 mb-6">
              Status: Phase 1 - Project Foundation & Infrastructure Setup
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white">
                    ✓
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-slate-900">
                    Next.js 14 Setup
                  </h3>
                  <p className="text-slate-600">
                    TypeScript, ESLint, Tailwind CSS
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white">
                    ✓
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-slate-900">
                    Firebase Integration
                  </h3>
                  <p className="text-slate-600">Admin SDK configured</p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white">
                    ✓
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-slate-900">
                    Security Rules
                  </h3>
                  <p className="text-slate-600">
                    Deny-all Firestore & Storage rules
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white">
                    ✓
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-slate-900">
                    Git & CI/CD
                  </h3>
                  <p className="text-slate-600">
                    GitHub Actions pipeline ready
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                Multi-Tenant
              </h3>
              <p className="text-slate-600">
                Complete data isolation between companies
              </p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                Secure
              </h3>
              <p className="text-slate-600">
                Role-based access with Firebase Auth
              </p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                Scalable
              </h3>
              <p className="text-slate-600">
                Built on serverless Firebase infrastructure
              </p>
            </div>
          </div>

          <div className="mt-12">
            <p className="text-slate-600 mb-4">📋 Phases 2-6 coming soon...</p>
            <p className="text-sm text-slate-500">
              Next Phase: Authentication & Multi-Tenant User Management
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
