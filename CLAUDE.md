# CLAUDE.md

Instructions for Claude Code working with the TUPSAFE codebase.

# TUPSAFE: TUP Manila e-PDS and e-SALN System

**Technological University of the Philippines System for Automated Filing and e-Compliance**

Secure web system for TUP Manila managing:

1. **Employee Compliance**: PDS/SALN submission per CSC standards
2. **Recruitment**: Job applications, HR management, applicant-to-employee conversion

## Target Users

- **Applicants**: Browse/apply for positions via employee portal
- **Faculty/Staff**: Submit PDS/SALN via employee portal
- **Department Heads**: Review department submissions
- **College Deans**: College-level oversight
- **HR/Admin**: System management, job postings, compliance reports via admin portal

## Development Principles (Priority Order)

### ⚡ Performance

- Code splitting (route + component), lazy loading, Next.js `<Image>`
- Optimize DB queries (indexing, no N+1), bundle < 200KB
- Web Vitals: LCP < 2.5s, FID < 100ms, CLS < 0.1
- Prefer Server Components, React Query for caching

### 🧹 Clean Code

- camelCase (variables/functions), PascalCase (components/types)
- DRY, Single Responsibility, SOLID principles
- TypeScript strict mode, no `any` without justification
- Run `npm run lint` before committing

### 🔧 Maintainability

- Modular design, separation of concerns
- Shared utilities in `@tupsafe/*` packages
- Comprehensive types in `@tupsafe/types`
- Document complex patterns, atomic commits

### ✨ UX

- WCAG 2.1 AA compliance (keyboard nav, ARIA, focus management)
- Skeleton screens, helpful errors, instant validation
- Mobile-first, optimistic UI, toast notifications

## Monorepo Architecture

**Turbo-managed with shared packages:**

### Apps (apps/\*)

**employee** (port 3000) - Applicants + Employees

- Design: Tailwind CSS 4 + Magic UI (animations/effects)
- Icons: `@radix-ui/react-icons` ONLY (no Radix components)
- Users: Applicants (job applications) + Employees (PDS/SALN)

**admin** (port 3001) - HR/Admin

- Design: Tailwind CSS 4 + shadcn/ui (Radix primitives)
- Install: `npx shadcn@latest add [component] --path apps/admin`
- Users: HR, department heads, deans, administrators

### Packages (packages/\*)

**@tupsafe/database** (@smartgov/database):

- Drizzle ORM, migrations, real-time hooks
- Tables: profiles, departments, positions, openPositions, jobApplications, pdsSubmissions, pds*, salnSubmissions, saln*, submissionDeadlines, approvalWorkflows, auditLogs, notifications, archives, auth tables

**@tupsafe/auth** (@smartgov/auth):

- Supabase Auth, session management, MFA, middleware

**@tupsafe/types** (@smartgov/types):

- TypeScript types, Zod schemas, API types

**@tupsafe/shared-ui** (@smartgov/shared-ui):

- Design-agnostic utilities, form components, hooks

**Package Strategy:**

- Always import from `@tupsafe/*` for shared functionality
- App-specific UI stays in `apps/[employee|admin]/src/components`
- DO NOT MIX: Magic UI (employee) ≠ shadcn/ui (admin)

## Tech Stack

**Core:** Next.js 15.5.3, React 19.1.0, TypeScript 5, Turbopack, Turbo monorepo

**Infrastructure:**

- DB: PostgreSQL (Supabase) + Drizzle ORM
- Real-time: Supabase Realtime + React Query v5
- Forms: React Hook Form + Zod
- Auth: Custom package + Supabase Auth + MFA (input-otp)
- Notifications: Sonner
- Animation: Framer Motion

## Commands

```bash
# Development
npm run dev                # All apps
npm run dev:employee       # Port 3000
npm run dev:admin          # Port 3001

# Build
npm run build              # All apps
npm run build:employee
npm run build:admin

# Quality
npm run lint               # Lint all
npm run type-check         # TypeScript check
npm run clean              # Clean artifacts

# Database (in packages/database)
npx drizzle-kit generate   # Generate migrations
npx drizzle-kit push       # Run migrations
npx drizzle-kit studio     # GUI
```

## Code Organization

**Apps Structure:**

```
apps/[employee|admin]/
├── src/
│   ├── app/           # App Router pages/layouts
│   ├── components/    # App-specific components
│   ├── providers/     # QueryProvider, ToastProvider
│   ├── hooks/         # Custom hooks
│   └── lib/           # Utilities, toast-templates.tsx
├── middleware.ts      # Auth/routing
├── components.json    # shadcn config (admin only)
└── .env.local         # Supabase credentials
```

**Packages Structure:**

```
packages/
├── database/src/      # schema/, migrations/, hooks/, utils/
├── auth/src/          # utils/supabase/, components/, middleware.ts
├── types/src/         # Type definitions
└── shared-ui/src/     # ui/, lib/
```

