import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/firebase/admin';
import { CustomClaims } from '@/types';

export interface AuthenticatedRequest {
  uid: string;
  email: string;
  claims: CustomClaims;
}

/**
 * Verify Firebase JWT token and extract custom claims
 * Returns null if token is invalid or missing
 */
export async function verifyAuth(request: NextRequest): Promise<AuthenticatedRequest | null> {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7); // Remove "Bearer " prefix
    const decodedToken = await auth.verifyIdToken(token);

    return {
      uid: decodedToken.uid,
      email: decodedToken.email || '',
      claims: {
        companyId: (decodedToken.companyId as string) || '',
        role: (decodedToken.role as any) || 'member',
        teamId: (decodedToken.teamId as string) || undefined,
      },
    };
  } catch (error) {
    console.error('Auth verification failed:', error);
    return null;
  }
}

/**
 * Send a 401 Unauthorized response
 */
export function unauthorized(message: string = 'Unauthorized') {
  return NextResponse.json({ error: message }, { status: 401 });
}

/**
 * Send a 403 Forbidden response
 */
export function forbidden(message: string = 'Forbidden') {
  return NextResponse.json({ error: message }, { status: 403 });
}

/**
 * Send a 400 Bad Request response
 */
export function badRequest(message: string = 'Bad Request') {
  return NextResponse.json({ error: message }, { status: 400 });
}

/**
 * Send a 500 Internal Server Error response
 */
export function serverError(message: string = 'Internal Server Error') {
  return NextResponse.json({ error: message }, { status: 500 });
}

/**
 * Send a 200 OK response with data
 */
export function success<T>(data: T, status: number = 200) {
  return NextResponse.json(data, { status });
}

/**
 * Check if user has required role
 */
export function hasRole(userRole: string, requiredRole: string | string[]): boolean {
  const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
  return roles.includes(userRole);
}

/**
 * Check if user has any of the required permissions
 */
export function canAccess(userRole: string, action: string): boolean {
  const permissions: Record<string, string[]> = {
    'create-company': ['superAdmin'],
    'create-team': ['superAdmin', 'companyAdmin', 'teamLead'],
    'assign-team-lead': ['superAdmin', 'companyAdmin'],
    'add-team-member': ['superAdmin', 'companyAdmin', 'teamLead'],
    'designate-editor': ['superAdmin', 'companyAdmin', 'teamLead'],
    'create-task': ['superAdmin', 'companyAdmin', 'teamLead', 'editor'],
    'edit-task': ['superAdmin', 'companyAdmin', 'teamLead', 'editor'],
    'log-work': ['superAdmin', 'companyAdmin', 'teamLead', 'editor', 'member'],
    'upload-screenshot': ['superAdmin', 'companyAdmin', 'teamLead', 'editor', 'member'],
    'view-team-logs': ['superAdmin', 'companyAdmin', 'teamLead'],
    'view-own-logs': ['superAdmin', 'companyAdmin', 'teamLead', 'editor', 'member'],
  };

  const requiredRoles = permissions[action] || [];
  return requiredRoles.includes(userRole);
}
