# Contributing to TUPSAFE

Thank you for contributing to TUPSAFE (TUP Manila e-PDS and e-SALN System)! This guide will help you get started with development and understand our automated quality assurance processes.

## Table of Contents

- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [GitHub Actions Workflows](#github-actions-workflows)
- [Code Quality Standards](#code-quality-standards)
- [Pull Request Process](#pull-request-process)
- [Troubleshooting](#troubleshooting)
- [Architecture Overview](#architecture-overview)

## Getting Started

### Prerequisites

- Node.js 22.x or higher
- npm 10.x or higher
- Git
- PostgreSQL (via Supabase)

### Initial Setup

1. **Clone the repository:**

   ```bash
   git clone <repository-url>
   cd smart-gov
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Configure environment variables:**

   Copy `.env.example` to `.env.local` in both apps:

   ```bash
   cp apps/employee/.env.example apps/employee/.env.local
   cp apps/admin/.env.example apps/admin/.env.local
   ```

   Fill in your Supabase credentials and other required environment variables.

4. **Build the project:**

   ```bash
   npm run build
   ```

5. **Start development servers:**

   ```bash
   # Run all apps
   npm run dev

   # Or run specific apps
   npm run dev:employee  # Port 3000
   npm run dev:admin     # Port 3001
   ```

## Development Workflow

### Branch Strategy

- `main` - Production-ready code
- `dev` - Development integration branch
- `feature/*` - Feature branches (e.g., `feature/admin-dashboard`)
- `fix/*` - Bug fix branches
- `chore/*` - Maintenance tasks

### Creating a Feature Branch

```bash
git checkout dev
git pull origin dev
git checkout -b feature/your-feature-name
```

### Working with Build Artifacts

**Important:** This project uses a monorepo architecture with Turbo, which generates build artifacts that should NEVER be committed to git.

#### Build Artifacts to Avoid

- `packages/*/dist/` - Compiled package outputs
- `apps/*/.next/` - Next.js build directories
- `*.tsbuildinfo` - TypeScript build cache
- `.turbo/` - Turbo cache files
- `node_modules/` - Dependencies

#### Clean Build Commands

When switching branches or encountering build issues:

```bash
# Quick clean (removes only build outputs)
npm run clean:dist

# Full clean (includes cache and build info)
npm run clean:all

# Quick rebuild (clean + build)
npm run rebuild:quick

# Full rebuild (thorough clean + build)
npm run rebuild
```

**Best Practice:** Always run `npm run rebuild:quick` when switching branches to prevent stale build artifacts.

## GitHub Actions Workflows

Our project uses GitHub Actions to ensure code quality and prevent build artifacts from being committed. The workflows run automatically and provide comprehensive validation.

### 1. PR Validation Workflow

**File:** `.github/workflows/pr-validation.yml`

**Triggers:**
- Every pull request to `main`, `dev`, or `feature/**` branches
- On PR open, synchronize, or reopen events

**What it does:**
1. **Checks for build artifacts** in the PR
   - Scans for `dist/`, `.next/`, `.tsbuildinfo`, `.turbo/`, and `node_modules/`
   - Fails if any artifacts are found
   - Provides cleanup instructions

2. **Performs clean build** from scratch
   - Cleans all build artifacts
   - Builds all packages and apps with Turbo
   - Verifies critical files are generated

3. **Runs quality checks**
   - TypeScript type checking
   - ESLint validation
   - Build verification

4. **Reports results**
   - Comments on PR with detailed status
   - Shows build metrics (package sizes, file counts)
   - Provides helpful tips

**Example PR Comment:**

```markdown
## ✅ PR Validation Results

### 📋 Check Status

| Check | Status |
|-------|--------|
| Build Artifacts | ✅ Clean |
| Build | ✅ Passed |
| Type Check | ✅ Passed |
| Lint | ✅ Passed |

### 📊 Build Metrics

- **Auth package:** 245KB
- **Database package:** 180KB
- **Types package:** 95KB
- **Shared UI package:** 320KB
- **Admin app files:** 1,234
- **Employee app files:** 1,567

### 💡 Tips

- Keep build artifacts out of git
- Run `npm run clean:all` before switching branches
- Use `npm run rebuild` for a clean build locally
```

### 2. CI Workflow

**File:** `.github/workflows/ci.yml`

**Triggers:**
- Push to `main`, `dev`, or `feature/**` branches
- Pull requests to `main` or `dev`

**What it does:**

**Matrix Build Job:**
- Builds and tests each app (admin, employee) separately
- Performs clean build from scratch
- Runs type checking and linting per app
- Calculates individual build metrics
- Uploads failure artifacts for debugging

**Full Monorepo Build Job:**
- Builds entire monorepo in one go
- Verifies all package dependencies
- Checks all build outputs
- Reports total build time and sizes
- Validates complete integration

**Status Check Job:**
- Aggregates results from all jobs
- Provides final CI status
- Generates comprehensive summary

**Build Reports Include:**
- Total build time
- Package sizes (auth, database, types, shared-ui, mock-data)
- Application sizes (admin, employee)
- File counts
- Quality check results

### 3. Cache Cleanup Workflow

**File:** `.github/workflows/cache-cleanup.yml`

**Triggers:**
- Scheduled daily at 2 AM UTC
- Manual trigger via workflow_dispatch

**What it does:**
1. **Identifies stale branches**
   - Finds branches with no commits in 30+ days
   - Lists active vs. stale branches

2. **Cleans old caches**
   - Deletes caches from stale branches
   - Removes caches older than 7 days (configurable)
   - Focuses on `feature/*` branches by default
   - Preserves `main` and `dev` caches

3. **Reports cleanup metrics**
   - Number of caches deleted
   - Space freed (in MB)
   - Branch patterns affected

**Manual Trigger Options:**
- `branch_pattern` - Target specific branch pattern (default: `feature/*`)
- `days_old` - Age threshold in days (default: 7)

**To manually trigger:**
1. Go to Actions tab in GitHub
2. Select "Cache Cleanup" workflow
3. Click "Run workflow"
4. Optionally adjust parameters
5. Click "Run workflow"

## Code Quality Standards

### Before Committing

Always verify your code meets quality standards:

```bash
# Type check
npm run type-check

# Lint
npm run lint

# Full build
npm run build
```

### TypeScript

- Use strict mode (enabled by default)
- Avoid `any` type unless absolutely necessary
- Define proper types in `@tupsafe/types` package
- Use Zod schemas for runtime validation

### Code Style

- **Variables/Functions:** camelCase
- **Components/Types:** PascalCase
- **Files:** kebab-case for utilities, PascalCase for components
- Use ESLint rules (automatically enforced)
- Format with Prettier (integrated with ESLint)

### Performance

- Prefer Server Components (React 19)
- Use `React.memo()`, `useMemo()`, `useCallback()` judiciously
- Implement code splitting and lazy loading
- Use Next.js `<Image>` component with proper dimensions
- Keep bundle sizes under 200KB

### Accessibility

- Follow WCAG 2.1 AA standards
- Ensure keyboard navigation works
- Add proper ARIA labels
- Test with screen readers
- Maintain 4.5:1 contrast ratio

## Pull Request Process

### Creating a Pull Request

1. **Ensure your branch is up to date:**

   ```bash
   git checkout dev
   git pull origin dev
   git checkout feature/your-feature
   git merge dev
   ```

2. **Run quality checks locally:**

   ```bash
   npm run clean:all
   npm run build
   npm run type-check
   npm run lint
   ```

3. **Commit your changes:**

   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

   Use conventional commit format:
   - `feat:` - New feature
   - `fix:` - Bug fix
   - `chore:` - Maintenance task
   - `docs:` - Documentation
   - `refactor:` - Code refactoring
   - `test:` - Tests
   - `style:` - Formatting

4. **Push to GitHub:**

   ```bash
   git push origin feature/your-feature
   ```

5. **Create PR on GitHub:**
   - Go to the repository on GitHub
   - Click "New Pull Request"
   - Select your branch
   - Fill in PR template
   - Submit for review

### PR Checklist

Before submitting, ensure:

- ✅ Code follows the 4 development principles (Performance, Clean Code, Maintainability, UX)
- ✅ TypeScript strict mode, no unjustified `any`
- ✅ WCAG 2.1 AA compliance
- ✅ Performance tested (check Web Vitals)
- ✅ Mobile responsive
- ✅ Error handling and loading states implemented
- ✅ Audit logging added for sensitive operations
- ✅ No build artifacts committed
- ✅ GitHub Actions checks pass

### What Happens After Submission

1. **PR Validation runs automatically:**
   - Checks for build artifacts
   - Performs clean build
   - Runs type checking and linting
   - Comments on PR with results

2. **CI builds run:**
   - Matrix builds for each app
   - Full monorepo build
   - All quality checks

3. **Code review:**
   - Maintainers review code
   - Address feedback
   - Update PR as needed

4. **Merge:**
   - Once approved and checks pass
   - Squash and merge (usually)
   - Delete feature branch

## Troubleshooting

### Build Artifacts Detected in PR

**Error Message:**
```
❌ Build artifacts detected in PR!
Please remove them using:
  npm run clean:all
  git add -u
  git commit -m 'chore: remove build artifacts'
```

**Solution:**

```bash
# Clean all artifacts
npm run clean:all

# Stage the deletions
git add -u

# Commit the cleanup
git commit -m "chore: remove build artifacts"

# Push the fix
git push
```

### Build Failures

**Issue:** Build fails in GitHub Actions but works locally

**Solution:**

1. **Clean local build:**
   ```bash
   npm run clean:all
   npm install
   npm run build
   ```

2. **Check for missing dependencies:**
   ```bash
   npm install
   ```

3. **Verify environment variables:**
   - Ensure all required env vars are set
   - Check `.env.example` for reference

4. **Check for path issues:**
   - Verify imports use `@tupsafe/*` for shared packages
   - Check relative paths are correct

### Type Check Failures

**Issue:** TypeScript errors in CI but not locally

**Solution:**

1. **Update TypeScript:**
   ```bash
   npm install -D typescript@latest
   ```

2. **Clean TypeScript cache:**
   ```bash
   npm run clean:all
   npm run build
   ```

3. **Run type check per app:**
   ```bash
   npm run type-check:employee
   npm run type-check:admin
   ```

4. **Check for missing type definitions:**
   - Ensure all packages have proper `@types/*` packages
   - Verify `tsconfig.json` paths are correct

### Lint Failures

**Issue:** ESLint errors in CI

**Solution:**

1. **Run lint locally:**
   ```bash
   npm run lint
   ```

2. **Auto-fix issues:**
   ```bash
   npm run lint -- --fix
   ```

3. **Check ESLint config:**
   - Verify `.eslintrc.json` in apps and packages
   - Ensure rules are consistent

### Merge Conflicts

**Issue:** Merge conflicts when updating from dev

**Solution:**

1. **Update your branch:**
   ```bash
   git checkout dev
   git pull origin dev
   git checkout feature/your-feature
   git merge dev
   ```

2. **Resolve conflicts:**
   - Open conflicted files
   - Keep relevant changes
   - Test after resolving

3. **Verify build works:**
   ```bash
   npm run clean:all
   npm run build
   ```

4. **Commit and push:**
   ```bash
   git add .
   git commit -m "chore: merge dev and resolve conflicts"
   git push
   ```

### GitHub Actions Check Not Running

**Issue:** PR validation or CI not triggering

**Possible Causes:**
1. Branch name doesn't match pattern
2. Workflow file has syntax error
3. Repository settings block workflows

**Solution:**

1. **Check branch naming:**
   - Use `feature/*`, `fix/*`, or `chore/*` prefix
   - Or target `main`/`dev` directly

2. **Manually trigger workflow:**
   - Go to Actions tab
   - Select workflow
   - Click "Run workflow"

3. **Check workflow syntax:**
   ```bash
   # Install act (local GitHub Actions runner)
   npm install -g act

   # Test workflow locally
   act pull_request
   ```

### Cache Issues

**Issue:** Old cache causing build problems

**Solution:**

1. **Local cache:**
   ```bash
   npm run clean:all
   rm -rf node_modules
   npm install
   npm run build
   ```

2. **GitHub Actions cache:**
   - Go to Actions tab
   - Click "Caches" in sidebar
   - Delete specific caches
   - Or run "Cache Cleanup" workflow manually

3. **Turbo cache:**
   ```bash
   rm -rf .turbo
   npm run build
   ```

## Architecture Overview

### Monorepo Structure

```
smart-gov/
├── apps/
│   ├── admin/          # Admin portal (port 3001)
│   │   ├── src/
│   │   ├── middleware.ts
│   │   └── components.json  # shadcn/ui config
│   └── employee/       # Employee portal (port 3000)
│       ├── src/
│       └── middleware.ts
├── packages/
│   ├── auth/           # @tupsafe/auth
│   ├── database/       # @tupsafe/database
│   ├── types/          # @tupsafe/types
│   ├── shared-ui/      # @tupsafe/shared-ui
│   └── mock-data/      # @tupsafe/mock-data
├── .github/
│   └── workflows/      # GitHub Actions workflows
├── turbo.json          # Turbo configuration
└── package.json        # Root package.json
```

### Design Systems

**Employee Portal (`apps/employee`):**
- Tailwind CSS 4
- Magic UI (animations, effects)
- Radix Icons ONLY (no Radix components)
- Modern, animated, user-friendly

**Admin Portal (`apps/admin`):**
- Tailwind CSS 4
- shadcn/ui (Radix primitives)
- Professional, enterprise-grade
- Install components: `npx shadcn@latest add [component] --path apps/admin`

**Shared (`packages/shared-ui`):**
- Design-agnostic utilities
- Form components
- Custom hooks
- `cn()` utility

### Tech Stack

- **Framework:** Next.js 15.5.3 (App Router)
- **UI:** React 19.1.0
- **Language:** TypeScript 5
- **Build:** Turbopack + Turbo monorepo
- **Database:** PostgreSQL (Supabase) + Drizzle ORM
- **Auth:** Custom package + Supabase Auth
- **Forms:** React Hook Form + Zod
- **State:** React Query v5
- **Real-time:** Supabase Realtime
- **Styling:** Tailwind CSS 4
- **Notifications:** Sonner

### Development Principles (Priority Order)

1. **Performance First** - Fast load times, optimized bundles, efficient rendering
2. **Clean Code** - Readable, maintainable, well-structured
3. **Maintainability** - Modular, documented, scalable
4. **User Experience** - Accessible, responsive, intuitive

## Additional Resources

- [Project Documentation (CLAUDE.md)](./CLAUDE.md) - Comprehensive project guide
- [Next.js Documentation](https://nextjs.org/docs)
- [Turbo Documentation](https://turbo.build/repo/docs)
- [Drizzle ORM Documentation](https://orm.drizzle.team)
- [Supabase Documentation](https://supabase.com/docs)
- [shadcn/ui Documentation](https://ui.shadcn.com)
- [Magic UI Documentation](https://magicui.design)

## Questions or Issues?

- Check existing issues on GitHub
- Read the [CLAUDE.md](./CLAUDE.md) documentation
- Ask in team discussions
- Reach out to maintainers

---

**Thank you for contributing to TUPSAFE!** Your efforts help improve the system for TUP Manila faculty, staff, and administration.
