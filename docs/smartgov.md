The thesis designs and builds a secure web system for Philippine government employees to submit and manage Personal Data Sheets (e‑PDS) and Statements of Assets, Liabilities, and Net Worth (SALN), replacing paper workflows with a modern, trackable, and auditable platform. It automates submissions, reviews, archiving for records older than five years, and provides an integrated AI assistant to answer process and compliance questions.

Technical summary:

Architecture: Next.js (serverless) with TypeScript for SSR/ISR APIs and UI, organized by admin and employee dashboards with role-based routing.

Data: PostgreSQL (via Supabase) with Row Level Security, schemas for users, profiles, PDS/SALN submissions, versions, archives, audits, notifications, and settings.

ORM: Drizzle ORM for type-safe SQL, migrations, and optimized queries aligned with serverless execution.

Forms: React Hook Form + Zod for schema-driven validation matching CSC PDS and SALN fields, with dynamic sections, autosave, and digital-signature readiness.

Search: Postgres full-text plus optional vector search for semantic queries; filters by year, status, office, and employee.

AI assistant: Gemini/OpenAI via RAG over policies, FAQs, and templates; scoped responses with redaction rules and citation of internal policy docs.

Storage: Supabase Storage for uploads; lifecycle policies to move 5+ year records to archival buckets; checksum and antivirus scanning on upload.

Security: MFA, RLS, least-privilege roles (Admin/HR/Employee), audit logs on all CRUD, CSRF/XSS protections, rate limiting, encryption in transit and at rest, and periodic backup/restore drills.

Performance: Edge caching for static assets, API caching for read-heavy endpoints, background queues for PDF generation and bulk reviews, and websockets/SSE for real-time status and notifications.

Compliance: Automated deadline reminders, review workflows, immutable versioning, exportable compliance reports, and accessibility (WCAG 2.1) adherence.

DevOps: Vercel deploys, environment-managed secrets, CI/CD with linting/tests, observability with logs, tracing, error monitoring, and cost-aware scaling.
