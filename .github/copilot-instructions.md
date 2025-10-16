# SmartGov Copilot Instructions

## Monorepo Structure

This is a **Turborepo monorepo** with two Next.js apps and shared packages. Key points:

- **Apps**: `apps/employee` (port 3000) and `apps/admin` (port 3001) are independent Next.js 15.5.3 applications
- **Shared packages**: Import from `@smartgov/*` namespaces (database, auth, types, shared-ui, mock-data)
- **Build orchestration**: Turbo manages task dependencies. Package changes auto-rebuild dependent apps

## Development Commands

```bash
# Run specific app (always use turbopack)
npm run dev:employee    # Port 3000
npm run dev:admin       # Port 3001

# Type checking before commits
npm run type-check      # All packages
npm run type-check:employee  # Single app

# Database operations (from packages/database)
npx drizzle-kit generate    # Create migrations from schema changes
npx drizzle-kit studio      # Visual DB editor
```

## Architecture Patterns

### Database Layer (`packages/database`)

- **Drizzle ORM** with TypeScript-first schema in `src/schema.ts`
- **Supabase PostgreSQL** backend with Row Level Security (RLS)
- **Migrations**: Generated SQL in `sql/` directory. Always run `drizzle-kit generate` after schema changes
- **Schema pattern**: Tables use UUIDv7 (`v7()` from uuid), enums for status/roles, relations for foreign keys
- **Example tables**: `profiles`, `departments`, `pds_submissions`, `saln_submissions` with audit trails

### Authentication (`packages/auth`)

- Custom auth package wrapping Supabase auth
- **Middleware pattern**: Each app has `middleware.ts` using `createAuthMiddleware` from `@smartgov/auth`
- **Client usage**: Import `useAuth()` hook or `createClient()` for Supabase client
- **Protected routes**: Configured in middleware `matcher` pattern (see `apps/employee/middleware.ts`)

### Form Handling

- **React Hook Form** + **Zod validation** for all forms
- **Pattern**: Define Zod schemas → use with `@hookform/resolvers/zod` → validate on submit
- **Form components**: Built with shadcn/ui `<Form>`, `<FormField>`, `<FormItem>` structure
- **PDS/SALN forms**: Multi-step forms with draft saving (see `apps/employee/src/app/dashboard/pds/page.tsx`)

## Component Organization

### App-specific Components

Each app has local shadcn/ui installation:

- **Employee**: `apps/employee/src/components/ui/`
- **Admin**: `apps/admin/src/components/ui/`
- **Configuration**: Each has `components.json` for shadcn CLI

### Shared UI (`packages/shared-ui`)

Magic UI components available: `animated-gradient-text`, `aurora-text`, `border-beam`, `globe`, `magic-card`, `meteors`, `neon-gradient-card`, `number-ticker`

### Styling Conventions

- **Tailwind CSS 4** with `@tailwindcss/postcss`
- **cn() utility**: Use `import { cn } from "@/lib/utils"` for conditional classes
- **Theme**: Dark mode support via `ThemeContext` (employee app)

## Code Quality Rules

1. **Type safety**: All DB queries return Drizzle-typed results. Never use `any`
2. **Validation**: Every API route/form must validate with Zod schemas
3. **Imports**: Use `@smartgov/*` for packages, `@/` for app-local imports
4. **Enums**: Use Drizzle pgEnum values from `packages/database/src/schema.ts` (e.g., `roleEnum`, `submissionStatusEnum`)
5. **Migrations**: Never manually edit schema after migration. Create new migration instead

## Key Files Reference

- **Database schema**: `packages/database/src/schema.ts` (532 lines, all tables/enums/relations)
- **Turbo config**: `turbo.json` (task dependencies)
- **App middleware**: `apps/[employee|admin]/middleware.ts` (auth + routing)
- **Package dependencies**: `@smartgov/database` exports `db`, schemas, types; `@smartgov/auth` exports hooks/middleware

## Compliance & Security Notes

- **Audit trails**: All PDS/SALN submissions must log who/what/when in `audit_logs` table
- **RLS policies**: Database enforces row-level security via Supabase (see `packages/database/sql/rls_policies.sql`)
- **Immutable records**: Submissions are versioned, never deleted
- **Sensitive data**: This handles Philippine government employee data—security is critical

## Testing & Debugging

- **Mock data**: `@smartgov/mock-data` package provides test users/forms for development
- **Type checking**: Always run `npm run type-check` before pushing
- **Lint errors**: Fix with `npm run lint` (uses ESLint 9)
- **DB inspection**: Use `npx drizzle-kit studio` to view/edit data visually
