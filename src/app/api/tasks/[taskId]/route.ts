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
  taskEditorRoles,
} from '@/lib/api/auth';

type RouteContext = {
  params: Promise<{ taskId: string }>;
};

const statuses = ['todo', 'in-progress', 'done'] as const;
const priorities = ['low', 'medium', 'high'] as const;

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { session, response } = await requireAuth(request);
  if (!session) return response;

  const roleError = requireRole(session, taskEditorRoles);
  if (roleError) return roleError;

  try {
    const { taskId } = await context.params;
    const body = (await request.json()) as {
      teamId?: unknown;
      title?: unknown;
      description?: unknown;
      status?: unknown;
      priority?: unknown;
      assigneeId?: unknown;
      dueDate?: unknown;
    };
    const teamId = cleanText(body.teamId, 128);
    if (!teamId) {
      return badRequest('teamId is required.');
    }

    const updates: Record<string, unknown> = {
      updatedAt: now(),
      updatedBy: session.uid,
    };
    const title = cleanText(body.title, 160);
    if (body.title !== undefined) {
      if (!title) return badRequest('Task title cannot be empty.');
      updates.title = title;
    }
    if (body.description !== undefined) {
      updates.description = optionalText(body.description, 1000) || '';
    }
    if (statuses.includes(body.status as (typeof statuses)[number])) {
      updates.status = body.status;
    }
    if (priorities.includes(body.priority as (typeof priorities)[number])) {
      updates.priority = body.priority;
    }
    if (body.assigneeId !== undefined) {
      updates.assigneeId = optionalText(body.assigneeId, 128) || '';
    }
    if (body.dueDate !== undefined) {
      updates.dueDate = optionalText(body.dueDate, 40) || '';
    }

    const { firestore } = getAdminServices();
    await firestore
      .collection('companies')
      .doc(session.claims.companyId)
      .collection('teams')
      .doc(teamId)
      .collection('tasks')
      .doc(taskId)
      .update(updates);

    return success({ ok: true });
  } catch (error) {
    console.error('Failed to update task:', error);
    return serverError('Failed to update task.');
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const { session, response } = await requireAuth(request);
  if (!session) return response;

  const roleError = requireRole(session, taskEditorRoles);
  if (roleError) return roleError;

  try {
    const { taskId } = await context.params;
    const teamId = request.nextUrl.searchParams.get('teamId')?.trim();
    if (!teamId) {
      return badRequest('teamId is required.');
    }

    const { firestore } = getAdminServices();
    await firestore
      .collection('companies')
      .doc(session.claims.companyId)
      .collection('teams')
      .doc(teamId)
      .collection('tasks')
      .doc(taskId)
      .delete();

    return success({ ok: true });
  } catch (error) {
    console.error('Failed to delete task:', error);
    return serverError('Failed to delete task.');
  }
}
