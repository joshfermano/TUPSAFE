# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# TUPSAFE: TUP Manila e-PDS and e-SALN Compliance System

**TUPSAFE** stands for **Technological University of the Philippines System for Automated Filing and e-Compliance**

## Project Overview

Thesis project for a secure web-based system enabling **Technological University of the Philippines (TUP) Manila)** to manage two core functions:

1. **Employee Compliance**: Employees (professors, faculty, administrative staff) submit and manage Personal Data Sheets (e-PDS) and Statements of Assets, Liabilities, and Net Worth (e-SALN) in compliance with Civil Service Commission (CSC) standards.

2. **Recruitment Management**: Applicants browse and apply for open positions, while HR personnel manage job postings, review applications, and convert hired applicants to employees.

The system replaces paper-based workflows with a modern, auditable digital platform tailored for university operations, ensuring compliance, transparency, and efficiency.

### Target Users

- **Applicants (Job Seekers)**: Browse open positions, submit job applications with PDS (employee portal)
- **Faculty Members (Professors/Instructors)**: Submit and update PDS/SALN forms (employee portal)
- **Administrative Staff**: Submit and update PDS/SALN forms (employee portal)
- **Department Heads**: Review department submissions and manage department compliance
- **College Deans**: Oversight of college-level submissions and compliance reporting
- **HR Personnel/University Administrators**: Review all submissions, manage users, generate compliance reports, post job openings, review applications (admin portal)

## Development Principles

This project prioritizes **four core pillars** in all development decisions:

### ⚡ Performance Optimizations

- **Code Splitting**: Implement route-based and component-based code splitting
- **Lazy Loading**: Use `React.lazy()` and dynamic imports for heavy components
- **Image Optimization**: Leverage Next.js `<Image>` component with proper sizing and formats
- **Database Queries**: Optimize with proper indexing, avoid N+1 queries, use Drizzle's query builder efficiently
- **Bundle Size**: Monitor with `@next/bundle-analyzer`, keep initial JS load under 200KB
- **Web Vitals Targets**:
  - LCP (Largest Contentful Paint): < 2.5s
  - FID (First Input Delay): < 100ms
  - CLS (Cumulative Layout Shift): < 0.1
- **Caching**: Implement SWR/React Query patterns for data fetching
- **Server Components**: Prefer React Server Components over Client Components when possible

### 🧹 Clean Code Standards

- **Naming Conventions**: Use descriptive, meaningful names (camelCase for variables/functions, PascalCase for components/types)
- **DRY Principle**: Avoid code duplication—extract reusable logic into utilities/hooks
- **Single Responsibility**: Each function/component should do one thing well
- **SOLID Principles**: Apply to component architecture and business logic
- **Meaningful Comments**: Document complex logic, edge cases, and "why" (not "what")
- **Consistent Formatting**: Rely on Prettier/ESLint—run `npm run lint` before committing
- **Type Safety**: Use TypeScript strict mode—no `any` types without explicit justification

### 🔧 Maintainable Code

- **Modular Design**: Break down large components into smaller, composable pieces
- **Separation of Concerns**: Keep business logic separate from UI logic
- **Reusable Utilities**: Place shared utilities in `@tupsafe/*` packages
- **Comprehensive Types**: Define interfaces/types in `@tupsafe/types` for cross-app consistency
- **Testing**: Write unit tests for utilities, integration tests for API routes, e2e tests for critical flows
- **Documentation**: Document complex patterns, architectural decisions, and integration points
- **Version Control**: Use meaningful commit messages, keep commits atomic

### ✨ Better User Experience

- **Intuitive Navigation**: Clear hierarchy, breadcrumbs, contextual navigation
- **Loading States**: Use skeleton screens and spinners to indicate progress
- **Error Handling**: Provide helpful, actionable error messages with recovery options
- **Accessibility First**: WCAG 2.1 AA compliance—keyboard navigation, ARIA labels, focus management
- **Mobile Responsive**: Design mobile-first, test across devices
- **Progressive Enhancement**: Core functionality works without JavaScript
- **Feedback & Validation**: Instant validation feedback, success confirmations, toast notifications
- **Performance Perception**: Optimistic UI updates, smooth transitions, immediate interactions

## Monorepo Architecture

This is a Turbo-managed monorepo with separate applications and shared packages:

### Apps (apps/\*)

- **employee**: Multi-purpose portal (port 3000) serving both applicants and employees

  - **Design System**: Tailwind CSS 4 + Magic UI components for modern, engaging, and interactive user experience
  - **Component Library**: Magic UI animations, effects, and premium components
  - **Icons**: Radix UI icons only
  - **Target Audience**:
    - **Applicants**: Browse open positions, submit job applications with PDS
    - **Employees**: Submit and manage PDS/SALN forms, track compliance
  - **Access Control**: UI adapts based on user type (applicant vs. employee)

- **admin**: HR/Admin portal (port 3001) for management and oversight
  - **Design System**: Tailwind CSS 4 + shadcn/ui for professional, clean, and enterprise-grade UI
  - **Component Library**: shadcn/ui components (built on Radix UI primitives)
  - **Target Audience**: HR personnel, department heads, college deans, and system administrators
  - **Capabilities**: Review submissions, manage users, generate compliance reports, post job openings, review applications, convert applicants to employees

### Shared Packages (packages/\*)

