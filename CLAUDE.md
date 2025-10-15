# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# SmartGov: e-PDS and e-SALN Compliance System

## Project Overview

Thesis project for a secure web-based system enabling Philippine government employees to submit and manage Personal Data Sheets (e-PDS) and Statements of Assets, Liabilities, and Net Worth (e-SALN). Replaces paper workflows with a modern, auditable digital platform.

### Target Users

- **Government Employees**: Submit and update PDS/SALN forms (employee portal)
- **HR Personnel/Administrators**: Review submissions, manage users, compliance reporting (admin portal)

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
4. **Row Level Security (RLS)**: Implemented at the Supabase database level
5. **Form validation**: Zod schemas for runtime validation, shared via `@smartgov/types`

### Security Considerations

- All inputs must be validated with Zod schemas
- Use Row Level Security for database access control
- Implement audit logging for all PDS/SALN operations
- Apply rate limiting on API routes
- This system handles sensitive government data - security is paramount

### Component Development

- Use shadcn/ui components from each app's local installation
- Check `components.json` in each app for shadcn configuration
- Magic UI components are available for enhanced visual effects
- Follow Tailwind CSS 4 conventions for styling
- Use `cn()` utility for conditional class merging

## Form Specifications

### PDS (Personal Data Sheet)

Complies with CSC (Civil Service Commission) format:

- Personal Information (4 sections)
- Educational Background
- Work Experience
- Voluntary Work/Training
- Digital signature support

### SALN (Statement of Assets, Liabilities, and Net Worth)

Annual financial disclosure requirements:

- Assets (Real Property, Personal Property, Cash/Investments)
- Liabilities
- Net Worth auto-calculation
- Business Interests tracking

Both forms require:

- Real-time Zod validation
- Auto-save for draft data
- Version control with timestamps
- Audit trail logging

## Compliance Requirements

- **Immutable Records**: All submissions permanently stored with version history
- **Audit Trails**: Complete logging (who, what, when) for regulatory compliance
- **Deadline Tracking**: Automated notifications for submission deadlines
- **Archival**: Records older than 5 years auto-archived with retrieval capability
- **Accessibility**: WCAG 2.1 AA compliance for all interfaces

## Deployment

- **Platform**: Vercel with Turbo integration
- **Database**: Supabase production instance
- **Environment Variables**: Configured per app (check `.env.local` in each app)
- **Staging**: Vercel preview deployments per PR
- **Production**: Vercel production from `main` branch

## Important Notes

- Always run `npm run lint` before committing
- Use `npm run type-check` to verify TypeScript before pushing
- Database schema changes require migration generation in `packages/database`
- Each app can be developed independently but builds depend on shared packages
- MCP servers are configured in `.mcp.json` - use filesystem, shadcn, github, memory, and sequential-thinking servers as appropriate
