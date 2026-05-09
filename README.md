# CollabWork - Collaborative Task Management Platform

Next-Gen Enterprise-Grade Collaborative Task Management Platform for Distributed Teams

## Project Overview

CollabWork is a multi-tenant, cloud-native collaborative task management platform designed for enterprise-grade scalability. Built on **Next.js**, **Node.js**, and **Firebase**, it allows multiple companies to operate independently within a shared infrastructure — each with their own teams, users, and data boundaries.

### Key Features

- **Multi-Tenant Isolation**: Complete data separation between companies with no cross-contamination risk
- **Hierarchical Team Management**: Company admins control team leads; team leads control team members
- **Rich Work Logging**: Daily logs with text entries and screenshot attachments for audit trails
- **Role-Based Access Control**: Fine-grained permissions ensuring least-privilege access at every layer
- **Real-Time Collaboration**: Firebase Realtime Database and Firestore for instant updates across users
- **Enterprise Security**: Firebase Authentication with company-scoped security rules at the database level

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express (via Next.js API Routes)
- **Database**: Cloud Firestore (NoSQL)
- **Authentication**: Firebase Authentication
- **File Storage**: Firebase Storage
- **Hosting**: Vercel (Frontend) + Firebase (Backend)
- **Real-time**: Firebase Cloud Messaging

## Project Structure

```
collabwork/
├── src/
│   ├── app/                 # Next.js App Router pages and layouts
│   ├── lib/
│   │   ├── api/             # API utilities and auth helpers
│   │   └── firebase/        # Firebase client & admin initialization
│   ├── types/               # TypeScript type definitions
│   └── components/          # React components (to be added in Phase 2)
├── public/                  # Static assets
├── firebase.json            # Firebase configuration
├── firestore.rules          # Firestore security rules
├── firestore.indexes.json   # Firestore index definitions
├── storage.rules            # Firebase Storage security rules
├── .env.example             # Environment variables template
├── .env.local               # Local environment variables (not committed)
└── package.json             # Dependencies and scripts
```

## Development Phases

### Phase 1: Project Foundation & Infrastructure Setup ✅
- Initialize Next.js 14 project with TypeScript, ESLint, and Tailwind CSS
- Set up Firebase project with Firestore, Authentication, and Storage
- Configure Firebase Admin SDK
- Create initial Firestore Security Rules (deny-all by default)
- Set up Git repository with branch strategy
- Configure CI/CD pipeline (GitHub Actions)
- Define Firestore indexes for common queries
- **Status**: Complete

### Phase 2: Authentication & Multi-Tenant User Management 🚀 IN PROGRESS
- Build Firebase Authentication flows
- Implement custom claims assignment
- Create Company Admin dashboard
- Implement user management endpoints
- Write Firestore Security Rules for /users collection

### Phase 3: Team Management Module (Coming Soon)
- Build Team Lead UI
- Implement team creation and member invitation
- Build Editor designation system
- Create team member search/invite
- Implement notifications

### Phase 4: Task Management Module (Coming Soon)
- Design task data schema
- Build Task Board UI with drag-and-drop
- Implement task CRUD operations
- Create task filtering and search
- Build audit trail for task changes

### Phase 5: Daily Work Logging & Screenshot Module (Coming Soon)
- Build Daily Log UI
- Implement screenshot upload flow
- Create log review view for team leads
- Build log history calendar view
- Implement log completeness indicator

### Phase 6: Testing, Hardening & Production Deployment (Coming Soon)
- Write unit tests for all API routes
- Write integration tests for Firestore Security Rules
- Conduct security audit
- Performance optimization
- Production deployment

## Getting Started

### Prerequisites

- Node.js 18+ and npm 9+
- Firebase account with a project created
- Git
- A code editor (VSCode recommended)

### Installation

1. **Clone the repository** (or navigate to the existing project):
```bash
cd collabwork
```

2. **Install dependencies**:
```bash
npm install
```

3. **Set up environment variables**:
```bash
cp .env.example .env.local
```

Then edit `.env.local` and add your Firebase configuration:

