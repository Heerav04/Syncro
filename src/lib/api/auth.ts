import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { getAdminServices } from '@/lib/firebase/admin';
import { CustomClaims, UserRole } from '@/types';

export interface AuthenticatedRequest {
  uid: string;
  email: string;
  claims: CustomClaims;
}

export const adminRoles: UserRole[] = ['superAdmin', 'companyAdmin'];
export const teamManagerRoles: UserRole[] = ['superAdmin', 'companyAdmin', 'teamLead'];
export const taskEditorRoles: UserRole[] = ['superAdmin', 'companyAdmin', 'teamLead', 'editor'];
export const allRoles: UserRole[] = ['superAdmin', 'companyAdmin', 'teamLead', 'editor', 'member'];

export async function verifyAuth(request: NextRequest): Promise<AuthenticatedRequest | null> {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);
    const { auth } = getAdminServices();
    const decodedToken = await auth.verifyIdToken(token);
    const role = allRoles.includes(decodedToken.role as UserRole)
      ? (decodedToken.role as UserRole)
      : 'member';

    return {
      uid: decodedToken.uid,
      email: decodedToken.email || '',
      claims: {
        companyId: (decodedToken.companyId as string) || '',
        role,
        teamId: (decodedToken.teamId as string) || undefined,
      },
    };
  } catch (error) {
    console.error('Auth verification failed:', error);
    return null;
  }
}

export async function requireAuth(request: NextRequest) {
  const session = await verifyAuth(request);
  if (!session || !session.claims.companyId) {
    return { session: null, response: unauthorized('Sign in again to continue.') };
  }

  return { session, response: null };
}

export function requireRole(session: AuthenticatedRequest, roles: UserRole[]) {
  if (!roles.includes(session.claims.role)) {
    return forbidden('Your role does not have permission for this action.');
  }

  return null;
}

export function unauthorized(message = 'Unauthorized') {
  return NextResponse.json({ error: message }, { status: 401 });
}

export function forbidden(message = 'Forbidden') {
  return NextResponse.json({ error: message }, { status: 403 });
}

export function badRequest(message = 'Bad Request') {
  return NextResponse.json({ error: message }, { status: 400 });
}

export function notFound(message = 'Not Found') {
  return NextResponse.json({ error: message }, { status: 404 });
}

export function serverError(message = 'Internal Server Error') {
  return NextResponse.json({ error: message }, { status: 500 });
}

export function success<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function now() {
  return new Date().toISOString();
}

export function cleanText(value: unknown, maxLength = 200) {
  if (typeof value !== 'string') {
    return '';
  }

  return value.trim().slice(0, maxLength);
}

export function optionalText(value: unknown, maxLength = 500) {
  const text = cleanText(value, maxLength);
  return text || undefined;
}

export function isValidRole(value: unknown): value is UserRole {
  return allRoles.includes(value as UserRole);
}

export function compactRecord<T extends Record<string, unknown>>(input: T) {
  return Object.fromEntries(
    Object.entries(input).filter(([, value]) => value !== undefined)
  ) as Partial<T>;
}

export function updateTimestamp() {
  return FieldValue.serverTimestamp();
}
