import { NextRequest } from 'next/server';
import { getAdminServices } from '@/lib/firebase/admin';
import {
  badRequest,
  cleanText,
  forbidden,
  isValidRole,
  now,
  requireAuth,
  serverError,
  success,
  teamManagerRoles,
} from '@/lib/api/auth';

export async function GET(request: NextRequest) {
  const { session, response } = await requireAuth(request);
  if (!session) return response;

  try {
    const { firestore } = getAdminServices();
    const snapshot = await firestore
      .collection('companies')
      .doc(session.claims.companyId)
      .collection('users')
      .orderBy('displayName')
      .limit(100)
      .get();

    return success({ users: snapshot.docs.map((doc) => doc.data()) });
  } catch (error) {
    console.error('Failed to load users:', error);
    return serverError('Failed to load users.');
  }
}

export async function PATCH(request: NextRequest) {
  const { session, response } = await requireAuth(request);
  if (!session) return response;

  if (!teamManagerRoles.includes(session.claims.role)) {
    return forbidden('Only admins and team leads can update users.');
  }

  try {
    const body = (await request.json()) as {
      uid?: unknown;
      role?: unknown;
      teamId?: unknown;
      isActive?: unknown;
    };

    const uid = cleanText(body.uid, 128);
    if (!uid) {
      return badRequest('Missing user id.');
    }

    const nextRole = body.role === undefined ? undefined : body.role;
    if (nextRole !== undefined && !isValidRole(nextRole)) {
      return badRequest('Invalid role.');
    }

    const teamId = typeof body.teamId === 'string' && body.teamId.trim()
      ? body.teamId.trim()
      : null;
    const isActive = typeof body.isActive === 'boolean' ? body.isActive : undefined;

    const { auth, firestore } = getAdminServices();
    const userRef = firestore
      .collection('companies')
      .doc(session.claims.companyId)
      .collection('users')
      .doc(uid);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return badRequest('User does not exist in this company.');
    }

    const updates: Record<string, unknown> = { updatedAt: now() };
    if (nextRole !== undefined) updates.role = nextRole;
    if (body.teamId !== undefined) updates.teamId = teamId;
    if (isActive !== undefined) updates.isActive = isActive;

    await userRef.update(updates);
    const finalRole = (nextRole || userDoc.get('role') || 'member') as string;
    const finalTeamId = body.teamId !== undefined ? teamId : userDoc.get('teamId') || null;

    await auth.setCustomUserClaims(uid, {
      companyId: session.claims.companyId,
      role: finalRole,
      teamId: finalTeamId,
    });

    return success({ ok: true });
  } catch (error) {
    console.error('Failed to update user:', error);
    return serverError('Failed to update user.');
  }
}
