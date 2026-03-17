---
name: code-reviewer
description: >
  Comprehensive code review across all Fuseable platform languages and services.
  Checks security, performance, type safety, API design, financial precision,
  and convention adherence. Accepts file paths, glob patterns, or PR numbers.
user-invocable: true
argument-hint: "[file-path, glob, or PR#]"
---

# Code Reviewer

Review code across the Fuseable platform. Invoked via `/code-reviewer`.

**Usage**:
- `/code-reviewer src/components/ui/button.tsx` — review a specific file
- `/code-reviewer agent-service/agents/` — review a directory
- `/code-reviewer PR#42` or `/code-reviewer 42` — review a GitHub PR
- `/code-reviewer` (no args) — review all staged and unstaged git changes

## Review Process

1. **Identify scope** — Parse `$ARGUMENTS` to determine files to review
2. **Read all changed files** — Use Read tool or `mcp__github__get_pull_request_files` for PRs
3. **Classify by domain** — Route each file to the appropriate domain checklist
4. **Delegate deep reviews** — Launch domain-specific sub-agents in parallel
5. **Aggregate findings** — Combine all sub-agent results
6. **Output structured report** — Present findings in the standard format

## Domain Detection & Sub-Agent Routing

Classify files and delegate via the Task tool. Launch all applicable sub-agents in parallel:

| File Path Pattern | Domain | Sub-Agents |
|-------------------|--------|------------|
| `fuseable-chat-interface/` | Frontend | `frontend-architect`, `senior-frontend-engineer` |
| `api-wm/` | Java Backend | `backend-architect`, `senior-backend-architect` |
| `agent-service/`, `mcp-server/`, `mcp-filegen/` | AI/ML | `ai-ml-engineer`, `ai-architecture-advisor` |
| `infra/`, `.github/`, `docker-compose*`, `Dockerfile*` | DevOps | `devops-engineer`, `devops-cicd-architect` |
| `api-masking/` | Python Backend | `backend-architect` |

## MCP Server Usage

- **serena** — Symbolic code analysis (preferred over reading full files):
  - `mcp__serena__find_symbol` to locate symbols under review
  - `mcp__serena__find_referencing_symbols` to check impact of changes
  - `mcp__serena__get_symbols_overview` for file structure context
- **github** — PR operations:
  - `mcp__github__get_pull_request_files` to get changed files in a PR
  - `mcp__github__get_pull_request` for PR context and description
  - `mcp__github__get_pull_request_comments` for existing review comments
  - `mcp__github__create_pull_request_review` to submit review with inline comments
- **context7** — Verify best practices against current documentation:
  - `mcp__context7__resolve-library-id` then `mcp__context7__query-docs`

## Universal Checks (All Languages)

### Security (OWASP Top 10)
- No SQL injection (parameterized queries, JPA Criteria API, Pydantic models)
- No XSS (proper output encoding, no `dangerouslySetInnerHTML` without sanitization)
- No hardcoded secrets, API keys, or credentials
- No PII exposure in logs or error messages
- No stack traces leaked in API responses
- Input validation on all external-facing endpoints
- Proper authentication and authorization checks

### Cross-Platform
- No platform-specific paths (`C:\`, `/home/user/`)
- Python: `os.path.join()` or `pathlib.Path`
- Java: `${ENV_VAR:default}` in properties
- All configuration from environment variables

### General
- No dead code or unused imports
- Consistent error handling patterns
- Proper logging (not print statements)
- Conventional Commits format for any commit messages
- No Claude co-author lines in commits

## Java-Specific Checks (api-wm)

- [ ] `BigDecimal` for ALL financial values — NEVER `float`/`double`
- [ ] `ResponseWrapper<T>` for ALL API responses
- [ ] Constructor injection via `@RequiredArgsConstructor` — never `@Autowired` on fields
- [ ] Interface naming with `I` prefix (`IAlertService`, `IClientRepository`)
- [ ] No comments in code — self-documenting through clear naming
- [ ] `@JsonInclude(NON_NULL)` on DTOs
- [ ] `@Data @Builder` on DTOs, `@RequiredArgsConstructor` on services
- [ ] Criteria API for dynamic filtering — no string-concatenated SQL
- [ ] `@ControllerAdvice` scoped to specific packages
- [ ] Proper HTTP status codes and error responses

## Python-Specific Checks (agent-service, mcp-server)

- [ ] Import order: stdlib → third-party → local (alphabetical within groups)
- [ ] Logger per module: `logger = logging.getLogger(__name__)`
- [ ] Pydantic models with strict validation for all inputs
- [ ] Type hints on all function signatures and return types
- [ ] No blocking calls in async context (use `asyncio.to_thread()`)
- [ ] Only dependencies already in `requirements.txt` / `pyproject.toml`
- [ ] Cross-platform paths with `os.path.join()` or `pathlib.Path`
- [ ] `@lru_cache` on settings/config factory functions

## Frontend-Specific Checks (fuseable-chat-interface)

- [ ] No hardcoded brand colors, typography, or spacing — all via design tokens
- [ ] Token-driven styling via `useDesignToken` hook
- [ ] No TypeScript `any` types
- [ ] Proper memoization: `React.memo`, `useMemo`, `useCallback` where needed
- [ ] Accessibility: ARIA attributes, keyboard navigation, semantic HTML
- [ ] Radix UI primitives for interactive elements
- [ ] Framer Motion animations respect `prefers-reduced-motion`
- [ ] pnpm only — never npm commands
- [ ] Localization entries in all 17 locale files for new user-facing strings
- [ ] `VITE_` prefix for client-side env vars

## AI/ML-Specific Checks (agent-service, mcp-server)

- [ ] BaseAgent pattern compliance: YAML config + MD prompt + thin subclass
- [ ] Tool count in agent matches YAML `include` list
- [ ] `core_tools` defined for agents with >15 tools
- [ ] `use_concise_descriptions: true` for agents with many tools
- [ ] PII gate configuration present (`pii.enabled` in YAML)
- [ ] RAG config validation (`rag.enabled`, `rag.top_k`)
- [ ] Prompt template uses `{{variable}}` Mustache syntax correctly
- [ ] No hardcoded model names — use YAML config `model.provider`/`model.name`
- [ ] Anti-hallucination guards present in prompts
- [ ] Context builder partials properly included

## Output Format

Present findings as a structured markdown report:

```markdown
## Code Review Report

### Summary
- **Status**: PASS / NEEDS CHANGES
- **Files reviewed**: N
- **Critical**: N | **Warnings**: N | **Suggestions**: N

### Critical Issues
> Issues that must be fixed before merge (security, data loss, correctness)

**[CRITICAL]** `file/path.ts:42` — Description of the issue
```suggestion
// Recommended fix
```

### Warnings
> Issues that should be addressed (performance, conventions, maintainability)

**[WARNING]** `file/path.java:108` — Description
```suggestion
// Recommended fix
```

### Suggestions
> Optional improvements (readability, optimization opportunities)

**[SUGGESTION]** `file/path.py:25` — Description
```

## GitHub PR Integration

When reviewing a PR (`$ARGUMENTS` contains PR number):
1. Fetch changed files: `mcp__github__get_pull_request_files`
2. Fetch PR context: `mcp__github__get_pull_request`
3. Check existing comments: `mcp__github__get_pull_request_comments`
4. Perform review using the checklists above
5. Optionally submit review: `mcp__github__create_pull_request_review` with inline comments
