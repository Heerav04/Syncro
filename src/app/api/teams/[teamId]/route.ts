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

type RouteContext = {
  params: Promise<{ teamId: string }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { session, response } = await requireAuth(request);
  if (!session) return response;

  const roleError = requireRole(session, teamManagerRoles);
  if (roleError) return roleError;

  try {
    const { teamId } = await context.params;
    const body = (await request.json()) as {
      name?: unknown;
      description?: unknown;
      memberIds?: unknown;
      editorIds?: unknown;
    };

    const updates: Record<string, unknown> = { updatedAt: now() };
    const name = cleanText(body.name, 120);
    if (body.name !== undefined) {
      if (!name) return badRequest('Team name cannot be empty.');
      updates.name = name;
    }
    if (body.description !== undefined) {
      updates.description = optionalText(body.description, 500) || '';
    }
    if (Array.isArray(body.memberIds)) {
      updates.memberIds = body.memberIds.filter((id): id is string => typeof id === 'string');
    }
    if (Array.isArray(body.editorIds)) {
      const editorIds = body.editorIds.filter((id): id is string => typeof id === 'string');
      if (editorIds.length > 2) {
        return badRequest('Maximum 2 editors allowed per team.');
      }
      updates.editorIds = editorIds;
    }

    const { firestore } = getAdminServices();
    await firestore
      .collection('companies')
      .doc(session.claims.companyId)
      .collection('teams')
      .doc(teamId)
      .update(updates);

    return success({ ok: true });
  } catch (error) {
    console.error('Failed to update team:', error);
    return serverError('Failed to update team.');
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const { session, response } = await requireAuth(request);
  if (!session) return response;

  const roleError = requireRole(session, teamManagerRoles);
  if (roleError) return roleError;

  try {
    const { teamId } = await context.params;
    const { firestore } = getAdminServices();
    await firestore
      .collection('companies')
      .doc(session.claims.companyId)
      .collection('teams')
      .doc(teamId)
      .delete();

    return success({ ok: true });
  } catch (error) {
    console.error('Failed to delete team:', error);
    return serverError('Failed to delete team.');
  }
}