The monorepo leverages shared packages for code reusability, consistency, and maintainability across both portals:

- **@tupsafe/database** (also accessible as @smartgov/database):

  - Drizzle ORM schemas and type-safe queries
  - Database migrations and seed scripts
  - Real-time hooks for live data synchronization
  - Database utilities and connection management
  - **Schema Organization**:
    - **User Management**: `profiles` (with userType enum), `departments`, `positions`
    - **Job Application System**: `openPositions`, `jobApplications`, `applicationStatusHistory`
    - **PDS Tables**: `pdsSubmissions`, `pdsPersonalInfo`, `pdsFamilyBackground`, `pdsChildren`, `pdsEducation`, `pdsCivilService`, `pdsWorkExperience`, `pdsVoluntaryWork`, `pdsTraining`, `pdsOtherInfo`
    - **SALN Tables**: `salnSubmissions`, `salnRealProperties`, `salnPersonalProperties`, `salnLiabilities`, `salnBusinessInterests`, `salnRelativesInGov`
    - **Administrative**: `submissionDeadlines`, `approvalWorkflows`, `auditLogs`, `notifications`, `archives`
    - **Auth System**: `otpVerifications`, `pendingRegistrations`, `trustedDevices`, `employeeIdRegistry`

- **@tupsafe/auth** (also accessible as @smartgov/auth):

  - Supabase Auth integration
  - Authentication utilities and session management
  - Protected route middleware
  - Multi-factor authentication (MFA) support

- **@tupsafe/types** (also accessible as @smartgov/types):

  - Shared TypeScript type definitions and interfaces
  - Form validation schemas (Zod)
  - API response types
  - Domain models and entities

- **@tupsafe/shared-ui** (also accessible as @smartgov/shared-ui):
  - App-agnostic utility components
  - Shared form components and layouts
  - Common UI patterns used across both portals
  - Utility functions and hooks

**Package Strategy**:

- **Import from packages**: Always prefer importing from `@tupsafe/*` packages for shared functionality
- **App-specific components**: Keep app-specific UI in respective `apps/[employee|admin]/src/components`
- **Design system separation**: Employee uses Magic UI, Admin uses shadcn/ui - shared-ui bridges common functionality
- **Namespace**: Packages use the `@tupsafe/*` namespace, with legacy `@smartgov/*` imports still supported for backward compatibility

Both apps are Next.js 15.5.3 applications using App Router with Turbopack. They consume shared packages via workspace dependencies.

## Technology Stack

### Core Technologies

- **Frontend**: Next.js 15.5.3, React 19.1.0, TypeScript 5
- **Build Tool**: Turbopack (via `--turbopack` flag) for fast development
- **Monorepo**: Turbo for task orchestration and caching

### Design Systems (App-Specific)

- **Employee Portal (apps/employee)**:

  - **Styling**: Tailwind CSS 4
  - **Components**: Magic UI (premium animations and effects)
  - **Icons**: Radix UI Icons (`@radix-ui/react-icons`)
  - **Philosophy**: Modern, engaging, interactive user experience

- **Admin Portal (apps/admin)**:
  - **Styling**: Tailwind CSS 4
  - **Components**: shadcn/ui (built on Radix UI primitives)
  - **Philosophy**: Professional, clean, enterprise-grade interface

### Shared Infrastructure

- **Database**: PostgreSQL via Supabase with Drizzle ORM (`@tupsafe/database`)
- **Real-time**: Supabase Realtime for live data synchronization
- **Data Fetching**: TanStack Query (React Query) v5 for caching and optimistic updates
- **Notifications**: Sonner for toast notifications
- **Forms**: React Hook Form + Zod validation (`@tupsafe/types`)
- **Authentication**: Custom auth package with MFA (input-otp), Supabase Auth (`@tupsafe/auth`)
- **Animation**: Framer Motion (motion package)

## Essential Commands

### Development

```bash
# Start all apps
npm run dev

# Start specific app
npm run dev:employee    # Starts employee portal on port 3000
npm run dev:admin       # Starts admin portal on port 3001

# Build all apps
npm run build

# Build specific app
npm run build:employee
npm run build:admin
```

### Code Quality

```bash
npm run lint          # Lint all packages/apps
npm run type-check    # TypeScript type checking across monorepo
npm run clean         # Clean build artifacts
```

### Database Operations

Navigate to `packages/database` or use these commands:

```bash
npx drizzle-kit generate    # Generate migrations from schema
npx drizzle-kit migrate     # Run pending migrations
npx drizzle-kit studio      # Open Drizzle Studio GUI
```

## Development Guidelines

### Working with the Monorepo

- **Apps are independent**: Each app has its own Next.js config, middleware, and routes
- **Shared packages are internal**: Import from `@tupsafe/*` namespaces (legacy `@smartgov/*` also supported)
- **Turbo orchestrates tasks**: Build/lint/type-check tasks run in dependency order
- **Package changes rebuild dependent apps**: Turbo handles cache invalidation

### Code Organization

**Apps Structure (apps/employee or apps/admin):**

