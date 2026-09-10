export type CurrencyMode = 'INR' | 'USD';

export type UserRole = 'System Administrator' | 'BD Manager' | 'BD Executive' | 'Management Reviewer' | 'Viewer';

export interface SegmentPermission {
  segmentKey: string;
  segmentLabel: string;
  canView: boolean;
  canAdd: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canExport: boolean;
}

export interface User {
  id: string; // Auth User ID / Supabase UUID
  employee_id?: string; // e.g. 'EMP-001'
  name: string; // Full Name
  email: string; // Corporate Email (@rajmudragroup.com)
  organization_id?: string; // Tenant Organization UUID
  role: UserRole; // Display Role
  role_name?: string; // DB System Role Enum (e.g. 'super_admin', 'bd_manager')
  department?: string; // Department (e.g. 'Business Development')
  department_id?: string; // Normalized Department UUID
  designation?: string; // Job Title / Designation
  region?: string; // Primary Region Name (e.g. 'West Region', 'North Region')
  region_id?: string; // Normalized Region UUID
  location?: string; // Base Location / Branch (e.g. 'Corporate HQ - Mumbai')
  joining_date?: string; // Company Employment Start Date (YYYY-MM-DD)
  employment_type?: 'Full-time' | 'Contract' | 'Probation' | 'Part-time'; // Employment Category
  is_regional_owner?: boolean; // Flag for Regional Territory Ownership
  team_id?: string; // Assigned Team UUID
  team_name?: string; // Assigned Team Name
  manager_id?: string; // Reporting Manager UUID
  manager_name?: string; // Reporting Manager Full Name
  status: 'Active' | 'Invited' | 'On Leave' | 'Inactive' | 'Exited' | 'Disabled'; // Account & Employee Status
  annual_target_inr?: number; // Annual BD Revenue Target Quota (INR)
  achieved_inr?: number; // YTD Won Revenue
  active_opps_count?: number; // Active Opportunities Count
  phone?: string; // Contact Phone Number
  avatar_url?: string; // Avatar Image URL
  avatar_bg?: string; // Avatar Color Token
  allowed_tabs: string[]; // RBAC Accessible Tab Modules
  permissions?: SegmentPermission[]; // Granular Module / Segment Permissions
  created_at?: string; // Creation Timestamp
  updated_at?: string; // Last Updated Timestamp
}

export interface Region {
  id: string;
  organization_id?: string;
  name: string;
  code: string;
  description?: string;
  regional_head_id?: string;
  regional_head_name?: string;
  is_active?: boolean;
}

