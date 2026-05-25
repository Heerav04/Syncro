type FirebaseAuthSignupResponse = {
  idToken: string;
  localId: string;
  email: string;
};

type FirebaseErrorResponse = {
  error?: {
    message?: string;
  };
};

function firebaseApiKey() {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  if (!apiKey) {
    throw new Error('Missing NEXT_PUBLIC_FIREBASE_API_KEY.');
  }

  return apiKey;
}

function projectId() {
  const id = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID;
  if (!id) {
    throw new Error('Missing Firebase project id.');
  }

  return id;
}

function firebaseErrorMessage(code?: string) {
  switch (code) {
    case 'EMAIL_EXISTS':
      return 'Email already registered. Please sign in instead.';
    case 'OPERATION_NOT_ALLOWED':
      return 'Email/password sign-up is disabled in Firebase Authentication.';
    case 'WEAK_PASSWORD : Password should be at least 6 characters':
      return 'Password is too weak.';
    default:
      return code || 'Firebase request failed.';
  }
}

export async function createFirebaseUserWithRest(email: string, password: string) {
  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${firebaseApiKey()}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        password,
        returnSecureToken: true,
      }),
    }
  );
  const data = (await response.json()) as FirebaseAuthSignupResponse & FirebaseErrorResponse;

  if (!response.ok) {
    throw new Error(firebaseErrorMessage(data.error?.message));
  }

  return data;
}

export async function writeFirestoreDocumentWithRest(
  idToken: string,
  documentPath: string,
  data: Record<string, unknown>
) {
  const fields = toFirestoreFields(data);
  const response = await fetch(
    `https://firestore.googleapis.com/v1/projects/${projectId()}/databases/(default)/documents/${documentPath}`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${idToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ fields }),
    }
  );
  const responseData = (await response.json()) as FirebaseErrorResponse;

  if (!response.ok) {
    throw new Error(firebaseErrorMessage(responseData.error?.message));
  }
}

function toFirestoreFields(data: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(data).map(([key, value]) => [key, toFirestoreValue(value)])
  );
}

function toFirestoreValue(value: unknown): Record<string, unknown> {
  if (value === null || value === undefined) {
    return { nullValue: null };
  }
  if (typeof value === 'boolean') {
    return { booleanValue: value };
  }
  if (typeof value === 'number') {
    return Number.isInteger(value) ? { integerValue: value } : { doubleValue: value };
  }
  if (Array.isArray(value)) {
    return { arrayValue: { values: value.map(toFirestoreValue) } };
  }
  if (typeof value === 'object') {
    return { mapValue: { fields: toFirestoreFields(value as Record<string, unknown>) } };
  }

  return { stringValue: String(value) };
}