**Key Patterns:**

1. Centralized DB in `@tupsafe/database`
2. Auth middleware per app
3. RLS at Supabase level
4. Zod validation via `@tupsafe/types`
5. Real-time: Supabase Realtime + React Query + custom hooks
6. Performance: Server Components default, React Query (5min stale time), optimistic updates

## RBAC

**User Types:**

- **Applicant**: Self-register, browse/apply jobs, PDS only (no SALN), `applicantId: APPL-YYYYMMDD-XXXX`
- **Employee**: Admin-created or converted applicant, PDS/SALN access, `employeeId: TUP-assigned`

**Roles:**

| User Type | Role       | Access Scope     | Key Capabilities                                       |
| --------- | ---------- | ---------------- | ------------------------------------------------------ |
| Applicant | applicant  | Own applications | Browse jobs, apply, track status, PDS for applications |
| Employee  | employee   | Own records      | PDS/SALN submit/edit, compliance tracking              |
| Employee  | supervisor | Department       | Approve/return submissions, dept reports               |
| Employee  | hr         | All records      | User management, compliance, job postings, review apps |
| Employee  | admin      | All + config     | Full system, role management, applicant conversion     |

**Database:**

- `profiles.userType`: 'employee' | 'applicant'
- Fields: `employeeId`, `applicantId`, `employmentCategory`, `hireDate` (all nullable)
- RLS enforces user type + role hierarchy

**Account Flow:**

```
Applicant: pending → active (verified+approved) → hired (→ employee)
Employee:  pending → active
```

**Hierarchy:** TUP Manila → Colleges → Departments → Faculty/Staff

## Design Systems

**Employee Portal - Magic UI:**

- Backgrounds: `dot-pattern`, `retro-grid`, `animated-grid-pattern`, `flickering-grid`
- Buttons: `shimmer-button`, `shiny-button`, `rainbow-button`
- Text: `animated-gradient-text`, `text-reveal`, `sparkles-text`, `aurora-text`
- Effects: `shine-border`, `border-beam`, `meteors`, `particles`
- Cards: `magic-card`, `neon-gradient-card`
- NO Radix components, icons only (`@radix-ui/react-icons`)

**Admin Portal - shadcn/ui:**

- Install: `npx shadcn@latest add [component] --path apps/admin`
- Radix primitives allowed
- Clean, professional, enterprise-grade

**Shared (@tupsafe/shared-ui):**

- `cn()` utility for class merging
- Design-agnostic helpers

**Color System (TUP Manila):**

```css
--color-tup-primary: #0066cc; /* TUP Blue */
--color-tup-secondary: #ffd700; /* TUP Gold */
/* Get official Pantone/hex from university Communications office */
```

**Accessibility:**

- WCAG 2.1 AA: 4.5:1 contrast, keyboard nav, focus states
- ARIA labels, semantic HTML, 16px min body text

**Typography:**

```css
h1: text-4xl font-heading font-bold (36px)
h2: text-3xl font-heading font-semibold (30px)
h3: text-2xl font-heading font-semibold (24px)
h4: text-xl font-heading font-medium (20px)
body: text-base font-sans (16px)
```

## Security

- **Data Classification**: CSC-regulated PDS/SALN (sensitive), applicant recruitment data
- **Input Validation**: Zod schemas mandatory
- **RLS**: User type + role + hierarchy enforcement
- **Audit Logging**: All operations (who, what, when, where)
- **Session**: 30min auto-logout
- **Storage**: Supabase Storage (resumes, docs, PDFs) with secure buckets
- **Encryption**: TLS 1.3 in transit, Supabase at rest

## Forms

**PDS (Personal Data Sheet) - CSC Format + TUP Extensions:**

- CSC Sections: Personal Info, Family, Education, Civil Service, Work Experience, Voluntary Work, Training, Other Info
- TUP Fields: Academic Rank, Department, College, Employee ID, Campus, Tenure Status, Employment Type
- UX: Multi-step, auto-save (30s), real-time Zod validation, progress indicator, mobile-responsive

**SALN (Statement of Assets, Liabilities, Net Worth):**

- Sections: Assets (Real/Personal Property, Cash), Liabilities, Net Worth (auto-calc), Business Interests, Relatives in Gov
- Compliance: Annual deadlines, reminders (30/14/7 days), year-over-year comparison, HR verification

**Both Forms:**

- Real-time validation, auto-save drafts, version control, audit trail, PDF export, digital signature

## Job Application System

**Position Management (Admin):**

- Create/edit/close positions, set deadlines, employment category, qualifications, salary grade, featured flag

**Applicant Workflow:**

1. Browse positions (`/dashboard/positions`) - filter, sort, search
2. Apply - link PDS, cover letter, resume (PDF), additional docs
3. Track status (`/dashboard/applications`)
4. Application number: `APP-YYYYMMDD-XXXX`

