# CollabWork - Firebase Setup Guide

This guide walks you through setting up your Firebase project for the CollabWork application.

## Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Add project"
3. Enter project name: `syncro` (or your preferred name)
4. Follow the setup wizard to create the project

## Step 2: Enable Required Services

### 2.1 Enable Authentication

1. In Firebase Console, go to **Authentication**
2. Click **Get started**
3. Go to **Sign-in method** tab
4. Enable **Email/Password** authentication
5. (Optional) Enable **Google Sign-in** for future enhancement

### 2.2 Enable Firestore Database

1. In Firebase Console, go to **Firestore Database**
2. Click **Create database**
3. Choose your region (e.g., `us-central1`)
4. Start in **Production mode** (security rules are locked by default)
5. Click **Create**

### 2.3 Enable Cloud Storage

1. In Firebase Console, go to **Cloud Storage**
2. Click **Get started**
3. Accept the default rules
4. Choose a region (same as Firestore recommended)
5. Click **Done**

### 2.4 (Optional) Enable Cloud Messaging

1. In Firebase Console, go to **Cloud Messaging**
2. Generate Web API keys if not already done

## Step 3: Get Your Firebase Configuration

### 3.1 Get Client SDK Configuration

1. In Firebase Console, go to **Project Settings** (gear icon)
2. Go to the **General** tab
3. Find "Your apps" section
4. If no web app exists, click "Web" to create one
5. Copy the `firebaseConfig` object

This should look like:
```javascript
const firebaseConfig = {
  apiKey: "AIzaSyCbhRmWhe8BPeIKce-_eizSfKbSRdrhNrs",
  authDomain: "syncro-a7923.firebaseapp.com",
  projectId: "syncro-a7923",
  storageBucket: "syncro-a7923.firebasestorage.app",
  messagingSenderId: "94374464251",
  appId: "1:94374464251:web:538ef31957bbe9bf3a3e5e",
  measurementId: "G-PQMY8PCVNZ"
};
```

### 3.2 Get Service Account (Admin SDK) Configuration

1. In Firebase Console, go to **Project Settings** > **Service Accounts**
2. Click **Generate New Private Key**
3. A JSON file will download - this contains your service account credentials

Keep this file **secure** and **never commit it to Git**.

## Step 4: Set Up Environment Variables

1. Open `.env.local` in your project root
2. Fill in the values from your Firebase configuration:

```bash
# From firebaseConfig (Step 3.1)
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyCbhRmWhe8BPeIKce-_eizSfKbSRdrhNrs
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=syncro-a7923.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=syncro-a7923
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=syncro-a7923.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=94374464251
NEXT_PUBLIC_FIREBASE_APP_ID=1:94374464251:web:538ef31957bbe9bf3a3e5e
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-PQMY8PCVNZ

# From service account JSON (Step 3.2)
FIREBASE_PROJECT_ID=syncro-a7923
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@syncro-a7923.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQE...[rest of key]\n-----END PRIVATE KEY-----\n"
```

**Important Notes**:
- `NEXT_PUBLIC_*` variables are **safe to commit** - they're for the browser
- `FIREBASE_*` variables are **private** - never commit to Git
- `.env.local` is already in `.gitignore`
- For the private key, ensure newlines are escaped as `\n`

## Step 5: Deploy Firestore Security Rules

Once your environment is configured, deploy the initial security rules:

```bash
# Install Firebase CLI if you haven't already
npm install -g firebase-tools

# Authenticate with your Google account
firebase login

# Link to your Firebase project
firebase use --add
# Select your project from the list

# Deploy security rules
firebase deploy --only firestore:rules,storage

# Deploy Firestore indexes
firebase deploy --only firestore:indexes
```

## Step 6: Verify Setup

1. Start the dev server:
```bash
npm run dev
```

2. Open [http://localhost:3000](http://localhost:3000)

3. You should see the CollabWork homepage

4. Check the browser console for any Firebase errors

## Troubleshooting

### "Module not found: Can't resolve 'firebase-admin'"
- Run `npm install firebase-admin`

### Firebase connection errors
- Verify `.env.local` has correct credentials
- Check Firebase project is active in Firebase Console
- Ensure Firestore database is created

### "Permission denied" errors
- This is expected initially due to deny-all security rules
- We'll incrementally open permissions in Phase 2

### "Invalid JSON in FIREBASE_PRIVATE_KEY"
- Ensure newlines in the private key are represented as `\n` (not literal newlines)
- The key should start with `-----BEGIN PRIVATE KEY-----` and end with `-----END PRIVATE KEY-----`

## Next Steps

1. Verify the homepage loads at http://localhost:3000
2. Proceed to Phase 2: Authentication & Multi-Tenant User Management
3. When ready for production, follow the deployment steps in the main README

## Security Reminders

1. **Never share your private key** - treat it like a password
2. **Don't commit `.env.local`** - it's in `.gitignore`
3. **Use GitHub Secrets** for CI/CD deployments
4. **Enable App Check** in production to prevent unauthorized API access
5. **Review security rules** before deploying to production

---

For more information, see:
- [Firebase Console](https://console.firebase.google.com)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
