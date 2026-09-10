/**
 * KRA & KPI Service
 * Handles Department-Specific Key Result Areas (KRAs) and Key Performance Indicators (KPIs)
 * for all 6 active departments (BD, Operations, Centralised Operations, Maintenance, Finance, Legal).
 */

import { supabase, isSupabaseConfigured } from '../utils/supabaseClient';
import { EmployeeKRA, EmployeeKPI, User } from '../types/crm';
import { calculateKPIAchievement, formatKPIValue, KPIType } from '../utils/kpiCalculationEngine';
import { logAuditEvent } from './auditService';

const KRA_STORAGE_KEY = 'corpbd_employee_kras_v1';
const KPI_STORAGE_KEY = 'corpbd_employee_kpis_v1';

/**
 * Generate standard default KRAs & KPIs based on employee's department.
 */
export function generateDefaultKRAsForDepartment(
  employee: User,
  financialYear: string = 'FY2026-27',
  reviewPeriod: string = 'Annual FY26-27'
): EmployeeKRA[] {
  const dept = (employee.department || 'Business Development').trim().toLowerCase();
  const orgId = employee.organization_id || '00000000-0000-0000-0000-000000000001';

  // 1. OPERATIONS
  if (dept === 'operations' || dept === 'ops') {
    const kra1Id = `kra-ops-1-${employee.id}`;
    const kra2Id = `kra-ops-2-${employee.id}`;
    const kra3Id = `kra-ops-3-${employee.id}`;
    const kra4Id = `kra-ops-4-${employee.id}`;

    return [
      {
        id: kra1Id,
        organization_id: orgId,
        employee_id: employee.id,
        department: 'Operations',
        name: 'Trip SLA Compliance & Punctuality',
        category: 'Operational Efficiency',
        description: 'Ensure staff pickup/drop routes execute with 98%+ on-time punctuality without trip delays.',
        weightage_pct: 35,
        score_pct: 94,
        status: 'On Track',
        financial_year: financialYear,
        review_period: reviewPeriod,
        kpis: [
          createKPI(
            `kpi-ops-1-${employee.id}`,
            employee.id,
            kra1Id,
            'On-Time Trip Arrival Rate',
            'percentage of trips arriving at client site within 5-minute scheduled window',
            'percentage',
            '%',
            98,
            97.4,
            20
          ),
          createKPI(
            `kpi-ops-2-${employee.id}`,
            employee.id,
            kra1Id,
            'Trip Delay Incident Frequency',
            'Total monthly customer-reported pickup delay incidents (lower is better)',
            'lower_is_better',
            'Incidents',
            4,
            2,
            15
          ),
        ],
      },
      {
        id: kra2Id,
        organization_id: orgId,
        employee_id: employee.id,
        department: 'Operations',
        name: 'Fuel & Fleet Running Cost Control',
        category: 'Cost Control',
        description: 'Optimize vehicle routing, minimize empty dead kilometers, and reduce fuel cost overruns.',
        weightage_pct: 25,
        score_pct: 91,
        status: 'On Track',
        financial_year: financialYear,
        review_period: reviewPeriod,
        kpis: [
          createKPI(
            `kpi-ops-3-${employee.id}`,
            employee.id,
            kra2Id,
            'Fuel Variance vs Standard Benchmark',
            'Percentage deviation in actual diesel/CNG consumption against standard route benchmark',
            'lower_is_better',
            '%',
            5.0,
            3.8,
            15
          ),
          createKPI(
            `kpi-ops-4-${employee.id}`,
            employee.id,
            kra2Id,
            'Dead Kilometer Ratio',
            'Unloaded kilometers traveled between depot and client pickup points',
            'lower_is_better',
            '%',
            8.0,
            6.5,
            10
          ),
        ],
      },
      {
        id: kra3Id,
        organization_id: orgId,
        employee_id: employee.id,
        department: 'Operations',
        name: 'Driver Roster & Shift Adherence',
        category: 'Driver Management',
        description: 'Maintain zero unexcused driver absences, strict uniform hygiene, and timely shift changeovers.',
        weightage_pct: 20,
        score_pct: 96,
        status: 'Exceeded',
        financial_year: financialYear,
        review_period: reviewPeriod,
        kpis: [
          createKPI(
            `kpi-ops-5-${employee.id}`,
            employee.id,
            kra3Id,
            'Driver Shift Attendance & Punctuality',
            'Percentage of designated roster shifts staffed with primary driver without backup callouts',
            'higher_is_better',
            '%',
            95,
            97.8,
            10
          ),
          createKPI(
            `kpi-ops-6-${employee.id}`,
            employee.id,
            kra3Id,
            'Driver Breathalyzer & Hygiene Audits',
            'Mandatory pre-trip alcohol safety and uniform compliance checks',
            'boolean_completion',
            '%',
            100,
            100,
            10
          ),
        ],
      },
      {
        id: kra4Id,
        organization_id: orgId,
        employee_id: employee.id,
        department: 'Operations',
        name: 'Client Ride Experience & Ratings',
        category: 'Client Satisfaction',
        description: 'Maintain superior passenger feedback ratings and swift resolution of corporate transport queries.',
        weightage_pct: 20,
        score_pct: 88,
        status: 'On Track',
        financial_year: financialYear,
        review_period: reviewPeriod,
        kpis: [
          createKPI(
            `kpi-ops-7-${employee.id}`,
            employee.id,
            kra4Id,
            'Average Commuter Ride Rating',
            'Passenger mobile app star ratings across morning and evening corporate shifts',
            'numeric',
            'Stars / 5.0',
            4.6,
            4.75,
            10
          ),
          createKPI(
            `kpi-ops-8-${employee.id}`,
            employee.id,
            kra4Id,
            'Escalation Ticket Resolution SLA',
            'Percentage of client transport helpdesk tickets resolved within 2 hours',
            'higher_is_better',
            '%',
            90,
            92,
            10
          ),
        ],
      },
    ];
  }

  // 2. CENTRALISED OPERATIONS (Command Centre / Telematics)
  if (dept === 'centralised operations' || dept === 'cop') {
    const kra1Id = `kra-cop-1-${employee.id}`;
    const kra2Id = `kra-cop-2-${employee.id}`;
    const kra3Id = `kra-cop-3-${employee.id}`;
    const kra4Id = `kra-cop-4-${employee.id}`;

    return [
      {
        id: kra1Id,
        organization_id: orgId,
        employee_id: employee.id,
        department: 'Centralised Operations',
        name: '24/7 Telematics & GPS Fleet Uptime',
        category: 'Command Center',
        description: 'Maintain unbroken live GPS connectivity, sensor health, and tracking uptime across all active vehicles.',
        weightage_pct: 35,
        score_pct: 98,
        status: 'Exceeded',
        financial_year: financialYear,
        review_period: reviewPeriod,
        kpis: [
          createKPI(
            `kpi-cop-1-${employee.id}`,
            employee.id,
            kra1Id,
            'Live GPS Tracking Uptime %',
            'Continuous connectivity uptime across all active vehicles on live trips',
            'percentage',
            '%',
            99.5,
            99.8,
            20
          ),
          createKPI(
            `kpi-cop-2-${employee.id}`,
            employee.id,
            kra1Id,
            'Faulty Telematics Hardware MTTR',
            'Average turnaround time in hours to identify and replace non-responsive GPS hardware',
            'lower_is_better',
            'Hours',
            6.0,
            3.5,
            15
          ),
        ],
      },
      {
        id: kra2Id,
        organization_id: orgId,
        employee_id: employee.id,
        department: 'Centralised Operations',
        name: 'Emergency SOS & Incident Response Time',
        category: 'Safety & Emergency',
        description: 'Rapid triaging and intervention for female commuter safety, breakdown SOS, and driver emergency triggers.',
        weightage_pct: 30,
        score_pct: 95,
        status: 'Exceeded',
        financial_year: financialYear,
        review_period: reviewPeriod,
        kpis: [
          createKPI(
            `kpi-cop-3-${employee.id}`,
            employee.id,
            kra2Id,
            'Average SOS Incident Response Time',
            'Elapsed time in minutes from SOS alert trigger to control room outreach and local supervisor dispatch',
            'lower_is_better',
            'Minutes',
            3.0,
            1.8,
            20
          ),
          createKPI(
            `kpi-cop-4-${employee.id}`,
            employee.id,
            kra2Id,
            'Night Shift Safe-Reach Verification Rate',
            'Verification confirmation rate for late-evening female passenger drops',
            'percentage',
            '%',
            100,
            100,
            10
          ),
        ],
      },
      {
        id: kra3Id,
        organization_id: orgId,
        employee_id: employee.id,
        department: 'Centralised Operations',
        name: 'Geofence & Over-Speeding Control',
        category: 'Route Compliance',
        description: 'Real-time alert clearance for unauthorized route deviations, off-route halts, and speed limit violations.',
        weightage_pct: 20,
        score_pct: 90,
        status: 'On Track',
        financial_year: financialYear,
        review_period: reviewPeriod,
        kpis: [
          createKPI(
            `kpi-cop-5-${employee.id}`,
            employee.id,
            kra3Id,
            'Speeding Violations Cleared <10 Mins',
            'Percentage of telemetry over-speeding alerts addressed with immediate driver contact',
            'percentage',
            '%',
            95,
            96.5,
            10
          ),
          createKPI(
            `kpi-cop-6-${employee.id}`,
            employee.id,
            kra3Id,
            'Geofence Route Deviation Incidents',
            'Monthly unexplained route divergence occurrences across fleet (lower is better)',
            'lower_is_better',
            'Alerts',
            5,
            3,
            10
          ),
        ],
      },
      {
        id: kra4Id,
        organization_id: orgId,
        employee_id: employee.id,
        department: 'Centralised Operations',
        name: 'Daily MIS & Client Reporting Timelines',
        category: 'Process Efficiency',
        description: 'Automated trip execution MIS sheets delivered to enterprise HR/Admin teams before 07:00 AM daily.',
        weightage_pct: 15,
        score_pct: 100,
        status: 'Exceeded',
        financial_year: financialYear,
        review_period: reviewPeriod,
        kpis: [
          createKPI(
            `kpi-cop-7-${employee.id}`,
            employee.id,
            kra4Id,
            'Morning MIS Delivery by 07:00 AM',
            'On-time delivery percentage of daily trip billing and occupancy logs to client portal',
            'percentage',
            '%',
            99,
            100,
            15
          ),
        ],
      },
    ];
  }

  // 3. MAINTENANCE
  if (dept === 'maintenance' || dept === 'mnt') {
    const kra1Id = `kra-mnt-1-${employee.id}`;
    const kra2Id = `kra-mnt-2-${employee.id}`;
    const kra3Id = `kra-mnt-3-${employee.id}`;
    const kra4Id = `kra-mnt-4-${employee.id}`;

    return [
      {
        id: kra1Id,
        organization_id: orgId,
        employee_id: employee.id,
        department: 'Maintenance',
        name: 'Preventive Maintenance (PMS) Schedule Adherence',
        category: 'Preventive Maintenance',
        description: 'Execute periodic 10,000 km oil changes, brake overhaul, tire rotations, and suspension checks without backlog.',
        weightage_pct: 35,
        score_pct: 95,
        status: 'Exceeded',
        financial_year: financialYear,
        review_period: reviewPeriod,
        kpis: [
          createKPI(
            `kpi-mnt-1-${employee.id}`,
            employee.id,
            kra1Id,
            'PMS Schedule Adherence %',
            'Percentage of fleet undergoing preventive servicing within +/- 500 km of due odometer',
            'percentage',
            '%',
            95,
            97.2,
            20
          ),
          createKPI(
            `kpi-mnt-2-${employee.id}`,
            employee.id,
            kra1Id,
            'Overdue PMS Backlog Vehicles',
            'Number of vehicles operating beyond overdue PMS inspection interval (lower is better)',
            'lower_is_better',
            'Vehicles',
            2,
            0,
            15
          ),
        ],
      },
      {
        id: kra2Id,
        organization_id: orgId,
        employee_id: employee.id,
        department: 'Maintenance',
        name: 'Fleet Breakdown Rate Reduction',
        category: 'Reliability & Availability',
        description: 'Eliminate en-route mechanical failures, AC malfunctions, tire blowouts, and engine heating breakdowns.',
        weightage_pct: 30,
        score_pct: 92,
        status: 'On Track',
        financial_year: financialYear,
        review_period: reviewPeriod,
        kpis: [
          createKPI(
            `kpi-mnt-3-${employee.id}`,
            employee.id,
            kra2Id,
            'On-Road Breakdown Rate per 10,000 KM',
            'Mechanical breakdown frequency per 10,000 operating kilometers (lower is better)',
            'lower_is_better',
            'Breakdowns / 10k km',
            0.25,
            0.18,
            20
          ),
          createKPI(
            `kpi-mnt-4-${employee.id}`,
            employee.id,
            kra2Id,
            'AC & Cooling System Failure Rate',
            'Percentage of passenger AC failure tickets logged during summer peak shifts (lower is better)',
            'lower_is_better',
            '%',
            2.0,
            1.1,
            10
          ),
        ],
      },
      {
        id: kra3Id,
        organization_id: orgId,
        employee_id: employee.id,
        department: 'Maintenance',
        name: 'Mean Time to Repair (MTTR) & Depot Turnaround',
        category: 'Workshop Efficiency',
        description: 'Optimize mechanic productivity, spare parts provisioning, and rapid turnaround for out-of-service vehicles.',
        weightage_pct: 20,
        score_pct: 88,
        status: 'On Track',
        financial_year: financialYear,
        review_period: reviewPeriod,
        kpis: [
          createKPI(
            `kpi-mnt-5-${employee.id}`,
            employee.id,
            kra3Id,
            'Average Workshop Repair MTTR',
            'Average elapsed hours per vehicle workshop repair before returning to roadworthy status (lower is better)',
            'lower_is_better',
            'Hours',
            5.0,
            4.2,
            10
          ),
          createKPI(
            `kpi-mnt-6-${employee.id}`,
            employee.id,
            kra3Id,
            'First-Time-Right (FTR) Repair Rate',
            'Percentage of repaired vehicles that do not return for the same defect within 30 days',
            'percentage',
            '%',
            92,
            94.5,
            10
          ),
        ],
      },
      {
        id: kra4Id,
        organization_id: orgId,
        employee_id: employee.id,
        department: 'Maintenance',
        name: 'Statutory Fitness & RTO Regulatory Compliance',
        category: 'Regulatory Compliance',
        description: 'Ensure 100% zero-lapse RTO vehicle fitness certificates, PUC emission permits, and roadworthiness approvals.',
        weightage_pct: 15,
        score_pct: 100,
        status: 'Exceeded',
        financial_year: financialYear,
        review_period: reviewPeriod,
        kpis: [
          createKPI(
            `kpi-mnt-7-${employee.id}`,
            employee.id,
            kra4Id,
            'Active Vehicle Fitness & PUC Compliance',
            'Percentage of fleet with active, unexpired statutory fitness certificates',
            'boolean_completion',
            '%',
            100,
            100,
            15
          ),
        ],
      },
    ];
  }

  // 4. FINANCE
  if (dept === 'finance' || dept === 'fin') {
    const kra1Id = `kra-fin-1-${employee.id}`;
    const kra2Id = `kra-fin-2-${employee.id}`;
    const kra3Id = `kra-fin-3-${employee.id}`;
    const kra4Id = `kra-fin-4-${employee.id}`;

    return [
      {
        id: kra1Id,
        organization_id: orgId,
        employee_id: employee.id,
        department: 'Finance',
        name: 'Monthly Client Billing Cycle Timelines',
        category: 'Billing & Invoicing',
        description: 'Complete 100% monthly corporate client billing, logsheet reconciliation, and tax invoices within 3 working days.',
        weightage_pct: 35,
        score_pct: 95,
        status: 'Exceeded',
        financial_year: financialYear,
        review_period: reviewPeriod,
        kpis: [
          createKPI(
            `kpi-fin-1-${employee.id}`,
            employee.id,
            kra1Id,
            'Billing Cycle Close Timeline in Days',
            'Working days post month-end to dispatch finalized corporate tax invoices (lower is better)',
            'lower_is_better',
            'Days',
            3.0,
            2.0,
            20
          ),
          createKPI(
            `kpi-fin-2-${employee.id}`,
            employee.id,
            kra1Id,
            'Invoice Accuracy & Zero-Credit-Note Rate',
            'Percentage of dispatched client invoices accepted without billing disputes or revision notes',
            'percentage',
            '%',
            98,
            99.2,
            15
          ),
        ],
      },
      {
        id: kra2Id,
        organization_id: orgId,
        employee_id: employee.id,
        department: 'Finance',
        name: 'Days Sales Outstanding (DSO) & Collections',
        category: 'Credit Control',
        description: 'Maintain strict debtor control, enforce client payment credit terms, and minimize bad debt exposure.',
        weightage_pct: 30,
        score_pct: 88,
        status: 'On Track',
        financial_year: financialYear,
        review_period: reviewPeriod,
        kpis: [
          createKPI(
            `kpi-fin-3-${employee.id}`,
            employee.id,
            kra2Id,
            'Days Sales Outstanding (DSO)',
            'Average days taken to collect payment from corporate enterprise clients (lower is better)',
            'lower_is_better',
            'Days',
            45.0,
            41.5,
            15
          ),
          createKPI(
            `kpi-fin-4-${employee.id}`,
            employee.id,
            kra2Id,
            'Overdue Invoices >60 Days Ratio',
            'Percentage of outstanding accounts receivable aged past 60 days overdue (lower is better)',
            'lower_is_better',
            '%',
            5.0,
            3.2,
            15
          ),
        ],
      },
      {
        id: kra3Id,
        organization_id: orgId,
        employee_id: employee.id,
        department: 'Finance',
        name: 'Commercial Rate Card & Margin Audit',
        category: 'Margin Governance',
        description: 'Audit RFP tenders and proposal calculator outputs to ensure minimum 18% projected gross margin compliance.',
        weightage_pct: 20,
        score_pct: 95,
        status: 'Exceeded',
        financial_year: financialYear,
        review_period: reviewPeriod,
        kpis: [
          createKPI(
            `kpi-fin-5-${employee.id}`,
            employee.id,
            kra3Id,
            'Commercial Proposals Margin Audit %',
            'Percentage of issued commercial quotations audited for diesel price escalation clauses and minimum margin',
            'percentage',
            '%',
            100,
            100,
            10
          ),
          createKPI(
            `kpi-fin-6-${employee.id}`,
            employee.id,
            kra3Id,
            'Vendor Lease Cost Audit Savings',
            'Annual negotiated savings on attached fleet vendor payout contracts in INR',
            'currency',
            'INR',
            2500000,
            2850000,
            10
          ),
        ],
      },
      {
        id: kra4Id,
        organization_id: orgId,
        employee_id: employee.id,
        department: 'Finance',
        name: 'Statutory GST, TDS & Audit Filing Compliance',
        category: 'Tax & Compliance',
        description: 'Zero delay and zero penalty on monthly GSTR-1/3B filings, quarterly TDS returns, and statutory audits.',
        weightage_pct: 15,
        score_pct: 100,
        status: 'Exceeded',
        financial_year: financialYear,
        review_period: reviewPeriod,
        kpis: [
          createKPI(
            `kpi-fin-7-${employee.id}`,
            employee.id,
            kra4Id,
            'Statutory GST & TDS Zero-Penalty Filing',
            'Flawless on-time compliance with monthly tax filings without statutory penalty or late interest',
            'boolean_completion',
            '%',
            100,
            100,
            15
          ),
        ],
      },
    ];
  }

  // 5. LEGAL
  if (dept === 'legal' || dept === 'leg') {
    const kra1Id = `kra-leg-1-${employee.id}`;
    const kra2Id = `kra-leg-2-${employee.id}`;
    const kra3Id = `kra-leg-3-${employee.id}`;
    const kra4Id = `kra-leg-4-${employee.id}`;

    return [
      {
        id: kra1Id,
        organization_id: orgId,
        employee_id: employee.id,
        department: 'Legal',
        name: 'Master Service Agreement (MSA) Turnaround Time',
        category: 'Contract Execution',
        description: 'Review, draft, negotiate and execute enterprise client transportation master service agreements rapidly.',
        weightage_pct: 35,
        score_pct: 95,
        status: 'Exceeded',
        financial_year: financialYear,
        review_period: reviewPeriod,
        kpis: [
          createKPI(
            `kpi-leg-1-${employee.id}`,
            employee.id,
            kra1Id,
            'Average MSA Review Turnaround in Days',
            'Average working days to deliver contract redlines and legal approvals on client MSAs (lower is better)',
            'lower_is_better',
            'Days',
            3.0,
            1.8,
            20
          ),
          createKPI(
            `kpi-leg-2-${employee.id}`,
            employee.id,
            kra1Id,
            'Contract Redline SLA Adherence %',
            'Percentage of enterprise RFP and legal reviews completed within client procurement timeline',
            'percentage',
            '%',
            95,
            98.5,
            15
          ),
        ],
      },
      {
        id: kra2Id,
        organization_id: orgId,
        employee_id: employee.id,
        department: 'Legal',
        name: 'Regulatory Transport Permits & Insurance Governance',
        category: 'Risk & Compliance',
        description: 'Enforce comprehensive commercial motor insurance, interstate carriage permits, and passenger liability coverage.',
        weightage_pct: 30,
        score_pct: 92,
        status: 'On Track',
        financial_year: financialYear,
        review_period: reviewPeriod,
        kpis: [
          createKPI(
            `kpi-leg-3-${employee.id}`,
            employee.id,
            kra2Id,
            'Fleet Motor Insurance Active Audit %',
            'Percentage of active vehicles with valid third-party and passenger accidental insurance coverage',
            'percentage',
            '%',
            100,
            100,
            15
          ),
          createKPI(
            `kpi-leg-4-${employee.id}`,
            employee.id,
            kra2Id,
            'Statutory Transport Permit Lapses',
            'Number of instances where commercial transport permits lapsed during operations (lower is better)',
            'lower_is_better',
            'Lapses',
            0,
            0,
            15
          ),
        ],
      },
      {
        id: kra3Id,
        organization_id: orgId,
        employee_id: employee.id,
        department: 'Legal',
        name: 'NDA & Vendor Subcontractor Governance',
        category: 'Governance',
        description: 'Maintain 100% executed non-disclosure agreements, data confidentiality clauses, and back-to-back vendor SLAs.',
        weightage_pct: 20,
        score_pct: 95,
        status: 'Exceeded',
        financial_year: financialYear,
        review_period: reviewPeriod,
        kpis: [
          createKPI(
            `kpi-leg-5-${employee.id}`,
            employee.id,
            kra3Id,
            'Vendor NDA & Back-to-Back Agreement Rate',
            'Percentage of attached fleet vendors with fully signed back-to-back indemnity and SLA contracts',
            'percentage',
            '%',
            98,
            100,
            10
          ),
          createKPI(
            `kpi-leg-6-${employee.id}`,
            employee.id,
            kra3Id,
            'Confidentiality & GDPR/Data Protection Audit',
            'Zero non-compliance findings in annual corporate passenger data privacy audit',
            'boolean_completion',
            '%',
            100,
            100,
            10
          ),
        ],
      },
      {
        id: kra4Id,
        organization_id: orgId,
        employee_id: employee.id,
        department: 'Legal',
        name: 'Commercial Dispute Resolution & Settlement',
        category: 'Dispute Resolution',
        description: 'Mediate and settle client or vendor commercial claims amicably with zero litigation penalties.',
        weightage_pct: 15,
        score_pct: 90,
        status: 'On Track',
        financial_year: financialYear,
        review_period: reviewPeriod,
        kpis: [
          createKPI(
            `kpi-leg-7-${employee.id}`,
            employee.id,
            kra4Id,
            'Commercial Disputes Settled Out of Court %',
            'Percentage of commercial contractor disputes resolved through arbitration without litigation delay',
            'percentage',
            '%',
            90,
            100,
            15
          ),
        ],
      },
    ];
  }

  // 6. DEFAULT / BUSINESS DEVELOPMENT
  const kra1Id = `kra-bd-1-${employee.id}`;
  const kra2Id = `kra-bd-2-${employee.id}`;
  const kra3Id = `kra-bd-3-${employee.id}`;
  const kra4Id = `kra-bd-4-${employee.id}`;

  const targetQuota = employee.annual_target_inr || 50000000;
  const wonRevenue = employee.achieved_inr || targetQuota * 0.78;

  return [
    {
      id: kra1Id,
      organization_id: orgId,
      employee_id: employee.id,
      department: 'Business Development',
      name: 'Enterprise Revenue & Annual Quota Attainment',
      category: 'New Business & Revenue',
      description: 'Achieve designated annual contract value targets for staff transportation and corporate fleet leases.',
      weightage_pct: 35,
      score_pct: Math.min(Math.round((wonRevenue / targetQuota) * 100), 120),
      status: (wonRevenue / targetQuota) >= 0.85 ? 'Exceeded' : 'On Track',
      financial_year: financialYear,
      review_period: reviewPeriod,
      kpis: [
        createKPI(
          `kpi-bd-1-${employee.id}`,
          employee.id,
          kra1Id,
          'Annual Contract Value (ACV) Won Revenue',
          'Total new annualized contract revenue signed and onboarded into ERP',
          'currency',
          'INR',
          targetQuota,
          wonRevenue,
          35
        ),
      ],
    },
    {
      id: kra2Id,
      organization_id: orgId,
      employee_id: employee.id,
      department: 'Business Development',
      name: 'Key Account Acquisition & Fleet Roster Growth',
      category: 'Client Acquisition & Expansion',
      description: 'Drive new enterprise logos, contract conversions, and fleet vehicle expansion across accounts.',
      weightage_pct: 25,
      score_pct: 88,
      status: 'On Track',
      financial_year: financialYear,
      review_period: reviewPeriod,
      kpis: [
        createKPI(
          `kpi-bd-2-${employee.id}`,
          employee.id,
          kra2Id,
          'New Enterprise Logos Signed',
          'Number of newly acquired Tier 1/2 enterprise client organizations',
          'count',
          'Clients',
          6,
          5,
          15
        ),
        createKPI(
          `kpi-bd-3-${employee.id}`,
          employee.id,
          kra2Id,
          'Client Contract Renewal Retention Rate',
          'Percentage of expiring fleet client contracts successfully renewed for multi-year term',
          'percentage',
          '%',
          90,
          94.5,
          10
        ),
      ],
    },
    {
      id: kra3Id,
      organization_id: orgId,
      employee_id: employee.id,
      department: 'Business Development',
      name: 'Pipeline Generation & Multi-Stage Deal Progression',
      category: 'Pipeline Health & Velocity',
      description: 'Maintain healthy 3x qualified pipeline coverage with rapid conversion velocity across sales stages.',
      weightage_pct: 20,
      score_pct: 92,
      status: 'On Track',
      financial_year: financialYear,
      review_period: reviewPeriod,
      kpis: [
        createKPI(
          `kpi-bd-4-${employee.id}`,
          employee.id,
          kra3Id,
          'Qualified Pipeline Value Coverage',
          'Total active pipeline opportunities under negotiation and commercial review in INR',
          'currency',
          'INR',
          targetQuota * 2,
          targetQuota * 2.3,
          20
        ),
      ],
    },
    {
      id: kra4Id,
      organization_id: orgId,
      employee_id: employee.id,
      department: 'Business Development',
      name: 'Client Engagement & Interaction SLA Adherence',
      category: 'CRM Hygiene & Compliance',
      description: 'Timely logging of meetings, proposals, client reviews, and zero overdue commercial follow-ups.',
      weightage_pct: 20,
      score_pct: 95,
      status: 'Exceeded',
      financial_year: financialYear,
      review_period: reviewPeriod,
      kpis: [
        createKPI(
          `kpi-bd-5-${employee.id}`,
          employee.id,
          kra4Id,
          'Monthly Client Touchpoints & Physical Meetings',
          'Total in-person corporate meetings, fleet audits, and executive commercial presentations logged',
          'count',
          'Meetings',
          16,
          18,
          10
        ),
        createKPI(
          `kpi-bd-6-${employee.id}`,
          employee.id,
          kra4Id,
          'Follow-up SLA Resolution Rate',
          'Percentage of assigned client action items resolved on or before designated due date',
          'percentage',
          '%',
          95,
          97.5,
          10
        ),
      ],
    },
  ];
}

