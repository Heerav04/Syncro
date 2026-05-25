import { NextRequest } from 'next/server';
import { getAdminServices } from '@/lib/firebase/admin';
import {
  badRequest,
  cleanText,
  now,
  optionalText,
  requireAuth,
  requireRole,
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
      .collection('teams')
      .orderBy('name')
      .limit(100)
      .get();

    return success({ teams: snapshot.docs.map((doc) => doc.data()) });
  } catch (error) {
    console.error('Failed to load teams:', error);
    return serverError('Failed to load teams.');
  }
}

export async function POST(request: NextRequest) {
  const { session, response } = await requireAuth(request);
  if (!session) return response;

  const roleError = requireRole(session, teamManagerRoles);
  if (roleError) return roleError;

  try {
    const body = (await request.json()) as {
      name?: unknown;
      description?: unknown;
      leadId?: unknown;
    };
    const name = cleanText(body.name, 120);
    const leadId = cleanText(body.leadId, 128);

    if (!name || !leadId) {
      return badRequest('Team name and lead are required.');
    }

    const { auth, firestore } = getAdminServices();
    const companyRef = firestore.collection('companies').doc(session.claims.companyId);
    const leadDoc = await companyRef.collection('users').doc(leadId).get();
    if (!leadDoc.exists) {
      return badRequest('Selected lead does not exist.');
    }

    const teamRef = companyRef.collection('teams').doc();
    const team = {
      id: teamRef.id,
      companyId: session.claims.companyId,
      name,
      description: optionalText(body.description, 500) || '',
      leadId,
      editorIds: [],
      memberIds: [leadId],
      createdAt: now(),
      updatedAt: now(),
    };

    await firestore.runTransaction(async (transaction) => {
      transaction.set(teamRef, team);
      transaction.update(companyRef.collection('users').doc(leadId), {
        role: 'teamLead',
        teamId: teamRef.id,
        updatedAt: now(),
      });
    });

    await auth.setCustomUserClaims(leadId, {
      companyId: session.claims.companyId,
      role: 'teamLead',
      teamId: teamRef.id,
    });

    return success({ team }, 201);
  } catch (error) {
    console.error('Failed to create team:', error);
    return serverError('Failed to create team.');
  }
}
