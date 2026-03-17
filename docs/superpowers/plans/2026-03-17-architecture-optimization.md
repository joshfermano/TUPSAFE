# TUPSAFE Architecture Optimization Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix 10 identified architecture bottlenecks across infrastructure, backend, and frontend to make TUPSAFE production-ready for university-scale usage.

**Architecture:** Three parallel waves — Wave 1 (config changes), Wave 2 (backend optimizations), Wave 3 (frontend improvements). Each wave contains independent tasks that can be executed by parallel sub-agents.

**Tech Stack:** Next.js 15, Drizzle ORM, Supabase, Docker, Nginx, GitHub Actions, TypeScript, React

---

## Wave 1: Infrastructure Config Changes (All Independent)

### Task 1: Nginx Rate Limits

**Files:**
- Modify: `nginx/nginx.conf:48-51` (zone definitions)
- Modify: `nginx/nginx.conf:116-136` (employee portal application)
- Modify: `nginx/nginx.conf:180-203` (admin portal application)

- [ ] **Step 1: Update rate limit zone definitions (lines 48-51)**

Change from:
```nginx
limit_req_zone $binary_remote_addr zone=general:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=api:10m rate=5r/s;
limit_req_zone $binary_remote_addr zone=auth:10m rate=1r/s;
```
To:
```nginx
limit_req_zone $binary_remote_addr zone=general:10m rate=25r/s;
limit_req_zone $binary_remote_addr zone=api:10m rate=15r/s;
limit_req_zone $binary_remote_addr zone=auth:10m rate=5r/s;
```

- [ ] **Step 2: Update burst allowances in employee server block**

Update all `limit_req` directives in the employee server block to use `nodelay`:
- `/api/auth/`: `burst=15 nodelay` (was `burst=5`)
- `/api/`: `burst=30 nodelay` (was `burst=10`)
- `/`: `burst=50 nodelay` (was `burst=20`)

- [ ] **Step 3: Update burst allowances in admin server block**

Same pattern for admin block:
- `/api/`: `burst=30 nodelay` (was `burst=10`)
- `/`: `burst=50 nodelay` (was `burst=20`)

- [ ] **Step 4: Verify Nginx config syntax**

Run: `docker compose exec nginx nginx -t` (or validate locally)

---

### Task 2: Docker Resource Rebalancing + Logging

**Files:**
- Modify: `docker-compose.prod.yml` (memory limits, CPU, logging)

- [ ] **Step 1: Rebalance memory limits to fit 1GB**

| Service   | Old Limit | New Limit | Old Reserve | New Reserve |
|-----------|-----------|-----------|-------------|-------------|
| nginx     | 64M       | 48M       | 32M         | 24M         |
| redis     | 96M       | 64M       | 64M         | 32M         |
| employee  | 256M      | 220M      | 180M        | 128M        |
| admin     | 256M      | 220M      | 180M        | 128M        |
| ai-agent  | 350M      | 280M      | 200M        | 150M        |
| **Total** | **1022M** | **832M**  | **656M**    | **462M**    |

- [ ] **Step 2: Adjust NODE_OPTIONS for reduced memory**

Employee/Admin: `--max-old-space-size=180` → `--max-old-space-size=160`

- [ ] **Step 3: Increase log retention**

Change logging config from:
```yaml
max-size: '10m'
max-file: '3'
```
To:
```yaml
max-size: '50m'
max-file: '5'
```

- [ ] **Step 4: Rebalance CPU limits**

| Service   | Old CPU | New CPU |
|-----------|---------|---------|
| nginx     | 0.25    | 0.15    |
| redis     | 0.25    | 0.15    |
| employee  | 0.5     | 0.30    |
| admin     | 0.5     | 0.30    |
| ai-agent  | 0.5     | 0.30    |
| **Total** | **2.0** | **1.2** |

---

### Task 3: CI/CD Health Check Improvements

**Files:**
- Modify: `.github/workflows/deploy.yml:110-131`

- [ ] **Step 1: Replace sleep 30 with retry loop**

Replace the deployment verification section (lines 110-131) with:
```bash
echo "Waiting for services to become healthy..."
MAX_RETRIES=12
RETRY_INTERVAL=10
for i in $(seq 1 $MAX_RETRIES); do
  echo "Health check attempt $i/$MAX_RETRIES..."
  ALL_HEALTHY=true
  for svc in tupsafe-employee tupsafe-admin tupsafe-nginx; do
    STATUS=$(docker inspect --format='{{.State.Health.Status}}' "$svc" 2>/dev/null || echo "starting")
    echo "  $svc: $STATUS"
    if [ "$STATUS" != "healthy" ]; then
      ALL_HEALTHY=false
    fi
  done
  if [ "$ALL_HEALTHY" = true ]; then
    echo "All services healthy!"
    break
  fi
  if [ "$i" = "$MAX_RETRIES" ]; then
    echo "ERROR: Services did not become healthy within $((MAX_RETRIES * RETRY_INTERVAL))s"
    docker compose -f docker-compose.prod.yml logs --tail=50
    exit 1
  fi
  sleep $RETRY_INTERVAL
done
```