```
# Firebase Client SDK (public - safe to expose)
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id

# Firebase Admin SDK (private - server-side only)
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=your_service_account_email
FIREBASE_PRIVATE_KEY=your_private_key_with_newlines_as_\n
```

4. **Get your Firebase credentials**:
   - Go to [Firebase Console](https://console.firebase.google.com)
   - Select your project
   - Go to Project Settings > Service Accounts
   - Download the service account key JSON file
   - Copy the values into `.env.local`

5. **Run the development server**:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build the Next.js application
- `npm run start` - Start the production server
- `npm run lint` - Run ESLint
- `npm test` - Run tests (when implemented)

## Git Workflow

We follow a branch strategy with:
- `main` - Production-ready code
- `develop` - Integration branch for features
- `feature/*` - Individual feature branches

### Creating a Feature Branch

```bash
git checkout develop
git pull origin develop
git checkout -b feature/your-feature-name
```

After making changes:
```bash
git add .
git commit -m "Brief description of changes"
git push origin feature/your-feature-name
```

Then create a Pull Request on GitHub.

## Firebase Setup

### 1. Enable Required Services

In Firebase Console:

1. **Authentication**:
   - Sign-in method > Email/Password > Enable
   - Optional: Enable Google Sign-in for future enhancement

2. **Firestore**:
   - Create database in production mode (locked by default)
   - Choose your region

3. **Storage**:
   - Create storage bucket
   - Default location: us-central1

4. **Cloud Messaging** (optional, for notifications):
   - Generate Web API keys as needed

### 2. Deploy Security Rules

Once you've configured `.env.local`:

```bash
npm install -g firebase-tools
firebase login
firebase use --add  # Select your Firebase project
firebase deploy --only firestore:rules,storage
```

### 3. Create Firestore Indexes

```bash
firebase deploy --only firestore:indexes
```

## Security Best Practices

1. **Never commit `.env.local`** - Add to `.gitignore` (already done)
2. **Use service account** - Only for server-side Admin SDK
3. **Validate on server** - Never trust client-side validation alone
4. **Security rules** - Start restrictive, open incrementally
5. **App Check** - Enable in production to prevent unauthorized API access

## API Endpoints

All API endpoints are located in `src/app/api/`. Each endpoint requires Firebase Authentication with a valid JWT token.

### Request Format

```bash
curl -H "Authorization: Bearer <idToken>" http://localhost:3000/api/endpoint
```

### Response Format

Success (200):
```json
{
  "data": {}
}
```

Error (401/403/400/500):
```json
{
  "error": "Error message"
}
```

## Type Definitions

Core types are defined in `src/types/index.ts`:
- `UserRole` - Role types (superAdmin, companyAdmin, teamLead, editor, member)
- `User` - User document structure
- `Company` - Company document structure
- `Team` - Team document structure
- `Task` - Task document structure
- `WorkLog` - Daily work log structure
- `CustomClaims` - Firebase custom claims

## Database Schema

### Firestore Collections

```
companies/
  {companyId}/
    users/
      {userId}
    teams/
      {teamId}/
        tasks/
          {taskId}
        logs/
          {logId}
```

All data is scoped under company documents to ensure multi-tenant isolation.

## Contributing

1. Create a feature branch from `develop`
2. Make your changes
3. Run `npm run lint` and `npm test`
4. Commit with clear messages
5. Push and create a Pull Request
6. Wait for code review and CI/CD checks to pass

## Troubleshooting

### Firebase Connection Issues

If you get connection errors:
1. Verify `.env.local` has correct Firebase credentials
2. Check Firebase project is active in Firebase Console
3. Verify service account has proper permissions
4. Clear `.next` cache: `rm -rf .next`

### Environment Variables Not Loading

1. Ensure `.env.local` is in the project root
2. Variables starting with `NEXT_PUBLIC_` are client-side (safe)
3. Other variables are server-side only
4. Restart dev server after changing `.env.local`

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/start)
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)

## License

Proprietary - All rights reserved

## Version

- **Version**: 1.0 - Initial Release
- **Date**: May 9, 2026
- **Status**: Phase 1 Complete, Ready for Phase 2

---

**Next Steps**: Phase 2 - Authentication & Multi-Tenant User Management
