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

const priorities = ['low', 'medium', 'high'] as const;

export async function GET(request: NextRequest) {
  const { session, response } = await requireAuth(request);
  if (!session) return response;

  const teamId = request.nextUrl.searchParams.get('teamId')?.trim();
  if (!teamId) {
    return badRequest('teamId is required.');
  }

  try {
    const { firestore } = getAdminServices();
    const snapshot = await firestore
      .collection('companies')
      .doc(session.claims.companyId)
      .collection('teams')
      .doc(teamId)
      .collection('tasks')
      .orderBy('updatedAt', 'desc')
      .limit(100)
      .get();

    return success({ tasks: snapshot.docs.map((doc) => doc.data()) });
  } catch (error) {
    console.error('Failed to load tasks:', error);
    return serverError('Failed to load tasks.');
  }
}

export async function POST(request: NextRequest) {
  const { session, response } = await requireAuth(request);
  if (!session) return response;

  const roleError = requireRole(session, taskEditorRoles);
  if (roleError) return roleError;

  try {
    const body = (await request.json()) as {
      teamId?: unknown;
      title?: unknown;
      description?: unknown;
      priority?: unknown;
      assigneeId?: unknown;
      dueDate?: unknown;
    };

    const teamId = cleanText(body.teamId, 128);
    const title = cleanText(body.title, 160);
    if (!teamId || !title) {
      return badRequest('Team and title are required.');
    }

    const priority = priorities.includes(body.priority as (typeof priorities)[number])
      ? body.priority
      : 'medium';
    const assigneeId = optionalText(body.assigneeId, 128);
    const dueDate = optionalText(body.dueDate, 40);

    const { firestore } = getAdminServices();
    const taskRef = firestore
      .collection('companies')
      .doc(session.claims.companyId)
      .collection('teams')
      .doc(teamId)
      .collection('tasks')
      .doc();
    const task = {
      id: taskRef.id,
      companyId: session.claims.companyId,
      teamId,
      title,
      description: optionalText(body.description, 1000) || '',
      status: 'todo',
      assigneeId: assigneeId || '',
      dueDate: dueDate || '',
      priority,
      createdBy: session.uid,
      updatedBy: session.uid,
      createdAt: now(),
      updatedAt: now(),
    };

    await taskRef.set(task);

    return success({ task }, 201);
  } catch (error) {
    console.error('Failed to create task:', error);
    return serverError('Failed to create task.');
  }
}
