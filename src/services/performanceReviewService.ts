/**
 * Performance & Review Service
 * Manages employee appraisal evaluations, KRA/KPI integration, manager ratings,
 * historical review cycles, and multi-department performance analytics.
 */

import { supabase, isSupabaseConfigured } from '../utils/supabaseClient';
import { EmployeePerformanceReview, User as CRMUser } from '../types/crm';
import { logAuditEvent } from './auditService';

export interface PerformanceFilterParams {
  organizationId?: string;
  employeeId?: string;
  department?: string;
  designation?: string;
  financialYear?: string;
  reviewPeriod?: string;
  status?: string;
}

// In-memory cache & fallback seed reviews across all 6 active departments
const mockPerformanceReviews: EmployeePerformanceReview[] = [
  // 1. Business Development - Devika Pangam (Current Q1)
  {
    id: 'pr-bd-devika-26-q1',
    employee_id: 'emp-devika-001',
    organization_id: '00000000-0000-0000-0000-000000000001',
    financial_year: 'FY2026-27',
    review_period: 'Q1 (Apr - Jun)',
    department: 'Business Development',
    designation: 'Head of Business Development',
    overall_score: 96.5,
    kra_achievement_pct: 98.0,
    kpi_achievement_pct: 95.0,
    manager_rating: 4.9,
    performance_status: 'Exceeding Targets',
    reviewer_name: 'Board of Directors',
    reviewer_role: 'Executive Leadership',
    key_strengths: 'Commercial command, 120% pipeline growth, strategic fleet contract closures across West Region.',
    areas_of_improvement: 'Expand high-margin manufacturing corridor shuttle packages.',
    goals_for_next_period: 'Target ₹15 Cr in net new enterprise ARR in Q2.',
    manager_remarks: 'Exceptional executive performance driving Rajmudra commercial expansion.',
    status: 'Finalized',
    review_date: '2026-06-30'
  },
  // 2. Business Development - Devika Pangam (Historical Annual FY25-26)
  {
    id: 'pr-bd-devika-25-annual',
    employee_id: 'emp-devika-001',
    organization_id: '00000000-0000-0000-0000-000000000001',
    financial_year: 'FY2025-26',
    review_period: 'Annual FY25-26',
    department: 'Business Development',
    designation: 'Senior BD Manager',
    overall_score: 94.0,
    kra_achievement_pct: 95.0,
    kpi_achievement_pct: 93.0,
    manager_rating: 4.8,
    performance_status: 'Exceeding Targets',
    reviewer_name: 'Executive Board',
    reviewer_role: 'Management Committee',
    key_strengths: 'Quota over-attainment (118%), excellent client retention, structured deal delegation.',
    areas_of_improvement: 'Standardize SLA documentation uploads during commercial contracting.',
    goals_for_next_period: 'Promoted to Head of Business Development with pan-regional oversight.',
    manager_remarks: 'Outstanding performance recognized with promotion to department leadership.',
    status: 'Finalized',
    review_date: '2026-03-31'
  },
  // 3. Business Development - Rajesh Sharma (Current Q1)
  {
    id: 'pr-bd-rajesh-26-q1',
    employee_id: 'usr-002',
    organization_id: '00000000-0000-0000-0000-000000000001',
    financial_year: 'FY2026-27',
    review_period: 'Q1 (Apr - Jun)',
    department: 'Business Development',
    designation: 'BD Executive',
    overall_score: 88.0,
    kra_achievement_pct: 90.0,
    kpi_achievement_pct: 86.0,
    manager_rating: 4.5,
    performance_status: 'On Track',
    reviewer_name: 'Devika Pangam',
    reviewer_role: 'Head of Business Development',
    key_strengths: 'Active lead pipeline, proactive client demos, strong relationship building.',
    areas_of_improvement: 'Accelerate proposal sign-offs and contract documentation turnaround.',
    goals_for_next_period: 'Close 2 enterprise transport contracts in Hinjawadi IT corridor.',
    manager_remarks: 'Consistent delivery with steady improvement in pipeline velocity.',
    status: 'Finalized',
    review_date: '2026-06-30'
  },
  // 4. Operations - Fleet Operations Specialist (Current Q1)
  {
    id: 'pr-ops-amit-26-q1',
    employee_id: 'usr-ops-001',
    organization_id: '00000000-0000-0000-0000-000000000001',
    financial_year: 'FY2026-27',
    review_period: 'Q1 (Apr - Jun)',
    department: 'Operations',
    designation: 'Operations Manager',
    overall_score: 93.5,
    kra_achievement_pct: 94.0,
    kpi_achievement_pct: 93.0,
    manager_rating: 4.7,
    performance_status: 'On Track',
    reviewer_name: 'Chief Operating Officer',
    reviewer_role: 'VP Operations',
    key_strengths: 'Maintained 99.2% on-time trip arrivals across 240 daily corporate routes.',
    areas_of_improvement: 'Reduce peak-hour SOS turnaround times in North Pune sector.',
    goals_for_next_period: 'Deploy automated GPS telemetry across all subcontractor fleet vehicles.',
    manager_remarks: 'Solid operational leadership with high client transport SLA scores.',
    status: 'Finalized',
    review_date: '2026-06-30'
  },
  // 5. Centralised Operations - Control Tower Specialist (Current Q1)
  {
    id: 'pr-cops-sachin-26-q1',
    employee_id: 'usr-cops-001',
    organization_id: '00000000-0000-0000-0000-000000000001',
    financial_year: 'FY2026-27',
    review_period: 'Q1 (Apr - Jun)',
    department: 'Centralised Operations',
    designation: 'Central Control Tower Supervisor',
    overall_score: 95.0,
    kra_achievement_pct: 96.0,
    kpi_achievement_pct: 94.0,
    manager_rating: 4.8,
    performance_status: 'Exceeding Targets',
    reviewer_name: 'Head of Operations',
    reviewer_role: 'Operations Director',
    key_strengths: 'Fast SOS MTTR (3.8 mins), 100% active GPS tracking coverage, zero SLA escalations.',
    areas_of_improvement: 'Establish cross-training for night-shift emergency response dispatchers.',
    goals_for_next_period: 'Integrate real-time telematics alerts with CorpBD CRM dispatch dashboard.',
    manager_remarks: 'Exemplary command center oversight ensuring employee commute security.',
    status: 'Finalized',
    review_date: '2026-06-30'
  },
  // 6. Maintenance - Chief Maintenance Engineer (Current Q1)
  {
    id: 'pr-maint-ramesh-26-q1',
    employee_id: 'usr-maint-001',
    organization_id: '00000000-0000-0000-0000-000000000001',
    financial_year: 'FY2026-27',
    review_period: 'Q1 (Apr - Jun)',
    department: 'Maintenance',
    designation: 'Chief Maintenance Engineer',
    overall_score: 91.0,
    kra_achievement_pct: 92.0,
    kpi_achievement_pct: 90.0,
    manager_rating: 4.6,
    performance_status: 'On Track',
    reviewer_name: 'Fleet Director',
    reviewer_role: 'VP Fleet & Engineering',
    key_strengths: 'Preventive maintenance compliance reached 98.4%, reducing roadside breakdowns by 22%.',
    areas_of_improvement: 'Improve spare part stock availability for EV 40-seater battery maintenance.',
    goals_for_next_period: 'Establish 4-hour MTTR SLA across all third-party authorized workshops.',
    manager_remarks: 'High fleet reliability supporting seamless commercial daily runs.',
    status: 'Finalized',
    review_date: '2026-06-30'
  },
  // 7. Finance - Senior Billing Specialist (Current Q1)
  {
    id: 'pr-fin-sneha-26-q1',
    employee_id: 'usr-fin-001',
    organization_id: '00000000-0000-0000-0000-000000000001',
    financial_year: 'FY2026-27',
    review_period: 'Q1 (Apr - Jun)',
    department: 'Finance',
    designation: 'Senior Billing & Collections Specialist',
    overall_score: 97.0,
    kra_achievement_pct: 98.0,
    kpi_achievement_pct: 96.0,
    manager_rating: 4.9,
    performance_status: 'Exceeding Targets',
    reviewer_name: 'Chief Financial Officer',
    reviewer_role: 'VP Finance',
    key_strengths: 'Zero billing dispute rate, 99.7% invoice generation accuracy, DSO reduced to 34 days.',
    areas_of_improvement: 'Automate monthly GST reconciliation with electronic dispatch manifests.',
    goals_for_next_period: 'Maintain DSO under 35 days across newly onboarded enterprise contracts.',
    manager_remarks: 'Superb financial discipline with zero audit deviations.',
    status: 'Finalized',
    review_date: '2026-06-30'
  },
  // 8. Legal - Corporate & Contracts Counsel (Current Q1)
  {
    id: 'pr-leg-rohit-26-q1',
    employee_id: 'usr-leg-001',
    organization_id: '00000000-0000-0000-0000-000000000001',
    financial_year: 'FY2026-27',
    review_period: 'Q1 (Apr - Jun)',
    department: 'Legal',
    designation: 'Corporate & Contracts Counsel',
    overall_score: 92.5,
    kra_achievement_pct: 93.0,
    kpi_achievement_pct: 92.0,
    manager_rating: 4.6,
    performance_status: 'On Track',
    reviewer_name: 'General Counsel',
    reviewer_role: 'Head of Legal & Compliance',
    key_strengths: '100% compliance on tripartite vendor agreements, prompt NDA contract turnaround (1.8 days).',
    areas_of_improvement: 'Standardize automated clause library for multi-year lease obligations.',
    goals_for_next_period: 'Complete annual compliance audit for commercial transport motor permits.',
    manager_remarks: 'Thorough risk mitigation and rapid legal advisory support.',
    status: 'Finalized',
    review_date: '2026-06-30'
  }
];