export interface DepartmentMaster {
  id: string;
  organization_id: string;
  department_name: string;
  department_code: string;
  description?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface TeamHierarchyItem {
  id: string;
  name: string;
  code: string;
  region_id?: string;
  region?: string;
  department?: string;
  department_id?: string;
  department_code?: string;
  leader_id?: string;
  annual_target_inr?: number;
  description?: string;
  is_active?: boolean;
}

export type FleetSeaterCapacity =
  | '17 Seater – Non AC'
  | '17 Seater – AC'
  | '32 Seater – Non AC'
  | '32 Seater – AC'
  | '40 Seater – Non AC'
  | '40 Seater – AC'
  | '50 Seater – Non AC'
  | '50 Seater – AC'
  | '17 Seater Urbania'
  | '06 Seater – Ertiga'
  | '06 Seater – Innova';

export type BillingFrequency = 'Monthly' | 'Quarterly' | 'On call';

export interface DeployedFleetContract {
  id: string;
  seaterCapacity: FleetSeaterCapacity;
  vehicleCount: number;
  shiftFormat: string; // e.g. 'General Shift (9 AM - 6 PM)', 'Morning Shift (6 AM - 2 PM)', '24/7 Rotational Roster (3 Shifts)'
  location: string;
  monthlyRatePerVehicleINR: number;
  totalMonthlyBillingINR: number;
  billingFrequency: BillingFrequency;
  extraKmRateINR?: number;
  extraHourRateINR?: number;
  tollParking?: 'Inclusive' | 'Exclusive / At Actuals';
  contractStartDate?: string;
  contractEndDate?: string;
  status: 'Active' | 'Under Renewal' | 'Expired' | 'Pending Signature';
  agreementDocumentName?: string;
  agreementDocumentSize?: string;
  agreementDocumentUrl?: string;
  agreementUploadDate?: string;
  notes?: string;
}

export interface ClientContact {
  id: string;
  name: string;
  designation: string;
  email: string;
  phone: string;
  isPrimary?: boolean;
}

export type ClientType = 'New Client' | 'Existing Client';
export type ClientStatus = 'Active' | 'Prospect' | 'Dormant' | 'Blacklisted';

export interface Client {
  id: string;
  code: string;
  name: string;
  clientType: ClientType;
  industry: string;
  segment: string;
  city: string;
  state: string;
  region: 'North' | 'South' | 'East' | 'West' | 'Central';
  tier: 'Tier 1 (Enterprise)' | 'Tier 2 (Mid-Market)' | 'Tier 3 (Emerging)';
  turnoverCr: number;
  employees: number;
  status: ClientStatus;
  accountOwner: string;
  website?: string;
  address?: string;
  createdDate: string;
  contacts: ClientContact[];
  deployedFleets?: DeployedFleetContract[];
  agreementDocumentName?: string;
  agreementDocumentSize?: string;
  agreementDocumentUrl?: string;
  agreementUploadDate?: string;
  notes?: string;
}

export interface OpportunityStage {
  id: number;
  name: string;
  defaultProb: number;
  category: 'lead' | 'discussion' | 'proposal' | 'review' | 'negotiation' | 'won' | 'lost' | 'hold';
}

export interface DelegationStep {
  step: string;
  department: string;
  owner: string;
  status: 'Pending' | 'In Progress' | 'Approved' | 'Completed' | 'Rejected';
  targetDate: string;
  notes?: string;
  approvalRemarks?: string;
}

export interface Opportunity {
  id: string;
  code: string;
  title: string;
  clientId: string;
  clientName: string;
  clientType?: ClientType;
  segment: string;
  serviceCategory: string;
  contractType: 'Monthly Retainer' | 'Annual Contract' | 'Project Based' | 'Ad-hoc Transaction';
  dealValueINR: number;
  monthlyValueINR: number;
  stage: string;
  probability: number;
  status: 'Open' | 'In Process' | 'Won' | 'Lost' | 'On Hold' | 'Closed';
  owner: string;
  leadSource: string;
  expectedCloseDate: string;
  createdDate: string;
  lastActivityDate: string;
  nextFollowupDate: string;
  fleetSize?: number;
  vehicleType?: string;
  locations?: string;
  competition?: string;
  winProbabilityNotes?: string;
  lostReason?: string;
  lostRemarks?: string;
  internalApprovalsRequired?: boolean;
  notes?: string;

  // Approvals & Governance
  approvalStatus?: 'Pending' | 'Approved' | 'Rejected' | 'Not Required';
  approvalRemarks?: string;
  approvedBy?: string;
  approvedDate?: string;

