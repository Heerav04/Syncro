# Syncro Production Test Plan

Date: 2026-05-25
Project root: `C:\Users\heera\Desktop\syncro\collabwork`

## Summary

This document records the production-readiness checks completed for Syncro before server deployment. The focus was signup reliability, strict-mode readiness, role privacy, build health, and the 3-browser test flow with 1 host/admin and 2 employees.

## Fixes Completed During This Pass

- Enabled explicit React strict mode in `next.config.ts` with `reactStrictMode: true`.
- Confirmed TypeScript strict mode is enabled in `tsconfig.json` with `"strict": true`.
- Fixed signup to support two clear modes:
  - `Host/Admin`: creates the company workspace and requires Company Name.
  - `Employee`: joins an existing workspace after the admin adds/invites that email.
- Fixed a production security issue where an employee could join a workspace only by knowing the Company ID.
  - With Firebase Admin configured, employee signup now requires an existing invited email profile.
  - Without Firebase Admin configured, employee signup creates the Auth account but does not create a workspace profile automatically; the dashboard must match an admin-created email invite.
- Updated signup UI text to explain the admin-first and employee-invite flow.

## Automated Checks Performed

- `npm run lint`
  - Result: Passed.
- `npm run build`
  - Result: Passed.
  - Next.js compiled successfully.
  - TypeScript completed successfully.
  - Routes generated successfully:
    - `/`
    - `/auth/login`
    - `/auth/signup`
    - `/dashboard`
    - `/api/auth/register`
    - `/api/logs`
    - `/api/me`
    - `/api/tasks`
    - `/api/tasks/[taskId]`
    - `/api/teams`
    - `/api/teams/[teamId]`
    - `/api/users`

## HTTP Smoke Checks Performed

- `GET /auth/signup`
  - Result: `200`
- `GET /auth/login`
  - Result: `200`
- `POST /api/auth/register` with invalid/missing fields
  - Result: `400`
  - Expected error returned: `Missing required fields: email, password, displayName, companyId`
- `GET /dashboard`
  - Result: `200`
  - Expected for this app because dashboard auth gating happens client-side through `RequireAuth`.

## Browser UI Checks Performed

- Opened `/auth/signup`.
- Confirmed the page renders `Syncro`.
- Confirmed `Host/Admin` account type is selected by default.
- Confirmed switching to `Employee` works.
- Confirmed Company Name becomes optional for Employee mode.
- Confirmed Employee mode helper text says employees should use the Company ID after the admin adds their email.

## Required 3-Browser Manual Test

Use three separate browsers or browser profiles so each has separate Firebase/localStorage session data.

1. Browser A: Host/Admin
   - Open `/auth/signup`.
   - Select `Host/Admin`.
   - Enter host/admin email, full name, Company ID, Company Name, and password.
   - Submit signup.
   - Confirm redirect/login to dashboard.
   - Confirm workspace opens.

2. Browser A: Add Employees
   - Go to dashboard `Members`.
   - Add employee 1 email as `Employee`.
   - Add employee 2 email as `Employee`.
   - Go to `Teams`.
   - Create a team.
   - Add employee 1 and employee 2 to the team.
   - Go to `Workspace`.
   - Assign one separate task to each employee.

3. Browser B: Employee 1
   - Open `/auth/signup`.
   - Select `Employee`.
   - Use employee 1 invited email.
   - Use the same Company ID.
   - Leave Company Name blank.
   - Complete signup and login.
   - Confirm only employee 1 assigned task is visible.
   - Open the notepad task.
   - Paste README submission.
   - Optionally attach a file.
   - Submit.
   - Confirm attendance prompt appears.
   - Mark present.

4. Browser C: Employee 2
   - Repeat Browser B flow with employee 2 email.
   - Confirm employee 2 cannot see employee 1 task, submission, or attendance.

5. Browser A: Admin Review
   - Confirm admin can see both employee submissions.
   - Confirm admin can see attendance entries.
   - Confirm submitted README text is readable in the notepad/review view.

## Production Deployment Checklist

- Firebase Authentication:
  - Enable Email/Password sign-in.
- Environment variables:
  - Set all `NEXT_PUBLIC_FIREBASE_*` variables.
  - Set `FIREBASE_PROJECT_ID`.
  - Strongly recommended: set real `FIREBASE_CLIENT_EMAIL` and `FIREBASE_PRIVATE_KEY` for Firebase Admin SDK.
- Firebase rules:
  - Deploy `firestore.rules`.
  - Deploy `storage.rules`.
- Build:
  - Run `npm run lint`.
  - Run `npm run build`.
- Server:
  - Deploy only after both commands pass.
  - Use HTTPS in production so browser notification/audio behavior is reliable.

## Known Deployment Notes

- Employee signup is intentionally invite-based for production safety.
- The host/admin should add employee emails before employees sign up.
- If Firebase Admin SDK is not configured, employees may need to sign in after signup and open the same workspace so the dashboard can claim their email invite.
- The current app does not include an automated Playwright or Jest test suite. The checks above are lint, production build, HTTP smoke checks, and browser UI smoke checks.
