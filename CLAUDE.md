# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# SmartGov: TUP Manila e-PDS and e-SALN Compliance System

## Project Overview

Thesis project for a secure web-based system enabling **Technological University of the Philippines (TUP) Manila** employees—including professors, faculty members, and administrative staff—to submit and manage Personal Data Sheets (e-PDS) and Statements of Assets, Liabilities, and Net Worth (e-SALN) in compliance with Civil Service Commission (CSC) standards. Replaces paper workflows with a modern, auditable digital platform tailored for university operations.

### Target Users

- **Faculty Members (Professors/Instructors)**: Submit and update PDS/SALN forms (employee portal)
- **Administrative Staff**: Submit and update PDS/SALN forms (employee portal)
- **Department Heads**: Review department submissions and manage department compliance
- **College Deans**: Oversight of college-level submissions and compliance reporting
- **HR Personnel/University Administrators**: Review all submissions, manage users, generate compliance reports (admin portal)

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
- **Reusable Utilities**: Place shared utilities in `@smartgov/*` packages
- **Comprehensive Types**: Define interfaces/types in `@smartgov/types` for cross-app consistency
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

- **employee**: Employee-facing portal (port 3000) for PDS/SALN submissions
- **admin**: HR/Admin portal (port 3001) for reviewing and managing submissions

### Shared Packages (packages/\*)

- **@smartgov/database**: Drizzle ORM schemas, migrations, and database utilities
- **@smartgov/auth**: Authentication utilities and middleware
- **@smartgov/types**: Shared TypeScript type definitions
- **@smartgov/shared-ui**: Shared UI components

Both apps are Next.js 15.5.3 applications using App Router with Turbopack. They consume shared packages via workspace dependencies.

## Technology Stack

- **Frontend**: Next.js 15.5.3, React 19.1.0, TypeScript 5
- **Build Tool**: Turbopack (via `--turbopack` flag) for fast development
- **Monorepo**: Turbo for task orchestration
- **Styling**: Tailwind CSS 4, shadcn/ui, Magic UI components
- **Database**: PostgreSQL via Supabase with Drizzle ORM
- **Forms**: React Hook Form + Zod validation
- **Authentication**: Custom auth package with MFA (input-otp)
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
- **Shared packages are internal**: Import from `@smartgov/*` namespaces
- **Turbo orchestrates tasks**: Build/lint/type-check tasks run in dependency order
- **Package changes rebuild dependent apps**: Turbo handles cache invalidation

### Code Organization

**Apps Structure (apps/employee or apps/admin):**

```
apps/[employee|admin]/
├── src/
│   ├── app/              # Next.js App Router pages and layouts
│   ├── components/       # App-specific components
│   └── lib/              # App-specific utilities
├── public/               # Static assets
├── middleware.ts         # Next.js middleware for auth/routing
├── next.config.ts        # Next.js configuration
└── components.json       # shadcn/ui configuration
```

**Database Package (packages/database):**

```
packages/database/
├── src/
│   ├── schema/           # Drizzle table schemas
│   ├── migrations/       # SQL migration files
│   └── index.ts          # Exports schemas and utilities
├── drizzle.config.ts     # Drizzle Kit configuration
└── package.json
```

### Key Architectural Patterns

1. **Shared database layer**: All database schemas and queries centralized in `@smartgov/database`
2. **Type safety**: TypeScript strict mode with Drizzle-generated types
3. **Authentication middleware**: Applied at the Next.js middleware level in each app
4. **Row Level Security (RLS)**: Implemented at the Supabase database level for data isolation
5. **Form validation**: Zod schemas for runtime validation, shared via `@smartgov/types`
6. **Performance architecture**:
   - Prefer Server Components for data fetching
   - Use React Query/SWR for client-side caching
   - Implement database connection pooling
   - Strategic use of ISR (Incremental Static Regeneration) for semi-static pages

## Role-Based Access Control (RBAC)

The system implements hierarchical access control aligned with TUP Manila's organizational structure:

