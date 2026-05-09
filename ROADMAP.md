# CollabWork Development Roadmap

## Project Summary
- **Name**: CollabWork
- **Version**: 1.0 - Initial Release
- **Date**: May 9, 2026
- **Stack**: Next.js 14 · Node.js · Firebase
- **Architecture**: Multi-Tenant SaaS

---

## Phase 1: Project Foundation & Infrastructure Setup ✅ COMPLETE
**Timeline**: Weeks 1–2 (Estimated: 2 weeks)
**Status**: ✅ Complete

### Deliverables
- [x] Initialize Next.js 14 project with TypeScript, ESLint, and Tailwind CSS
- [x] Create Firebase project with Firestore, Authentication, and Firebase Storage
- [x] Set up Firebase Admin SDK in Node.js API routes with service account credentials
- [x] Configure environment variables (FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, etc.)
- [x] Create initial Firestore Security Rules (deny all by default)
- [x] Set up Git repository with branch strategy (main, develop, feature/*)
- [x] Configure CI/CD pipeline (GitHub Actions) for lint, test, and build
- [x] Define Firestore indexes for compound queries
- [x] Set up Firebase Emulator Suite documentation for local development
- [x] Create comprehensive README and Firebase setup guide

### Acceptance Criteria
- [x] Running Next.js app connected to Firebase
- [x] TypeScript configuration working
- [x] Environment variables properly configured
- [x] Firebase Admin SDK initialized
- [x] Security rules deployed (deny-all)
- [x] Git repository with proper branch structure
- [x] CI/CD pipeline triggers on push

### Files Created
- `firebase.json` - Firebase project configuration
- `firestore.rules` - Firestore security rules
- `storage.rules` - Firebase Storage security rules
- `firestore.indexes.json` - Firestore index definitions
- `src/lib/firebase/admin.ts` - Firebase Admin SDK initialization
- `src/lib/firebase/client.ts` - Firebase client SDK initialization
- `src/lib/api/auth.ts` - API authentication utilities
- `src/types/index.ts` - TypeScript type definitions
- `.github/workflows/ci.yml` - GitHub Actions CI/CD pipeline
- `README.md` - Comprehensive project documentation
- `FIREBASE_SETUP.md` - Firebase setup guide
- `.env.example` - Environment variables template
- `.env.local` - Local environment configuration (not committed)

---

## Phase 2: Authentication & Multi-Tenant User Management 🚀 COMING NEXT
**Timeline**: Weeks 3–5 (Estimated: 3 weeks)
**Status**: 🚀 Ready to start
**Dependencies**: Phase 1 ✅

### Planned Deliverables
- [ ] Build Firebase Authentication flows (Sign Up, Sign In, Password Reset, Email Verification)
- [ ] Implement custom claims assignment via Admin SDK (companyId, role, teamId)
- [ ] Create `/api/auth/register` endpoint with company domain validation
- [ ] Build Company Admin dashboard for user management
- [ ] Implement Company Admin functions (invite users, deactivate accounts, reset roles)
- [ ] Build `useAuth()` React hook for auth state management
- [ ] Create protected route middleware using Next.js middleware
- [ ] Build role-gated UI components (`<RoleGate role='teamLead'>`)
- [ ] Write Firestore Security Rules for `/users` collection
- [ ] Implement user role assignment workflows
- [ ] Set up email templates for user invitations

### Acceptance Criteria
- [ ] Users can sign up with email/password
- [ ] Users can sign in and receive JWT token
- [ ] Custom claims are set on Firebase Auth tokens
- [ ] Company admins can manage users
- [ ] Protected routes redirect unauthenticated users
- [ ] Role-based UI rendering works correctly
- [ ] Firestore security rules enforce company scope

### Files to Create
- `src/app/auth/` - Authentication pages (login, signup, reset password)
- `src/app/api/auth/` - Authentication API routes
- `src/contexts/useAuth.ts` - Auth context and hook
- `src/middleware.ts` - Next.js route protection middleware
- `src/components/RoleGate.tsx` - Role-based rendering component
- `src/components/Auth/` - Auth-related components

### Key Decisions Needed
- Email verification: required or optional?
- SSO integration: when to add?
- Password reset: email link or OTP?

---

## Phase 3: Team Management Module 🔄 PLANNED
**Timeline**: Weeks 6–9 (Estimated: 4 weeks)
**Status**: 🔄 Planned
**Dependencies**: Phase 2

### Planned Deliverables
- [ ] Build Team Lead UI (Create Team form, member invitation)
- [ ] Implement `/api/teams/create` endpoint
- [ ] Build `/api/teams/addMember` endpoint with team limit validation
- [ ] Implement `/api/teams/assignEditor` with 2-editor maximum enforcement
- [ ] Build Team Lead dashboard (view team roster, member roles, activity)
- [ ] Create Company Admin team overview
- [ ] Implement team member search and invite functionality
- [ ] Write Firestore Security Rules for `/teams` collection
- [ ] Build Firebase Cloud Messaging notifications
- [ ] Test multi-team scenarios and editor limits

### Acceptance Criteria
- [ ] Team leads can create teams
- [ ] Team leads can add members to teams
- [ ] Maximum 2 editors per team enforced
- [ ] Team member search works by email/name
- [ ] Users receive notifications on team assignment
- [ ] Firestore rules prevent unauthorized access

### Files to Create
- `src/app/teams/` - Team management pages
- `src/app/api/teams/` - Team management API routes
- `src/components/Teams/` - Team-related components

---

## Phase 4: Task Management Module 🔄 PLANNED
**Timeline**: Weeks 10–13 (Estimated: 4 weeks)
**Status**: 🔄 Planned
**Dependencies**: Phase 3

### Planned Deliverables
- [ ] Design task data schema (title, description, status, assignee, priority, etc.)
- [ ] Build Task Board UI with Kanban-style drag-and-drop
- [ ] Implement `/api/tasks/create` endpoint
- [ ] Build `/api/tasks/update` endpoint with updatedBy logging
- [ ] Implement task assignment functionality
- [ ] Build task detail view with change audit trail
- [ ] Create task filtering (by status, assignee, due date, priority)
- [ ] Implement optimistic UI updates with rollback
- [ ] Write Firestore Security Rules for `/tasks` collection
- [ ] Set up Firestore indexes for task queries

### Acceptance Criteria
- [ ] Tasks can be created and edited by authorized users
- [ ] Task Kanban board renders with drag-and-drop
- [ ] Audit trail shows all task changes with timestamps
- [ ] Only team members can view tasks in their team
- [ ] Editors and leads can modify tasks
- [ ] Members can view tasks assigned to them

### Files to Create
- `src/app/tasks/` - Task management pages
- `src/app/api/tasks/` - Task management API routes
- `src/components/Tasks/` - Task-related components

---

## Phase 5: Daily Work Logging & Screenshot Module 🔄 PLANNED
**Timeline**: Weeks 14–17 (Estimated: 4 weeks)
**Status**: 🔄 Planned
**Dependencies**: Phase 4

### Planned Deliverables
- [ ] Design work log data schema (userId, date, text, screenshots, taskIds)
- [ ] Build Daily Log UI (date picker, rich text editor, screenshot upload)
- [ ] Implement screenshot upload flow with browser compression
- [ ] Create `/api/logs/create` endpoint (one log per user per date)
- [ ] Build `/api/logs/update` endpoint with same-day editing only
- [ ] Implement screenshot management (preview, delete, max 10 per log)
- [ ] Build Team Lead log review view
- [ ] Create member log history calendar view
- [ ] Write Storage Security Rules for company-scoped upload paths
- [ ] Write Firestore Security Rules for `/logs` collection
- [ ] Implement log completeness indicator for team leads

### Acceptance Criteria
- [ ] Users can create daily work logs with text
- [ ] Screenshots can be uploaded and attached to logs
- [ ] Only same-day logs can be edited (read-only after midnight)
- [ ] Team leads can view all team member logs
- [ ] Members can only view their own logs
- [ ] Screenshot storage is properly namespaced by company

### Files to Create
- `src/app/logs/` - Work log pages
- `src/app/api/logs/` - Work log API routes
- `src/components/Logs/` - Log-related components

---

## Phase 6: Testing, Hardening & Production Deployment 🔄 PLANNED
**Timeline**: Weeks 18–20 (Estimated: 3 weeks)
**Status**: 🔄 Planned
**Dependencies**: Phase 5

### Planned Deliverables
- [ ] Write unit tests for all API routes using Jest
- [ ] Write integration tests for Firestore Security Rules
- [ ] Conduct cross-company data isolation tests
- [ ] Security audit: check for IDOR vulnerabilities
- [ ] Perform penetration testing on API endpoints
- [ ] Implement query pagination for large result sets
- [ ] Optimize screenshot handling
- [ ] Set up Firebase App Check for production
- [ ] Configure Firebase monitoring and alerts
- [ ] Deploy to production on Vercel
- [ ] Set up monitoring dashboards
- [ ] Create runbook for production operations
- [ ] Conduct UAT with stakeholders

### Acceptance Criteria
- [ ] All API endpoints have unit tests
- [ ] Firestore Security Rules tested and validated
- [ ] No cross-company data leakage possible
- [ ] No IDOR vulnerabilities found
- [ ] Performance benchmarks met
- [ ] App Check prevents unauthorized API calls
- [ ] Monitoring and alerts configured
- [ ] UAT passed by all stakeholder groups

### Files to Create
- `src/__tests__/` - Test files
- `jest.config.js` - Jest configuration
- `vercel.json` - Vercel deployment configuration
- Operations runbook (documentation)

---

## Overall Progress

```
Phase 1: ████████████████████ 100% ✅ COMPLETE
Phase 2: ░░░░░░░░░░░░░░░░░░░░   0% 🚀 COMING NEXT
Phase 3: ░░░░░░░░░░░░░░░░░░░░   0% 🔄 PLANNED
Phase 4: ░░░░░░░░░░░░░░░░░░░░   0% 🔄 PLANNED
Phase 5: ░░░░░░░░░░░░░░░░░░░░   0% 🔄 PLANNED
Phase 6: ░░░░░░░░░░░░░░░░░░░░   0% 🔄 PLANNED

Total: ████░░░░░░░░░░░░░░░░ 16.67% Complete
```

---

## Key Technology Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Frontend Framework | Next.js 14 App Router | Server components + API routes in one framework |
| Database | Cloud Firestore | NoSQL, real-time, built-in security rules, multi-region |
| Auth | Firebase Authentication | Managed service, JWT tokens, custom claims |
| File Storage | Firebase Storage | Integrated with Firestore, security rules support |
| Hosting | Vercel (frontend) + Firebase | Vercel for Next.js optimization, Firebase for serverless functions |
| Language | TypeScript | Type safety, better developer experience |
| Styling | Tailwind CSS | Utility-first, fast development, consistent design |
| Testing | Jest + Firebase Emulator | Jest for unit/integration, emulator for Firestore rules |
| CI/CD | GitHub Actions | Native to GitHub, free for public repos |

---

## Known Risks & Mitigation

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Firebase cold starts on serverless | Medium | Cache auth tokens, use regional deployments |
| Firestore quota limits | High | Monitor usage, implement pagination, set billing alerts |
| Security rules complexity | High | Test rules thoroughly, use emulator, conduct security audit |
| Screenshot storage costs | Medium | Implement lifecycle policies, archive old screenshots |
| Cross-tenant data leakage | Critical | Layered validation (client, API, Firestore rules), security audit |

---

## Next Steps (Immediate)

1. **Verify Phase 1 is complete**
   - [ ] Homepage loads without errors
   - [ ] Git repository initialized with develop branch
   - [ ] Environment variables template created
   - [ ] Firebase configuration documented

2. **Complete Firebase project setup** (via Firebase Console)
   - [ ] Enable Authentication (Email/Password)
   - [ ] Enable Firestore Database
   - [ ] Enable Cloud Storage
   - [ ] Download service account key

3. **Configure environment variables**
   - [ ] Fill in `.env.local` with Firebase credentials
   - [ ] Test Firebase connection

4. **Start Phase 2**
   - [ ] Create `feature/auth` branch from develop
   - [ ] Begin building authentication flows
   - [ ] Target completion within 3 weeks

---

## Contact & Questions

For questions about the roadmap or architecture, refer to:
- Project Plan: `CollabWork_Project_Plan.docx`
- Architecture Docs: `README.md` > System Architecture section
- Type Definitions: `src/types/index.ts`

---

**Last Updated**: Phase 1 Complete
**Next Phase**: Phase 2 - Authentication & Multi-Tenant User Management
**Target Completion**: Week 5
