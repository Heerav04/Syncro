'use client';

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types';

interface RoleGateProps {
  role: UserRole | UserRole[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * RoleGate Component
 * Conditionally renders content based on user role
 *
 * Usage:
 * <RoleGate role="teamLead">
 *   <AdminPanel />
 * </RoleGate>
 *
 * With fallback:
 * <RoleGate role="superAdmin" fallback={<AccessDenied />}>
 *   <SystemSettings />
 * </RoleGate>
 */
export function RoleGate({ role, children, fallback }: RoleGateProps) {
  const { claims, loading } = useAuth();

  if (loading) {
    return <div className="flex items-center justify-center p-4">Loading...</div>;
  }

  if (!claims) {
    return (
      fallback || (
        <div className="flex flex-col items-center justify-center p-4">
          <p className="text-red-600">Not authenticated</p>
        </div>
      )
    );
  }

  // Check if user has the required role
  const roles = Array.isArray(role) ? role : [role];
  const hasAccess = roles.includes(claims.role);

  if (!hasAccess) {
    return (
      fallback || (
        <div className="flex flex-col items-center justify-center p-4">
          <p className="text-red-600">Access Denied</p>
        </div>
      )
    );
  }

  return <>{children}</>;
}

/**
 * RoleText Component
 * Renders role display name
 */
export function RoleText({ role }: { role: UserRole }) {
  const roleNames: Record<UserRole, string> = {
    superAdmin: 'Super Admin',
    companyAdmin: 'Company Admin',
    teamLead: 'Team Lead',
    editor: 'Editor',
    member: 'Member',
  };

  return <span>{roleNames[role] || role}</span>;
}

/**
 * RequireAuth Component
 * Redirects to login if not authenticated
 */
export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="flex items-center justify-center p-4">Loading...</div>;
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-lg text-gray-600">Please log in to continue</p>
      </div>
    );
  }

  return <>{children}</>;
}
