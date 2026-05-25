import { NextRequest } from 'next/server';
import { getAdminServices } from '@/lib/firebase/admin';
import {
  badRequest,
  cleanText,
  now,
  requireAuth,
  serverError,
  success,
} from '@/lib/api/auth';

export async function GET(request: NextRequest) {
  const { session, response } = await requireAuth(request);
  if (!session) return response;

  const teamId = request.nextUrl.searchParams.get('teamId')?.trim() || session.claims.teamId;
  if (!teamId) {
    return success({ logs: [] });
  }

  try {
    const { firestore } = getAdminServices();
    const snapshot = await firestore
      .collection('companies')
      .doc(session.claims.companyId)
      .collection('teams')
      .doc(teamId)
      .collection('logs')
      .orderBy('date', 'desc')
      .limit(30)
      .get();

    const logs = snapshot.docs
      .map((doc) => doc.data())
      .filter((log) => {
        if (['superAdmin', 'companyAdmin', 'teamLead'].includes(session.claims.role)) {
          return true;
        }
        return log.userId === session.uid;
      });

    return success({ logs });
  } catch (error) {
    console.error('Failed to load logs:', error);
    return serverError('Failed to load work logs.');
  }
}

export async function POST(request: NextRequest) {
  const { session, response } = await requireAuth(request);
  if (!session) return response;

  try {
    const body = (await request.json()) as {
      teamId?: unknown;
      date?: unknown;
      text?: unknown;
      taskIds?: unknown;
      screenshotUrls?: unknown;
    };
    const teamId = cleanText(body.teamId, 128) || session.claims.teamId;
    const date = cleanText(body.date, 20) || new Date().toISOString().slice(0, 10);
    const text = cleanText(body.text, 5000);

    if (!teamId) {
      return badRequest('Join or create a team before adding a work log.');
    }
    if (!text) {
      return badRequest('Work log text is required.');
    }

    const taskIds = Array.isArray(body.taskIds)
      ? body.taskIds.filter((id): id is string => typeof id === 'string')
      : [];
    const screenshotUrls = Array.isArray(body.screenshotUrls)
      ? body.screenshotUrls.filter((url): url is string => typeof url === 'string')
      : [];

    const { firestore } = getAdminServices();
    const logRef = firestore
      .collection('companies')
      .doc(session.claims.companyId)
      .collection('teams')
      .doc(teamId)
      .collection('logs')
      .doc(`${session.uid}_${date}`);

    const existingLog = await logRef.get();
    const log = {
      id: logRef.id,
      companyId: session.claims.companyId,
      teamId,
      userId: session.uid,
      date,
      text,
      screenshotUrls,
      taskIds,
      createdAt: existingLog.get('createdAt') || now(),
      updatedAt: now(),
    };

    await logRef.set(log, { merge: true });

    return success({ log }, existingLog.exists ? 200 : 201);
  } catch (error) {
    console.error('Failed to save work log:', error);
    return serverError('Failed to save work log.');
  }
}