- [ ] **Step 2: Add endpoint verification with retries**

After container health check, add endpoint verification:
```bash
echo "Verifying endpoint responses..."
for endpoint in "https://tupsafe.tech/api/health" "http://localhost:9443/api/health"; do
  for attempt in 1 2 3; do
    if curl -sf --max-time 10 "$endpoint" > /dev/null 2>&1; then
      echo "  OK: $endpoint"
      break
    fi
    if [ "$attempt" = "3" ]; then
      echo "  WARN: $endpoint not responding after 3 attempts"
    fi
    sleep 5
  done
done
```

---

## Wave 2: Backend Optimizations (All Independent)

### Task 4: Fix SALN N+1 Queries

**Files:**
- Modify: `packages/database/src/queries/saln.ts:188-280` (getSALNSubmissions)

- [ ] **Step 1: Read current getSALNSubmissions implementation**

Read lines 188-280 of `packages/database/src/queries/saln.ts` to understand full function signature, parameters, and return type.

- [ ] **Step 2: Rewrite using Drizzle relational query**

Replace the N+1 pattern (fetch submissions → loop to fetch children) with:
```typescript
const submissions = await db.query.salnSubmissions.findMany({
  where: and(
    eq(salnSubmissions.userId, userId),
    // preserve existing filters
  ),
  with: {
    realProperties: true,
    personalProperties: true,
    liabilities: true,
    businessInterests: true,
    relativesInGov: true,
  },
  orderBy: [desc(salnSubmissions.year)],
  limit,
  offset,
});
```

- [ ] **Step 3: Ensure return type matches existing CompleteSaln interface**

Map the relational query result to match the existing CompleteSaln type so all consumers remain compatible.

- [ ] **Step 4: Verify build passes**

Run: `pnpm build:employee`

---

### Task 5: Fix PDS Query Optimization

**Files:**
- Modify: `packages/database/src/queries/pds.ts:228-344` (getPDSSubmissionById)

- [ ] **Step 1: Read current getPDSSubmissionById implementation**

Read lines 228-344 to understand full function, return type, and ordering on child tables.

- [ ] **Step 2: Rewrite using Drizzle relational query**

Replace 9 parallel Promise.all queries with:
```typescript
const submission = await db.query.pdsSubmissions.findFirst({
  where: eq(pdsSubmissions.id, id),
  with: {
    personalInfo: true,
    familyBackground: true,
    children: { orderBy: [asc(pdsChildren.dateOfBirth)] },
    education: { orderBy: [asc(pdsEducation.level)] },
    civilService: { orderBy: [desc(pdsCivilService.dateOfExam)] },
    workExperience: { orderBy: [desc(pdsWorkExperience.dateFrom)] },
    voluntaryWork: { orderBy: [desc(pdsVoluntaryWork.dateFrom)] },
    training: { orderBy: [desc(pdsTraining.dateFrom)] },
    otherInfo: true,
  },
});
```

- [ ] **Step 3: Map result to match existing return type**

Ensure the relational query result maps correctly to the existing return structure (personalInfo as single object, not array, etc.)

- [ ] **Step 4: Verify build passes**

Run: `pnpm build:employee`

---

### Task 6: Cache Profile in Middleware

**Files:**
- Modify: `packages/auth/src/middleware.ts:98-110`

- [ ] **Step 1: Read full middleware file**

Read `packages/auth/src/middleware.ts` to understand the complete flow and where profile caching can be inserted.

- [ ] **Step 2: Add profile cache via cookie**

After profile fetch, store role/is_active in a short-lived cookie. On subsequent requests, read from cookie first:
```typescript
// Check for cached profile data
const cachedProfile = request.cookies.get('x-profile-cache')?.value;
if (cachedProfile) {
  try {
    const parsed = JSON.parse(cachedProfile);
    // Verify cache is for current user
    if (parsed.id === user.id && parsed.exp > Date.now()) {
      // Use cached profile data
      const profile = { role: parsed.role, is_active: parsed.is_active };
      // Skip DB fetch, continue with profile
    }
  } catch { /* fall through to DB fetch */ }
}

// Existing DB fetch as fallback
const { data: profile } = await supabase
  .from('profiles')
  .select('role, is_active')
  .eq('id', user.id)
  .single();

// Cache in cookie (5 min TTL)
const response = NextResponse.next();
response.cookies.set('x-profile-cache', JSON.stringify({
  id: user.id,
  role: profile.role,
  is_active: profile.is_active,
  exp: Date.now() + 5 * 60 * 1000,
}), { httpOnly: true, secure: true, sameSite: 'lax', maxAge: 300 });
```

