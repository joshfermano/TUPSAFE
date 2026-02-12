# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**TUPSAFE** (TUP System for Automated Filing and e-Compliance) - Secure web system for TUP Manila managing employee PDS/SALN compliance submissions and recruitment, per CSC (Civil Service Commission) standards.

Two portals: **employee** (applicants + employees) and **admin** (HR/administrators).

## Commands

```bash
# Development
npm run dev                # All apps (employee:3000, admin:3001)
npm run dev:employee       # Employee portal only
npm run dev:admin          # Admin portal only

# Build & Quality (run before committing)
npm run build:employee     # Build employee app
npm run build:admin        # Build admin app
npm run lint               # Lint all packages
npm run type-check         # TypeScript check

# Database (run from packages/database/)
npx drizzle-kit generate   # Generate migrations from schema changes
npx drizzle-kit push       # Push migrations to database
npx drizzle-kit studio     # Visual database browser
```

No test framework is configured yet. Verify changes via `npm run build:employee && npm run lint`.

## Monorepo Architecture

Turbo-managed workspace. Package names use `@tupsafe/*` imports but are registered as `@smartgov/*` in package.json.

```
apps/
  employee/    # Next.js 15 - Port 3000 - Tailwind 4 + Magic UI
  admin/       # Next.js 15 - Port 3001 - Tailwind 4 + shadcn/ui
packages/
  database/    # @tupsafe/database - Drizzle ORM schema, queries, real-time hooks
  auth/        # @tupsafe/auth    - Supabase Auth, middleware, session management
  types/       # @tupsafe/types   - Shared TypeScript types and Zod schemas
  shared-ui/   # @tupsafe/shared-ui - PDF components, form utilities, cn()
```

**Dependency flow:** apps → all packages; `auth` → `database` + `types`; `types` → `database` (schema imports)

## Critical Design Constraint

**DO NOT MIX design systems across portals:**
- **Employee app**: Magic UI components + `@radix-ui/react-icons` ONLY (no Radix component primitives)
- **Admin app**: shadcn/ui + Radix primitives. Install: `npx shadcn@latest add [component] --path apps/admin`
- **shared-ui**: Design-agnostic only (PDF rendering, form utilities)

## Data Flow: Form → Database → PDF

Understanding this pipeline is critical for PDS/SALN work:

```
UI Form (camelCase)
  → Zod validation (apps/employee/src/lib/validations/{pds,saln}-schema.ts)
  → Transformation to snake_case (apps/employee/src/lib/utils/{pds,saln}-transformations.ts)
  → API route (apps/employee/src/app/api/{pds,saln}/)
  → Transaction-based multi-table write (packages/database/src/queries/{pds,saln}.ts)
  → Database (packages/database/src/schema.ts) - all snake_case columns
  → Transformation back to camelCase for display/PDF
  → PDF rendering (packages/shared-ui/src/{pds,saln}-pdf/) via @react-pdf/renderer
```

**Key rules:**
- Drizzle schema columns MUST match Supabase DB columns exactly (snake_case)
- Apply migrations via Supabase MCP tool before updating Drizzle schema
- All currency fields: `decimal(15,2)` in DB, formatted to 2 decimal places
- Date fields: use `formatDateForInput()` / `parseDateFromInput()` from `apps/employee/src/lib/utils/date-utils.ts` (local timezone, never `toISOString()`)
- Date inputs: use `FormDateInput` component (`apps/employee/src/components/forms/shared/FormDateInput.tsx`) which buffers local state to prevent keyboard typing resets
- PDF uses 2025 CSC format exclusively (2019 format removed)

## Authentication Architecture

Multi-layer auth with portal isolation:

1. **Supabase Auth** handles identity (JWT + session cookies)
2. **Middleware** (Edge Runtime, per app) validates session — no DB access, just cookie/JWT checks
3. **API routes** handle authorization: extract user from headers → validate ownership (profileId === userId) → execute
4. **Portal cookie isolation**: employee and admin use separate cookie names, enabling simultaneous login

**User types:** `applicant` (self-register, PDS only) | `employee` (admin-created or converted, PDS + SALN)
**Roles:** `applicant` → `employee` → `supervisor` → `hr` → `admin`

