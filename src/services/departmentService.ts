/**
 * Department Service
 * Single source of truth for Department Master in CorpBD CRM.
 * Manages active/inactive lifecycle, team department filtering, and Supabase synchronization.
 */

import { supabase, isSupabaseConfigured } from '../utils/supabaseClient';
import { DepartmentMaster } from '../types/crm';

const DEFAULT_ORG_ID = '00000000-0000-0000-0000-000000000001';

/**
 * Standard Canonical Departments for Rajmudra Group:
 * 6 Active: Business Development, Operations, Centralised Operations, Maintenance, Finance, Legal
 * 4 Inactive/Preserved: Human Resources, Administration, Management / Corporate, IT / Technology
 */
export const CANONICAL_DEPARTMENTS: DepartmentMaster[] = [
  // 6 Active Departments
  {
    id: '30000000-0000-0000-0000-000000000001',
    organization_id: DEFAULT_ORG_ID,
    department_name: 'Business Development',
    department_code: 'BD',
    description: 'Corporate client acquisition, RFP formulation, and revenue growth across regions.',
    is_active: true,
  },
  {
    id: '30000000-0000-0000-0000-000000000002',
    organization_id: DEFAULT_ORG_ID,
    department_name: 'Operations',
    department_code: 'OPS',
    description: 'Fleet operations, dispatch management, driver scheduling, and route optimization.',
    is_active: true,
  },
  {
    id: '30000000-0000-0000-0000-000000000003',
    organization_id: DEFAULT_ORG_ID,
    department_name: 'Centralised Operations',
    department_code: 'COP',
    description: 'Central Command Centre, 24/7 telematics, GPS tracking, and pan-India trip monitoring.',
    is_active: true,
  },
  {
    id: '30000000-0000-0000-0000-000000000004',
    organization_id: DEFAULT_ORG_ID,
    department_name: 'Maintenance',
    department_code: 'MNT',
    description: 'Fleet workshop management, preventive vehicle servicing, and asset reliability.',
    is_active: true,
  },
  {
    id: '30000000-0000-0000-0000-000000000005',
    organization_id: DEFAULT_ORG_ID,
    department_name: 'Finance',
    department_code: 'FIN',
    description: 'Billing, invoicing, commercial pricing calculations, receivables, and accounting.',
    is_active: true,
  },
  {
    id: '30000000-0000-0000-0000-000000000006',
    organization_id: DEFAULT_ORG_ID,
    department_name: 'Legal',
    department_code: 'LEG',
    description: 'Contract drafting, SLA compliance, regulatory permits, and NDA governance.',
    is_active: true,
  },

  // 4 Preserved Inactive Departments (is_active = false)
  {
    id: '30000000-0000-0000-0000-000000000007',
    organization_id: DEFAULT_ORG_ID,
    department_name: 'Human Resources',
    department_code: 'HR',
    description: 'Personnel, recruitment, and payroll administration (Legacy / Inactive in CRM).',
    is_active: false,
  },
  {
    id: '30000000-0000-0000-0000-000000000008',
    organization_id: DEFAULT_ORG_ID,
    department_name: 'Administration',
    department_code: 'ADM',
    description: 'General corporate administration and facility management (Legacy / Inactive in CRM).',
    is_active: false,
  },
  {
    id: '30000000-0000-0000-0000-000000000009',
    organization_id: DEFAULT_ORG_ID,
    department_name: 'Management / Corporate',
    department_code: 'MGT',
    description: 'Executive board and corporate leadership (Legacy / Inactive in CRM).',
    is_active: false,
  },
  {
    id: '30000000-0000-0000-0000-00000000010',
    organization_id: DEFAULT_ORG_ID,
    department_name: 'IT / Technology',
    department_code: 'IT',
    description: 'Software systems and network infrastructure (Legacy / Inactive in CRM).',
    is_active: false,
  },
];

/**
 * Fetch all departments from Supabase (or fallback defaults)
 */
export async function fetchDepartments(includeInactive: boolean = false): Promise<DepartmentMaster[]> {
  if (isSupabaseConfigured()) {
    try {
      let query = (supabase.from('departments') as any).select('*').order('department_name', { ascending: true });
      if (!includeInactive) {
        query = query.eq('is_active', true);
      }
      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        return data as DepartmentMaster[];
      }
    } catch (err) {
      console.warn('Could not load departments from Supabase, using canonical defaults:', err);
    }
  }

  return includeInactive
    ? CANONICAL_DEPARTMENTS
    : CANONICAL_DEPARTMENTS.filter((d) => d.is_active);
}

/**
 * Fetch ONLY active departments for new user creation
 */
export async function fetchActiveDepartments(): Promise<DepartmentMaster[]> {
  return fetchDepartments(false);
}

/**
 * Maps a department name or code to its normalized display name
 */
export function normalizeDepartmentName(dept: string | undefined): string {
  if (!dept) return 'Business Development';
  const trimmed = dept.trim().toLowerCase();
  if (trimmed === 'bd' || trimmed.includes('business development') || trimmed.includes('sales')) {
    return 'Business Development';
  }
  if (trimmed === 'ops' || trimmed === 'operations' || trimmed.includes('fleet operations')) {
    return 'Operations';
  }
  if (trimmed === 'cop' || trimmed.includes('centralised operations') || trimmed.includes('command')) {
    return 'Centralised Operations';
  }
  if (trimmed === 'mnt' || trimmed.includes('maintenance') || trimmed.includes('workshop')) {
    return 'Maintenance';
  }
  if (trimmed === 'fin' || trimmed.includes('finance') || trimmed.includes('accounts') || trimmed.includes('pricing')) {
    return 'Finance';
  }
  if (trimmed === 'leg' || trimmed.includes('legal') || trimmed.includes('compliance')) {
    return 'Legal';
  }
  return dept;
}