- [ ] **Step 3: Add cache invalidation on role change**

Ensure the profile cache cookie is deleted when user role changes (on logout or profile update API routes).

- [ ] **Step 4: Verify build passes**

Run: `pnpm build:employee && pnpm build:admin`

---

### Task 7: Standardize API Response Format

**Files:**
- Create: `packages/types/src/api-helpers.ts`
- Modify: `packages/types/src/index.ts` (re-export helpers)
- Modify: All API routes in `apps/employee/src/app/api/` and `apps/admin/src/app/api/`

- [ ] **Step 1: Create API response helper functions**

Create `packages/types/src/api-helpers.ts`:
```typescript
import { NextResponse } from 'next/server';

interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface ApiErrorResponse {
  success: false;
  error: string;
  code?: string;
}

export function apiSuccess<T>(data: T, status = 200): NextResponse<ApiSuccessResponse<T>> {
  return NextResponse.json({ success: true, data }, { status });
}

export function apiPaginated<T>(data: T[], pagination: { page: number; limit: number; total: number }): NextResponse {
  return NextResponse.json({
    success: true,
    data,
    pagination: { ...pagination, totalPages: Math.ceil(pagination.total / pagination.limit) },
  });
}

export function apiError(error: string, status = 400, code?: string): NextResponse<ApiErrorResponse> {
  return NextResponse.json({ success: false, error, ...(code && { code }) }, { status });
}
```

- [ ] **Step 2: Export from packages/types/src/index.ts**

Add: `export { apiSuccess, apiPaginated, apiError } from './api-helpers';`

- [ ] **Step 3: Migrate employee app API routes**

Update all routes in `apps/employee/src/app/api/` to use `apiSuccess()`, `apiError()`, `apiPaginated()`.

- [ ] **Step 4: Migrate admin app API routes**

Update all routes in `apps/admin/src/app/api/` to use the same helpers.

- [ ] **Step 5: Verify builds pass**

Run: `pnpm build:employee && pnpm build:admin`

---

## Wave 3: Frontend Improvements (All Independent)

### Task 8: Code Splitting and Lazy Loading

**Files:**
- Modify: `packages/shared-ui/package.json` (add PDF export entry)
- Modify: `packages/shared-ui/src/index.ts` (separate PDF exports)
- Modify: Heavy page files in both apps to add dynamic imports

- [ ] **Step 1: Create separate PDF export entry in shared-ui**

Add to `packages/shared-ui/package.json` exports:
```json
"./pdf": {
  "types": "./src/pdf-exports.ts",
  "default": "./src/pdf-exports.ts"
}
```

Create `packages/shared-ui/src/pdf-exports.ts` with all PDF-related exports moved from index.ts.

- [ ] **Step 2: Update shared-ui/src/index.ts**

Remove PDF exports from main index.ts, add comment directing to `@tupsafe/shared-ui/pdf`.

- [ ] **Step 3: Update PDF imports across apps**

Change all `import { SALNDocument, PDSDocument, ... } from '@tupsafe/shared-ui'` to `from '@tupsafe/shared-ui/pdf'`.

- [ ] **Step 4: Add dynamic imports to heavy employee pages**

Add `next/dynamic` with `{ ssr: false }` for:
- Dashboard PDS/SALN form sections
- PDF preview/generation components

- [ ] **Step 5: Add dynamic imports to heavy admin pages**

Similar pattern for admin dashboard components.

- [ ] **Step 6: Verify builds pass**

Run: `pnpm build:employee && pnpm build:admin`

---

### Task 9: Re-enable ESLint and Fix Errors

**Files:**
- Modify: `apps/employee/next.config.ts:5-8`
- Modify: `apps/admin/next.config.ts:4-8`
- Fix: All files with ESLint errors in both apps

- [ ] **Step 1: Audit current ESLint errors**

Run: `pnpm lint` to get full error list and categorize by type.

- [ ] **Step 2: Fix `any` type errors**

Replace `any` with proper types or `unknown` with type narrowing across both apps.

- [ ] **Step 3: Fix unused variable errors**

Remove unused imports and variables, or prefix with `_` if intentionally unused.

- [ ] **Step 4: Fix remaining lint errors**

Address any other categories (missing deps, react-hooks rules, etc.)

- [ ] **Step 5: Re-enable ESLint in builds**

Change `ignoreDuringBuilds: true` to `ignoreDuringBuilds: false` in both next.config.ts files.

- [ ] **Step 6: Verify clean build**

Run: `pnpm build:employee && pnpm build:admin && pnpm lint`
