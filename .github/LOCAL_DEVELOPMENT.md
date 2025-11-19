# Local Development Guide

Best practices for working with the TUPSAFE monorepo to avoid build artifacts and module resolution issues.

## Quick Reference

### Essential Commands

```bash
# Clean everything
npm run clean:all

# Clean + rebuild everything
npm run rebuild

# Quick clean (just dist folders)
npm run clean:dist

# Rebuild after quick clean
npm run rebuild:quick

# Verify no artifacts before commit
npm run verify:no-artifacts
```

---

## Common Workflows

### 1. Starting Fresh (New Clone or Major Issues)

```bash
# Clone the repository
git clone <repository-url>
cd smart-gov

# Install dependencies
npm ci

# Build everything
npm run build

# Start development
npm run dev  # Both apps
# OR
npm run dev:admin     # Port 3001
npm run dev:employee  # Port 3000
```

---

### 2. Switching Branches

**IMPORTANT:** Always clean when switching branches to avoid "Module not found" errors.

```bash
# Save your work
git add .
git commit -m "wip: save current work"

# Clean ALL build artifacts
npm run clean:all

# Switch branch
git checkout <branch-name>

# Clean install (recommended)
npm ci

# Rebuild
npm run build

# Continue development
npm run dev
```

**Why this is necessary:**
- Different branches may have different package versions
- Build artifacts are branch-specific
- Stale artifacts cause module resolution errors
- Turbo cache may be branch-specific

---

### 3. Pulling Latest Changes

```bash
# Pull changes
git pull origin <branch-name>

# If package-lock.json changed
npm ci

# If any package.json changed
npm run rebuild

# If only source code changed
npm run build  # Turbo will skip unchanged packages
```

**Decision Tree:**
- `package-lock.json` changed → `npm ci && npm run rebuild`
- Any `package.json` changed → `npm run rebuild`
- Only source files changed → `npm run build`
- New packages added → `npm ci && npm run rebuild`

---

### 4. Creating a New Branch

```bash
# From latest main/dev
git checkout main  # or dev
git pull origin main

# Clean state
npm run clean:all
npm ci
npm run build

# Create new branch
git checkout -b feature/my-feature

# Start development
npm run dev
```

---

### 5. Before Creating a PR

```bash
# Ensure clean state
npm run clean:all

# Fresh build
npm run build

# Run checks (same as CI)
npm run type-check
npm run lint

# Verify no artifacts in git
npm run verify:no-artifacts

# If all pass, create PR
git push origin <branch-name>
```

**The PR validation workflow will:**
1. Check for build artifacts (fails if found)
2. Clean build from scratch
3. Run type checks
4. Run linting
5. Comment on PR with results

---

### 6. Resolving "Module not found" Errors

This is the most common issue when switching branches.

**Immediate Fix:**
```bash
npm run clean:all
npm ci
npm run build
```

**If that doesn't work:**
```bash
# Nuclear option - remove everything
rm -rf node_modules
rm -rf packages/*/dist
rm -rf packages/*/.turbo
rm -rf apps/*/.next
rm -rf apps/*/.turbo
rm -rf .turbo

# Fresh install
npm install

# Rebuild
npm run build
```

**Specific Package Issues:**
```bash
# If auth package middleware.js is missing
cd packages/auth
npm run build
cd ../..

# Verify it exists
ls -la packages/auth/dist/middleware.js
```

---

### 7. Working on Specific Packages

**Building individual packages:**
```bash
# Build just one package
cd packages/auth
npm run build
cd ../..

# Build all packages (not apps)
for pkg in auth database types shared-ui mock-data; do
  cd packages/$pkg
  npm run build
  cd ../..
done
```

**Developing packages with watch mode:**
```bash
# Terminal 1: Watch package
cd packages/auth
npm run build -- --watch

# Terminal 2: Run app
cd ../..
npm run dev:admin
```

