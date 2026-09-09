/**
 * Admin Service — Secure Administrator User Management API Client
 * Communicates with server-side /api/admin/users endpoints
 * Never exposes service_role key to client.
 */

import { supabase } from '../utils/supabaseClient';
import { UserRoleEnum, UserStatusEnum } from '../types/database.types';

export interface ProvisionUserPayload {
  full_name: string;
  email: string;
  role: UserRoleEnum;
  department?: string;
  designation?: string;
  team_id?: string | null;
  manager_id?: string | null;
  organization_id?: string;
  status?: UserStatusEnum;
  provisioning_method: 'invite' | 'password';
  temp_password?: string;
}

export interface UpdateUserPayload {
  full_name?: string;
  role?: UserRoleEnum;
  department?: string;
  designation?: string;
  team_id?: string | null;
  manager_id?: string | null;
  status?: UserStatusEnum;
}

export interface HierarchyOptions {
  organizations: Array<{ id: string; name: string; slug: string }>;
  teams: Array<{ id: string; name: string; code: string; is_active?: boolean }>;
  managers: Array<{ id: string; full_name: string; email?: string; role: string; designation?: string }>;
}

/**
 * Helper to get Bearer headers with the caller's active Supabase session
 */
async function getAuthHeaders(): Promise<HeadersInit> {
  const { data } = await supabase.auth.getSession();
  const token = data?.session?.access_token;
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

/**
 * Fetch hierarchy options (teams, managers, orgs) for the current organization
 */
export async function getHierarchyOptions(): Promise<HierarchyOptions> {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch('/api/admin/users/hierarchy-options', {
      method: 'GET',
      headers,
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success) {
        return {
          organizations: data.organizations || [],
          teams: data.teams || [],
          managers: data.managers || [],
        };
      }
    }
  } catch (err) {
    console.warn('Could not fetch hierarchy options from server:', err);
  }

  // Fallback defaults for offline / initial development
  return {
    organizations: [{ id: '00000000-0000-0000-0000-000000000001', name: 'Rajmudra Group', slug: 'rajmudra-group' }],
    teams: [
      { id: '10000000-0000-0000-0000-000000000001', name: 'Enterprise BD - West', code: 'EBD-W' },
      { id: '10000000-0000-0000-0000-000000000002', name: 'Fleet Operations & Dispatch', code: 'FLEET-OPS' },
      { id: '10000000-0000-0000-0000-000000000003', name: 'Commercial Pricing & Proposals', code: 'PRICING' },
      { id: '10000000-0000-0000-0000-000000000004', name: 'Legal & Contract Compliance', code: 'LEGAL' },
    ],
    managers: [
      { id: '00000000-0000-0000-0000-000000000001', full_name: 'Rajendra Bhosale', role: 'super_admin', designation: 'Managing Director' },
      { id: '00000000-0000-0000-0000-000000000002', full_name: 'Vikram Shinde', role: 'bd_director', designation: 'Director - Business Development' },
      { id: '00000000-0000-0000-0000-000000000003', full_name: 'Amit Deshmukh', role: 'bd_manager', designation: 'Senior Manager - Corporate Sales' },
    ],
  };
}

/**
 * Provision a new user via server-side admin endpoint
 */
export async function provisionUser(payload: ProvisionUserPayload): Promise<{ success: boolean; message?: string; user?: any; error?: string }> {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch('/api/admin/users/provision', {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      return { success: false, error: data.error || 'Failed to provision user.' };
    }

    return { success: true, message: data.message, user: data.user };
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error connecting to admin server.' };
  }
}

/**
 * Update an existing user profile (role, team, manager, status)
 */
export async function updateAdminUser(userId: string, payload: UpdateUserPayload): Promise<{ success: boolean; message?: string; user?: any; error?: string }> {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      return { success: false, error: data.error || 'Failed to update user.' };
    }

    return { success: true, message: data.message, user: data.user };
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error connecting to admin server.' };
  }
}

/**
 * Trigger password reset email or set temporary password for a user
 */
export async function triggerPasswordReset(userId: string, newPassword?: string): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`/api/admin/users/${userId}/reset-password`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ new_password: newPassword, send_email: !newPassword }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      return { success: false, error: data.error || 'Failed to reset password.' };
    }

    return { success: true, message: data.message };
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error connecting to admin server.' };
  }
}

/**
 * Revoke user access and suspend account immediately
 */
export async function revokeUserAccess(userId: string): Promise<{ success: boolean; message?: string; user?: any; error?: string }> {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`/api/admin/users/${userId}/revoke`, {
      method: 'POST',
      headers,
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      return { success: false, error: data.error || 'Failed to revoke access.' };
    }

    return { success: true, message: data.message, user: data.user };
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error connecting to admin server.' };
  }
}

/**
 * Generate direct activation / password setup URL for a user
 */
export async function generateActivationLink(userId: string): Promise<{ success: boolean; link?: string; email?: string; message?: string; error?: string }> {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`/api/admin/users/${userId}/generate-activation-link`, {
      method: 'POST',
      headers,
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      return { success: false, error: data.error || 'Failed to generate activation link.' };
    }

    return { success: true, link: data.link, email: data.email, message: data.message };
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error connecting to admin server.' };
  }
}

