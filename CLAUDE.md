# SmartGov: Streamlined e-PDS and e-SALN Compliance System

## Project Overview

Thesis Project: SmartGov is a secure web-based system designed for Philippine government employees to submit and manage Personal Data Sheets (e-PDS) and Statements of Assets, Liabilities, and Net Worth (e-SALN). The system replaces traditional paper workflows with a modern, trackable, and auditable digital platform.

### Core Objectives

- Automate PDS and SALN submissions with validation
- Implement review workflows for supervisors/HR
- Archive records older than 5 years automatically
- Provide integrated AI assistant for compliance questions
- Ensure full audit trails and regulatory compliance

### Target Users

- **Government Employees**: Submit and update PDS/SALN forms
- **HR Personnel**: Review submissions, manage deadlines
- **Administrators**: System configuration, user management, compliance reporting

## Technical Architecture

### Technology Stack

- **Frontend**: Next.js 15.5.3 with TypeScript, React 19.1.0, Server-Side Rendering
- **Build Tool**: Turbopack for faster development and builds
- **Styling**: Tailwind CSS 4 with shadcn/ui components
- **Database**: PostgreSQL via Supabase with Row Level Security (RLS)
- **ORM**: Drizzle ORM for type-safe SQL operations
- **Forms**: React Hook Form + Zod for schema-driven validation
- **Storage**: Supabase Storage with lifecycle policies
- **AI Integration**: Gemini/OpenAI APIs with RAG over policy documents

### Project Structure

```
src/
├── app/                    # Next.js App Router pages
├── components/
│   ├── ui/                # shadcn/ui components
│   ├── forms/             # PDS/SALN form components
│   └── dashboard/         # Dashboard components
├── lib/
│   ├── db/                # Drizzle schema and migrations
│   ├── validation/        # Zod schemas
│   └── utils/             # Utility functions
└── types/                 # TypeScript type definitions
```

## Database Schema

### Core Tables

- **users**: Authentication and basic user info
- **profiles**: Extended user profiles with government employee data
- **roles**: Role-based access control (Admin, HR, Employee)
- **pds_submissions**: Personal Data Sheet submissions
- **saln_submissions**: SALN submissions
- **submission_versions**: Immutable version history
- **archives**: Long-term storage for 5+ year old records
- **audit_logs**: Complete audit trail of all operations
- **notifications**: System notifications and deadlines
- **settings**: System configuration

### Key Features

- Row Level Security (RLS) for data isolation
- Immutable versioning for compliance
- Automated archival policies
- Full-text search capabilities
- Audit logging on all CRUD operations

## Development Guidelines

### IMPORTANT: Always Use MCP Servers

This project is configured with MCP (Model Context Protocol) servers that must be utilized for all development operations:

#### Available MCP Servers (.mcp.json):

- **shadcn**: Use for UI component management and installation
- **filesystem**: Use for file operations and directory management
- **github**: Use for repository operations and version control
- **memory**: Use for maintaining context across sessions
- **sequential-thinking**: Use for complex problem-solving workflows

#### MCP Usage Rules:

1. **Always use MCP filesystem server** for file operations instead of direct file commands
2. **Use shadcn MCP server** for component installations and UI development
3. **Use github MCP server** for all git operations and repository management
4. **Use memory MCP server** to track project context and decisions
5. **Use sequential-thinking MCP server** for complex architectural decisions

### Scripts and Commands

```bash
npm run dev          # Development server with Turbopack
npm run build        # Production build with Turbopack
npm run start        # Start production server
npm run lint         # ESLint code quality checks
```

### Code Quality

- Always run `npm run lint` before committing
- Use TypeScript strict mode for type safety
- Follow established shadcn/ui component patterns
- Implement comprehensive error handling
- Write type-safe database queries with Drizzle

### Security Requirements

- Implement Multi-Factor Authentication (MFA)
- Use Row Level Security for all database access
- Apply least-privilege role assignments
- Log all operations for audit compliance
- Validate all inputs with Zod schemas
- Protect against CSRF/XSS attacks
- Rate limit API endpoints

## Form Specifications

### PDS (Personal Data Sheet)

Must comply with CSC (Civil Service Commission) PDS format:

- Personal Information (4 pages)
- Educational Background
- Work Experience
- Voluntary Work/Training
- Other Information
- Digital signature readiness

### SALN (Statement of Assets, Liabilities, and Net Worth)

Annual financial disclosure requirements:

- Assets (Real Properties, Personal Properties, Cash/Investments)
- Liabilities
- Net Worth calculation
- Business Interests and Financial Connections
- Relatives in Government Service

### Form Features

- **Dynamic validation**: Real-time field validation with Zod
- **Auto-save**: Periodic saving of draft data
- **Version control**: Track all changes with timestamps
- **Digital signatures**: Cryptographic signing capability
- **PDF export**: Generate official PDF reports

## AI Assistant Integration

### Capabilities

- Answer compliance questions about PDS/SALN requirements
- Provide guidance on form completion
- Explain CSC policies and deadlines
- Help with error resolution
- Citation of relevant policy documents

### Implementation

- RAG (Retrieval Augmented Generation) over policy database
- Scoped responses with redaction of sensitive information
- Integration with Gemini or OpenAI APIs
- Context-aware responses based on user role

## Compliance and Audit

### Regulatory Requirements

- **Immutable Records**: All submissions stored permanently
- **Audit Trails**: Complete logging of who, what, when for all actions
- **Deadline Tracking**: Automated reminders for submission deadlines
- **Access Controls**: Role-based permissions with approval workflows
- **Data Retention**: 5+ year archival with retrieval capabilities

### Accessibility

- WCAG 2.1 AA compliance
- Screen reader compatibility
- Keyboard navigation support
- High contrast mode
- Responsive design for mobile devices

## Performance and Scalability

### Optimization Strategies

- Edge caching for static assets
- API caching for read-heavy endpoints
- Background job queues for PDF generation
- Database indexing for search operations
- Lazy loading for large datasets

### Monitoring

- Error tracking and alerting
- Performance monitoring
- Database query optimization
- User activity analytics
- System health dashboards

## Deployment

### Environment Configuration

- **Development**: Local development with Supabase local instance
- **Staging**: Vercel preview deployments
- **Production**: Vercel with Supabase production database

### Environment Variables

- Database connection strings
- API keys for AI services
- Authentication secrets
- Storage bucket configurations
- Feature flags

## Getting Started

1. **Setup Environment**:

   ```bash
   npm install
   cp .env.example .env
   # Configure environment variables
   ```

2. **Database Setup**:

   ```bash
   npx drizzle-kit generate
   npx drizzle-kit migrate
   ```

3. **Development**:
   ```bash
   npm run dev
   ```

## Important Notes for Claude Code

- **Always prioritize MCP server usage** for all operations
- Check existing components before creating new ones
- Follow the established TypeScript patterns
- Maintain security best practices
- Test all form validations thoroughly
- Ensure accessibility compliance
- Document any new features or changes
- Run linting before any commits

This system handles sensitive government data - security and compliance are paramount in all development decisions.