### Access Levels

| Role                | Access Scope                | Capabilities                                                         |
| ------------------- | --------------------------- | -------------------------------------------------------------------- |
| **Faculty/Staff**   | Own records only            | View/edit personal PDS/SALN, submit for review                       |
| **Department Head** | Department records          | View all department submissions, approve/return for revision         |
| **College Dean**    | College-level records       | View all college submissions across departments, oversight reporting |
| **HR Personnel**    | All records                 | Full access to all submissions, user management, compliance reports  |
| **System Admin**    | All records + system config | Full system access, user role management, system configuration       |

### Implementation Notes

- **RLS Policies**: Enforce at database level using Supabase RLS based on user role and organizational hierarchy
- **Middleware**: Next.js middleware validates role before rendering protected routes
- **Audit Logging**: All cross-user access logged with timestamp, role, and action
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

**shadcn/ui Customization:**

- Configure theme colors in `components.json` to use TUP Manila palette
- Maintain consistent border radius (`rounded-lg` for cards, `rounded-md` for buttons)
- Use consistent spacing scale (Tailwind's default 4px scale)

**Magic UI Integration:**
Premium effects for enhanced UX:

- **Animated Backgrounds**: `dot-pattern`, `retro-grid`, `animated-grid-pattern` for hero sections
- **Interactive Buttons**: `shimmer-button`, `rainbow-button` for primary CTAs
- **Text Animations**: `animated-gradient-text`, `text-reveal` for headlines
- **Special Effects**: `shine-border`, `border-beam` for highlighted cards/sections
- **Smooth Transitions**: Use Framer Motion for page transitions, modal animations

**Dark Mode Support:**

- Implement system-preferred dark mode using Next.js 15 and Tailwind CSS 4
- Ensure all colors have dark mode variants
- Test readability and contrast ratios in both modes

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
- **Input Validation**: All inputs must be validated with Zod schemas
- **Row Level Security**: Use RLS for database access control based on user role and hierarchy
- **Audit Logging**: Implement comprehensive audit trails for all PDS/SALN operations
- **Rate Limiting**: Apply rate limiting on API routes to prevent abuse
- **Session Management**: Auto-logout after 30 minutes of inactivity (important for shared university computers)
- **Encryption**: TLS 1.3 for data in transit, Supabase encryption for data at rest
- **CSC Compliance**: This system handles sensitive government employee data—security is paramount
- **University Data Protection**: Comply with institutional data handling policies
- **Future SSO Integration**: Prepare for integration with TUP Manila's identity management system

## Component Development

### General Guidelines

- Use shadcn/ui components from each app's local installation
- Check `components.json` in each app for shadcn configuration
- Magic UI components are available for enhanced visual effects
- Follow Tailwind CSS 4 conventions for styling
- Use `cn()` utility for conditional class merging

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

- **Domain**: Deploy to TUP Manila subdomain (e.g., `smartgov.tup.edu.ph` or similar)
- **Maintenance Windows**: Schedule during academic breaks or low-usage periods
- **Semester Schedule**: Coordinate major releases around semester transitions
- **Backup Strategy**: Daily automated backups with 30-day retention
- **Disaster Recovery**: RTO (Recovery Time Objective) < 4 hours, RPO (Recovery Point Objective) < 1 hour

### Monitoring

- **Error Tracking**: Implement Sentry or similar for error monitoring
- **Performance Monitoring**: Vercel Analytics for Web Vitals tracking
- **Uptime Monitoring**: Set up alerts for downtime
- **Database Metrics**: Monitor query performance, connection pooling

## Important Notes

- Always run `npm run lint` before committing
- Use `npm run type-check` to verify TypeScript before pushing
- Database schema changes require migration generation in `packages/database`
- Each app can be developed independently but builds depend on shared packages
- MCP servers are configured in `.mcp.json`—use filesystem, shadcn, github, memory, and sequential-thinking servers as appropriate
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
