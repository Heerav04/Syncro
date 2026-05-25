import { NextRequest } from 'next/server';
import { getAdminServices } from '@/lib/firebase/admin';
import { requireAuth, serverError, success } from '@/lib/api/auth';

export async function GET(request: NextRequest) {
  const { session, response } = await requireAuth(request);
  if (!session) return response;

  try {
    const { firestore } = getAdminServices();
    const companyRef = firestore.collection('companies').doc(session.claims.companyId);
    const [companyDoc, userDoc] = await Promise.all([
      companyRef.get(),
      companyRef.collection('users').doc(session.uid).get(),
    ]);

    return success({
      user: userDoc.exists ? userDoc.data() : null,
      company: companyDoc.exists ? companyDoc.data() : null,
      claims: session.claims,
    });
  } catch (error) {
    console.error('Failed to load current user:', error);
    return serverError('Failed to load account details.');
  }
}