**HR Review:**

1. View all applications
2. Update status: pending → under_review → shortlisted → for_interview → interviewed → for_final_review → accepted/rejected/withdrawn → hired
3. Schedule interviews, add notes, make decisions
4. Convert hired applicants to employees

**Database:**

- `openPositions`: Position details, requirements (JSONB), salary, deadline, featured
- `jobApplications`: Application number, applicantId, positionId, pdsId, materials, status, interview details, conversion tracking
- `applicationStatusHistory`: Complete audit trail

**Security:**

- RLS: Applicants see own, HR sees all
- Equal opportunity: structured process, rejection reasons tracked
- Integration: Seamless applicant → employee conversion

## Compliance

**Record Management:**

- Immutable records, complete version history, audit trails
- Deadline tracking (university calendar aligned), auto-reminders
- 5-year archival, CSC retention compliance

**Standards:**

- WCAG 2.1 AA, mobile accessible
- Browsers: Latest 2 versions (Chrome, Firefox, Safari, Edge)
- CHED guidelines for HEI employees

## Performance

**Best Practices:**

- Memoization: `React.memo()`, `useMemo()`, `useCallback()`
- Lazy loading: `React.lazy()`, dynamic imports
- Virtualization: `react-window` / `@tanstack/react-virtual`
- Next.js `<Image>` with width/height
- Route-based code splitting

**Budgets:**

- Initial JS: < 200KB
- Total page: < 1MB
- LCP < 2.5s, FID < 100ms, CLS < 0.1
- Monitor with Lighthouse CI

## Real-time Features

**Implementation:**

- Supabase Realtime (WebSocket) + React Query
- Custom hooks: `@tupsafe/database/hooks`
- Toast notifications (Sonner)
- Optimistic UI updates

**Features:**

- Live notifications (approvals/rejections)
- Submission status updates
- Profile synchronization
- Auto cache invalidation

**Security:**

- RLS-enforced channels
- User-scoped subscriptions
- Audit logging

**Usage:**

```typescript
import {
  useRealtimeNotifications,
  useRealtimeSubmissionStatus,
} from '@tupsafe/database/hooks';

function DashboardPage() {
  const { user } = useAuth();
  useRealtimeNotifications(user?.id || '');
  useRealtimeSubmissionStatus(user?.id || '');
  return <div>Dashboard</div>;
}
```

See `/REALTIME.md` for full documentation.

## Code Quality

**Pre-Commit:**

- `npm run lint` (ESLint pass)
- `npm run type-check` (no TS errors)
- Prettier formatting
- Build validation

**PR Checklist:**

- ✅ Follows 4 development principles
- ✅ TypeScript strict, no `any` (unless justified)
- ✅ WCAG 2.1 AA
- ✅ Performance tested (Web Vitals)
- ✅ Mobile responsive
- ✅ Error handling + loading states
- ✅ Audit logging (sensitive ops)
- ✅ Tests written

**Testing:**

- Unit: utilities, hooks, pure functions
- Integration: API routes, DB ops
- E2E: PDS/SALN submission, approval workflows
- A11y: axe-core automated testing

## Deployment

**Environment:**

- Platform: Vercel + Turbo
- DB: Supabase production
- Staging: Vercel preview (per PR)
- Production: `main` branch
- Domain: `tupsafe.tup.edu.ph` (TUP Manila subdomain)

**Monitoring:**

- Sentry (errors)
- Vercel Analytics (Web Vitals)
- Uptime alerts
- DB metrics (query performance, pooling)

**University Considerations:**

- Maintenance during academic breaks
- Releases around semester transitions
- Daily backups (30-day retention)
- RTO < 4hr, RPO < 1hr

## Important Notes

**Code Quality:**

- Always `npm run lint` + `npm run type-check` before committing
- DB schema changes need migrations in `packages/database`
- Apps independent but depend on shared packages
- MCP servers in `.mcp.json`: filesystem, shadcn, github, memory, sequential-thinking

**Design System Separation:**

- Employee: Magic UI + Tailwind 4 (Radix icons ONLY)
- Admin: shadcn/ui + Tailwind 4 (Radix primitives OK)
- Shared: `@tupsafe/*` packages
- **DO NOT MIX**

**Architecture:**

- Real-time: React Query + Supabase Realtime
- Shared logic: `@tupsafe/database`, `@tupsafe/auth`, `@tupsafe/types`
- Performance first, accessibility mandatory
- Security critical (CSC-regulated data)
- Get official TUP Manila brand guidelines

## Future Enhancements

**Planned:**

- University SSO/LDAP
- Directory sync (HR system)
- Email integration (official university)
- Document management integration

**Roadmap:**

- Mobile app (React Native)
- Bulk upload/import
- Advanced analytics
- API for third-party integrations
- Multi-language (English/Filipino)
- Real-time collaboration (presence, concurrent editing)
- Offline-first with sync
