import { NextRequest } from 'next/server';
import { getAdminServices, isFirebaseAdminConfigured } from '@/lib/firebase/admin';
import { badRequest, cleanText, serverError, success } from '@/lib/api/auth';
import { createFirebaseUserWithRest, writeFirestoreDocumentWithRest } from '@/lib/firebase/rest';

interface RegisterRequest {
  email: string;
  password: string;
  displayName: string;
  companyId: string;
  companyName?: string;
  domain?: string;
  mode?: 'create' | 'join';
}

/**
 * POST /api/auth/register
 * Register a new user with company details
 *
 * Request body:
 * {
 *   email: string
 *   password: string
 *   displayName: string
 *   companyId: string
 *   companyName?: string (required if creating new company)
 *   domain?: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as RegisterRequest;
    const email = cleanText(body.email, 320).toLowerCase();
    const displayName = cleanText(body.displayName, 120);
    const companyId = cleanText(body.companyId, 80).toLowerCase().replace(/[^a-z0-9-]/g, '-');
    const companyName = cleanText(body.companyName, 140);
    const domain = cleanText(body.domain, 140).toLowerCase();
    const mode = body.mode === 'join' ? 'join' : 'create';

    // Validate input
    if (!email || !body.password || !displayName || !companyId) {
      return badRequest(
        'Missing required fields: email, password, displayName, companyId'
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return badRequest('Invalid email format');
    }

    // Validate password strength
    if (body.password.length < 8) {
      return badRequest('Password must be at least 8 characters long');
    }

    if (!isFirebaseAdminConfigured()) {
      return registerWithoutAdmin({
        email,
        password: body.password,
        displayName,
        companyId,
        companyName,
        domain,
        mode,
      });
    }

    const { auth, firestore } = getAdminServices();

    let isNewCompany = false;
    let invitedProfile: Record<string, unknown> | null = null;

    // Check if company exists
    try {
      const companyDoc = await firestore.collection('companies').doc(companyId).get();
      if (!companyDoc.exists && mode === 'join') {
        return badRequest('Workspace not found. Ask the admin to create it first, then join as employee.');
      }
      if (!companyDoc.exists && !companyName) {
        return badRequest('Company does not exist. Provide companyName to create a new one.');
      }

      if (companyDoc.exists && mode === 'join') {
        const inviteDoc = await firestore
          .collection('companies')
          .doc(companyId)
          .collection('users')
          .doc(email)
          .get();
        if (!inviteDoc.exists) {
          return badRequest('Employee invite not found. Ask the host/admin to add this email before signing up.');
        }
        invitedProfile = inviteDoc.data() || null;
      }

      // Create company if it doesn't exist
      if (!companyDoc.exists) {
        isNewCompany = true;
        await firestore.collection('companies').doc(companyId).set({
          id: companyId,
          name: companyName || 'Unnamed Company',
          domain,
          plan: 'starter', // Default plan for new companies
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error('Error checking company:', error);
      return serverError('Failed to check company existence');
    }

    // Create Firebase Auth user
    let uid = '';
    try {
      const userRecord = await auth.createUser({
        email,
        password: body.password,
        displayName,
      });
      uid = userRecord.uid;
    } catch (error: unknown) {
      if (typeof error === 'object' && error && 'code' in error && error.code === 'auth/email-already-exists') {
        return badRequest('Email already registered');
      }
      console.error('Error creating auth user:', error);
      return serverError('Failed to create user');
    }

    // Set custom claims for the user
    try {
      await auth.setCustomUserClaims(uid, {
        companyId,
        role: isNewCompany ? 'companyAdmin' : invitedProfile?.role || 'member',
        teamId: invitedProfile?.teamId || null,
      });
    } catch (error) {
      console.error('Error setting custom claims:', error);
      // Continue - user will have empty claims, can be set later
    }

    // Create user document in Firestore
    try {
      await firestore
        .collection('companies')
        .doc(companyId)
        .collection('users')
        .doc(uid)
        .set({
          uid,
          email,
          displayName,
          companyId,
          teamId: invitedProfile?.teamId || null,
          role: isNewCompany ? 'companyAdmin' : invitedProfile?.role || 'member',
          pending: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isActive: true,
        });
    } catch (error) {
      console.error('Error creating user document:', error);
      // Try to delete the auth user if Firestore write fails
      try {
        await auth.deleteUser(uid);
      } catch (deleteError) {
        console.error('Error cleaning up auth user:', deleteError);
      }
      return serverError('Failed to create user profile');
    }

    return success(
      {
        uid,
        email,
        displayName,
        companyId,
        role: isNewCompany ? 'companyAdmin' : invitedProfile?.role || 'member',
        message: isNewCompany
          ? 'User and company created successfully. You are now a Company Admin.'
          : 'User created successfully',
      },
      201
    );
  } catch (error) {
    console.error('Registration error:', error);
    return serverError('Registration failed');
  }
}

async function registerWithoutAdmin(input: {
  email: string;
  password: string;
  displayName: string;
  companyId: string;
  companyName: string;
  domain: string;
  mode: 'create' | 'join';
}) {
  try {
    if (input.mode === 'create' && !input.companyName) {
      return badRequest('Company Name is required for first-time setup.');
    }

    const authUser = await createFirebaseUserWithRest(input.email, input.password);
    const timestamp = new Date().toISOString();
    if (input.mode === 'join') {
      return success(
        {
          uid: authUser.localId,
          email: input.email,
          displayName: input.displayName,
          companyId: input.companyId,
          role: 'member',
          message: 'Employee account created. Sign in with the invited email and open the workspace.',
          adminConfigured: false,
        },
        201
      );
    }

    const company = {
      id: input.companyId,
      name: input.companyName,
      domain: input.domain,
      plan: 'starter',
      createdBy: authUser.localId,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    const user = {
      uid: authUser.localId,
      email: input.email,
      displayName: input.displayName,
      companyId: input.companyId,
      teamId: '',
      role: 'companyAdmin',
      createdAt: timestamp,
      updatedAt: timestamp,
      isActive: true,
    };

    await writeFirestoreDocumentWithRest(authUser.idToken, `companies/${input.companyId}`, company);
    await writeFirestoreDocumentWithRest(
      authUser.idToken,
      `companies/${input.companyId}/users/${authUser.localId}`,
      user
    );

    return success(
      {
        uid: authUser.localId,
        email: input.email,
        displayName: input.displayName,
        companyId: input.companyId,
        role: 'companyAdmin',
        message: 'Workspace created. Sign in to continue.',
        adminConfigured: false,
      },
      201
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Registration failed';
    console.error('Fallback registration error:', error);

    if (message.includes('Missing or insufficient permissions')) {
      return serverError(
        'Firebase account was created, but Firestore blocked profile setup. Deploy the included firestore.rules or add real Firebase Admin service-account credentials.'
      );
    }

    return serverError(message);
  }
}