```
apps/[employee|admin]/
├── src/
│   ├── app/              # Next.js App Router pages and layouts
│   ├── components/       # App-specific components
│   │   ├── navigation/   # Navigation components (Header, NotificationBell)
│   │   ├── dashboard/    # Dashboard-specific components
│   │   └── theme/        # Theme components
│   ├── providers/        # React context providers
│   │   ├── QueryProvider.tsx    # React Query provider
│   │   └── ToastProvider.tsx    # Toast notification provider
│   ├── hooks/            # Custom React hooks
│   └── lib/              # App-specific utilities
│       └── toast-templates.tsx  # Pre-configured toast notifications
├── public/               # Static assets
├── middleware.ts         # Next.js middleware for auth/routing
├── next.config.ts        # Next.js configuration
├── components.json       # shadcn/ui configuration
└── .env.local            # Environment variables (Supabase credentials)
```

**Shared Packages Structure (packages/\*):**

```
packages/
├── database/                    # @tupsafe/database
│   ├── src/
│   │   ├── schema/              # Drizzle table schemas
│   │   ├── migrations/          # SQL migration files
│   │   ├── hooks/               # Real-time React hooks
│   │   │   ├── useRealtimeBase.ts
│   │   │   ├── useRealtimeNotifications.ts
│   │   │   ├── useRealtimeSubmissionStatus.ts
│   │   │   └── useRealtimeProfile.ts
│   │   ├── utils/               # Real-time utilities
│   │   │   └── realtime-connection.ts
│   │   ├── types/               # TypeScript types
│   │   │   └── realtime.ts
│   │   └── index.ts             # Exports schemas and utilities
│   ├── drizzle.config.ts        # Drizzle Kit configuration
│   └── package.json
│
├── auth/                        # @tupsafe/auth
│   ├── src/
│   │   ├── utils/supabase/      # Supabase client utilities
│   │   ├── components/          # Auth components (LoginForm, ProtectedRoute)
│   │   ├── middleware.ts        # Auth middleware for Next.js
│   │   └── index.ts
│   └── package.json
│
├── types/                       # @tupsafe/types
│   ├── src/
│   │   ├── index.ts             # Shared type definitions
│   │   └── [domain-models].ts   # Domain-specific types
│   └── package.json
│
└── shared-ui/                   # @tupsafe/shared-ui
    ├── src/
    │   ├── ui/                  # Shared UI components
    │   ├── lib/                 # Shared utilities (cn, etc.)
    │   └── index.ts
    └── package.json
```

### Key Architectural Patterns

1. **Shared database layer**: All database schemas and queries centralized in `@tupsafe/database`
2. **Type safety**: TypeScript strict mode with Drizzle-generated types
3. **Authentication middleware**: Applied at the Next.js middleware level in each app
4. **Row Level Security (RLS)**: Implemented at the Supabase database level for data isolation
5. **Form validation**: Zod schemas for runtime validation, shared via `@tupsafe/types`
6. **Real-time Data Synchronization**:
   - Supabase Realtime for WebSocket-based live updates
   - React Query integration for automatic cache invalidation
   - Custom hooks in `@tupsafe/database/hooks` for real-time subscriptions
   - Toast notifications via Sonner for instant user feedback
7. **Performance architecture**:
   - Prefer Server Components for data fetching
   - React Query (TanStack Query) v5 for client-side caching with 5-minute stale time
   - Optimistic UI updates for instant perceived performance
   - Automatic background refetching and cache synchronization
   - Implement database connection pooling
   - Strategic use of ISR (Incremental Static Regeneration) for semi-static pages

## Role-Based Access Control (RBAC)

The system implements hierarchical access control aligned with TUP Manila's organizational structure and supports a multi-user type system distinguishing between applicants and employees.

### User Types

The system supports two distinct user types, each with different access patterns and workflows:

**1. Applicant User Type**

- **Purpose**: External job seekers applying for positions at TUP Manila
- **Registration**: Self-registration with email verification and admin approval
- **Access**: Employee portal with limited functionality focused on job applications
- **Unique Identifier**: `applicantId` (auto-generated, format: `APPL-YYYYMMDD-XXXX`)
- **Portal**: Employee portal only
- **Primary Use Cases**:
  - Browse open job positions
  - Submit job applications with required documents
  - Track application status
  - Fill out PDS for job applications
  - Cannot access SALN functionality

**2. Employee User Type**

- **Purpose**: Current TUP Manila employees (faculty, staff, administrators)
- **Registration**: Admin-created or converted from hired applicants
- **Access**: Full employee portal functionality or admin portal (based on role)
- **Unique Identifier**: `employeeId` (format: TUP-assigned employee number)
- **Portal**: Employee portal and/or admin portal (role-dependent)
- **Primary Use Cases**:
  - Submit and manage PDS/SALN forms
  - Track compliance deadlines
  - View submission history
  - (Role-dependent) Review submissions, manage users, generate reports

### Access Levels by Role

| User Type     | Role                     | Access Scope                | Capabilities                                                                                                  |
| ------------- | ------------------------ | --------------------------- | ------------------------------------------------------------------------------------------------------------- |
| **Applicant** | applicant                | Own applications only       | Browse positions, submit applications, track application status, fill PDS for jobs                            |
| **Employee**  | employee (Faculty/Staff) | Own records only            | View/edit personal PDS/SALN, submit for review, track compliance                                              |
| **Employee**  | supervisor (Dept. Head)  | Department records          | View department submissions, approve/return for revision, department compliance reports                       |
| **Employee**  | hr                       | All records                 | Full access to all submissions, user management, compliance reports, manage job postings, review applications |
| **Employee**  | admin                    | All records + system config | Full system access, user role management, system configuration, applicant-to-employee conversion              |

