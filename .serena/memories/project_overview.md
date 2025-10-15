# SmartGov Project Overview

## Purpose
SmartGov is a secure web-based system for Philippine government employees to submit and manage Personal Data Sheets (e-PDS) and Statements of Assets, Liabilities, and Net Worth (e-SALN), replacing traditional paper workflows with a modern, trackable, and auditable digital platform.

## Architecture
- Monorepo structure with Turbo build system
- Apps: employee portal, admin portal
- Packages: shared-ui, database, auth, types
- Frontend: Next.js 15.5.3 with React 19.1.0, TypeScript
- Styling: Tailwind CSS 4 with Shadcn UI and Magic UI components
- Database: PostgreSQL via Supabase with Drizzle ORM
- Authentication: Custom auth package

## Key Features
- e-PDS and e-SALN form submissions
- Review workflows for supervisors/HR
- Archive records older than 5 years automatically
- Integrated AI assistant for compliance questions
- Full audit trails and regulatory compliance