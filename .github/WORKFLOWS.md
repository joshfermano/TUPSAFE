# GitHub Actions Workflows

Comprehensive CI/CD pipeline for the TUPSAFE Next.js 15 monorepo. These workflows ensure clean builds, prevent stale artifacts, and maintain code quality.

## Overview

All workflows are designed to work with Turbo monorepo structure and completely replace git hooks for a more reliable CI/CD experience.

## Workflows

### 1. `pr-validation.yml` - Pull Request Validation

**Purpose:** Validates all pull requests before merging

**Triggers:**

- Pull request opened, synchronized, or reopened
- Target branches: `main`, `dev`, `feature/**`

**Features:**

- Detects build artifacts in PR (fails if found)
- Clean build from scratch using `npm run clean:all`
- Verifies critical files (especially `packages/auth/dist/middleware.js`)
- Type checks entire codebase
- Lints all code
- Calculates build metrics
- Comments on PR with results
- Updates comment on subsequent runs
- Upload debug artifacts on failure

**Concurrency:** Cancels previous runs for same PR

**Caching Strategy:**

- NPM dependencies: Based on `package-lock.json` hash
- Turbo: Per-branch, per-commit with fallback to branch cache

**Key Checks:**

- No `packages/*/dist/` in git
- No `apps/*/.next/` in git
- No `.tsbuildinfo` files in git
- No `.turbo/` cache in git
- No `node_modules/` in git

**Build Metrics Reported:**

- Package sizes (auth, database, types, shared-ui, mock-data)
- App file counts (admin, employee)
- Build status for each check

**Usage:**

```bash
# Triggered automatically on PR creation/update
# Manual re-run available from Actions tab
```

---

### 2. `ci.yml` - Continuous Integration

**Purpose:** Main CI pipeline for all branches

**Triggers:**

- Push to `main`, `dev`, `feature/**`
- Pull requests to `main`, `dev`

**Features:**

- **Matrix Build Strategy**: Tests admin and employee apps independently
- **Full Monorepo Build**: Verifies entire codebase builds together
- **Parallel Execution**: Matrix jobs run concurrently
- **Status Check Job**: Aggregates results and fails if any job fails

**Jobs:**

#### 2.1. `build-and-test` (Matrix)

Runs separately for `admin` and `employee` apps:

- Clean build from scratch
- Build packages first, then specific app
- Verify critical files exist
- Calculate app-specific build sizes
- Type check app
- Lint app
- Upload failure artifacts

**Matrix Configuration:**

```yaml
matrix:
  target:
    - name: admin
      path: apps/admin
    - name: employee
      path: apps/employee
```

#### 2.2. `full-build`

Complete monorepo build:

- Build all packages and apps with Turbo
- Track total build time
- Verify all outputs
- Calculate comprehensive build sizes
- Type check entire monorepo
- Lint entire monorepo

#### 2.3. `status-check`

Final check that depends on both jobs:

- Fails if either job fails
- Generates final summary
- Marks as success only if all pass

**Build Metrics:**

- Individual package sizes
- Admin/Employee app sizes
- Total build time
- File counts

**Caching Strategy:**

- NPM: Shared across jobs
- Turbo: Separate cache per job type

---

### 3. `cache-cleanup.yml` - Cache Management

**Purpose:** Automatically clean up old and orphaned caches

**Triggers:**

- Schedule: Daily at 2 AM UTC
- Manual: `workflow_dispatch` from Actions tab

**Manual Parameters:**

- `older_than_days`: Delete caches older than X days (default: 7)
- `dry_run`: Preview deletions without executing (default: false)

**Features:**

- **Time-based Cleanup**: Removes caches older than specified days
- **Branch Cleanup**: Removes caches for deleted/merged branches
- **Statistics**: Reports total cache count and size
- **Dry Run Mode**: Preview changes before executing
- **Safe Deletion**: Uses GitHub API with proper error handling

**Cleanup Process:**

1. Get all caches via GitHub API
2. Calculate statistics (count, size)
3. Delete caches older than cutoff date
4. Compare cache branches with actual branches
5. Delete caches for non-existent branches
6. Generate summary report

**Manual Execution:**

```bash
# From GitHub UI:
# Actions -> Cache Cleanup -> Run workflow
# Set parameters:
#   - older_than_days: 7
#   - dry_run: true (to preview)
```

**Permissions Required:**

- `actions: write` - Delete caches
- `contents: read` - Access repository

---

### 4. `branch-cleanup.yml` - Branch Lifecycle Management

**Purpose:** Clean up resources when PRs close

**Triggers:**

- Pull request closed (merged or not merged)

**Features:**

- Deletes branch-specific caches immediately
- Adds helpful comment to PR with next steps
- Different messages for merged vs closed PRs
- Local cleanup instructions