### Multi-User System Implementation

**Database Schema Design:**

- **profiles table** includes `userType` enum field: `'employee' | 'applicant'`
- **Conditional Fields**:
  - `employeeId` (nullable for applicants)
  - `applicantId` (nullable for employees)
  - `employmentCategory` (nullable for applicants)
  - `hireDate` (null until applicant is converted to employee)
- **Indexes**: Composite indexes on `userType` + `employmentCategory` and `userType` + `accountStatus` for efficient queries

**RLS (Row Level Security) Policies:**

- User type verified in all RLS policies
- Applicants can only access their own applications and PDS submissions linked to applications
- Employees access based on traditional role hierarchy
- Cross-user-type access strictly controlled (e.g., HR can view applicant profiles, applicants cannot view employee data)

**Account Status Flow:**

```
Applicant:    pending → active (after email verification & admin approval) → hired (converted to employee)
Employee:     pending → active (admin-created or converted from applicant)
```

### Implementation Notes

- **RLS Policies**: Enforce at database level using Supabase RLS based on user type, user role, and organizational hierarchy
- **Middleware**: Next.js middleware validates both user type and role before rendering protected routes
- **Audit Logging**: All cross-user access logged with timestamp, user type, role, and action
- **Type Guards**: Server-side validation ensures applicants cannot access employee-only features (SALN, compliance reports)
- **Applicant Conversion**: HR/Admin can convert hired applicants to employees, triggering:
  - User type change from `applicant` to `employee`
  - Assignment of `employeeId` and `hireDate`
  - Role assignment based on position
  - Transfer of PDS data from application to employee record
- **Future Integration**: Placeholder for university SSO/LDAP integration to sync roles with institutional directory

### University Organizational Hierarchy

```
TUP Manila
└── Colleges
    └── Departments
        └── Faculty/Staff Members
```

Database schema supports multi-level hierarchy for accurate role-based filtering and reporting.

## Branding & Theme System

The application uses a modern, premium, and minimalistic design system aligned with TUP Manila's institutional identity.

### Design Philosophy

- **Modern**: Clean layouts, ample whitespace, contemporary UI patterns
- **Premium**: Subtle shadows, smooth animations, polished interactions
- **Minimalistic**: Focus on content, reduce visual noise, intentional design choices

### Color System

**TUP Manila Official Colors** (to be obtained from university):

```css
/* Placeholder - Update with official TUP Manila brand colors */
:root {
  /* Primary Colors */
  --color-tup-primary: #0066cc; /* TUP Blue - Primary brand color */
  --color-tup-secondary: #ffd700; /* TUP Gold - Accent color */

  /* Neutral Palette */
  --color-background: #ffffff;
  --color-foreground: #0a0a0a;
  --color-muted: #f5f5f5;
  --color-muted-foreground: #6b7280;
  --color-border: #e5e7eb;

  /* Semantic Colors */
  --color-success: #10b981;
  --color-warning: #f59e0b;
  --color-error: #ef4444;
  --color-info: #3b82f6;
}
```

**Note**: Contact TUP Manila's Communications/Marketing office to obtain official brand guidelines including:

- Pantone/hex codes for university colors
- Logo usage specifications
- Typography guidelines
- Official imagery and iconography

### Tailwind CSS 4 Configuration

Extend Tailwind configuration in each app's `tailwind.config.ts`:

```typescript
// Example customization for TUP Manila theme
export default {
  theme: {
    extend: {
      colors: {
        tup: {
          primary: 'var(--color-tup-primary)',
          secondary: 'var(--color-tup-secondary)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        heading: ['Lexend', 'system-ui', 'sans-serif'],
      },
    },
  },
};
```

### Component Styling Guidelines

**Employee Portal (apps/employee) - Magic UI:**

Magic UI provides premium, animated components for engaging user experiences:

- **Animated Backgrounds**: `dot-pattern`, `retro-grid`, `animated-grid-pattern`, `flickering-grid` for hero sections
- **Interactive Buttons**: `shimmer-button`, `shiny-button`, `rainbow-button` for primary CTAs
- **Text Animations**: `animated-gradient-text`, `text-reveal`, `sparkles-text`, `aurora-text` for headlines
- **Special Effects**: `shine-border`, `border-beam`, `meteors`, `particles` for highlighted cards/sections
- **Card Effects**: `magic-card`, `neon-gradient-card` for interactive surfaces
- **Backgrounds**: `warp-background`, `ripple` for dynamic page backgrounds
- **Smooth Transitions**: Use Framer Motion (`blur-fade`) for page transitions and animations
- **Icons**: Import from `@radix-ui/react-icons` only (no Radix UI components)

**Admin Portal (apps/admin) - shadcn/ui:**

shadcn/ui provides professional, accessible components built on Radix UI:

- **Component Library**: Use shadcn/ui CLI to add components (`npx shadcn@latest add [component]`)
- **Radix Primitives**: All components built on accessible Radix UI primitives
- **Configuration**: Theme colors defined in `components.json` using TUP Manila palette
- **Consistency**: Maintain consistent border radius (`rounded-lg` for cards, `rounded-md` for buttons)
- **Spacing**: Use Tailwind's default 4px spacing scale
- **Professional Aesthetic**: Clean, minimal design with subtle shadows and clear hierarchy