---

### 8. Testing Changes Locally

**Before pushing:**
```bash
# Full clean rebuild
npm run rebuild

# Type check all
npm run type-check

# Lint all
npm run lint

# Build specific app
npm run build:admin
npm run build:employee

# Or build everything
npm run build
```

---

## Understanding Build Artifacts

### What Gets Generated

```
monorepo/
├── packages/
│   ├── auth/
│   │   ├── dist/               # ⚠️ Build artifact
│   │   ├── .turbo/             # ⚠️ Turbo cache
│   │   └── tsconfig.tsbuildinfo # ⚠️ TS cache
│   ├── database/
│   │   ├── dist/               # ⚠️ Build artifact
│   │   └── .turbo/             # ⚠️ Turbo cache
│   └── .../
├── apps/
│   ├── admin/
│   │   ├── .next/              # ⚠️ Next.js build
│   │   └── .turbo/             # ⚠️ Turbo cache
│   ├── employee/
│   │   ├── .next/              # ⚠️ Next.js build
│   │   └── .turbo/             # ⚠️ Turbo cache
├── .turbo/                      # ⚠️ Root Turbo cache
└── node_modules/.cache/         # ⚠️ Various caches
```

**All marked with ⚠️ should NEVER be committed to git.**

### .gitignore Coverage

```gitignore
# Build outputs
dist/
.next/
*.tsbuildinfo

# Turbo
.turbo/

# Dependencies
node_modules/

# Caches
.cache/
```

---

## Troubleshooting Common Issues

### Issue: "Cannot find module '@tupsafe/auth'"

**Cause:** Package not built or stale build

**Solution:**
```bash
cd packages/auth
npm run build
cd ../..
npm run dev
```

### Issue: "middleware.js not found"

**Cause:** Auth package build didn't complete

**Solution:**
```bash
npm run clean:all
npm run build
ls -la packages/auth/dist/middleware.js  # Verify exists
```

### Issue: TypeScript errors after switching branches

**Cause:** Stale TS cache or version mismatch

**Solution:**
```bash
# Remove TS caches
find . -name "*.tsbuildinfo" -delete

# Rebuild
npm run rebuild

# Type check
npm run type-check
```

### Issue: Next.js build fails with cryptic errors

**Cause:** Corrupted .next cache

**Solution:**
```bash
# Clean Next.js builds
rm -rf apps/admin/.next
rm -rf apps/employee/.next

# Rebuild apps
npm run build:admin
npm run build:employee
```

### Issue: "npm ci" vs "npm install"

**When to use `npm ci`:**
- After pulling changes to package-lock.json
- When starting fresh
- Before creating a PR
- When dependencies seem wrong

**When to use `npm install`:**
- Adding a new package
- Updating a package
- Generating/updating lock file

```bash
# Deterministic, clean install
npm ci

# Add/update packages
npm install <package-name>
npm install
```

### Issue: Turbo cache causing issues

**Cause:** Stale or corrupted Turbo cache

**Solution:**
```bash
# Clean Turbo cache
rm -rf .turbo
rm -rf packages/*/.turbo
rm -rf apps/*/.turbo

# Rebuild
npm run build
```

### Issue: Different build results locally vs CI

**Cause:** Environment differences or cached files

**Solution:**
```bash
# Replicate CI environment
npm ci  # Clean install
npm run clean:all  # Deep clean
npm run build  # Fresh build
npm run type-check
npm run lint
```

---

## Best Practices

### 1. Branch Hygiene

- ✅ Always clean before switching branches
- ✅ Pull latest before creating new branch
- ✅ Keep branches short-lived
- ✅ Regularly sync with main/dev
- ❌ Never commit build artifacts
- ❌ Never force push without team agreement

### 2. Commit Practices

```bash
# Before every commit
npm run verify:no-artifacts

# If artifacts found
npm run clean:all
git add -u
git commit -m "chore: remove build artifacts"
```

