import { NextRequest, NextResponse } from 'next/server';
import { auth, firestore } from '@/lib/firebase/admin';
import { badRequest, serverError, success } from '@/lib/api/auth';

interface RegisterRequest {
  email: string;
  password: string;
  displayName: string;
  companyId: string;
  companyName?: string;
  domain?: string;
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

    // Validate input
    if (!body.email || !body.password || !body.displayName || !body.companyId) {
      return badRequest(
        'Missing required fields: email, password, displayName, companyId'
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return badRequest('Invalid email format');
    }

    // Validate password strength
    if (body.password.length < 8) {
      return badRequest('Password must be at least 8 characters long');
    }

    let companyId = body.companyId;
    let isNewCompany = false;

    // Check if company exists
    try {
      const companyDoc = await firestore.collection('companies').doc(companyId).get();
      if (!companyDoc.exists && !body.companyName) {
        return badRequest('Company does not exist. Provide companyName to create a new one.');
      }

      // Create company if it doesn't exist
      if (!companyDoc.exists) {
        isNewCompany = true;
        await firestore.collection('companies').doc(companyId).set({
          id: companyId,
          name: body.companyName || 'Unnamed Company',
          domain: body.domain || '',
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
        email: body.email,
        password: body.password,
        displayName: body.displayName,
      });
      uid = userRecord.uid;
    } catch (error: any) {
      if (error.code === 'auth/email-already-exists') {
        return badRequest('Email already registered');
      }
      console.error('Error creating auth user:', error);
      return serverError('Failed to create user');
    }

    // Set custom claims for the user
    try {
      await auth.setCustomUserClaims(uid, {
        companyId,
        role: isNewCompany ? 'companyAdmin' : 'member', // First user is company admin
        teamId: null,
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
          email: body.email,
          displayName: body.displayName,
          companyId,
          teamId: null,
          role: isNewCompany ? 'companyAdmin' : 'member',
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
        email: body.email,
        displayName: body.displayName,
        companyId,
        role: isNewCompany ? 'companyAdmin' : 'member',
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
