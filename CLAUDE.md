# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**TUPSAFE** (TUP System for Automated Filing and e-Compliance) - Secure web system for TUP Manila managing employee PDS/SALN compliance submissions and recruitment, per CSC (Civil Service Commission) standards.

Two portals: **employee** (applicants + employees) and **admin** (HR/administrators).

## Commands

```bash
# Development
pnpm dev                # All apps (employee:3000, admin:3001)
pnpm dev:employee       # Employee portal only
pnpm dev:admin          # Admin portal only

# Build & Quality (run before committing)
pnpm build:employee     # Build employee app
pnpm build:admin        # Build admin app
pnpm lint               # Lint all packages
pnpm type-check         # TypeScript check

# Database (run from packages/database/)
pnpm exec drizzle-kit generate   # Generate migrations from schema changes
pnpm exec drizzle-kit push       # Push migrations to database
pnpm exec drizzle-kit studio     # Visual database browser
```

No test framework is configured yet. After implementation changes, run `pnpm lint` to check for errors. Only run `pnpm build:employee` or `pnpm build:admin` before committing — do NOT run builds after every implementation step.

```bash
# Docker (local development)
pnpm docker:up              # Start all containers (uses .env.local)
pnpm docker:down            # Stop all containers
pnpm docker:logs            # Tail container logs
pnpm docker:build           # Build images
pnpm docker:rebuild         # Force rebuild (no cache)
pnpm docker:clean           # Remove containers, volumes, images
```

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
- **Admin app**: shadcn/ui + Radix primitives. Install: `pnpm dlx shadcn@latest add [component] --path apps/admin`
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

| Role       | Scope            | Access                                             |
| ---------- | ---------------- | -------------------------------------------------- |
| applicant  | Own applications | Browse/apply for jobs, PDS for applications        |
| employee   | Own records      | PDS/SALN submit/edit, compliance tracking          |
| supervisor | Department       | Approve/return submissions, department reports     |
| hr         | All records      | User management, compliance, job postings          |
| admin      | All + config     | Full system, role management, applicant conversion |

Account flow: `pending → active (verified+approved) → hired (applicant→employee conversion)`

## Key File Locations

| Purpose                   | Path                                                          |
| ------------------------- | ------------------------------------------------------------- |
| PDS form validation       | `apps/employee/src/lib/validations/pds-schema.ts`             |
| SALN form validation      | `apps/employee/src/lib/validations/saln-schema.ts`            |
| PDS data transformations  | `apps/employee/src/lib/utils/pds-transformations.ts`          |
| SALN data transformations | `apps/employee/src/lib/utils/saln-transformations.ts`         |
| Date utilities            | `apps/employee/src/lib/utils/date-utils.ts`                   |
| Date input component      | `apps/employee/src/components/forms/shared/FormDateInput.tsx` |
| Database schema           | `packages/database/src/schema.ts`                             |
| PDS queries               | `packages/database/src/queries/pds.ts`                        |
| SALN queries              | `packages/database/src/queries/saln.ts`                       |
| Real-time hooks           | `packages/database/src/hooks/useRealtime*.ts`                 |
| PDS PDF rendering         | `packages/shared-ui/src/pds-pdf/`                             |
| SALN PDF rendering        | `packages/shared-ui/src/saln-pdf/`                            |
| Auth middleware           | `packages/auth/src/middleware.ts`                             |
| MCP server config         | `.mcp.json`                                                   |

## Production Deployment (AWS EC2)

Single EC2 instance (t2.micro, 1 vCPU, 1GB RAM + 4GB swap) running all services via Docker.

**Live URLs:**

