/**
 * Supabase Database TypeScript Schema Definitions
 * Auto-aligned with PostgreSQL Migration 20260909000001_initial_multi_org_schema.sql
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRoleEnum =
  | 'super_admin'
  | 'bd_director'
  | 'bd_manager'
  | 'bd_sr_exec'
  | 'bd_exec'
  | 'operations_manager'
  | 'cops_supervisor'
  | 'maintenance_engineer'
  | 'finance_executive'
  | 'legal_counsel'
  | 'management_viewer'
  | 'analyst';

export type PermissionActionEnum =
  | 'view'
  | 'create'
  | 'edit'
  | 'delete'
  | 'export'
  | 'approve'
  | 'assign'
  | 'admin';

export type CRMModuleKey =
  | 'dashboard'
  | 'clients'
  | 'team'
  | 'segments'
  | 'opportunities'
  | 'calculator'
  | 'activities'
  | 'followups'
  | 'internal'
  | 'documents'
  | 'review'
  | 'users';

export type UserStatusEnum = 'active' | 'inactive' | 'suspended' | 'pending_invite';

export type ClientTierEnum = 'Tier 1 (Enterprise)' | 'Tier 2 (Mid-Market)' | 'Tier 3 (Emerging)';

export type ClientStatusEnum = 'Active' | 'Prospect' | 'Dormant' | 'Blacklisted';

export type OpportunityStageEnum =
  | 'Lead / Inception'
  | 'Discovery & Requirement'
  | 'Proposal Formulation'
  | 'Commercial Discussion'
  | 'Executive Review'
  | 'Negotiation & Legal'
  | 'Closed Won'
  | 'Closed Lost'
  | 'On Hold';

export type OpportunityStatusEnum = 'Open' | 'In Process' | 'Won' | 'Lost' | 'On Hold' | 'Closed';

export type ContractTypeEnum =
  | 'Monthly Retainer'
  | 'Annual Contract'
  | 'Project Based'
  | 'Ad-hoc Transaction'
  | 'Tripartite SLA';

export type ActivityTypeEnum =
  | 'Physical Meeting'
  | 'Phone Call'
  | 'Proposal Discussion'
  | 'Commercial Negotiation'
  | 'Client Review'
  | 'Site Visit'
  | 'Email Communication'
  | 'Demo Presentation';

export type FollowupPriorityEnum = 'High' | 'Medium' | 'Low' | 'Urgent';

export type FollowupStatusEnum = 'Pending' | 'In Progress' | 'Completed' | 'Overdue' | 'Cancelled';

export type DelegationDeptEnum =
  | 'Operations'
  | 'Pricing & Commercials'
  | 'Management'
  | 'Finance & Accounts'
  | 'Legal & Compliance'
  | 'Fleet / Asset Management'
  | 'Human Resources'
  | 'IT & Systems'
  | 'BD';

export type DelegationStatusEnum =
  | 'Pending Action'
  | 'In Review'
  | 'Approved & Handed Off'
  | 'Action Completed'
  | 'Escalated'
  | 'Rejected';

export type ApprovalStatusEnum = 'Draft' | 'Pending Approval' | 'Approved' | 'Rejected' | 'Revised';

export type NotificationTypeEnum =
  | 'deal_assigned'
  | 'deal_stage_changed'
  | 'approval_requested'
  | 'approval_decision'
  | 'followup_due'
  | 'followup_overdue'
  | 'document_uploaded'
  | 'system_alert';

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string;
          name: string;
          slug: string;
          legal_entity_name: string | null;
          gstin: string | null;
          cin: string | null;
          primary_domain: string | null;
          logo_url: string | null;
          is_active: boolean;
          subscription_tier: string;
          settings: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['organizations']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['organizations']['Insert']>;
      };

      regions: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          code: string;
          description: string | null;
          regional_head_id: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['regions']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['regions']['Insert']>;
      };

      teams: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          code: string;
          department: DelegationDeptEnum;
          region: string;
          region_id: string | null;
          leader_id: string | null;
          annual_target_inr: number;
          description: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['teams']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['teams']['Insert']>;
      };

      profiles: {
        Row: {
          id: string;
          organization_id: string;
          full_name: string;
          email: string;
          role: UserRoleEnum;
          department: string;
          designation: string | null;
          employee_id: string | null;
          phone: string | null;
          avatar_url: string | null;
          avatar_bg: string | null;
          team_id: string | null;
          manager_id: string | null;
          status: UserStatusEnum;
          region: string;
          region_id: string | null;
          location: string | null;
          joining_date: string | null;
          employment_type: 'Full-time' | 'Contract' | 'Probation' | 'Part-time';
          is_regional_owner: boolean;
          allowed_segments: string[];
          annual_target_inr: number;
          last_login_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at' | 'updated_at'> & {
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
      };

      role_permissions: {
        Row: {
          id: string;
          organization_id: string;
          role: UserRoleEnum;
          module_key: string;
          module_name: string;
          action: PermissionActionEnum;
          is_allowed: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['role_permissions']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['role_permissions']['Insert']>;
      };

      clients: {
        Row: {
          id: string;
          organization_id: string;
          client_code: string;
          client_name: string;
          client_type: 'New Client' | 'Existing Client';
          industry: string;
          segment: string;
          city: string;
          state: string;
          region: 'North' | 'South' | 'East' | 'West' | 'Central';
          tier: ClientTierEnum;
          turnover_cr: number;
          employees: number;
          status: ClientStatusEnum;
          owner_id: string | null;
          team_id: string | null;
          website: string | null;
          address: string | null;
          deployed_fleets: Json;
          agreement_doc_url: string | null;
          agreement_doc_name: string | null;
          agreement_upload_date: string | null;
          notes: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['clients']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['clients']['Insert']>;
      };

      contacts: {
        Row: {
          id: string;
          organization_id: string;
          client_id: string;
          name: string;
          designation: string | null;
          email: string | null;
          phone: string | null;
          linkedin_url: string | null;
          is_primary: boolean;
          department: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['contacts']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['contacts']['Insert']>;
      };

      opportunities: {
        Row: {
          id: string;
          organization_id: string;
          opportunity_code: string;
          title: string;
          client_id: string;
          segment: string;
          service_category: string;
          contract_type: ContractTypeEnum;
          deal_value_inr: number;
          monthly_value_inr: number;
          stage: OpportunityStageEnum;
          probability: number;
          status: OpportunityStatusEnum;
          owner_id: string | null;
          team_id: string | null;
          lead_source: string;
          expected_close_date: string | null;
          last_activity_date: string;
          next_followup_date: string | null;
          fleet_size: number | null;
          vehicle_type: string | null;
          locations: string | null;
          competition: string | null;
          win_probability_notes: string | null;
          lost_reason: string | null;
          lost_remarks: string | null;
          internal_approvals_required: boolean;
          approval_status: ApprovalStatusEnum;
          approved_by: string | null;
          approved_date: string | null;
          approval_remarks: string | null;
          delegated_department: DelegationDeptEnum;
          delegated_owner_id: string | null;
          delegation_status: DelegationStatusEnum;
          delegation_milestone: string | null;
          sla_days_remaining: number | null;
          delegation_remarks: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['opportunities']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['opportunities']['Insert']>;
      };

      activities: {
        Row: {
          id: string;
          organization_id: string;
          client_id: string;
          opportunity_id: string | null;
          type: ActivityTypeEnum;
          subject: string;
          activity_date: string;
          activity_time: string | null;
          conducted_by: string;
          contact_person: string;
          contact_id: string | null;
          location: string | null;
          key_discussion: string;
          outcome: string;
          action_items: string | null;
          next_followup_date: string | null;
          status: 'Completed' | 'Scheduled' | 'Cancelled';
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['activities']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['activities']['Insert']>;
      };

      followups: {
        Row: {
          id: string;
          organization_id: string;
          client_id: string;
          opportunity_id: string | null;
          activity_id: string | null;
          assigned_to: string;
          due_date: string;
          type: string;
          priority: FollowupPriorityEnum;
          description: string;
          status: FollowupStatusEnum;
          completed_date: string | null;
          remarks: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['followups']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['followups']['Insert']>;
      };

      documents: {
        Row: {
          id: string;
          organization_id: string;
          client_id: string | null;
          opportunity_id: string | null;
          name: string;
          original_filename: string;
          storage_path: string;
          storage_bucket: string;
          document_type: string;
          stage: OpportunityStageEnum;
          file_size_bytes: number;
          file_extension: string;
          mime_type: string | null;
          uploaded_by: string;
          metadata: Json;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['documents']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['documents']['Insert']>;
      };

      proposals: {
        Row: {
          id: string;
          organization_id: string;
          proposal_number: string;
          client_id: string;
          opportunity_id: string | null;
          owner_id: string;
          version: number;
          title: string;
          pricing_data: Json;
          total_monthly_quote_inr: number;
          total_annual_quote_inr: number;
          projected_margin_pct: number;
          approval_status: ApprovalStatusEnum;
          approved_by: string | null;
          approved_at: string | null;
          approval_remarks: string | null;
          valid_until: string | null;
          pdf_storage_path: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['proposals']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['proposals']['Insert']>;
      };

      audit_logs: {
        Row: {
          id: string;
          organization_id: string;
          user_id: string | null;
          user_name: string | null;
          action: string;
          entity_type: string;
          entity_id: string;
          old_values: Json | null;
          new_values: Json | null;
          metadata: Json;
          ip_address: string | null;
          user_agent: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['audit_logs']['Row'], 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['audit_logs']['Insert']>;
      };

      notifications: {
        Row: {
          id: string;
          organization_id: string;
          user_id: string;
          type: NotificationTypeEnum;
          title: string;
          message: string;
          link_tab: string | null;
          link_entity_id: string | null;
          is_read: boolean;
          read_at: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['notifications']['Row'], 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['notifications']['Insert']>;
      };

      employee_history: {
        Row: {
          id: string;
          employee_id: string;
          organization_id: string;
          event_type: string;
          effective_date: string;
          title: string;
          description?: string | null;
          previous_value?: Json | null;
          new_value?: Json | null;
          designation_before?: string | null;
          designation_after?: string | null;
          department_before?: string | null;
          department_after?: string | null;
          team_before?: string | null;
          team_after?: string | null;
          region_before?: string | null;
          region_after?: string | null;
          manager_before?: string | null;
          manager_after?: string | null;
          location_before?: string | null;
          location_after?: string | null;
          created_by?: string | null;
          created_by_name?: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['employee_history']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['employee_history']['Insert']>;
      };

      departments: {
        Row: {
          id: string;
          organization_id: string;
          department_name: string;
          department_code: string;
          description?: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['departments']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['departments']['Insert']>;
      };

      segments: {
        Row: {
          id: string;
          organization_id: string;
          segment_code: string;
          name: string;
          category: string;
          target_margin_pct: number;
          lead_owner: string;
          description: string | null;
          active_clients_count: number;
          pipeline_value_inr: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['segments']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['segments']['Insert']>;
      };

      internal_tasks: {
        Row: {
          id: string;
          organization_id: string;
          opportunity_id: string | null;
          client_id: string | null;
          task_code: string | null;
          title: string;
          department: string;
          assigned_to: string;
          assigned_by: string;
          due_date: string;
          priority: string;
          status: string;
          request_details: string | null;
          response_notes: string | null;
          action_date: string | null;
          approval_remarks: string | null;
          approved_by: string | null;
          approved_at: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['internal_tasks']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['internal_tasks']['Insert']>;
      };

      employee_kras: {
        Row: {
          id: string;
          organization_id: string;
          employee_id: string;
          department: string;
          name: string;
          category: string;
          description: string | null;
          weightage_pct: number;
          score_pct: number;
          status: string;
          financial_year: string;
          review_period: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['employee_kras']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['employee_kras']['Insert']>;
      };

      employee_kpis: {
        Row: {
          id: string;
          organization_id: string;
          employee_id: string;
          kra_id: string;
          title: string;
          description: string | null;
          metric_type: string;
          unit: string;
          target_value: number;
          actual_value: number;
          achievement_pct: number;
          weightage_pct: number;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['employee_kpis']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['employee_kpis']['Insert']>;
      };

      employee_performance_reviews: {
        Row: {
          id: string;
          organization_id: string;
          employee_id: string;
          reviewer_id: string | null;
          financial_year: string;
          quarter: string;
          overall_score: number;
          rating_band: string;
          status: string;
          strengths: string | null;
          improvements: string | null;
          final_remarks: string | null;
          review_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['employee_performance_reviews']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['employee_performance_reviews']['Insert']>;
      };
    };
  };
}

