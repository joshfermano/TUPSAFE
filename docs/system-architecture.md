# TUPSAFE System Architecture

## Technological University of the Philippines System for Automated Filing and e-Compliance

---

## 1. High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                    PRESENTATION LAYER                                    │
├─────────────────────────────────────┬───────────────────────────────────────────────────┤
│         EMPLOYEE PORTAL             │              ADMIN PORTAL                          │
│        (Next.js - Port 3000)        │           (Next.js - Port 3001)                   │
│                                     │                                                    │
│  ┌─────────────────────────────┐    │    ┌─────────────────────────────┐                │
│  │     Magic UI + Tailwind     │    │    │   shadcn/ui + Tailwind      │                │
│  │     Radix Icons Only        │    │    │   Radix Primitives          │                │
│  └─────────────────────────────┘    │    └─────────────────────────────┘                │
│                                     │                                                    │
│  Users:                             │    Users:                                          │
│  • Job Applicants                   │    • HR Personnel                                  │
│  • Faculty Members                  │    • Department Heads                              │
│  • Administrative Staff             │    • College Deans                                 │
│                                     │    • System Administrators                         │
└─────────────────────────────────────┴───────────────────────────────────────────────────┘
                                            │
                                            ▼
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                   APPLICATION LAYER                                      │
│                              (Shared Packages - Monorepo)                               │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                          │
│   ┌───────────────────┐  ┌───────────────────┐  ┌───────────────────┐                   │
│   │  @tupsafe/auth    │  │ @tupsafe/database │  │  @tupsafe/types   │                   │
│   │                   │  │                   │  │                   │                   │
│   │ • Supabase Auth   │  │ • Drizzle ORM     │  │ • TypeScript      │                   │
│   │ • Session Mgmt    │  │ • Schema Defs     │  │   Definitions     │                   │
│   │ • MFA (OTP)       │  │ • Query Builders  │  │ • Zod Schemas     │                   │
│   │ • Middleware      │  │ • Real-time Hooks │  │ • API Types       │                   │
│   └───────────────────┘  └───────────────────┘  └───────────────────┘                   │
│                                                                                          │
│   ┌───────────────────┐  ┌───────────────────┐                                          │
│   │ @tupsafe/shared-ui│  │ @tupsafe/mock-data│                                          │
│   │                   │  │                   │                                          │
│   │ • Form Components │  │ • Test Data       │                                          │
│   │ • cn() Utility    │  │ • Development     │                                          │
│   │ • Common Hooks    │  │   Fixtures        │                                          │
│   └───────────────────┘  └───────────────────┘                                          │
│                                                                                          │
└─────────────────────────────────────────────────────────────────────────────────────────┘
                                            │
                                            ▼
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                    DATA LAYER                                            │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                          │
│   ┌─────────────────────────────────────────────────────────────────────────────────┐   │
│   │                           SUPABASE PLATFORM                                      │   │
│   │                                                                                  │   │
│   │  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐               │   │
│   │  │   PostgreSQL     │  │  Supabase Auth   │  │ Supabase Storage │               │   │
│   │  │   Database       │  │                  │  │                  │               │   │
│   │  │                  │  │  • JWT Tokens    │  │  • PDF Files     │               │   │
│   │  │  • Row Level     │  │  • OAuth         │  │  • Resumes       │               │   │
│   │  │    Security      │  │  • MFA Support   │  │  • Documents     │               │   │
│   │  │  • Indexes       │  │                  │  │  • Secure        │               │   │
│   │  │  • Relations     │  │                  │  │    Buckets       │               │   │
│   │  └──────────────────┘  └──────────────────┘  └──────────────────┘               │   │
│   │                                                                                  │   │
│   │  ┌──────────────────────────────────────────────────────────────┐               │   │
│   │  │                    SUPABASE REALTIME                         │               │   │
│   │  │                                                              │               │   │
│   │  │  • WebSocket Connections      • Live Notifications           │               │   │
│   │  │  • Database Change Events     • Status Updates               │               │   │
│   │  │  • Presence Channels          • Profile Sync                 │               │   │
│   │  └──────────────────────────────────────────────────────────────┘               │   │
│   └─────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                          │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Monorepo Package Architecture