- Employee: `https://tupsafe.tech` (Nginx HTTPS, Let's Encrypt SSL)
- Admin: `http://18.139.182.61:9443` (Nginx HTTP, IP-restricted via Security Group)
- AI Agent: internal Docker network only (`http://ai-agent:8000`)

**Infrastructure:**

- **Region:** ap-southeast-1 (Singapore)
- **OS:** Ubuntu 24.04
- **Registry:** AWS ECR (3 repos: `tupsafe/employee`, `tupsafe/admin`, `tupsafe/ai-agent`)
- **DNS:** get.tech registrar, A records for `tupsafe.tech` + `www.tupsafe.tech` → `18.139.182.61`
- **SSL:** Let's Encrypt via certbot (auto-renewal), certs at `/etc/letsencrypt/live/www.tupsafe.tech/`
- **Database/Auth:** Supabase Cloud (not self-hosted)

**Docker services (docker-compose.prod.yml):**

| Service  | Image                | Memory Limit | Ports           |
| -------- | -------------------- | ------------ | --------------- |
| nginx    | nginx:1.27-alpine    | 64M          | 80, 443, 9443   |
| redis    | redis:7-alpine       | 96M          | internal        |
| employee | ECR tupsafe/employee | 256M         | internal (3000) |
| admin    | ECR tupsafe/admin    | 256M         | internal (3001) |
| ai-agent | ECR tupsafe/ai-agent | 350M         | internal (8000) |

**CI/CD (`.github/workflows/deploy.yml`):**

1. Triggered on push to `main` (or manual dispatch)
2. Builds 3 Docker images in parallel matrix → pushes to ECR with SHA + latest tags
3. SSHs into EC2 → pulls images → `docker compose up -d` → health check
4. `NEXT_PUBLIC_*` vars are baked at Docker build time (passed as build args from GitHub Secrets)

**Key deployment files:**

| Purpose              | Path                                             |
| -------------------- | ------------------------------------------------ |
| Local dev compose    | `docker-compose.yml`                             |
| EC2 prod compose     | `docker-compose.prod.yml`                        |
| Nginx config         | `nginx/nginx.conf`                               |
| CI/CD workflow       | `.github/workflows/deploy.yml`                   |
| EC2 env template     | `.env.ec2.example`                               |
| EC2 env (gitignored) | `.env.prod` (on EC2 at `/opt/tupsafe/.env.prod`) |

**Nginx notes:**

- Proxy buffers set to 128k/256k for large Supabase auth cookies (default 4k/8k causes 502)
- Rate limiting: 10r/s general, 5r/s API, 1r/s auth
- HSTS, security headers, gzip compression enabled
- Static assets (`/_next/static/`) cached 365 days

**EC2 commands (via SSH):**

```bash
ssh -i tupsafe-aws.pem ubuntu@18.139.182.61
cd /opt/tupsafe
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d      # Start all
docker compose -f docker-compose.prod.yml --env-file .env.prod restart     # Restart all
docker compose -f docker-compose.prod.yml --env-file .env.prod logs -f     # Tail logs
docker ps --format 'table {{.Names}}\t{{.Status}}'                        # Check health
```

## Local Development (Docker)

```bash
docker compose --env-file .env.local up -d    # Start all services with hot reload
docker compose down                            # Stop all
docker compose logs -f                         # Tail logs
```

4 services: Redis (:6379), Employee (:3000), Admin (:3001), AI Agent (:8000). All ports exposed to host. Uses `Dockerfile.dev` with volume mounts for hot reload.

## Claude Code Workflow

- **Always use specialized Claude sub-agents** (Agent tool) for all analysis and engineering work. Select the appropriate `subagent_type` for the task domain (e.g., `senior-frontend-engineer` for React/Next.js, `backend-architect` for API/DB, `database-architect` for schema design, `devops-engineer` for Docker/CI/CD, `ai-ml-engineer` for AI/LLM work, `Plan` for architecture planning, `Explore` for codebase research). Launch multiple agents in parallel when tasks are independent to maximize efficiency.
- **Always leverage Claude skills** (Skill tool) before starting work. Invoke relevant skills like `superpowers:brainstorming` before creative work, `superpowers:writing-plans` before multi-step tasks, `superpowers:systematic-debugging` for bugs, `superpowers:test-driven-development` for features, and `superpowers:verification-before-completion` before claiming work is done.
- **Always leverage MCP servers** for domain-specific operations. Use Serena for symbolic code analysis and editing, Supabase MCP for database migrations and SQL, GitHub MCP for PR/issue management, Context7 for up-to-date library docs, shadcn MCP for UI components, and Playwright for browser testing.
- **Git commits:** Never include `Co-Authored-By: Claude` in commit messages. Use conventional commit format (`feat:`, `fix:`, `refactor:`, `chore:`, etc.).

## Coding Conventions

- **Naming:** camelCase (variables/functions), PascalCase (components/types), snake_case (DB columns)
- **TypeScript:** Strict mode, no `any` — use `unknown` with type narrowing instead
- **Imports:** Always use `@tupsafe/*` for shared packages, never relative cross-package imports
- **Forms:** React Hook Form `Controller`/`FormField` pattern with Zod resolvers
- **Data fetching:** React Query hooks (never raw `useState` + `useEffect` for API calls)
- **Validation:** Zod at both frontend (form submit) and API route (request body)
- **DB writes:** Use transactions for multi-table operations
- **Pre-commit:** Run `pnpm lint` + `pnpm build:employee` (or `build:admin`)
