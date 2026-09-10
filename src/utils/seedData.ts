import {
  Client, Opportunity, Activity, Followup, InternalTask,
  TeamMember, BusinessSegment, User, CRMDocument,
  FleetSeaterCapacity, BillingFrequency, DeployedFleetContract
} from '../types/crm';

export const INITIAL_CLIENTS: Client[] = [];
export const INITIAL_OPPORTUNITIES: Opportunity[] = [];
export const INITIAL_ACTIVITIES: Activity[] = [];
export const INITIAL_FOLLOWUPS: Followup[] = [];
export const INITIAL_INTERNAL_TASKS: InternalTask[] = [];
export const INITIAL_DOCUMENTS: CRMDocument[] = [];

export const INITIAL_TEAM_MEMBERS: TeamMember[] = [
  {
    id: 'BD-01',
    name: 'Devika Pangam',
    title: 'Managing Director & System Administrator',
    email: 'devika.p@rajmudragroup.com',
    phone: '+91 99999 00000',
    region: 'All Corporate Business Segments & Regions',
    annualTargetINR: 265000000,
    achievedINR: 199700000,
    activeOppsCount: 22,
    avatarBg: '#f59e0b',
    status: 'Active'
  }
];

export const INITIAL_SEGMENTS: BusinessSegment[] = [
  {
    id: 'SEG-01',
    name: 'Employee Transportation',
    category: 'Corporate Mobility',
    targetMarginPct: 22,
    leadOwner: 'Devika Pangam',
    description: 'Corporate employee commute, cab fleet operations, shuttle buses and green EV transport.',
    activeClientsCount: 8,
    pipelineValueINR: 42000000
  },
  {
    id: 'SEG-02',
    name: 'Warehouse Logistics',
    category: 'Supply Chain & 3PL',
    targetMarginPct: 25,
    leadOwner: 'Devika Pangam',
    description: 'Grade-A dedicated warehousing, multi-client distribution centers, WMS software and inventory management.',
    activeClientsCount: 6,
    pipelineValueINR: 58000000
  },
  {
    id: 'SEG-03',
    name: 'Fleet Management',
    category: 'Enterprise Fleet',
    targetMarginPct: 18,
    leadOwner: 'Devika Pangam',
    description: 'Enterprise fleet leasing, telematics, maintenance, fuel management and dedicated corporate drivers.',
    activeClientsCount: 5,
    pipelineValueINR: 28000000
  },
  {
    id: 'SEG-04',
    name: 'Contract Logistics',
    category: 'End-to-End 3PL',
    targetMarginPct: 20,
    leadOwner: 'Devika Pangam',
    description: 'End-to-end 3PL / 4PL long-term contracts, supply chain planning, multimodal transport and packaging.',
    activeClientsCount: 4,
    pipelineValueINR: 34000000
  },
  {
    id: 'SEG-05',
    name: 'Corporate Travel',
    category: 'Executive Mobility',
    targetMarginPct: 28,
    leadOwner: 'Devika Pangam',
    description: 'Executive VIP travel, airport transfers, corporate event logistics and luxury car rentals.',
    activeClientsCount: 7,
    pipelineValueINR: 22000000
  },
  {
    id: 'SEG-06',
    name: 'Supply Chain Solutions',
    category: 'Consulting & Multimodal',
    targetMarginPct: 24,
    leadOwner: 'Devika Pangam',
    description: 'Consulting, network optimization, freight forwarding, customs clearance and port handling.',
    activeClientsCount: 5,
    pipelineValueINR: 48000000
  },
  {
    id: 'SEG-07',
    name: 'Last Mile Delivery',
    category: 'Urban E-commerce',
    targetMarginPct: 16,
    leadOwner: 'Devika Pangam',
    description: 'E-commerce intracity delivery, hyper-local courier, dark store dispatches and return logistics.',
    activeClientsCount: 3,
    pipelineValueINR: 19000000
  },
  {
    id: 'SEG-08',
    name: 'Cold Chain Logistics',
    category: 'Temperature-Controlled',
    targetMarginPct: 26,
    leadOwner: 'Devika Pangam',
    description: 'Temperature-controlled reefer trucks, cold storage, perishable pharma & food distribution.',
    activeClientsCount: 4,
    pipelineValueINR: 36000000
  }
];