```
TUPSAFE/
│
├── apps/                                    # Application Packages
│   │
│   ├── employee/                            # Employee Portal (Port 3000)
│   │   ├── src/
│   │   │   ├── app/                         # Next.js App Router
│   │   │   │   ├── (auth)/                  # Authentication Routes
│   │   │   │   ├── (dashboard)/             # Protected Dashboard
│   │   │   │   └── api/                     # API Routes
│   │   │   ├── components/                  # App-Specific Components
│   │   │   │   ├── ui/                      # Magic UI Components
│   │   │   │   ├── forms/                   # PDS/SALN Forms
│   │   │   │   └── layout/                  # Layout Components
│   │   │   ├── hooks/                       # Custom React Hooks
│   │   │   ├── providers/                   # Context Providers
│   │   │   └── lib/                         # Utilities
│   │   └── middleware.ts                    # Auth Middleware
│   │
│   └── admin/                               # Admin Portal (Port 3001)
│       ├── src/
│       │   ├── app/                         # Next.js App Router
│       │   │   ├── (auth)/                  # Authentication Routes
│       │   │   ├── (dashboard)/             # Admin Dashboard
│       │   │   └── api/                     # API Routes
│       │   ├── components/                  # App-Specific Components
│       │   │   ├── ui/                      # shadcn/ui Components
│       │   │   └── layout/                  # Layout Components
│       │   ├── hooks/                       # Custom React Hooks
│       │   └── providers/                   # Context Providers
│       └── middleware.ts                    # Auth Middleware
│
├── packages/                                # Shared Packages
│   │
│   ├── database/                            # @tupsafe/database
│   │   └── src/
│   │       ├── schema.ts                    # Drizzle Schema Definitions
│   │       ├── client.ts                    # Database Client
│   │       ├── hooks/                       # Real-time Hooks
│   │       │   ├── useRealtimeNotifications.ts
│   │       │   ├── useRealtimeProfile.ts
│   │       │   └── useRealtimeSubmissionStatus.ts
│   │       └── queries/                     # Query Builders
│   │           ├── pds.ts
│   │           ├── saln.ts
│   │           └── departments.ts
│   │
│   ├── auth/                                # @tupsafe/auth
│   │   └── src/
│   │       ├── middleware.ts                # Auth Middleware
│   │       ├── context.tsx                  # Auth Context Provider
│   │       ├── utils/
│   │       │   └── supabase/                # Supabase Client Utils
│   │       └── components/                  # Auth Components
│   │
│   ├── types/                               # @tupsafe/types
│   │   └── src/
│   │       ├── index.ts                     # Type Exports
│   │       └── schemas/                     # Zod Validation Schemas
│   │
│   └── shared-ui/                           # @tupsafe/shared-ui
│       └── src/
│           ├── ui/                          # Design-Agnostic Components
│           └── lib/                         # Shared Utilities (cn())
│
└── turbo.json                               # Turbo Build Configuration
```

---

## 3. Database Entity-Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                              DATABASE SCHEMA (PostgreSQL)                                │
└─────────────────────────────────────────────────────────────────────────────────────────┘

                                    ┌─────────────────┐
                                    │   DEPARTMENTS   │
                                    ├─────────────────┤
                                    │ id (PK)         │
                                    │ name            │
                                    │ code            │
                                    │ office_type     │◄────────────────┐
                                    │ parent_id (FK)  │─────────────────┤ (Self-Reference)
                                    │ parent_college  │─────────────────┘
                                    └────────┬────────┘
                                             │
                              ┌──────────────┼──────────────┐
                              │              │              │
                              ▼              │              ▼
                    ┌─────────────────┐      │    ┌─────────────────┐
                    │   POSITIONS     │      │    │ OPEN_POSITIONS  │
                    ├─────────────────┤      │    ├─────────────────┤
                    │ id (PK)         │      │    │ id (PK)         │
                    │ title           │      │    │ position_title  │
                    │ grade_level     │      │    │ department_id   │
                    │ department_id   │      │    │ status          │
                    └────────┬────────┘      │    │ deadline        │
                             │              │    │ posted_by       │
                             │              │    └────────┬────────┘
                             │              │             │
                             ▼              ▼             │
                    ┌─────────────────────────────┐      │
                    │          PROFILES           │◄─────┘
                    ├─────────────────────────────┤
                    │ id (PK) → auth.users.id     │
                    │ user_type (employee/applic) │
                    │ employee_id                 │
                    │ applicant_id                │
                    │ role (employee/hr/admin)    │
                    │ department_id (FK)          │
                    │ position_id (FK)            │
                    │ account_status              │
                    │ employment_category         │
                    └─────────────┬───────────────┘
                                  │
          ┌───────────────────────┼───────────────────────┐
          │                       │                       │
          ▼                       ▼                       ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│ PDS_SUBMISSIONS │     │SALN_SUBMISSIONS │     │ JOB_APPLICATIONS│