/**
 * Fetch performance reviews filtered by employee, FY, period, department, designation
 */
export async function fetchPerformanceReviews(
  params: PerformanceFilterParams
): Promise<EmployeePerformanceReview[]> {
  if (isSupabaseConfigured()) {
    try {
      let query = (supabase.from('performance_reviews') as any).select('*');

      if (params.organizationId) {
        query = query.eq('organization_id', params.organizationId);
      }
      if (params.employeeId) {
        query = query.eq('employee_id', params.employeeId);
      }
      if (params.department && params.department !== 'All') {
        query = query.eq('department', params.department);
      }
      if (params.financialYear && params.financialYear !== 'All') {
        query = query.eq('financial_year', params.financialYear);
      }
      if (params.reviewPeriod && params.reviewPeriod !== 'All') {
        query = query.eq('review_period', params.reviewPeriod);
      }
      if (params.status && params.status !== 'All') {
        query = query.eq('status', params.status);
      }

      const { data, error } = await query.order('review_date', { ascending: false });

      if (!error && data && data.length > 0) {
        return data as EmployeePerformanceReview[];
      }
    } catch (err) {
      console.warn('Supabase performance_reviews fetch error, using cache:', err);
    }
  }

  // Fallback in-memory filtered reviews
  return mockPerformanceReviews.filter((r) => {
    if (params.employeeId && r.employee_id !== params.employeeId && !r.id.includes(params.employeeId)) {
      return false;
    }
    if (params.department && params.department !== 'All' && r.department.toLowerCase() !== params.department.toLowerCase()) {
      return false;
    }
    if (params.designation && params.designation !== 'All' && r.designation.toLowerCase() !== params.designation.toLowerCase()) {
      return false;
    }
    if (params.financialYear && params.financialYear !== 'All' && r.financial_year !== params.financialYear) {
      return false;
    }
    if (params.reviewPeriod && params.reviewPeriod !== 'All' && r.review_period !== params.reviewPeriod) {
      return false;
    }
    if (params.status && params.status !== 'All' && r.status !== params.status) {
      return false;
    }
    return true;
  });
}