**For Merged PRs:**

- Success message
- Cleanup confirmation
- Next steps based on target branch:
  - `main`: Production deployment guidance
  - `dev`: Staging testing reminder
  - Other: General workflow continuation
- Local cleanup commands

**For Closed (Not Merged) PRs:**

- Closure notification
- Cleanup confirmation
- Option to reopen
- Local/remote branch deletion commands

**Comment Example:**

````markdown
## ✅ PR Merged Successfully

### 🎉 Branch `feature/my-feature` has been merged into `main`

#### 🧹 Cleanup Actions:

- ✅ Branch caches have been cleaned up
- ✅ GitHub Actions artifacts will expire per retention policy

#### 🔄 Next Steps:

- 🚀 Changes are now in production
- 📊 Monitor deployment status
- 🔍 Check production logs for any issues

#### 💡 Local Cleanup Reminder:

```bash
git checkout main
git pull origin main
git branch -d feature/my-feature
npm run clean:all
npm run build
```
````

````

**Permissions Required:**
- `actions: write` - Delete caches
- `contents: read` - Access repository
- `pull-requests: write` - Add comments

---

## Caching Strategy

### NPM Dependencies
- **Key:** `${{ runner.os }}-node-22-${{ hashFiles('**/package-lock.json') }}`
- **Restore Keys:** `${{ runner.os }}-node-22-`
- **Scope:** Shared across all workflows
- **Invalidation:** When package-lock.json changes

### Turbo Cache
Multiple cache strategies based on workflow:

1. **PR Validation:**
   - Key: `turbo-pr-{branch}-{sha}`
   - Restore: `turbo-pr-{branch}-`, `turbo-pr-`

2. **CI Matrix Build:**
   - Key: `turbo-{branch}-{app}-{sha}`
   - Restore: `turbo-{branch}-{app}-`, `turbo-{branch}-`, `turbo-`

3. **CI Full Build:**
   - Key: `turbo-full-{branch}-{sha}`
   - Restore: `turbo-full-{branch}-`, `turbo-full-`

### Cache Lifecycle
- **Creation:** On successful build
- **Usage:** Automatic on cache hit
- **Cleanup:** Automatic (old caches via `cache-cleanup.yml`)
- **Invalidation:** On cache miss (new commit/branch)

---

## Best Practices

### For Developers