├─────────────────┤     ├─────────────────┤     ├─────────────────┤
│ id (PK)         │     │ id (PK)         │     │ id (PK)         │
│ user_id (FK)    │     │ user_id (FK)    │     │ applicant_id    │
│ year            │     │ year            │     │ position_id     │
│ version         │     │ total_assets    │     │ pds_submission  │
│ status          │     │ total_liabil.   │     │ status          │
│ submitted_at    │     │ net_worth       │     │ reviewed_by     │
│ approved_by     │     │ status          │     │ interview_date  │
│ pdf_file_path   │     │ filing_type     │     │ final_decision  │
└────────┬────────┘     └────────┬────────┘     └─────────────────┘
         │                       │
         │     PDS SECTIONS      │     SALN SECTIONS
         │                       │
    ┌────┴────┐             ┌────┴────┐
    ▼         ▼             ▼         ▼
┌────────┐ ┌────────┐  ┌────────┐ ┌────────┐
│Personal│ │Family  │  │Real    │ │Personal│
│Info    │ │Backgrnd│  │Property│ │Property│
└────────┘ └────────┘  └────────┘ └────────┘
┌────────┐ ┌────────┐  ┌────────┐ ┌────────┐
│Children│ │Educatn │  │Liabil. │ │Business│
└────────┘ └────────┘  └────────┘ │Interest│
┌────────┐ ┌────────┐  └────────┘ └────────┐
│Civil   │ │Work    │  ┌────────┐          │
│Service │ │Experien│  │Relatives          │
└────────┘ └────────┘  │in Govt │          │
┌────────┐ ┌────────┐  └────────┘          │
│Voluntry│ │Training│                      │
│Work    │ └────────┘                      │
└────────┘ ┌────────┐                      │
           │Other   │                      │
           │Info    │                      │
           └────────┘                      │

        ┌──────────────────────────────────┘
        │
        ▼              ADMINISTRATIVE TABLES
┌─────────────────────────────────────────────────────────────────┐
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │ SUBMISSION   │  │  APPROVAL    │  │  AUDIT_LOGS  │           │
│  │ DEADLINES    │  │  WORKFLOWS   │  │              │           │
│  ├──────────────┤  ├──────────────┤  ├──────────────┤           │
│  │ form_type    │  │ submission_id│  │ user_id      │           │
│  │ year         │  │ approver_id  │  │ action       │           │
│  │ deadline     │  │ status       │  │ entity_type  │           │
│  │ reminders    │  │ comments     │  │ changes      │           │
│  └──────────────┘  └──────────────┘  │ ip_address   │           │
│                                      └──────────────┘           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │ NOTIFICATIONS│  │   ARCHIVES   │  │   USER       │           │
│  ├──────────────┤  ├──────────────┤  │ PREFERENCES  │           │
│  │ user_id      │  │ original_tbl │  ├──────────────┤           │
│  │ type         │  │ original_id  │  │ theme        │           │
│  │ title        │  │ data (JSONB) │  │ email_digest │           │
│  │ is_read      │  │ archived_at  │  │ language     │           │
│  └──────────────┘  └──────────────┘  └──────────────┘           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

        AUTH SYSTEM TABLES