  // Delegation Matrix
  delegatedDepartment: 'Operations' | 'Pricing & Commercials' | 'Management' | 'Finance & Accounts' | 'Legal & Compliance' | 'Fleet / Asset Management' | 'BD';
  delegatedOwner: string;
  delegationStatus: 'Pending Action' | 'In Review' | 'Approved & Handed Off' | 'Action Completed' | 'Escalated' | 'Rejected';
  delegationMilestone: string;
  slaDaysRemaining: number;
  delegationRemarks?: string;
}

export interface Activity {
  id: string;
  type: 'Physical Meeting' | 'Phone Call' | 'Proposal Discussion' | 'Commercial Negotiation' | 'Client Review' | 'Site Visit' | 'Email Communication';
  clientId: string;
  clientName: string;
  clientType?: ClientType;
  opportunityId?: string;
  opportunityTitle?: string;
  date: string;
  time?: string;
  conductedBy: string;
  contactPerson: string;
  location?: string;
  keyDiscussion: string;
  outcome: string;
  actionItems: string;
  nextFollowupDate?: string;
  status: 'Completed' | 'Scheduled' | 'Cancelled';
}

export interface Followup {
  id: string;
  clientId: string;
  clientName: string;
  clientType?: ClientType;
  opportunityId?: string;
  opportunityTitle?: string;
  dueDate: string;
  assignedTo: string;
  type: string;
  priority: 'High' | 'Medium' | 'Low';
  description: string;
  status: 'Pending' | 'Completed' | 'Overdue' | 'Cancelled';
  completedDate?: string;
  remarks?: string;
}

export interface InternalTask {
  id: string;
  department: 'Operations' | 'Pricing & Commercials' | 'Management' | 'Finance & Accounts' | 'Legal & Compliance' | 'Fleet / Asset Management' | 'Human Resources' | 'IT & Systems';
  title: string;
  clientId?: string;
  clientName?: string;
  opportunityId?: string;
  opportunityTitle?: string;
  assignedTo: string;
  assignedBy: string;
  dueDate: string;
  priority: 'Urgent' | 'High' | 'Medium' | 'Low';
  status: 'Pending' | 'In Progress' | 'Approved' | 'Rejected' | 'Completed';
  requestDetails: string;
  responseNotes?: string;
  actionDate?: string;
  approvalRemarks?: string;
  approvedBy?: string;
  approvedDate?: string;
}

export interface CRMDocument {
  id: string;
  name: string; // Editable file name
  originalFilename?: string;
  opportunityId?: string;
  opportunityTitle?: string;
  clientId?: string;
  clientName?: string;
  stage: string;
  documentType: string;
  fileSize: string;
  fileExtension: string;
  uploadedBy: string;
  uploadedDate: string;
  notes?: string;
}

export interface TeamMember {
  id: string;
  name: string;
  title: string;
  email: string;
  phone: string;
  region: string;
  annualTargetINR: number;
  achievedINR: number;
  activeOppsCount: number;
  avatarBg?: string;
  status: 'Active' | 'Inactive' | 'Disabled';
  employee_id?: string;
  team_id?: string;
  team_name?: string;
  manager_id?: string;
  manager_name?: string;
  is_regional_owner?: boolean;
  joining_date?: string;
  location?: string;
  employment_type?: string;
}

export interface BusinessSegment {
  id: string;
  name: string;
  category: string;
  targetMarginPct: number;
  leadOwner: string;
  description: string;
  activeClientsCount: number;
  pipelineValueINR: number;
}

export type EmployeeEventType =
  | 'joining'
  | 'promotion'
  | 'designation_change'
  | 'department_change'
  | 'team_change'
  | 'region_change'
  | 'manager_change'
  | 'location_change'
  | 'responsibility_change'
  | 'achievement'
  | 'award'
  | 'training'
  | 'certification'
  | 'other';

export interface EmployeeHistoryEvent {
  id: string;
  employee_id: string;
  organization_id?: string;
  event_type: EmployeeEventType;
  effective_date: string;
  title: string;
  description?: string;
  previous_value?: Record<string, any>;
  new_value?: Record<string, any>;
  designation_before?: string;
  designation_after?: string;
  department_before?: string;
  department_after?: string;
  team_before?: string;
  team_after?: string;
  region_before?: string;
  region_after?: string;
  manager_before?: string;
  manager_after?: string;
  location_before?: string;
  location_after?: string;
  created_by?: string;
  created_by_name?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CareerTrajectoryMilestone {
  id: string;
  date: string;
  type: 'Joining' | 'Promotion' | 'Role Change' | 'Territory Transfer' | 'Award' | 'Probation Completed' | 'Certification';
  title: string;
  description: string;
  designationBefore?: string;
  designationAfter?: string;
  departmentBefore?: string;
  departmentAfter?: string;
  promotedBy?: string;
}

export interface EmployeeKPI {
  id: string;
  organization_id?: string;
  employee_id: string;
  employee_kra_id: string;
  kpi_definition_id?: string;
  name: string;
  description?: string;
  kpi_type: 'higher_is_better' | 'lower_is_better' | 'target_range' | 'percentage' | 'numeric' | 'currency' | 'count' | 'boolean_completion';
  unit: string;
  target_value: number;
  actual_value: number;
  target_range_min?: number;
  target_range_max?: number;
  target_display?: string;
  actual_display?: string;
  weightage_pct: number;
  achievement_pct: number;
  score: number;
  status: 'Exceeded' | 'On Track' | 'Needs Improvement' | 'At Risk';
  manager_comment?: string;
  employee_comment?: string;
  financial_year?: string;
  review_period?: string;
  created_at?: string;
  updated_at?: string;
}

export interface EmployeeKRA {
  id: string;
  organization_id?: string;
  employee_id: string;
  kra_definition_id?: string;
  department: string;
  name: string;
  category: string;
  description?: string;
  weightage_pct: number;
  score_pct: number;
  status: 'Exceeded' | 'On Track' | 'Needs Improvement' | 'At Risk' | 'Finalized';
  financial_year: string;
  review_period: string;
  kpis?: EmployeeKPI[];
  created_at?: string;
  updated_at?: string;
}

export interface KRAItem {
  id: string;
  category: string;
  title: string;
  description: string;
  weightPct: number; // e.g. 35%
  targetMetric: string; // e.g. "₹2.5 Cr Revenue"
  achievedMetric: string; // e.g. "₹2.1 Cr Revenue"
  scorePct: number; // e.g. 84%
  status: 'Exceeded' | 'On Track' | 'Needs Improvement' | 'At Risk';
  kpis?: EmployeeKPI[];
}

export interface PerformanceReviewItem {
  id: string;
  reviewPeriod: string; // e.g. "FY 2025-26 Q3", "Annual Review 2025"
  reviewDate: string;
  reviewerName: string;
  reviewerRole: string;
  overallRating: number; // 1.0 to 5.0
  quotaTargetINR?: number;
  quotaAchievedINR?: number;
  dealsWonCount?: number;
  overallScore?: number; // 0-100
  kraAchievementPct?: number;
  kpiAchievementPct?: number;
  performanceStatus?: 'Exceeding Targets' | 'On Track' | 'Needs Improvement' | 'At Risk';
  department?: string;
  designation?: string;
  keyStrengths: string;
  areasOfImprovement: string;
  goalsForNextPeriod: string;
  managerRemarks?: string;
  employeeRemarks?: string;
  status: 'Finalized' | 'Draft' | 'Submitted' | 'Approved' | 'Employee Acknowledged';
}

export interface EmployeePerformanceReview {
  id: string;
  employee_id: string;
  organization_id?: string;
  financial_year: string;
  review_period: string;
  department: string;
  designation: string;
  overall_score: number; // 0 - 100
  kra_achievement_pct: number;
  kpi_achievement_pct: number;
  manager_rating: number; // 1.0 - 5.0
  self_rating?: number;
  performance_status: 'Exceeding Targets' | 'On Track' | 'Needs Improvement' | 'At Risk';
  reviewer_id?: string;
  reviewer_name: string;
  reviewer_role: string;
  key_strengths: string;
  areas_of_improvement: string;
  goals_for_next_period: string;
  manager_remarks?: string;
  employee_remarks?: string;
  status: 'Draft' | 'Submitted' | 'Finalized' | 'Approved';
  review_date: string;
  created_at?: string;
  updated_at?: string;
}

export interface FilterState {
  financialYear: string;
  period: string;
  bdOwner: string;
  segment: string;
  region: string;
  searchQuery: string;
}

