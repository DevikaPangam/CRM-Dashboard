export type CurrencyMode = 'INR' | 'USD';

export type UserRole = 'System Administrator' | 'BD Manager' | 'BD Executive' | 'Management Reviewer' | 'Viewer';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  role_name?: string;
  status: 'Active' | 'Inactive';
  allowed_tabs: string[];
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
  status: 'Active' | 'Prospect' | 'Dormant' | 'Blacklisted';
  accountOwner: string;
  website?: string;
  address?: string;
  createdDate: string;
  contacts: ClientContact[];
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

export interface FilterState {
  financialYear: string;
  period: string;
  bdOwner: string;
  segment: string;
  region: string;
  searchQuery: string;
}