┌─────────────────────────────────────────────────────────────────┐
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │    OTP       │  │   PENDING    │  │   TRUSTED    │           │
│  │ VERIFICATIONS│  │ REGISTRATIONS│  │   DEVICES    │           │
│  ├──────────────┤  ├──────────────┤  ├──────────────┤           │
│  │ user_id      │  │ user_id      │  │ user_id      │           │
│  │ code         │  │ status       │  │ fingerprint  │           │
│  │ type         │  │ approved_by  │  │ browser_info │           │
│  │ expires_at   │  │ admin_notes  │  │ expires_at   │           │
│  └──────────────┘  └──────────────┘  └──────────────┘           │
│                                                                  │
│  ┌──────────────┐                                               │
│  │  EMPLOYEE_ID │                                               │
│  │   REGISTRY   │                                               │
│  ├──────────────┤                                               │
│  │ employee_id  │                                               │
│  │ user_id      │                                               │
│  └──────────────┘                                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. Authentication & Authorization Flow

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                           AUTHENTICATION FLOW DIAGRAM                                    │
└─────────────────────────────────────────────────────────────────────────────────────────┘

                    ┌─────────────┐
                    │    USER     │
                    └──────┬──────┘
                           │
                           ▼
              ┌────────────────────────┐
              │  Login / Registration  │
              └───────────┬────────────┘
                          │
           ┌──────────────┴──────────────┐
           │                             │
           ▼                             ▼
    ┌─────────────┐              ┌─────────────┐
    │  EMPLOYEE   │              │  APPLICANT  │
    │ Registration│              │ Registration│
    │ (Admin Only)│              │ (Self-Serve)│
    └──────┬──────┘              └──────┬──────┘
           │                            │
           ▼                            ▼
    ┌─────────────┐              ┌─────────────┐
    │Admin Creates│              │Submit Form  │
    │Account + TUP│              │+ Email Verify│
    │Employee ID  │              │             │
    └──────┬──────┘              └──────┬──────┘
           │                            │
           ▼                            ▼
    ┌─────────────┐              ┌─────────────┐
    │Email + Temp │              │ OTP Email   │
    │Password Sent│              │ Verification│
    └──────┬──────┘              └──────┬──────┘
           │                            │
           └──────────────┬─────────────┘
                          │
                          ▼
              ┌────────────────────────┐
              │       LOGIN            │
              │  Email + Password      │
              └───────────┬────────────┘
                          │
                          ▼
              ┌────────────────────────┐
              │    DEVICE CHECK        │
              │  Is Device Trusted?    │
              └───────────┬────────────┘
                          │
           ┌──────────────┴──────────────┐
           │                             │
           ▼                             ▼
    ┌─────────────┐              ┌─────────────┐
    │   TRUSTED   │              │ NOT TRUSTED │
    │   (Skip OTP)│              │  (Send OTP) │
    └──────┬──────┘              └──────┬──────┘
           │                            │
           │                            ▼
           │                     ┌─────────────┐
           │                     │ 6-Digit OTP │
           │                     │  via Email  │
           │                     └──────┬──────┘
           │                            │
           │                            ▼
           │                     ┌─────────────┐
           │                     │ Enter OTP + │
           │                     │Trust Device?│
           │                     └──────┬──────┘
           │                            │
           └──────────────┬─────────────┘
                          │
                          ▼
              ┌────────────────────────┐
              │    JWT TOKEN ISSUED    │
              │  (Supabase Session)    │
              └───────────┬────────────┘
                          │
                          ▼
              ┌────────────────────────┐
              │   MIDDLEWARE CHECK     │
              │  @tupsafe/auth         │
              └───────────┬────────────┘
                          │
           ┌──────────────┴──────────────┐
           │                             │
           ▼                             ▼
    ┌─────────────┐              ┌─────────────┐
    │ EMPLOYEE    │              │   ADMIN     │
    │   PORTAL    │              │   PORTAL    │
    │ (Port 3000) │              │ (Port 3001) │
    └─────────────┘              └─────────────┘

                    ROLE-BASED ACCESS CONTROL (RBAC)
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                          │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐          │
│  │  APPLICANT   │    │   EMPLOYEE   │    │  SUPERVISOR  │    │   HR/ADMIN   │          │
│  ├──────────────┤    ├──────────────┤    ├──────────────┤    ├──────────────┤          │
│  │• Browse Jobs │    │• Submit PDS  │    │• All Employee│    │• All Access  │          │
│  │• Apply       │    │• Submit SALN │    │• Approve/Rej │    │• User Mgmt   │          │
│  │• Track Apps  │    │• View Status │    │  Submissions │    │• Job Posting │          │
│  │• PDS (Apps)  │    │• Notifications│   │• Dept Reports│    │• Compliance  │          │
│  └──────────────┘    └──────────────┘    └──────────────┘    └──────────────┘          │
│                                                                                          │
│  Row Level Security (RLS) enforced at database level for all queries                    │
│                                                                                          │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                              PDS/SALN SUBMISSION WORKFLOW                                │
└─────────────────────────────────────────────────────────────────────────────────────────┘

┌─────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ DRAFT   │───▶│  SUBMITTED  │───▶│  REVIEWING  │───▶│  APPROVED   │    │  REJECTED   │
│         │    │             │    │             │    │             │    │             │
│Auto-save│    │Employee     │    │HR/Supervisor│    │Final        │    │With Reason  │
│30 sec   │    │submits form │    │reviews form │    │approval     │    │& Comments   │
└─────────┘    └─────────────┘    └─────────────┘    └──────┬──────┘    └──────┬──────┘
                                                           │                   │
                                                           ▼                   │
                                                    ┌─────────────┐            │
                                                    │ PDF GENERATE│            │
                                                    │ & Archive   │            │
                                                    └─────────────┘            │
                                                                               │
                                         ┌─────────────────────────────────────┘
                                         │
                                         ▼
                                  ┌─────────────┐
                                  │  RESUBMIT   │
                                  │  (Revision) │
                                  └─────────────┘


┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                              JOB APPLICATION WORKFLOW                                    │
└─────────────────────────────────────────────────────────────────────────────────────────┘

┌─────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ PENDING │───▶│UNDER_REVIEW │───▶│ SHORTLISTED │───▶│FOR_INTERVIEW│───▶│ INTERVIEWED │
│         │    │             │    │             │    │             │    │             │
│Applicant│    │HR Initial   │    │Qualified    │    │Schedule     │    │Interview    │
│submits  │    │screening    │    │candidates   │    │interview    │    │completed    │
└─────────┘    └─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
                                                                               │
    ┌──────────────────────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────┐    ┌─────────────┐    ┌─────────────┐
│ FOR_FINAL_REVIEW│───▶│   ACCEPTED  │───▶│    HIRED    │
│                 │    │             │    │             │
│Final committee  │    │Offer made   │    │Convert to   │
│review           │    │& accepted   │    │Employee     │
└─────────────────┘    └─────────────┘    └─────────────┘
        │
        │              ┌─────────────┐
        └─────────────▶│  REJECTED/  │
                       │  WITHDRAWN  │
                       └─────────────┘


┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                              REAL-TIME DATA FLOW                                         │
└─────────────────────────────────────────────────────────────────────────────────────────┘

    ┌─────────────┐         ┌─────────────────────────────────────────────┐
    │   CLIENT    │         │              SUPABASE                        │
    │  (Browser)  │         │                                             │
    └──────┬──────┘         │  ┌─────────────┐    ┌─────────────────────┐ │
           │                │  │  PostgreSQL │    │   Realtime Server   │ │
           │                │  │  Database   │    │   (WebSocket)       │ │
           │                │  └──────┬──────┘    └──────────┬──────────┘ │
           │                │         │                      │            │
           │   REST API     │         │   DB Events          │            │
           │◄───────────────┼─────────┘                      │            │
           │                │                                │            │
           │   WebSocket    │                                │            │
           │◄───────────────┼────────────────────────────────┘            │
           │                │                                             │
    ┌──────▼──────┐         └─────────────────────────────────────────────┘
    │ React Query │
    │  + Custom   │
    │   Hooks     │
    ├─────────────┤
    │useRealtime  │◄──── Notification updates
    │Notifications│
    ├─────────────┤
    │useRealtime  │◄──── Submission status changes
    │Submission   │
    ├─────────────┤
    │useRealtime  │◄──── Profile synchronization
    │Profile      │
    └─────────────┘