**Shared Components (@tupsafe/shared-ui):**

- **Cross-Portal Utilities**: Components that work across both design systems
- **Form Helpers**: Shared form layouts, validation components
- **Utility Functions**: `cn()` for class merging, color utilities
- **Type-Safe**: Full TypeScript support with proper prop types

**Dark Mode Support (Both Portals):**

- Implement system-preferred dark mode using Next.js 15 and Tailwind CSS 4
- Ensure all colors have dark mode variants
- Test readability and contrast ratios in both modes (WCAG 2.1 AA compliance)
- Magic UI components automatically support dark mode
- shadcn/ui components include dark mode variants

### Accessibility Standards

- **WCAG 2.1 AA Compliance**: Minimum contrast ratio 4.5:1 for text
- **Keyboard Navigation**: All interactive elements accessible via keyboard
- **Focus States**: Visible focus indicators on all interactive elements
- **Screen Reader Support**: Proper ARIA labels, semantic HTML, alt text for images
- **Responsive Text**: Font sizes scale appropriately, minimum 16px for body text

### Typography Scale

```css
/* Recommended typography hierarchy */
h1: text-4xl font-heading font-bold (36px)
h2: text-3xl font-heading font-semibold (30px)
h3: text-2xl font-heading font-semibold (24px)
h4: text-xl font-heading font-medium (20px)
body: text-base font-sans (16px)
small: text-sm font-sans (14px)
```

## Security Considerations

- **Data Classification**: Handle TUP Manila institutional data with appropriate security controls
  - **Employee Data**: PDS/SALN contain sensitive personal and financial information (CSC-regulated)
  - **Applicant Data**: Resumes, cover letters, personal information (recruitment records)
  - **Segregation**: Strict RLS policies prevent cross-contamination between applicant and employee data
- **Input Validation**: All inputs must be validated with Zod schemas
- **Row Level Security**: Use RLS for database access control based on user type, user role, and organizational hierarchy
  - **Applicants**: Can only access their own applications and linked PDS
  - **Employees**: Access based on role (own records, department records, or all records)
  - **HR/Admin**: Can access applicant data for recruitment, employee data for compliance
- **Audit Logging**: Implement comprehensive audit trails for all operations
  - **PDS/SALN Operations**: Complete history of submissions, reviews, approvals
  - **Application Operations**: Full audit trail of status changes, reviews, hiring decisions
  - **Cross-User Access**: Log whenever HR/Admin accesses applicant or employee records
- **Rate Limiting**: Apply rate limiting on API routes to prevent abuse
- **Session Management**: Auto-logout after 30 minutes of inactivity (important for shared university computers)
- **Encryption**: TLS 1.3 for data in transit, Supabase encryption for data at rest
- **Document Storage**: Supabase Storage with secure bucket policies for resumes, additional documents, generated PDFs
- **CSC Compliance**: This system handles sensitive government employee data—security is paramount
- **Recruitment Compliance**: Equal opportunity hiring, rejection reasons tracked, no discriminatory data
- **University Data Protection**: Comply with institutional data handling policies
- **Future SSO Integration**: Prepare for integration with TUP Manila's identity management system

## Component Development

### Design System Guidelines by Portal

**Employee Portal (apps/employee):**

- **Primary Library**: Magic UI components for animations and premium effects
- **No Radix UI Components**: Use Radix UI icons only (`@radix-ui/react-icons`)
- **Installation**: Magic UI components are already integrated in the employee portal
- **Styling**: Tailwind CSS 4 with custom Magic UI theme
- **Component Location**: `apps/employee/src/components/ui/` for Magic UI components
- **Philosophy**: Engaging, modern, interactive - prioritize user delight

**Admin Portal (apps/admin):**

- **Primary Library**: shadcn/ui components (built on Radix UI primitives)
- **Installation**: Use `npx shadcn@latest add [component] --path apps/admin`
- **Configuration**: Check `apps/admin/components.json` for shadcn configuration
- **Component Location**: `apps/admin/src/components/ui/` for shadcn components
- **Philosophy**: Professional, clean, enterprise-grade - prioritize clarity and efficiency

**Shared Components (@tupsafe/shared-ui):**

- **Purpose**: Design-system-agnostic utilities and helpers
- **Import Path**: `@tupsafe/shared-ui` or `@smartgov/shared-ui`
- **Examples**: Form wrappers, validation helpers, common hooks
- **Rule**: Should work seamlessly in both employee and admin portals

### General Guidelines

- Follow Tailwind CSS 4 conventions for styling in both portals
- Use `cn()` utility (from `@tupsafe/shared-ui/lib/utils`) for conditional class merging
- Maintain consistent spacing and typography scales across both portals
- Leverage shared packages (`@tupsafe/*`) for business logic and data fetching
- Keep design system components separate - don't mix Magic UI in admin or shadcn in employee

### Performance Best Practices

- **Memoization**: Use `React.memo()`, `useMemo()`, `useCallback()` appropriately
- **Lazy Loading**: Dynamic imports for heavy components (charts, editors, etc.)
- **Virtualization**: Use `react-window` or `@tanstack/react-virtual` for large lists/tables
- **Image Optimization**: Always use Next.js `<Image>` with proper width/height
- **Code Splitting**: Keep bundle sizes small with route-based splitting

### Component Design Patterns

