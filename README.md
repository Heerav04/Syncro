# CollabWork - Collaborative Task Management Platform

Next-Gen Enterprise-Grade Collaborative Task Management Platform for Distributed Teams

## Project Overview

CollabWork is a multi-tenant, cloud-native collaborative task management platform designed for enterprise-grade scalability. Built on **Next.js**, **Node.js**, and **Firebase**, it allows multiple companies to operate independently within a shared infrastructure — each with their own teams, users, and data boundaries.

### Key Features

- **Multi-Tenant Isolation**: Complete data separation between companies with no cross-contamination risk
- **Hierarchical Team Management**: Company admins control team leads; team leads control team members
- **Kanban Task Boards**: Interactive drag-and-drop task boards for every team with real-time updates
- **Rich Work Logging**: Daily logs with text entries and screenshot attachments for audit trails
- **Role-Based Access Control**: Fine-grained permissions ensuring least-privilege access at every layer
- **Enterprise Security**: Firebase Authentication with company-scoped security rules at the database level

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS
- **Backend**: Node.js, Next.js Serverless API Routes
- **Database**: Cloud Firestore (NoSQL)
- **Authentication**: Firebase Authentication
- **File Storage**: Firebase Storage
- **Testing**: Jest, React Testing Library
- **Hosting**: Vercel (Frontend) + Firebase (Backend Security)

## Project Structure

```
collabwork/
├── src/
│   ├── app/                 # Next.js App Router pages and layouts
│   ├── lib/                 # API utilities and auth helpers
│   ├── types/               # TypeScript type definitions
│   ├── components/          # Reusable React components (Kanban, Logs, etc.)
│   └── __tests__/           # Jest Unit Tests
├── public/                  # Static assets
├── firebase.json            # Firebase configuration
├── firestore.rules          # Firestore security rules
├── firestore.indexes.json   # Firestore index definitions
├── storage.rules            # Firebase Storage security rules
├── jest.config.ts           # Jest test configuration
├── vercel.json              # Vercel deployment and security headers
├── .env.example             # Environment variables template
└── package.json             # Dependencies and scripts
```

## Development Phases (All Complete)

### Phase 1: Project Foundation & Infrastructure Setup ✅
- Initialize Next.js 14 project with TypeScript, ESLint, and Tailwind CSS
- Set up Firebase project with Firestore, Authentication, and Storage
- Configure Firebase Admin SDK
- Create initial Firestore Security Rules (deny-all by default)

### Phase 2: Authentication & Multi-Tenant User Management ✅
- Build Firebase Authentication flows
- Implement custom claims assignment
- Create Company Admin dashboard
- Implement user management endpoints

### Phase 3: Team Management Module ✅
- Build Team Lead UI and member management
- Implement team creation and member invitation
- Create `/api/teams` endpoints

### Phase 4: Task Management Module ✅
- Interactive Kanban Task Board with drag-and-drop
- Implement `/api/tasks` CRUD endpoints
- Built audit trail for task changes and priority assignments

### Phase 5: Daily Work Logging & Screenshot Module ✅
- Build Daily Log UI for users
- Implement screenshot upload flow directly to Firebase Storage
- Enforced single-day log edits and 5MB image size limits via `storage.rules`

### Phase 6: Testing, Hardening & Production Deployment ✅
- Wrote Jest unit tests for API routes
- Added Vercel security headers (`X-Frame-Options`, `X-XSS-Protection`)
- Zero build errors on `npm run build`

## Getting Started

### Prerequisites

- Node.js 18+ and npm 9+
- Firebase account with a project created
- Vercel or Netlify account for hosting

### Installation

1. **Clone the repository**:
```bash
git clone https://github.com/Heerav04/Syncro.git
```

2. **Install dependencies**:
```bash
npm install
```

3. **Set up environment variables**:
```bash
cp .env.example .env.local
```

Edit `.env.local` and add your Firebase configuration:

```
# Firebase Client SDK
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id

# Firebase Admin SDK (Private)
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=your_service_account_email
FIREBASE_PRIVATE_KEY="your_private_key_here"
```

4. **Run the development server**:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build the Next.js application for production
- `npm run start` - Start the production server locally
- `npm run lint` - Run ESLint checks
- `npm run test` - Run Jest unit tests

## Firebase Deployment

Once you've configured `.env.local`, you must deploy your security rules to protect the database and storage:

```bash
npm install -g firebase-tools
firebase login
firebase use --add  # Select your Firebase project
firebase deploy --only firestore:rules,storage
```

## API Endpoints

All API endpoints are located in `src/app/api/`. Each endpoint requires Firebase Authentication with a valid JWT token.

- `GET /api/me` - Get current user profile
- `GET /api/teams` - Get all teams for a company
- `POST /api/tasks` - Create a new task
- `PATCH /api/tasks/[taskId]` - Update task status (Kanban move)
- `POST /api/logs` - Submit daily work log

## License

Proprietary - All rights reserved

## Version

- **Version**: 1.0 - Production Release
- **Status**: 100% Complete