```

---

## 6. Technology Stack Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                               TECHNOLOGY STACK                                           │
└─────────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                   FRONTEND                                               │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐    │
│  │                         FRAMEWORK & RUNTIME                                      │    │
│  │                                                                                  │    │
│  │    ┌────────────────┐  ┌────────────────┐  ┌────────────────┐                   │    │
│  │    │  Next.js 15.5  │  │   React 19.1   │  │ TypeScript 5   │                   │    │
│  │    │  App Router    │  │  Server/Client │  │  Strict Mode   │                   │    │
│  │    │  Turbopack     │  │  Components    │  │                │                   │    │
│  │    └────────────────┘  └────────────────┘  └────────────────┘                   │    │
│  └─────────────────────────────────────────────────────────────────────────────────┘    │
│                                                                                          │
│  ┌────────────────────────────────┐  ┌────────────────────────────────┐                 │
│  │      EMPLOYEE PORTAL UI        │  │        ADMIN PORTAL UI         │                 │
│  │                                │  │                                │                 │
│  │  • Tailwind CSS 4              │  │  • Tailwind CSS 4              │                 │
│  │  • Magic UI Components         │  │  • shadcn/ui Components        │                 │
│  │  • Framer Motion               │  │  • Radix UI Primitives         │                 │
│  │  • Radix Icons (only)          │  │  • Framer Motion               │                 │
│  └────────────────────────────────┘  └────────────────────────────────┘                 │
│                                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐    │
│  │                         STATE & DATA MANAGEMENT                                  │    │
│  │                                                                                  │    │
│  │    ┌────────────────┐  ┌────────────────┐  ┌────────────────┐                   │    │
│  │    │ React Query v5 │  │ React Hook Form│  │  Zod Schemas   │                   │    │
│  │    │ Server State   │  │ Form State     │  │  Validation    │                   │    │
│  │    │ Caching        │  │ Validation     │  │                │                   │    │
│  │    └────────────────┘  └────────────────┘  └────────────────┘                   │    │
│  └─────────────────────────────────────────────────────────────────────────────────┘    │
│                                                                                          │
└─────────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                   BACKEND                                                │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐    │
│  │                              DATABASE LAYER                                      │    │
│  │                                                                                  │    │
│  │    ┌────────────────┐  ┌────────────────┐  ┌────────────────┐                   │    │
│  │    │  PostgreSQL    │  │  Drizzle ORM   │  │  Row Level     │                   │    │
│  │    │  (Supabase)    │  │  Type-Safe SQL │  │  Security      │                   │    │
│  │    └────────────────┘  └────────────────┘  └────────────────┘                   │    │
│  └─────────────────────────────────────────────────────────────────────────────────┘    │
│                                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐    │
│  │                              SUPABASE SERVICES                                   │    │
│  │                                                                                  │    │
│  │    ┌────────────────┐  ┌────────────────┐  ┌────────────────┐                   │    │
│  │    │ Authentication │  │    Storage     │  │   Realtime     │                   │    │
│  │    │ JWT + MFA      │  │  File Storage  │  │  WebSocket     │                   │    │
│  │    │ OAuth Support  │  │  Secure Bucket │  │  Subscriptions │                   │    │
│  │    └────────────────┘  └────────────────┘  └────────────────┘                   │    │
│  └─────────────────────────────────────────────────────────────────────────────────┘    │
│                                                                                          │
└─────────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                              BUILD & DEPLOYMENT                                          │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                          │
│    ┌────────────────┐  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐       │
│    │     Turbo      │  │    Vercel      │  │    ESLint      │  │   Prettier     │       │
│    │   Monorepo     │  │   Deployment   │  │  Code Quality  │  │   Formatting   │       │
│    │   Build Sys    │  │   Platform     │  │                │  │                │       │
│    └────────────────┘  └────────────────┘  └────────────────┘  └────────────────┘       │
│                                                                                          │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 7. Deployment Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                              DEPLOYMENT ARCHITECTURE                                     │
└─────────────────────────────────────────────────────────────────────────────────────────┘

                              ┌─────────────────────────┐
                              │        INTERNET         │
                              └───────────┬─────────────┘
                                          │
                                          ▼
                              ┌─────────────────────────┐
                              │    CDN (Vercel Edge)    │
                              │   Global Distribution   │
                              └───────────┬─────────────┘
                                          │
              ┌───────────────────────────┼───────────────────────────┐
              │                           │                           │
              ▼                           ▼                           ▼
    ┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
    │  Static Assets  │         │    Employee     │         │     Admin       │
    │  (JS/CSS/IMG)   │         │     Portal      │         │     Portal      │
    │                 │         │  tupsafe.tup.   │         │  admin.tupsafe  │
    │                 │         │   edu.ph        │         │  .tup.edu.ph    │
    └─────────────────┘         └────────┬────────┘         └────────┬────────┘
                                         │                           │
                                         └─────────────┬─────────────┘
                                                       │
                                                       ▼
                                         ┌─────────────────────────┐
                                         │   VERCEL SERVERLESS     │
                                         │   (Next.js Runtime)     │
                                         │                         │
                                         │  • API Routes           │
                                         │  • Server Components    │
                                         │  • Server Actions       │
                                         └───────────┬─────────────┘
                                                     │
                                                     ▼
                                         ┌─────────────────────────┐
                                         │   SUPABASE PLATFORM     │
                                         │                         │
                                         │  ┌─────────────────┐    │
                                         │  │   PostgreSQL    │    │
                                         │  │   (Primary DB)  │    │
                                         │  └─────────────────┘    │
                                         │                         │
                                         │  ┌─────────────────┐    │
                                         │  │ Auth Service    │    │
                                         │  │ (GoTrue)        │    │
                                         │  └─────────────────┘    │
                                         │                         │
                                         │  ┌─────────────────┐    │
                                         │  │ Storage (S3)    │    │
                                         │  │ PDF/Documents   │    │
                                         │  └─────────────────┘    │
                                         │                         │
                                         │  ┌─────────────────┐    │
                                         │  │ Realtime        │    │
                                         │  │ (WebSocket)     │    │
                                         │  └─────────────────┘    │
                                         │                         │
                                         └─────────────────────────┘


┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                              ENVIRONMENT STRATEGY                                        │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                          │
│    ┌────────────────────────────────────────────────────────────────────────────────┐   │
│    │                            DEVELOPMENT                                          │   │
│    │  Local: localhost:3000 (Employee) / localhost:3001 (Admin)                     │   │
│    │  Database: Supabase Development Project                                        │   │
│    └────────────────────────────────────────────────────────────────────────────────┘   │
│                                          │                                              │
│                                          ▼                                              │
│    ┌────────────────────────────────────────────────────────────────────────────────┐   │
│    │                             STAGING                                             │   │
│    │  Vercel Preview Deployments (Per Pull Request)                                 │   │
│    │  Database: Supabase Staging Project                                            │   │
│    └────────────────────────────────────────────────────────────────────────────────┘   │
│                                          │                                              │
│                                          ▼                                              │
│    ┌────────────────────────────────────────────────────────────────────────────────┐   │
│    │                            PRODUCTION                                           │   │
│    │  Domain: tupsafe.tup.edu.ph                                                    │   │
│    │  Branch: main                                                                  │   │
│    │  Database: Supabase Production Project                                         │   │
│    │  Backups: Daily (30-day retention)                                             │   │
│    │  RTO: < 4 hours | RPO: < 1 hour                                                │   │
│    └────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                          │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 8. Security Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                              SECURITY ARCHITECTURE                                       │
└─────────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                              DEFENSE IN DEPTH                                            │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                          │
│  LAYER 1: NETWORK                                                                        │
│  ┌────────────────────────────────────────────────────────────────────────────────────┐ │
│  │  • TLS 1.3 (HTTPS Only)                                                             │ │
│  │  • Vercel Edge Network (DDoS Protection)                                            │ │
│  │  • CORS Configuration                                                               │ │
│  └────────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                          │
│  LAYER 2: APPLICATION                                                                    │
│  ┌────────────────────────────────────────────────────────────────────────────────────┐ │
│  │  • JWT Token Authentication (Supabase Auth)                                         │ │
│  │  • Multi-Factor Authentication (OTP via Email)                                      │ │
│  │  • Trusted Device Management (30-day tokens)                                        │ │
│  │  • Session Timeout (30 minutes)                                                     │ │
│  │  • Input Validation (Zod Schemas)                                                   │ │
│  │  • XSS Prevention (React's built-in escaping)                                       │ │
│  │  • CSRF Protection (SameSite cookies)                                               │ │
│  └────────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                          │
│  LAYER 3: DATABASE                                                                       │
│  ┌────────────────────────────────────────────────────────────────────────────────────┐ │
│  │  • Row Level Security (RLS) Policies                                                │ │
│  │  • Parameterized Queries (Drizzle ORM)                                              │ │
│  │  • Encryption at Rest (Supabase)                                                    │ │
│  │  • Database Connection Pooling                                                      │ │
│  └────────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                          │
│  LAYER 4: AUDIT & COMPLIANCE                                                             │
│  ┌────────────────────────────────────────────────────────────────────────────────────┐ │
│  │  • Comprehensive Audit Logging (who, what, when, where)                             │ │
│  │  • IP Address & User Agent Tracking                                                 │ │
│  │  • Immutable Record History                                                         │ │
│  │  • 5-Year Archival (CSC Compliance)                                                 │ │
│  │  • CHED/CSC Regulatory Alignment                                                    │ │
│  └────────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                          │
└─────────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                              DATA CLASSIFICATION                                         │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                          │
│  ┌────────────────────────────────────────────────────────────────────────────────────┐ │
│  │  SENSITIVE (CSC-Regulated)                                                          │ │
│  ��  • Personal Data Sheet (PDS) - Full personal information                            │ │
│  │  • Statement of Assets, Liabilities, Net Worth (SALN) - Financial data             │ │
│  │  • Government IDs (GSIS, PhilHealth, SSS, TIN, PhilSys)                            │ │
│  └────────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                          │
│  ┌────────────────────────────────────────────────────────────────────────────────────┐ │
│  │  CONFIDENTIAL                                                                       │ │
│  │  • Job Applications & Interview Records                                             │ │
│  │  • Employee Performance Data                                                        │ │
│  │  • Approval/Rejection Decisions                                                     │ │
│  └────────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                          │
│  ┌────────────────────────────────────────────────────────────────────────────────────┐ │
│  │  INTERNAL                                                                           │ │
│  │  • Department Structure                                                             │ │
│  │  • Position Listings                                                                │ │
│  │  • Submission Deadlines                                                             │ │
│  └────────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                          │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 9. Component Architecture (Simplified)

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                        FRONTEND COMPONENT HIERARCHY                                      │
└─────────────────────────────────────────────────────────────────────────────────────────┘

                              ┌─────────────────┐
                              │    RootLayout   │
                              │  (app/layout)   │
                              └────────┬────────┘
                                       │
                    ┌──────────────────┼──────────────────┐
                    │                  │                  │
                    ▼                  ▼                  ▼
          ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
          │    Providers    │ │   AuthLayout    │ │ DashboardLayout │
          │                 │ │   (Public)      │ │  (Protected)    │
          │ • QueryProvider │ │                 │ │                 │
          │ • ToastProvider │ │ • Login         │ │ • Sidebar       │
          │ • AuthProvider  │ │ • Register      │ │ • Header        │
          └─────────────────┘ │ • Verify        │ │ • Main Content  │
                              └─────────────────┘ └────────┬────────┘
                                                           │
                          ┌────────────────────────────────┼────────────────────────────────┐
                          │                                │                                │
                          ▼                                ▼                                ▼
                ┌─────────────────┐              ┌─────────────────┐              ┌─────────────────┐
                │   Dashboard     │              │   Forms Module  │              │  Applications   │
                │   Pages         │              │                 │              │  Module         │
                │                 │              │  ┌───────────┐  │              │                 │
                │ • Overview      │              │  │PDS Forms  │  │              │ • Positions     │
                │ • Profile       │              │  │           │  │              │ • Apply         │
                │ • Settings      │              │  │• Personal │  │              │ • Track Status  │
                │ • Notifications │              │  │• Family   │  │              │ • Documents     │
                │                 │              │  │• Education│  │              │                 │
                └─────────────────┘              │  │• Work Exp │  │              └─────────────────┘
                                                │  │• Training │  │
                                                │  │• Other    │  │
                                                │  └───────────┘  │
                                                │                 │
                                                │  ┌───────────┐  │
                                                │  │SALN Forms │  │
                                                │  │           │  │
                                                │  │• Assets   │  │
                                                │  │• Liabilit.│  │
                                                │  │• Net Worth│  │
                                                │  │• Business │  │
                                                │  │• Relatives│  │
                                                │  └───────────┘  │
                                                │                 │
                                                └─────────────────┘


┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                              SHARED HOOKS ARCHITECTURE                                   │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                          │
│  @tupsafe/database/hooks                                                                │
│  ┌────────────────────────────────────────────────────────────────────────────────────┐ │
│  │                                                                                     │ │
│  │  useRealtimeBase ─────────────────┬──────────────────┬───────────────────────────┐ │ │
│  │          │                        │                  │                           │ │ │
│  │          ▼                        ▼                  ▼                           │ │ │
│  │  useRealtimeNotifications  useRealtimeProfile  useRealtimeSubmissionStatus       │ │ │
│  │                                                                                  │ │ │
│  │  • Subscribe to notification    • Sync profile    • Track PDS/SALN status       │ │ │
│  │    channel                        changes           changes                      │ │ │
│  │  • Auto-refresh on new          • Invalidate      • Real-time approval          │ │ │
│  │    notifications                  cache             updates                      │ │ │
│  │                                                                                  │ │ │
│  └────────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                          │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 10. System Summary

| Component              | Technology                | Purpose                             |
| ---------------------- | ------------------------- | ----------------------------------- |
| **Frontend Framework** | Next.js 15.5 + React 19.1 | Server/Client rendering, App Router |
| **Language**           | TypeScript 5 (Strict)     | Type safety, developer experience   |
| **Styling**            | Tailwind CSS 4            | Utility-first CSS framework         |
| **Employee UI**        | Magic UI + Radix Icons    | Modern, animated interface          |
| **Admin UI**           | shadcn/ui + Radix         | Professional, enterprise design     |
| **State Management**   | React Query v5            | Server state, caching, real-time    |
| **Forms**              | React Hook Form + Zod     | Validation, type-safe forms         |
| **Database**           | PostgreSQL (Supabase)     | Relational data, RLS                |
| **ORM**                | Drizzle ORM               | Type-safe SQL, migrations           |
| **Authentication**     | Supabase Auth + MFA       | JWT, OTP verification               |
| **Real-time**          | Supabase Realtime         | WebSocket subscriptions             |
| **File Storage**       | Supabase Storage          | PDF, documents, resumes             |
| **Build System**       | Turbo                     | Monorepo management                 |
| **Deployment**         | Vercel                    | Serverless, edge network            |
| **Notifications**      | Sonner                    | Toast notifications                 |
| **Animation**          | Framer Motion             | UI animations                       |

---

_Document generated for TUPSAFE Thesis Documentation_
_Technological University of the Philippines - Manila_