- **Composition over Inheritance**: Build complex components from simpler ones
- **Controlled vs. Uncontrolled**: Prefer controlled components for forms
- **Prop Drilling**: Use Context API or Zustand for deeply nested state
- **Error Boundaries**: Implement error boundaries for graceful degradation
- **Loading States**: Always provide skeleton screens or loading indicators

## Form Specifications

### PDS (Personal Data Sheet)

Complies with CSC (Civil Service Commission) format for Philippine government employees, adapted for TUP Manila university context:

**Standard CSC Sections:**

- Personal Information (4 sections)
- Family Background
- Educational Background
- Civil Service Eligibility
- Work Experience
- Voluntary Work/Training
- Learning and Development Interventions
- Other Information
- Digital signature support

**TUP Manila-Specific Additions:**

- **Academic Rank/Position**: Professor, Associate Professor, Assistant Professor, Instructor, Administrative Staff
- **Department Assignment**: Department within college
- **College Assignment**: College within university
- **Employee ID/Faculty Number**: TUP Manila employee identifier
- **Campus Assignment**: Main campus or satellite campus designation
- **Tenure Status**: Tenured, tenure-track, non-tenure track, contractual
- **Employment Type**: Full-time, part-time, adjunct

**UX Enhancements:**

- Multi-step form with progress indicator
- Auto-save to draft every 30 seconds
- Real-time Zod validation with inline error messages
- Section completion indicators
- Mobile-responsive design

### SALN (Statement of Assets, Liabilities, and Net Worth)

Annual financial disclosure requirements per CSC guidelines:

**Standard Sections:**

- Assets (Real Property, Personal Property, Cash/Investments)
- Liabilities
- Net Worth auto-calculation
- Business Interests and Financial Connections
- Relatives in Government Service

**Compliance Requirements:**

- Annual submission deadline tracking aligned with university academic calendar
- Automated reminders 30, 14, and 7 days before deadline
- Version comparison for year-over-year changes
- Verification workflow for HR review

**Both Forms Require:**

- Real-time Zod validation
- Auto-save for draft data
- Version control with timestamps
- Comprehensive audit trail logging
- PDF export capability
- Digital signature verification

## Job Application System

The system includes a comprehensive job application and recruitment management system for TUP Manila to streamline hiring processes.

### Open Positions Management

**Position Posting (Admin Portal - HR/Admin only):**

- Create and publish job openings with detailed information
- Set application deadlines and number of openings
- Define employment category (faculty, administrative, contractual)
- Specify qualifications, responsibilities, and requirements
- Set salary grade and range
- Mark positions as featured for prominent display
- Track number of applications received
- Close or cancel positions

**Position Browsing (Employee Portal - Applicants):**

- Browse all active open positions
- Filter by employment category (faculty, administrative, contractual)
- Sort by deadline (soonest), salary (highest), or posted date (newest)
- Search by position title, department, or description
- View detailed job descriptions, requirements, and qualifications
- See application deadlines with urgency indicators
- View featured positions prominently
- Check if already applied to a position

### Job Application Workflow

**Application Submission (Applicant):**

1. **Browse Positions**: View open positions on `/dashboard/positions`
2. **Apply**: Click "Apply Now" on desired position
3. **Submit Application Package**:
   - Link existing PDS submission or create new PDS
   - Write cover letter
   - Upload resume (PDF)
   - Upload additional documents (certifications, portfolios, etc.)
   - Auto-generated application number (format: `APP-YYYYMMDD-XXXX`)
4. **Track Status**: Monitor application progress on `/dashboard/applications`

**Application Review (HR/Admin):**

1. **Initial Review**: View all applications, filter by position/status
2. **Shortlisting**: Update status to `shortlisted`
3. **Interview Scheduling**: Set interview date, location, and notes
4. **Interview Conducted**: Update to `interviewed` with interview feedback
5. **Final Decision**: Accept or reject with notes
6. **Hiring**: Mark as `hired` and initiate applicant-to-employee conversion

### Application Status Lifecycle

Applications progress through the following statuses:

```
pending → under_review → shortlisted → for_interview → interviewed → for_final_review → accepted/rejected/withdrawn
                                                                                              ↓
                                                                                            hired
```

**Status Definitions:**

- **pending**: Initial submission, awaiting HR review
- **under_review**: HR actively reviewing application materials
- **shortlisted**: Selected for further consideration
- **for_interview**: Interview scheduled (date/location set)
- **interviewed**: Interview completed, awaiting decision
- **for_final_review**: Final review by department/college leadership
- **accepted**: Offer extended to applicant
- **rejected**: Application declined (rejection reason logged)
- **withdrawn**: Applicant withdrew application
- **hired**: Applicant accepted offer and onboarding initiated

### Database Schema for Job Applications

**Core Tables:**

**1. `openPositions` table:**

- Position details (title, code, description)
- Department assignment and employment category
- Qualifications, responsibilities, requirements (JSONB arrays)
- Salary information (grade, min/max range)
- Application deadline and number of openings
- Status (open, closed, filled, cancelled)
- Featured flag for highlighted positions
- Posted by and posted date for audit trail
- Comprehensive indexes for filtering and searching

**2. `jobApplications` table:**

