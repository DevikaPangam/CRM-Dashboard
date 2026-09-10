# Rajmudra Group — Enterprise Corporate BD & Fleet CRM Platform
## Complete Technical Architecture, Data Schema, Feature Specifications & System Review Document

> **Document Purpose**: This comprehensive document provides an exhaustive, end-to-end blueprint of the **Rajmudra Group Corporate CRM & Fleet BD Management System**. It is formatted for AI systems (such as ChatGPT, Claude, DeepSeek) and human technical auditors to inspect the full architecture, data models, state lifecycle, role-based access controls, database schema, and operational workflows.

---

## 1. Executive Summary & Project Context

- **Platform Name**: Rajmudra Corporate Fleet Solutions — BD & Enterprise Operations CRM
- **Primary Domain / Industry**: B2B Corporate Mobility, Employee Transportation Systems (ETS), Corporate Car Rentals, Industrial Fleet Operations & Heavy Logistics.
- **Primary Organization**: `Rajmudra Corporate Fleet Solutions Ltd` (Tenant UUID: `00000000-0000-0000-0000-000000000001`)
- **System Administrator / Lead User**: Devika Pangam (`devika.p@rajmudragroup.com`)
- **Live Production URL**: [https://crm-dashboard-l79s.vercel.app/](https://crm-dashboard-l79s.vercel.app/)
- **Repository**: [https://github.com/DevikaPangam/CRM-Dashboard.git](https://github.com/DevikaPangam/CRM-Dashboard.git) (Branch: `main`)
- **Cloud Backend**: Supabase Cloud PostgreSQL ([https://lyaryldpiviaytcarbtn.supabase.co](https://lyaryldpiviaytcarbtn.supabase.co))

---

## 2. Technology Stack & Framework Choices

| Layer | Technologies Used | Design & Engineering Rationale |
| :--- | :--- | :--- |
| **Frontend Framework** | **React 19** + **TypeScript** | Strict compile-time type safety for complex corporate enterprise schemas. |
| **Build Tooling & Bundler** | **Vite 6** | Ultra-fast Hot Module Replacement (HMR) and optimized vendor chunk splitting. |
| **Styling & Design System** | **Vanilla CSS Design System** (`src/index.css`) | Custom, high-density corporate UI design system; zero CSS-in-JS runtime overhead; custom design tokens for light/dark modes, glassmorphic cards, custom data tables, and modal overlays. |
| **Icons & UI Symbols** | **Lucide React** | Lightweight, consistent SVG icon set. |
| **Data Visualizations** | **Chart.js** & **Recharts** | Interactive revenue breakdowns, pipeline stage funnels, and department achievement gauges. |
| **Backend & Database** | **Supabase Cloud (PostgreSQL 15+)** | Cloud-native relational database, Row Level Security (RLS), realtime WebSocket subscriptions, and PostgREST API layer. |
| **Authentication Layer** | **Supabase Auth + Corporate Direct Login** | Corporate email validation (`@rajmudragroup.com`), session recovery, and fallback state handling. |
| **Persistence Strategy** | **Dual-Layer Hybrid (Supabase + LocalStorage)** | Optimistic UI updates with offline cache fallback, seamless reconciliation on hard refresh (`Ctrl + F5`), and zero-loss state merging. |

---

## 3. Application State & Architecture Breakdown

### 3.1 Context Architecture
The application is governed by two central React Context Providers:

1. **`AuthContext` (`src/context/AuthContext.tsx`)**:
   - Manages user authentication, session tokens, profile loading from `public.profiles`, corporate organization tenant mapping, role permissions, and corporate email domain enforcement (`@rajmudragroup.com`).
   - Supports both Cloud Supabase Auth and Instant Corporate Direct Login.
2. **`CRMContext` (`src/context/CRMContext.tsx`)**:
   - Holds global reactive state for all 13 core business entities.
   - Synchronizes changes to `localStorage` under key `CORPBD_CRM_REACT_V5_*`.
   - Executes optimistic UI updates immediately, followed by asynchronous cloud persistence via `crmDataService.ts`.
   - Realtime collaborative updates powered by Supabase Realtime channel subscriptions (`src/services/realtimeService.ts`).

---

## 4. Complete Module Breakdown & Capabilities

### Module 1: Executive KPI Dashboard (`DashboardTab.tsx`)
- **Revenue Metrics**: Total Annual Pipeline Value (INR / USD toggle), Weighted Closed Revenue, Active Deals Count, Average Deal Size.
- **Visual Analytics**:
  - Interactive Pipeline Stage Distribution (Lead, Requirement Discussion, Technical Feasibility, Commercial Proposal, Negotiation, Won, Lost).
  - Business Segment Revenue Breakdown (Employee Transport, Luxury Car Rental, Long-Term Leases, Logistics).
  - Monthly BD Performance vs. Targets.
- **Action Banners**: Overdue action item alerts, pending internal approval counters.

### Module 2: Corporate Client Master Directory (`ClientsTab.tsx`)
- **Entity Management**: Comprehensive client records with Client Code (`CLT-1001`), Industry, Segment, Tier (Tier 1 Enterprise, Tier 2 Mid-Market, Tier 3 Emerging), Region (North, South, East, West, Central), Annual Turnover (Cr), and Employee Count.
- **Multi-Contact Hierarchy**: Add and manage multiple contacts per client (Primary Procurement Head, Fleet Coordinator, Admin Director).
- **Fleet Deployment Tracking**: Deployed vehicles per client account (e.g., 25 AC Buses, 10 Innova Crysta, 15 Sedans).
- **CSV Import / Export**: Instant bulk import and backup export.

### Module 3: Employee Master & Directory (`EmployeeMasterTab.tsx` & `TeamTab.tsx`)
- **Workforce Hierarchy**: Employee ID (`EMP-001`), Designation, Department, Reporting Manager, Regional Ownership, Annual BD Targets, and Achieved Targets.
- **RBAC Roles Supported**:
  - `super_admin`: Full system administrative privileges, schema overrides, user management, and pricing threshold controls.
  - `bd_director` / `bd_manager`: Pipeline allocation, cross-department task assignment, and opportunity sign-offs.
  - `bd_exec` / `bd_sr_exec`: Lead management, activity logs, client interactions, and quote calculations.
  - `management_viewer`: Read-only executive reporting access.
  - `operations_manager` / `finance_executive` / `legal_counsel`: Department-specific feasibility and approval workflows.

### Module 4: Employee Career History & Timeline (`EmployeeProfileTab.tsx`)
- **Chronological Career Timeline**: Captures initial hiring, promotions, designation changes, salary/target revisions, department transfers, and management commendations.
- **Automated Audit Triggers**: Detects updates in user profiles and automatically logs career event records.

### Module 5: KRA / KPI Performance Management System
- **Balanced Scorecard**: Department-specific Key Result Areas (KRAs) and Key Performance Indicators (KPIs) with weights, target metrics, actual achieved values, and quarterly review scoring (Q1-Q4).
- **Automated Default Generator**: Generates industry-standard KRAs for Business Development, Operations, Commercials, Legal, and Maintenance departments.

### Module 6: Business Segments & Revenue Streams (`SegmentsTab.tsx`)
- **Segments Configured**:
  1. *Employee Transportation (ETS)* (Buses, Tempo Travelers, Corporate Shuttles)
  2. *Executive Car Rental & Spot Mobility* (Premium Sedans, Luxury SUVs)
  3. *Long-Term Operating Leases (Dry/Wet)*
  4. *Inter-City Corporate Transit & Shuttles*
  5. *Industrial Fleet & Plant Commute*
  6. *Special Event Mobility & Delegation Transport*
- **Segment Metrics**: Active clients count, pipeline value, target gross margin %, and segment BD leader.

### Module 7: Opportunity Pipeline & Deal Inception (`OpportunitiesTab.tsx`)
- **Stage Progression Engine**: Tracks deals from *Lead / Inception* -> *Requirement Discussion* -> *Route Survey & Feasibility* -> *Proposal Formulation* -> *Commercial Negotiation* -> *Won / Lost / On Hold*.
- **Comprehensive Opportunity Details**: Fleet size requirements, vehicle type, competition matrix, win probability calculation notes, lost reasons, SLA tracking, and internal approval conditions.

### Module 8: Interactive Proposal & Route Commercials Calculator (`ProposalCalculatorTab.tsx`)
- **Fleet Pricing Formula Engine**:
  - Vehicle Type & Fuel Variants (Diesel, CNG, Electric EV).
  - Daily Run (KM), Working Days/Month, Vehicle Capital Cost (EMI), Driver Salary, Fuel Efficiency (KMPL / Fuel Cost per Liter), Insurance & Maintenance reserves.
  - Auto-calculated Monthly Base Cost, Minimum Quote INR, Recommended Quote INR, and Projected Gross Margin %.
  - Margin Threshold Warning (< 15% requires CFO / Super Admin clearance).

### Module 9: Client Interaction & Engagement Log (`ActivitiesTab.tsx`)
- **Interaction Types**: Physical Meeting, Phone Call, Proposal Discussion, Commercial Negotiation, Client Review, Site Visit, Email Communication.
- **Engagement Details**: Date, time, conducted by, contact person, location, key discussion, outcome, action items, and auto-generated follow-up dates.

### Module 10: Follow-up & Action Item Tracker (`FollowupsTab.tsx`)
- **Dedicated Follow-up Scheduler**: Direct modal (`AddFollowupModal.tsx`) for scheduling calls, proposal submissions, client reviews, and contract deadlines.
- **Overdue Detection Banner**: Real-time identification of past-due action items with priority color coding (High, Medium, Low).
- **One-Click Completion**: Mark done with completion timestamps and resolution remarks.

### Module 11: Internal Cross-Department Coordination & Approvals Matrix (`InternalTab.tsx`)
- **Cross-Department Workflows**:
  - *Operations*: Route survey & turnaround feasibility.
  - *Pricing & Commercials (CFO)*: Gross profit margin and discount approvals.
  - *Legal & Compliance*: SLA terms, indemnity, and liability cap clearance.
  - *Fleet Asset Management*: Chassis allocation & OEM delivery schedule sign-off.
- **Approval Engine**: Interactive modal (`ApprovalModal.tsx`) for managers to Approve, Reject, or Request Revision with mandatory condition notes.

### Module 12: Document Vault & Stage Attachment Repository (`DocumentsTab.tsx`)
- **Enterprise Stage Vault**: Upload, categorize, and track RFPs, Technical Proposals, Commercial Quotations, Master Service Agreements (MSA), NDA contracts, and Rate Cards.

### Module 13: Management Review & Pipeline Audit (`ReviewTab.tsx`)
- **Quarterly Pipeline Audit**: Deal stage health checks, stalled opportunity alerts (> 30 days with no activity), and revenue forecasting.

---

## 5. PostgreSQL Database Schema Definition (DDL)

```sql
-- Core Organization Table
CREATE TABLE public.organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- User Profiles Table
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY,
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  email text NOT NULL UNIQUE,
  full_name text NOT NULL,
  role text DEFAULT 'bd_exec' NOT NULL,
  status text DEFAULT 'active' NOT NULL,
  department text DEFAULT 'Business Development',
  designation text DEFAULT 'Executive',
  employee_id text,
  phone text,
  region text DEFAULT 'West',
  location text DEFAULT 'Corporate HQ - Mumbai',
  joining_date date DEFAULT current_date,
  employment_type text DEFAULT 'Full-time',
  is_regional_owner boolean DEFAULT false,
  team_id uuid,
  manager_id uuid,
  annual_target_inr numeric(15, 2) DEFAULT 0.00,
  avatar_url text,
  avatar_bg text DEFAULT '#3b82f6',
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Business Segments Table
CREATE TABLE public.segments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  segment_code text NOT NULL,
  name text NOT NULL,
  category text NOT NULL,
  target_margin_pct numeric(5, 2) DEFAULT 20.00 NOT NULL,
  lead_owner text DEFAULT 'Devika Pangam' NOT NULL,
  description text,
  active_clients_count integer DEFAULT 0,
  pipeline_value_inr numeric(15, 2) DEFAULT 0.00,
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Corporate Clients Table
CREATE TABLE public.clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  client_code text NOT NULL,
  name text NOT NULL,
  client_type text DEFAULT 'Existing Client',
  industry text NOT NULL,
  segment text NOT NULL,
  city text NOT NULL,
  state text NOT NULL,
  region text DEFAULT 'West',
  tier text DEFAULT 'Tier 1 (Enterprise)',
  turnover_cr numeric(12, 2) DEFAULT 0.00,
  employees_count integer DEFAULT 0,
  status text DEFAULT 'Active',
  account_owner text,
  website text,
  address text,
  deployed_fleets jsonb DEFAULT '[]'::jsonb,
  notes text,
  created_by uuid,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Opportunity Pipeline Table
CREATE TABLE public.opportunities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  opportunity_code text NOT NULL,
  title text NOT NULL,
  client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  client_name text NOT NULL,
  client_type text DEFAULT 'Existing Client',
  segment text DEFAULT 'Employee Transportation' NOT NULL,
  service_category text DEFAULT 'Corporate Mobility',
  contract_type text DEFAULT 'Annual Contract',
  deal_value_inr numeric(15, 2) DEFAULT 0.00 NOT NULL,
  monthly_value_inr numeric(15, 2) DEFAULT 0.00 NOT NULL,
  stage text DEFAULT 'Lead / Inception' NOT NULL,
  probability_pct numeric(5, 2) DEFAULT 10.00 NOT NULL,
  status text DEFAULT 'Open' NOT NULL,
  owner_name text DEFAULT 'BD Owner' NOT NULL,
  lead_source text DEFAULT 'Direct Outreach',
  expected_close_date date,
  last_activity_date date,
  next_followup_date date,
  fleet_size integer DEFAULT 0,
  vehicle_type text,
  locations text,
  competition text,
  win_probability_notes text,
  lost_reason text,
  lost_remarks text,
  internal_approvals_required boolean DEFAULT false,
  approval_status text DEFAULT 'Not Required',
  approval_remarks text,
  approved_by text,
  approved_at timestamptz,
  delegated_department text DEFAULT 'Operations',
  delegated_owner text DEFAULT 'Manish Rawat (VP - Ops)',
  delegation_status text DEFAULT 'Pending Action',
  delegation_milestone text,
  sla_days_remaining integer DEFAULT 0,
  delegation_remarks text,
  notes text,
  created_by uuid,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Interactions & Activity Logs Table
CREATE TABLE public.activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  client_id uuid,
  opportunity_id uuid,
  client_name text NOT NULL,
  client_type text DEFAULT 'Existing Client',
  opportunity_title text,
  activity_type text DEFAULT 'Physical Meeting',
  activity_date date DEFAULT current_date,
  activity_time text,
  conducted_by text DEFAULT 'BD Executive',
  contact_person text,
  location text,
  key_discussion text,
  outcome text,
  action_items text,
  next_followup_date date,
  status text DEFAULT 'Completed',
  created_by uuid,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Follow-up & Action Items Table
CREATE TABLE public.followups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  client_id uuid,
  opportunity_id uuid,
  client_name text NOT NULL,
  client_type text DEFAULT 'Existing Client',
  opportunity_title text,
  due_date date DEFAULT current_date,
  assigned_to text DEFAULT 'BD Executive',
  followup_type text DEFAULT 'Call',
  priority text DEFAULT 'Medium',
  description text,
  status text DEFAULT 'Pending',
  completed_at timestamptz,
  completed_date date,
  remarks text,
  created_by uuid,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Internal Tasks & Delegation Matrix Table
CREATE TABLE public.internal_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  opportunity_id uuid,
  client_id uuid,
  task_code text,
  title text NOT NULL,
  department text NOT NULL,
  assigned_to text NOT NULL,
  assigned_by text DEFAULT 'System Administrator',
  due_date date NOT NULL,
  priority text DEFAULT 'Medium' NOT NULL,
  status text DEFAULT 'Pending' NOT NULL,
  request_details text,
  response_notes text,
  action_date date,
  approval_remarks text,
  approved_by text,
  approved_at timestamptz,
  created_by uuid,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);
```

---

## 6. Directory Structure & Key Code Artifacts

```text
CRM-Dashboard_Vite/
├── dist/                              # Production compiled bundle (Vite)
├── public/                            # Static assets
├── src/
│   ├── components/
│   │   ├── auth/
│   │   │   └── LoginPage.tsx          # Corporate auth with @rajmudragroup.com enforcement
│   │   ├── layout/
│   │   │   ├── Header.tsx             # Global header, currency toggle, user profile badge
│   │   │   └── Navigation.tsx         # Sidebar navigation tab router
│   │   ├── modals/                    # 26 Specialized Modal Workflows
│   │   │   ├── AddActivityModal.tsx   # Client interaction & delegation matrix handoff
│   │   │   ├── AddClientModal.tsx     # Corporate client creation with contacts & fleets
│   │   │   ├── AddFollowupModal.tsx   # Action item and follow-up scheduler
│   │   │   ├── AddInternalModal.tsx   # Cross-department task logger
│   │   │   ├── AddOpportunityModal.tsx# Opportunity and deal inception
│   │   │   ├── AddSegmentModal.tsx    # Business segment manager
│   │   │   ├── ApprovalModal.tsx      # Management approval/rejection conditions
│   │   │   ├── DelegationMatrixModal.tsx # Department delegation milestone tracker
│   │   │   ├── GlobalModals.tsx       # Centralized modal render switchboard
│   │   │   └── ImportClientsModal.tsx # Bulk CSV client importer
│   │   └── tabs/                      # 13 Core Application Views
│   │       ├── ActivitiesTab.tsx      # Client interaction timeline
│   │       ├── ClientsTab.tsx         # Client master directory
│   │       ├── DashboardTab.tsx       # Executive KPI dashboard
│   │       ├── DocumentsTab.tsx       # Proposal & document vault
│   │       ├── EmployeeMasterTab.tsx  # Employee directory & target allocations
│   │       ├── EmployeeProfileTab.tsx # Career history & promotion timeline
│   │       ├── FollowupsTab.tsx       # Scheduled action item tracker
│   │       ├── InternalTab.tsx        # Internal cross-department requests
│   │       ├── OpportunitiesTab.tsx   # Opportunity pipeline board
│   │       ├── ProposalCalculatorTab.tsx # Route pricing & margin calculator
│   │       ├── ReviewTab.tsx          # Quarterly management review & audit
│   │       ├── SegmentsTab.tsx        # Business segments & revenue streams
│   │       ├── TeamTab.tsx            # BD team structure
│   │       └── UsersTab.tsx           # RBAC system administration
│   ├── context/
│   │   ├── AuthContext.tsx            # Supabase Auth, session lifecycle, RBAC
│   │   └── CRMContext.tsx             # Global CRM reactive state & cloud sync
│   ├── services/
│   │   ├── auditService.ts            # Audit logging service
│   │   ├── careerHistoryService.ts    # Career event service
│   │   ├── crmDataService.ts          # Bidirectional Supabase PostgreSQL data layer
│   │   ├── kraKpiService.ts           # Balanced scorecard & KPI metrics
│   │   └── realtimeService.ts         # Supabase WebSocket realtime channels
│   ├── types/
│   │   ├── crm.ts                     # TypeScript entity schemas
│   │   └── database.types.ts          # Generated Supabase Database types
│   ├── utils/
│   │   ├── exportUtils.ts             # CSV & JSON export utilities
│   │   ├── formatters.ts              # Currency (INR ₹, USD $), date, and badge formatters
│   │   ├── seedData.ts                # Default seed records for instant onboarding
│   │   └── supabaseClient.ts          # Supabase Client singleton
│   ├── App.tsx                        # Application root router
│   ├── main.tsx                       # React DOM entrypoint
│   └── index.css                      # Corporate CSS design system (Vanilla CSS)
├── supabase/
│   └── UNIFIED_FULL_PERSISTENCE_MIGRATION.sql # Complete master database migration
├── package.json                       # Dependencies & build scripts
├── tsconfig.json                      # TypeScript compiler configuration
└── vite.config.ts                     # Vite bundler configuration
```

---

## 7. Data Lifecycle & Persistence Guarantee

1. **Optimistic UI Execution**: When a user submits any modal (e.g. creating an opportunity or scheduling an action item), the item is instantly generated with a local identifier, updated in React state, and persisted in `localStorage`.
2. **Cloud PostgreSQL Insertion**: The operation invokes `crmDataService.ts`, which sends sanitized snake_case payloads to Supabase PostgREST.
3. **Identifier Resolution**: Upon database return, the temporary ID is cleanly replaced by the PostgreSQL UUID.
4. **Hard Refresh & Re-login Reconciliation**: On browser reload (`Ctrl + F5`), `refreshCRMData()` executes `Promise.all()` across all tables. It merges database rows with local state using unique identifier mapping, preventing blind state overwrites or data loss.
5. **Realtime Multi-User Sync**: Any insert, update, or delete triggered by another user on the tenant is broadcast over Supabase WebSockets and rendered in real-time.

---

## 8. Summary for Reviewers & AI Assistants

This platform represents a **production-ready, enterprise-grade B2B Corporate CRM and Fleet Mobility Management System**. It features full end-to-end multi-tenancy, complete relational database persistence in PostgreSQL, interactive financial pricing formulas, balanced scorecard employee evaluations, and cross-department delegation workflows.