export const INITIAL_USERS: User[] = [
  {
    id: 'USR-001',
    employee_id: 'EMP-001',
    name: 'Devika Pangam',
    email: 'devika.p@rajmudragroup.com',
    role: 'System Administrator',
    role_name: 'super_admin',
    department: 'Executive Management & Administration',
    designation: 'Managing Director / System Administrator',
    region: 'All Corporate Business Segments & Regions',
    location: 'Corporate HQ - Mumbai',
    joining_date: '2020-04-01',
    employment_type: 'Full-time',
    is_regional_owner: true,
    annual_target_inr: 265000000,
    achieved_inr: 199700000,
    active_opps_count: 22,
    phone: '+91 99999 00000',
    avatar_bg: '#f59e0b',
    status: 'Active',
    allowed_tabs: [
      'tab-dashboard', 'tab-clients', 'tab-employee-master', 'tab-team', 'tab-employee-profile', 'tab-segments',
      'tab-opportunities', 'tab-calculator', 'tab-activities', 'tab-followups',
      'tab-internal', 'tab-documents', 'tab-review', 'tab-users'
    ]
  }
];

export const PIPELINE_STAGES = [
  'New Enquiry',
  'Initial Contact',
  'Requirement Discussion',
  'Meeting Scheduled',
  'Meeting Completed',
  'Requirement Received',
  'Proposal Under Preparation',
  'Internal Approval Pending',
  'Proposal / Commercial Shared',
  'Client Review',
  'Follow-up',
  'Commercial Negotiation',
  'Final Discussion',
  'Won',
  'Lost',
  'On Hold'
];

export const DOCUMENT_TYPES = [
  'Commercial Proposal PDF',
  'Email Approval PDF',
  'Commercial Rate Card / Quotation',
  'Signed SLA / Master Contract',
  'Technical Scope / Layout PDF',
  'Presentation Pitch Deck',
  'Minutes of Meeting (MOM)',
  'Client Requirement / RFP Scope',
  'Other Document'
];

export const FLEET_SEATER_CAPACITIES: FleetSeaterCapacity[] = [
  '17 Seater – Non AC',
  '17 Seater – AC',
  '32 Seater – Non AC',
  '32 Seater – AC',
  '40 Seater – Non AC',
  '40 Seater – AC',
  '50 Seater – Non AC',
  '50 Seater – AC',
  '17 Seater Urbania',
  '06 Seater – Ertiga',
  '06 Seater – Innova'
];

export const SHIFT_FORMAT_PRESETS = [
  'General Shift (9:00 AM - 6:00 PM)',
  'Morning Shift (6:00 AM - 2:00 PM)',
  'Afternoon Shift (2:00 PM - 10:00 PM)',
  'Night Shift (10:00 PM - 6:00 AM)',
  '24/7 Rotational Roster (3 Shifts)',
  'Split Shift (Morning 7-10 AM & Evening 5-8 PM)',
  'Dedicated Plant Shift (8:00 AM - 4:30 PM)',
  'Executive On-Call / Ad-hoc Roster'
];

export const BILLING_FREQUENCIES: BillingFrequency[] = [
  'Monthly',
  'Quarterly',
  'On call'
];

export const LEAD_SOURCES = [
  'Direct Outreach / Cold BD',
  'Referral / Existing Client',
  'Inbound Website Enquiry',
  'Trade Show / Corporate Expo',
  'Management Reference',
  'LinkedIn BD Campaign',
  'Tender / RFP Portal',
  'Partner Channel'
];

export const INDUSTRIES = [
  'Automotive & Engineering',
  'Information Technology & ITES',
  'Healthcare & Pharma',
  'FMCG & Retail',
  'Manufacturing & Heavy Industry',
  'E-commerce & Logistics',
  'Banking & Financial Services',
  'Consulting & Professional'
];

export const DEPARTMENTS = [
  'Operations',
  'Pricing & Commercials',
  'Management',
  'Finance & Accounts',
  'Legal & Compliance',
  'Fleet / Asset Management',
  'Human Resources',
  'IT & Systems',
  'BD'
];