## Database Schema

Single schema file: `packages/database/src/schema.ts` (~2000 lines, Drizzle ORM)

- **Core:** `profiles`, `departments`, `colleges`, `positions`
- **PDS:** `pdsSubmissions` + 9 related tables (education, eligibility, workExperience, etc.)
- **SALN:** `salnSubmissions` + 4 related tables (realProperties, personalProperties, liabilities, businessInterests, relativesInGov)
- **SALN 2025:** `salnFormatVersion` field, `propertyOwner` enum, dual government IDs, compliance type
- **Recruitment:** `openPositions`, `jobApplications`, `applicationStatusHistory`
- **System:** `notifications`, `auditLogs`, `submissionDeadlines`, `archives`

## State Management & Real-Time

- **React Query v5**: 5min staleTime, 10min cacheTime, refetchOnWindowFocus disabled
- **Real-time**: Supabase Realtime channels + React Query cache invalidation via hooks in `packages/database/src/hooks/`
- **Forms**: React Hook Form + Zod validation + auto-save (useAutoSave hook with IndexedDB/localStorage)
- **Notifications**: Sonner toasts

## API Route Pattern

All routes follow this structure:
```typescript
// Extract user from middleware-set headers
const userId = request.headers.get('x-user-id');
// Validate request body with Zod
const validated = schema.parse(await request.json());
// Check ownership: profileId must match authenticated user
// Execute with transaction for multi-table writes
// Return { success, data, error, pagination? }
```

## RBAC

| Role       | Scope            | Access                                            |
| ---------- | ---------------- | ------------------------------------------------- |
| applicant  | Own applications | Browse/apply for jobs, PDS for applications       |
| employee   | Own records      | PDS/SALN submit/edit, compliance tracking         |
| supervisor | Department       | Approve/return submissions, department reports    |
| hr         | All records      | User management, compliance, job postings         |
| admin      | All + config     | Full system, role management, applicant conversion|

Account flow: `pending → active (verified+approved) → hired (applicant→employee conversion)`

## Key File Locations

| Purpose | Path |
|---------|------|
| PDS form validation | `apps/employee/src/lib/validations/pds-schema.ts` |
| SALN form validation | `apps/employee/src/lib/validations/saln-schema.ts` |
| PDS data transformations | `apps/employee/src/lib/utils/pds-transformations.ts` |
| SALN data transformations | `apps/employee/src/lib/utils/saln-transformations.ts` |
| Date utilities | `apps/employee/src/lib/utils/date-utils.ts` |
| Date input component | `apps/employee/src/components/forms/shared/FormDateInput.tsx` |
| Database schema | `packages/database/src/schema.ts` |
| PDS queries | `packages/database/src/queries/pds.ts` |
| SALN queries | `packages/database/src/queries/saln.ts` |
| Real-time hooks | `packages/database/src/hooks/useRealtime*.ts` |
| PDS PDF rendering | `packages/shared-ui/src/pds-pdf/` |
| SALN PDF rendering | `packages/shared-ui/src/saln-pdf/` |
| Auth middleware | `packages/auth/src/middleware.ts` |
| MCP server config | `.mcp.json` |

## Claude Code Workflow

- **Always use Claude sub-agents** (Task tool) for planning, analyzing, and developing. Launch multiple agents in parallel when tasks are independent to maximize efficiency.
- **Git commits:** Never include `Co-Authored-By: Claude` in commit messages. Use conventional commit format (`feat:`, `fix:`, `refactor:`, `chore:`, etc.).

## Coding Conventions

- **Naming:** camelCase (variables/functions), PascalCase (components/types), snake_case (DB columns)
- **TypeScript:** Strict mode, no `any` — use `unknown` with type narrowing instead
- **Imports:** Always use `@tupsafe/*` for shared packages, never relative cross-package imports
- **Forms:** React Hook Form `Controller`/`FormField` pattern with Zod resolvers
- **Data fetching:** React Query hooks (never raw `useState` + `useEffect` for API calls)
- **Validation:** Zod at both frontend (form submit) and API route (request body)
- **DB writes:** Use transactions for multi-table operations
- **Pre-commit:** Run `npm run lint` + `npm run build:employee` (or `build:admin`)