/**
 * Helper to build an EmployeeKPI record with calculated values
 */
function createKPI(
  id: string,
  employeeId: string,
  kraId: string,
  name: string,
  description: string,
  kpiType: KPIType,
  unit: string,
  targetValue: number,
  actualValue: number,
  weightagePct: number,
  targetRangeMin?: number,
  targetRangeMax?: number
): EmployeeKPI {
  const calc = calculateKPIAchievement({
    kpiType,
    targetValue,
    actualValue,
    weightagePct,
    targetRangeMin,
    targetRangeMax,
    unit,
  });

  return {
    id,
    employee_id: employeeId,
    employee_kra_id: kraId,
    name,
    description,
    kpi_type: kpiType,
    unit,
    target_value: targetValue,
    actual_value: actualValue,
    target_range_min: targetRangeMin,
    target_range_max: targetRangeMax,
    target_display: formatKPIValue(targetValue, unit, kpiType),
    actual_display: formatKPIValue(actualValue, unit, kpiType),
    weightage_pct: weightagePct,
    achievement_pct: calc.achievementPct,
    score: calc.score,
    status: calc.status,
    financial_year: 'FY2026-27',
    review_period: 'Annual FY26-27',
  };
}

/**
 * Load KRAs from localStorage cache
 */
function loadStoredKRAs(): EmployeeKRA[] {
  try {
    const raw = localStorage.getItem(KRA_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Save KRAs to localStorage cache
 */
function saveStoredKRAs(kras: EmployeeKRA[]): void {
  try {
    localStorage.setItem(KRA_STORAGE_KEY, JSON.stringify(kras));
  } catch (err) {
    console.warn('Failed to persist KRAs to local storage:', err);
  }
}

/**
 * Fetch KRAs and nested KPIs for an employee
 */
export async function fetchEmployeeKRAs(
  employee: User,
  financialYear: string = 'FY2026-27',
  reviewPeriod: string = 'Annual FY26-27'
): Promise<EmployeeKRA[]> {
  const allStored = loadStoredKRAs();
  const empStored = allStored.filter(
    (k) => k.employee_id === employee.id && (!financialYear || k.financial_year === financialYear)
  );

  // If local store has KRAs for this employee, return them
  if (empStored.length > 0) {
    return empStored;
  }

  // Attempt fetch from Supabase if configured
  if (isSupabaseConfigured()) {
    try {
      const { data: kraData, error: kraErr } = await (supabase.from('employee_kras') as any)
        .select('*, employee_kpis(*)')
        .eq('employee_id', employee.id);

      if (!kraErr && kraData && kraData.length > 0) {
        const mapped: EmployeeKRA[] = kraData.map((k: any) => ({
          id: k.id,
          organization_id: k.organization_id,
          employee_id: k.employee_id,
          kra_definition_id: k.kra_definition_id,
          department: k.department,
          name: k.name,
          category: k.category,
          description: k.description,
          weightage_pct: Number(k.weightage_pct),
          score_pct: Number(k.score_pct),
          status: k.status,
          financial_year: k.financial_year,
          review_period: k.review_period,
          kpis: (k.employee_kpis || []).map((p: any) => ({
            id: p.id,
            organization_id: p.organization_id,
            employee_id: p.employee_id,
            employee_kra_id: p.employee_kra_id,
            name: p.name,
            description: p.description,
            kpi_type: p.kpi_type,
            unit: p.unit,
            target_value: Number(p.target_value),
            actual_value: Number(p.actual_value),
            target_range_min: p.target_range_min ? Number(p.target_range_min) : undefined,
            target_range_max: p.target_range_max ? Number(p.target_range_max) : undefined,
            target_display: p.target_display || formatKPIValue(Number(p.target_value), p.unit, p.kpi_type),
            actual_display: p.actual_display || formatKPIValue(Number(p.actual_value), p.unit, p.kpi_type),
            weightage_pct: Number(p.weightage_pct),
            achievement_pct: Number(p.achievement_pct),
            score: Number(p.score),
            status: p.status,
            manager_comment: p.manager_comment,
            employee_comment: p.employee_comment,
            financial_year: p.financial_year,
            review_period: p.review_period,
          })),
        }));

        // Cache locally
        saveStoredKRAs([...allStored.filter((k) => k.employee_id !== employee.id), ...mapped]);
        return mapped;
      }
    } catch (err) {
      console.warn('Could not load KRAs from Supabase, falling back to dynamic generator:', err);
    }
  }

  // Generate canonical default KRAs for this employee's department
  const generated = generateDefaultKRAsForDepartment(employee, financialYear, reviewPeriod);
  saveStoredKRAs([...allStored.filter((k) => k.employee_id !== employee.id), ...generated]);
  return generated;
}

/**
 * Update an employee KPI's actual value, comments, or status
 */
export async function updateEmployeeKPI(
  kpiId: string,
  updates: {
    actual_value?: number;
    target_value?: number;
    status?: 'Exceeded' | 'On Track' | 'Needs Improvement' | 'At Risk';
    manager_comment?: string;
    employee_comment?: string;
  },
  actorUser?: User
): Promise<{ success: boolean; updatedKPI?: EmployeeKPI; error?: string }> {
  const allKRAs = loadStoredKRAs();

  let targetKRA: EmployeeKRA | undefined;
  let targetKPI: EmployeeKPI | undefined;

  for (const kra of allKRAs) {
    if (kra.kpis) {
      const found = kra.kpis.find((p) => p.id === kpiId);
      if (found) {
        targetKRA = kra;
        targetKPI = found;
        break;
      }
    }
  }

  if (!targetKPI || !targetKRA) {
    return { success: false, error: 'KPI record not found.' };
  }

  const prevActual = targetKPI.actual_value;
  const prevTarget = targetKPI.target_value;

  const newActual = updates.actual_value !== undefined ? updates.actual_value : targetKPI.actual_value;
  const newTarget = updates.target_value !== undefined ? updates.target_value : targetKPI.target_value;

  // Re-calculate achievement using the math engine
  const calc = calculateKPIAchievement({
    kpiType: targetKPI.kpi_type,
    targetValue: newTarget,
    actualValue: newActual,
    weightagePct: targetKPI.weightage_pct,
    targetRangeMin: targetKPI.target_range_min,
    targetRangeMax: targetKPI.target_range_max,
    unit: targetKPI.unit,
  });

  targetKPI.actual_value = newActual;
  targetKPI.target_value = newTarget;
  targetKPI.actual_display = formatKPIValue(newActual, targetKPI.unit, targetKPI.kpi_type);
  targetKPI.target_display = formatKPIValue(newTarget, targetKPI.unit, targetKPI.kpi_type);
  targetKPI.achievement_pct = calc.achievementPct;
  targetKPI.score = calc.score;
  targetKPI.status = updates.status || calc.status;

  if (updates.manager_comment !== undefined) {
    targetKPI.manager_comment = updates.manager_comment;
  }
  if (updates.employee_comment !== undefined) {
    targetKPI.employee_comment = updates.employee_comment;
  }

  // Re-compute parent KRA score
  if (targetKRA.kpis && targetKRA.kpis.length > 0) {
    const totalKPIScores = targetKRA.kpis.reduce((sum, p) => sum + p.score, 0);
    const totalKPIWeights = targetKRA.kpis.reduce((sum, p) => sum + p.weightage_pct, 0);
    if (totalKPIWeights > 0) {
      targetKRA.score_pct = Math.round((totalKPIScores / totalKPIWeights) * 100);
    }
  }

  saveStoredKRAs(allKRAs);

  // Sync to Supabase if configured
  if (isSupabaseConfigured()) {
    try {
      await (supabase.from('employee_kpis') as any)
        .update({
          actual_value: newActual,
          target_value: newTarget,
          actual_display: targetKPI.actual_display,
          target_display: targetKPI.target_display,
          achievement_pct: targetKPI.achievement_pct,
          score: targetKPI.score,
          status: targetKPI.status,
          manager_comment: targetKPI.manager_comment,
          employee_comment: targetKPI.employee_comment,
          updated_at: new Date().toISOString(),
        })
        .eq('id', kpiId);
    } catch (err) {
      console.warn('Could not sync KPI update to Supabase, persisted locally:', err);
    }
  }

  // Log Audit Event
  await logAuditEvent({
    organizationId: targetKRA.organization_id,
    userId: actorUser?.id,
    userName: actorUser?.name || 'System User',
    action: 'KPI_ACTUAL_UPDATED',
    entityType: 'employee_kpis',
    entityId: kpiId,
    oldValues: { actual_value: prevActual, target_value: prevTarget },
    newValues: {
      actual_value: newActual,
      target_value: newTarget,
      achievement_pct: targetKPI.achievement_pct,
      status: targetKPI.status,
      manager_comment: targetKPI.manager_comment,
      employee_comment: targetKPI.employee_comment,
    },
    metadata: {
      kpi_name: targetKPI.name,
      employee_id: targetKPI.employee_id,
      department: targetKRA.department,
    },
  });

  return { success: true, updatedKPI: targetKPI };
}

/**
 * Add a new KRA for an employee
 */
export async function addEmployeeKRA(
  kraData: {
    employee_id: string;
    organization_id?: string;
    department: string;
    name: string;
    category: string;
    description?: string;
    weightage_pct: number;
    financial_year?: string;
    review_period?: string;
  },
  actorUser?: User
): Promise<{ success: boolean; newKRA?: EmployeeKRA; error?: string }> {
  const allKRAs = loadStoredKRAs();
  const id = `kra-${Date.now()}`;
  const orgId = kraData.organization_id || '00000000-0000-0000-0000-000000000001';

  const newRecord: EmployeeKRA = {
    id,
    organization_id: orgId,
    employee_id: kraData.employee_id,
    department: kraData.department,
    name: kraData.name,
    category: kraData.category,
    description: kraData.description,
    weightage_pct: Number(kraData.weightage_pct) || 25,
    score_pct: 0,
    status: 'On Track',
    financial_year: kraData.financial_year || 'FY2026-27',
    review_period: kraData.review_period || 'Annual FY26-27',
    kpis: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  allKRAs.push(newRecord);
  saveStoredKRAs(allKRAs);

  if (isSupabaseConfigured()) {
    try {
      await (supabase.from('employee_kras') as any).insert({
        id: newRecord.id,
        organization_id: newRecord.organization_id,
        employee_id: newRecord.employee_id,
        department: newRecord.department,
        name: newRecord.name,
        category: newRecord.category,
        description: newRecord.description,
        weightage_pct: newRecord.weightage_pct,
        score_pct: newRecord.score_pct,
        status: newRecord.status,
        financial_year: newRecord.financial_year,
        review_period: newRecord.review_period,
      });
    } catch (err) {
      console.warn('Supabase addEmployeeKRA notice:', err);
    }
  }

  await logAuditEvent({
    organizationId: orgId,
    userId: actorUser?.id,
    userName: actorUser?.name || 'System User',
    action: 'KRA_CREATED',
    entityType: 'employee_kras',
    entityId: id,
    newValues: {
      name: newRecord.name,
      department: newRecord.department,
      weightage_pct: newRecord.weightage_pct,
      employee_id: newRecord.employee_id,
    },
  });

  return { success: true, newKRA: newRecord };
}

/**
 * Add a new KPI under a designated KRA
 */
export async function addEmployeeKPI(
  kpiData: {
    employee_id: string;
    employee_kra_id: string;
    organization_id?: string;
    name: string;
    description?: string;
    kpi_type: KPIType;
    unit: string;
    target_value: number;
    actual_value: number;
    target_range_min?: number;
    target_range_max?: number;
    weightage_pct: number;
    financial_year?: string;
    review_period?: string;
    manager_comment?: string;
  },
  actorUser?: User
): Promise<{ success: boolean; newKPI?: EmployeeKPI; error?: string }> {
  const allKRAs = loadStoredKRAs();
  const targetKRA = allKRAs.find((k) => k.id === kpiData.employee_kra_id);

  if (!targetKRA) {
    return { success: false, error: 'Designated KRA not found.' };
  }

  const id = `kpi-${Date.now()}`;
  const orgId = kpiData.organization_id || targetKRA.organization_id || '00000000-0000-0000-0000-000000000001';

  const calc = calculateKPIAchievement({
    kpiType: kpiData.kpi_type,
    targetValue: kpiData.target_value,
    actualValue: kpiData.actual_value,
    weightagePct: kpiData.weightage_pct,
    targetRangeMin: kpiData.target_range_min,
    targetRangeMax: kpiData.target_range_max,
    unit: kpiData.unit,
  });

  const newKPI: EmployeeKPI = {
    id,
    organization_id: orgId,
    employee_id: kpiData.employee_id,
    employee_kra_id: kpiData.employee_kra_id,
    name: kpiData.name,
    description: kpiData.description,
    kpi_type: kpiData.kpi_type,
    unit: kpiData.unit,
    target_value: kpiData.target_value,
    actual_value: kpiData.actual_value,
    target_range_min: kpiData.target_range_min,
    target_range_max: kpiData.target_range_max,
    target_display: formatKPIValue(kpiData.target_value, kpiData.unit, kpiData.kpi_type),
    actual_display: formatKPIValue(kpiData.actual_value, kpiData.unit, kpiData.kpi_type),
    weightage_pct: kpiData.weightage_pct,
    achievement_pct: calc.achievementPct,
    score: calc.score,
    status: calc.status,
    manager_comment: kpiData.manager_comment,
    financial_year: kpiData.financial_year || targetKRA.financial_year,
    review_period: kpiData.review_period || targetKRA.review_period,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (!targetKRA.kpis) targetKRA.kpis = [];
  targetKRA.kpis.push(newKPI);

  // Recalculate KRA score
  const totalScores = targetKRA.kpis.reduce((sum, p) => sum + p.score, 0);
  const totalWeights = targetKRA.kpis.reduce((sum, p) => sum + p.weightage_pct, 0);
  if (totalWeights > 0) {
    targetKRA.score_pct = Math.round((totalScores / totalWeights) * 100);
  }

  saveStoredKRAs(allKRAs);

  if (isSupabaseConfigured()) {
    try {
      await (supabase.from('employee_kpis') as any).insert({
        id: newKPI.id,
        organization_id: newKPI.organization_id,
        employee_id: newKPI.employee_id,
        employee_kra_id: newKPI.employee_kra_id,
        name: newKPI.name,
        description: newKPI.description,
        kpi_type: newKPI.kpi_type,
        unit: newKPI.unit,
        target_value: newKPI.target_value,
        actual_value: newKPI.actual_value,
        target_range_min: newKPI.target_range_min,
        target_range_max: newKPI.target_range_max,
        target_display: newKPI.target_display,
        actual_display: newKPI.actual_display,
        weightage_pct: newKPI.weightage_pct,
        achievement_pct: newKPI.achievement_pct,
        score: newKPI.score,
        status: newKPI.status,
        manager_comment: newKPI.manager_comment,
        financial_year: newKPI.financial_year,
        review_period: newKPI.review_period,
      });
    } catch (err) {
      console.warn('Supabase addEmployeeKPI notice:', err);
    }
  }

  await logAuditEvent({
    organizationId: orgId,
    userId: actorUser?.id,
    userName: actorUser?.name || 'System User',
    action: 'KPI_CREATED',
    entityType: 'employee_kpis',
    entityId: id,
    newValues: {
      name: newKPI.name,
      kpi_type: newKPI.kpi_type,
      target_value: newKPI.target_value,
      employee_id: newKPI.employee_id,
      kra_id: newKPI.employee_kra_id,
    },
  });

  return { success: true, newKPI };
}