### 3. Development Workflow

```bash
# Morning routine
git pull origin <branch>
npm ci  # If lock file changed
npm run clean:all
npm run build
npm run dev

# Before lunch/end of day
git add .
git commit -m "wip: descriptive message"
git push origin <branch>

# Before creating PR
npm run rebuild
npm run type-check
npm run lint
npm run verify:no-artifacts
```

### 4. Package Development

When working on shared packages:

```bash
# Terminal 1: Watch package
cd packages/<package-name>
npm run build -- --watch

# Terminal 2: Watch app that uses it
npm run dev:admin
# or
npm run dev:employee
```

**Note:** Some changes may require full restart even with watch mode.

### 5. Monorepo Commands

```bash
# Run command in all packages
npx turbo run build

# Run in specific package
npx turbo run build --filter=@tupsafe/auth

# Run in specific app
npx turbo run build --filter=admin

# Run with dependencies
npx turbo run dev --filter=admin...
```

---

## IDE Setup

### VS Code

**Recommended Extensions:**
- ESLint
- Prettier
- TypeScript and JavaScript Language Features

**Settings (.vscode/settings.json):**
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true
}
```

**Tasks (.vscode/tasks.json):**
```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Clean All",
      "type": "shell",
      "command": "npm run clean:all",
      "problemMatcher": []
    },
    {
      "label": "Rebuild",
      "type": "shell",
      "command": "npm run rebuild",
      "problemMatcher": []
    }
  ]
}
```

---

## Performance Tips

### 1. Faster Builds

```bash
# Only build what changed (Turbo handles this)
npm run build

# Build specific target
npm run build:admin
npm run build:employee

# Parallel builds (Turbo default)
# No extra configuration needed

# Skip cache (force rebuild)
npx turbo run build --force
```

### 2. Faster Dev Server

```bash
# Only start what you need
npm run dev:admin     # If only working on admin
npm run dev:employee  # If only working on employee

# Both (uses more resources)
npm run dev
```

### 3. Optimize Node.js

```bash
# Increase Node memory (if needed)
export NODE_OPTIONS="--max-old-space-size=4096"

# Add to shell profile (~/.bashrc or ~/.zshrc)
echo 'export NODE_OPTIONS="--max-old-space-size=4096"' >> ~/.bashrc
```

---

## Environment Variables

### Required Variables (.env.local)

Each app needs its own `.env.local`:

```bash
# apps/admin/.env.local
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# apps/employee/.env.local
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

**Never commit `.env.local` files!**

---

## Summary Cheat Sheet

| Scenario | Command |
|----------|---------|
| Fresh clone | `npm ci && npm run build` |
| Switch branch | `npm run clean:all && npm run build` |
| Pull changes | `npm ci && npm run rebuild` |
| Before PR | `npm run rebuild && npm run type-check && npm run lint` |
| Module not found | `npm run clean:all && npm ci && npm run build` |
| Package issues | `cd packages/<pkg> && npm run build && cd ../..` |
| Clean everything | `npm run clean:all` |
| Quick clean | `npm run clean:dist` |
| Type check | `npm run type-check` |
| Lint | `npm run lint` |
| Dev (both) | `npm run dev` |
| Dev (admin) | `npm run dev:admin` |
| Dev (employee) | `npm run dev:employee` |

---

## Getting Help

If you encounter issues not covered here:

1. Check GitHub Actions logs for your branch
2. Review workflow documentation in `.github/WORKFLOWS.md`
3. Check if issue is in CI (works locally) or local (works in CI)
4. Try the "nuclear option" full clean
5. Contact team lead or check project documentation

**Nuclear Option (Last Resort):**
```bash
# Remove everything
rm -rf node_modules packages/*/dist apps/*/.next .turbo

# Fresh start
npm install
npm run build
```

This should be your **last resort** as it takes longest and clears all caches.