- Application number (unique identifier)
- Applicant ID (references profiles)
- Position ID (references openPositions)
- PDS submission ID (linked PDS)
- Application materials (cover letter, resume URL, additional documents)
- Status tracking (current status, status history)
- Review information (reviewed by, reviewer notes)
- Interview details (date, location, notes)
- Final decision (decision by, decision date, rejection reason)
- Conversion tracking (converted employee ID, hire date)
- Created/updated timestamps

**3. `applicationStatusHistory` table:**

- Complete audit trail of all status changes
- Previous status → new status
- Changed by (user ID), changed at (timestamp)
- Notes explaining the change
- IP address and user agent for security audit
- Comprehensive indexes for querying status transitions

**Key Features:**

- **Cascade Deletes**: Applications cascade deleted if applicant account deleted
- **Restrict Deletes**: Positions cannot be deleted if applications exist
- **Foreign Keys**: Strict referential integrity for applicants, positions, reviewers
- **JSONB Fields**: Flexible storage for requirements, qualifications, additional documents
- **Status Enums**: Type-safe status values prevent invalid states
- **Composite Indexes**: Optimized queries for common filters (applicant+status, position+status, etc.)

### Applicant Portal Features

**Dashboard Overview:**

- Quick stats: Total applications, pending/under review count
- Recent applications with status
- Upcoming interview dates
- Action items (complete PDS if needed)

**Browse Positions (`/dashboard/positions`):**

- Grid view of all open positions
- Featured positions displayed prominently with special styling
- Filter by employment category
- Sort by deadline, salary, or posted date
- Search functionality
- Position cards showing:
  - Position title and code
  - Department and employment category
  - Salary range
  - Application deadline with urgency indicator
  - Number of openings
  - "Applied" badge if already submitted
  - "Apply Now" or "View Application" buttons

**My Applications (`/dashboard/applications`):**

- Grid view of all submitted applications
- Filter by status
- Search by position or department
- Application cards showing:
  - Position title and application number
  - Department and employment category
  - Application date
  - Current status with color-coded badges
  - Interview date (if scheduled)
  - Click to view full application details

**Application Details (`/dashboard/applications/[id]`):**

- Complete application information
- Linked PDS submission
- Cover letter and resume
- Additional documents
- Status history timeline
- Interview details (if scheduled)
- Reviewer notes (if provided)
- Withdrawal option (if not yet decided)

### HR/Admin Portal Features

**Job Posting Management:**

- Create new job openings
- Edit existing positions
- Close/cancel positions
- View applications per position
- Export applicant data

**Application Review:**

- View all applications across positions
- Filter by position, status, date range
- Bulk status updates
- Assign reviewers
- Schedule interviews
- Add reviewer notes
- Make hiring decisions
- Initiate applicant-to-employee conversion

**Recruitment Analytics:**

- Time-to-hire metrics
- Applications per position
- Conversion rates (applicant → interview → hire)
- Source tracking
- Department-level recruitment reports

### Security & Compliance

**Data Protection:**

- Applicant data encrypted at rest (Supabase)
- Resume and documents stored in secure Supabase Storage buckets
- RLS policies restrict access to own applications (applicants) or authorized HR (employees)
- Audit logging for all application access

**Equal Opportunity:**

- Consistent application process
- Structured interview scoring (future enhancement)
- Rejection reasons tracked for compliance
- No discriminatory data collection

**Integration with Employee Onboarding:**

- Seamless conversion from applicant to employee
- PDS data transferred automatically
- Employee ID assignment
- Hire date recorded
- Role and department assignment
- Account status updated to employee type

## Compliance Requirements

### Record Management

- **Immutable Records**: All submissions permanently stored with complete version history
- **Audit Trails**: Complete logging (who, what, when, from where) for regulatory compliance
- **Deadline Tracking**: Automated notifications for submission deadlines aligned with university calendar
- **Archival**: Records older than 5 years auto-archived with retrieval capability
- **Retention Policy**: Comply with CSC and university records retention requirements

### Accessibility & Standards

- **WCAG 2.1 AA Compliance**: All interfaces must meet accessibility standards
- **Mobile Accessibility**: Full functionality on mobile devices
- **Browser Support**: Latest 2 versions of Chrome, Firefox, Safari, Edge

### University-Specific Compliance

- **Academic Calendar Integration**: Submission deadlines aligned with semester schedules
- **Department Reporting**: Aggregate compliance reports by department and college
- **Confidentiality**: Protect sensitive employee information per university policies
- **CHED Guidelines**: Comply with Commission on Higher Education requirements for HEI employees

## Code Quality Standards

### Pre-Commit Checks

- **Linting**: ESLint must pass (`npm run lint`)
- **Type Checking**: No TypeScript errors (`npm run type-check`)
- **Formatting**: Prettier formatting applied automatically
- **Build Validation**: Ensure builds succeed before pushing

### Code Review Checklist

Before approving PRs, verify:

- ✅ Code follows development principles (performance, clean code, maintainable, UX-first)
- ✅ TypeScript types are comprehensive (no `any` without justification)
- ✅ Accessibility standards met (WCAG 2.1 AA)
- ✅ Performance tested (no regression in Web Vitals)
- ✅ Mobile responsive design verified
- ✅ Error handling implemented
- ✅ Loading states provided
- ✅ Audit logging added for sensitive operations
- ✅ Tests written (unit/integration/e2e as appropriate)

### Testing Strategy