/**
 * Fetch all reviews for a specific employee across all historical periods
 */
export async function fetchEmployeeReviewHistory(
  employeeId: string,
  employeeEmail?: string,
  employeeDepartment?: string
): Promise<EmployeePerformanceReview[]> {
  const reviews = await fetchPerformanceReviews({ employeeId });
  if (reviews.length > 0) return reviews;

  // Fallback match by department or mock identifier
  return mockPerformanceReviews.filter((r) => {
    if (r.employee_id === employeeId) return true;
    if (employeeEmail && employeeEmail.toLowerCase().startsWith('devika') && r.employee_id.includes('devika')) return true;
    if (employeeEmail && employeeEmail.toLowerCase().startsWith('rajesh') && r.employee_id.includes('usr-002')) return true;
    if (employeeDepartment && r.department.toLowerCase() === employeeDepartment.toLowerCase()) return true;
    return false;
  });
}

/**
 * Create or save a new Performance Appraisal Evaluation
 */
export async function createPerformanceReview(
  data: Omit<EmployeePerformanceReview, 'id' | 'created_at' | 'updated_at'>,
  evaluator?: { id?: string; name?: string; organizationId?: string }
): Promise<EmployeePerformanceReview> {
  const newReview: EmployeePerformanceReview = {
    ...data,
    id: `pr-${Date.now()}`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured()) {
    try {
      const { data: inserted, error } = await (supabase.from('performance_reviews') as any)
        .upsert([data], { onConflict: 'employee_id,financial_year,review_period' })
        .select()
        .single();

      if (!error && inserted) {
        // Log Audit Event
        await logAuditEvent({
          organizationId: data.organization_id || evaluator?.organizationId,
          userId: evaluator?.id,
          userName: evaluator?.name || data.reviewer_name,
          action: 'CAREER_EVENT_CREATED',
          entityType: 'performance_reviews',
          entityId: inserted.id,
          newValues: {
            employee_id: data.employee_id,
            financial_year: data.financial_year,
            review_period: data.review_period,
            overall_score: data.overall_score,
            manager_rating: data.manager_rating,
            performance_status: data.performance_status
          }
        });

        return inserted as EmployeePerformanceReview;
      }
    } catch (err) {
      console.warn('Supabase performance_reviews insert error, storing in cache:', err);
    }
  }

  // In-memory update
  const existingIndex = mockPerformanceReviews.findIndex(
    (r) => r.employee_id === data.employee_id && r.financial_year === data.financial_year && r.review_period === data.review_period
  );
  if (existingIndex >= 0) {
    mockPerformanceReviews[existingIndex] = { ...mockPerformanceReviews[existingIndex], ...newReview };
  } else {
    mockPerformanceReviews.unshift(newReview);
  }

  return newReview;
}