1. **Before Creating PR:**
   ```bash
   npm run clean:all
   npm run build
   npm run type-check
   npm run lint
````

2. **Switching Branches:**

   ```bash
   git checkout <branch>
   npm run clean:all
   npm run build
   ```

3. **After Pulling Changes:**

   ```bash
   git pull
   npm ci  # Clean install
   npm run rebuild  # Clean build
   ```

4. **Keep PRs Clean:**
   - Never commit build artifacts
   - Add to `.gitignore` if missing
   - Use `npm run verify:no-artifacts` locally

### For Maintainers

1. **Monitor Cache Usage:**

   - Check Actions -> Caches tab
   - Review cache cleanup logs weekly
   - Adjust retention if needed

2. **Review Failed Builds:**

   - Download uploaded artifacts
   - Check `.turbo/runs/*.json` for details
   - Review build manifests

3. **Update Workflows:**
   - Test changes in feature branch first
   - Monitor first run carefully
   - Update documentation

---

## Troubleshooting

### "Module not found" Errors

**Cause:** Stale build artifacts from previous branch

**Solution:**

```bash
npm run clean:all
npm ci
npm run build
```

### Build Artifacts in PR

**Cause:** Accidentally committed dist/build files

**Solution:**

```bash
npm run clean:all
git add -u
git commit -m 'chore: remove build artifacts'
git push
```

### Cache Miss on Every Build

**Possible Causes:**

- `package-lock.json` changing frequently
- Turbo cache key collision
- Cache size limit exceeded

**Solutions:**

1. Lock dependencies properly
2. Review cache key strategy
3. Run manual cache cleanup
4. Check cache size limits

### PR Comment Not Updating

**Cause:** Bot detection logic or permissions issue

**Solution:**

1. Check workflow permissions
2. Verify `github-script` action version
3. Review comment body format

### Workflow Not Triggering

**Possible Causes:**

- Branch name doesn't match pattern
- Workflow file syntax error
- GitHub Actions disabled

**Solutions:**

1. Verify branch name matches pattern
2. Validate YAML syntax
3. Check repository settings

---

## Monitoring and Metrics

### Key Metrics to Track

1. **Build Times:**

   - Package builds: Should be < 2 min
   - App builds: Should be < 5 min
   - Full build: Should be < 10 min

2. **Build Sizes:**

   - Package dist: Monitor growth
   - App bundles: Keep under 200KB initial
   - Static files: Optimize large assets

3. **Cache Performance:**

   - Cache hit rate: Should be > 80%
   - Cache size: Monitor growth
   - Cache age: Regular cleanup

4. **Failure Rate:**
   - PR validation: Should be < 5%
   - CI builds: Should be < 2%
   - Cache cleanup: Should be 100%

### Where to Find Metrics

- **Actions Tab:** Individual run times and status
- **Job Summaries:** Build metrics and statistics
- **PR Comments:** Per-PR build information
- **Cache Tab:** Current cache usage

---

## Workflow Comparison

| Feature       | PR Validation | CI          | Cache Cleanup | Branch Cleanup   |
| ------------- | ------------- | ----------- | ------------- | ---------------- |
| **Trigger**   | PR events     | Push/PR     | Schedule      | PR close         |
| **Scope**     | PR changes    | Full repo   | Cache mgmt    | Branch resources |
| **Duration**  | 15-20 min     | 20-30 min   | 5-10 min      | 1-2 min          |
| **Artifacts** | On failure    | On failure  | None          | None             |
| **Comments**  | Always        | Never       | Never         | Always           |
| **Caching**   | PR-specific   | Multi-level | N/A           | Deletes caches   |
| **Matrix**    | No            | Yes         | No            | No               |

---

## Migration from Git Hooks

The workflows replace the following git hooks:

### Pre-commit Hook

**Replaced by:** PR Validation workflow

- Artifact detection
- Build verification
- Type checking
- Linting

### Pre-push Hook

**Replaced by:** CI workflow

- Full build verification
- All checks must pass

### Post-merge Hook

**Replaced by:** Branch Cleanup workflow

- Cache cleanup
- Resource management

### Benefits of GitHub Actions over Git Hooks:

1. **Consistency:** Same environment for all developers
2. **Visibility:** All runs tracked in GitHub UI
3. **Reporting:** Detailed summaries and comments
4. **Enforcement:** Cannot be bypassed
5. **Debugging:** Artifacts and logs preserved
6. **Maintenance:** Central management, no local setup

---

## Advanced Configuration

### Adjusting Cache Retention

Edit cache keys to change retention strategy:

```yaml
# Short retention (PR-specific)
key: ${{ runner.os }}-turbo-pr-${{ github.ref_name }}-${{ github.sha }}

# Medium retention (branch-specific)
key: ${{ runner.os }}-turbo-${{ github.ref_name }}-${{ github.sha }}

# Long retention (shared)
key: ${{ runner.os }}-turbo-${{ github.sha }}
```

### Adding Build Steps

To add steps (e.g., tests):

```yaml
- name: Run tests
  run: npm run test

- name: Upload test results
  uses: actions/upload-artifact@v4
  with:
    name: test-results
    path: coverage/
```

### Custom Notifications

Add Slack/Discord notifications:

```yaml
- name: Notify on failure
  if: failure()
  uses: slackapi/slack-github-action@v1
  with:
    payload: |
      {
        "text": "Build failed: ${{ github.workflow }}"
      }
```

---

## Security Considerations

1. **Secrets:** Never log sensitive data
2. **Permissions:** Use minimal required permissions
3. **Dependencies:** Regular security audits
4. **Artifacts:** 7-day retention max
5. **Cache:** No sensitive data in cache

---

## Future Enhancements

Planned improvements:

1. **Remote Caching:** Turbo remote cache (Vercel)
2. **Test Coverage:** Add test jobs with coverage reports
3. **E2E Tests:** Add Playwright/Cypress tests
4. **Performance Budgets:** Bundle size limits
5. **Accessibility Tests:** Automated a11y checks
6. **Deployment:** Auto-deploy on merge to main/dev
7. **Release Management:** Automated versioning
8. **Dependency Updates:** Renovate/Dependabot integration

---

## Support

For issues with workflows:

1. Check this documentation
2. Review workflow run logs
3. Check GitHub Actions status page
4. Review recent commits to workflow files
5. Contact DevOps team

**Useful Commands:**

```bash
# Validate workflow syntax locally
npx action-validator .github/workflows/*.yml

# Test workflow changes in feature branch
git checkout -b test-workflow-changes
# Edit workflows
git push origin test-workflow-changes
# Create PR to see results
```

---

## Summary

The TUPSAFE CI/CD pipeline ensures:

- Clean builds from scratch every time
- No stale artifacts between branches
- Comprehensive validation before merge
- Automatic cache management
- Clear feedback via PR comments
- Detailed metrics and summaries
- Reliable, reproducible builds

All workflows work together to maintain code quality and prevent the "Module not found" errors caused by stale build artifacts when switching branches.