- **Unit Tests**: Test utilities, hooks, and pure functions
- **Integration Tests**: Test API routes, database operations
- **E2E Tests**: Test critical user flows (PDS submission, SALN submission, approval workflow)
- **Accessibility Tests**: Automated a11y testing with axe-core or similar

### Performance Budgets

Monitor and maintain:

- **Initial JavaScript**: < 200KB
- **Total Page Size**: < 1MB
- **LCP**: < 2.5s
- **FID**: < 100ms
- **CLS**: < 0.1

Use Lighthouse CI in GitHub Actions to enforce budgets.

## Deployment

### Environments

- **Platform**: Vercel with Turbo integration
- **Database**: Supabase production instance
- **Environment Variables**: Configured per app (check `.env.local` in each app)
- **Staging**: Vercel preview deployments per PR
- **Production**: Vercel production from `main` branch

### University-Specific Considerations

- **Domain**: Deploy to TUP Manila subdomain (e.g., `tupsafe.tup.edu.ph` or similar)
- **Maintenance Windows**: Schedule during academic breaks or low-usage periods
- **Semester Schedule**: Coordinate major releases around semester transitions
- **Backup Strategy**: Daily automated backups with 30-day retention
- **Disaster Recovery**: RTO (Recovery Time Objective) < 4 hours, RPO (Recovery Point Objective) < 1 hour

### Monitoring

- **Error Tracking**: Implement Sentry or similar for error monitoring
- **Performance Monitoring**: Vercel Analytics for Web Vitals tracking
- **Uptime Monitoring**: Set up alerts for downtime
- **Database Metrics**: Monitor query performance, connection pooling

## Real-time Features

TUPSAFE implements comprehensive real-time functionality for instant data synchronization:

### Implemented Features

- **Live Notifications**: Instant delivery via WebSocket when submissions are approved/rejected
- **Submission Status Updates**: Real-time status changes for PDS/SALN (draft → submitted → reviewing → approved/rejected)
- **Profile Synchronization**: Automatic updates when role, department, or position changes
- **Toast Notifications**: User-friendly notifications with Sonner for all real-time events
- **Optimistic UI Updates**: Immediate UI feedback with React Query mutations

### Architecture

- **Supabase Realtime**: WebSocket-based pub/sub system respecting RLS policies
- **React Query Integration**: Automatic cache invalidation on real-time events
- **Custom Hooks**: Type-safe hooks in `@tupsafe/database/hooks` for easy integration
- **Connection Management**: Auto-reconnect with exponential backoff, health monitoring

### Usage Example

```typescript
import {
  useRealtimeNotifications,
  useRealtimeSubmissionStatus,
} from '@tupsafe/database/hooks';

function DashboardPage() {
  const { user } = useAuth();

  // Auto-subscribes and shows toast notifications
  useRealtimeNotifications(user?.id || '');
  useRealtimeSubmissionStatus(user?.id || '', {
    onApproved: (submission) => {
      // Optional: Custom celebration logic
    },
  });

  return <div>Dashboard</div>;
}
```

### Security

- **RLS Enforcement**: Real-time respects Row Level Security policies
- **User-Scoped Channels**: Each user only receives their own data updates
- **Audit Logging**: All real-time subscriptions logged for compliance

### Documentation

See `/REALTIME.md` for comprehensive documentation on:

- Setup and configuration
- Available hooks and their APIs
- Integration examples
- Troubleshooting guide

## Important Notes

### Code Quality & Development

- Always run `npm run lint` before committing
- Use `npm run type-check` to verify TypeScript before pushing
- Database schema changes require migration generation in `packages/database`
- Each app can be developed independently but builds depend on shared packages
- MCP servers are configured in `.mcp.json`—use filesystem, shadcn, github, memory, and sequential-thinking servers as appropriate

### Design System Separation

- **Employee Portal**: Magic UI + Tailwind CSS 4 (no Radix UI components, only icons)
- **Admin Portal**: shadcn/ui + Tailwind CSS 4 (Radix UI primitives allowed)
- **Shared Packages**: Use `@tupsafe/*` for cross-portal functionality
- **DO NOT MIX**: Keep Magic UI in employee, shadcn/ui in admin - they are intentionally separate

### Architecture & Integration

- **Real-time Integration**: Use React Query hooks with Supabase Realtime for live data synchronization
- **Shared Logic**: Always prefer `@tupsafe/database`, `@tupsafe/auth`, `@tupsafe/types` for shared functionality
- **Performance First**: Every change should consider its impact on load time and user experience
- **Accessibility Required**: WCAG 2.1 AA compliance is mandatory, not optional
- **Security Critical**: This system handles sensitive CSC-regulated employee data—security cannot be compromised
- **TUP Manila Branding**: Obtain official brand guidelines before finalizing visual design

## Future Enhancements

### Planned Integrations

- **University SSO/LDAP**: Integration with TUP Manila's institutional authentication system
- **Directory Sync**: Automatic employee data sync from university HR system
- **Email Integration**: Automated notifications via official university email system
- **Document Management**: Integration with university document management system

### Roadmap Items

- Mobile app (React Native) for on-the-go access
- Bulk upload/import for HR administrative tasks
- Advanced analytics dashboard for compliance reporting
- API for third-party integrations
- Multi-language support (English/Filipino)
- Real-time collaboration features (presence indicators, concurrent editing)
- Offline-first support with sync capabilities
