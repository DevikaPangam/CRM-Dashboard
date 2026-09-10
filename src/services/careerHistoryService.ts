import { supabase, isSupabaseConfigured } from '../utils/supabaseClient';
import { EmployeeHistoryEvent, EmployeeEventType, User } from '../types/crm';
import { logAuditEvent } from './auditService';

const STORAGE_KEY = 'corpbd_crm_employee_history';

// ── Local cache helpers (non-authoritative, offline fallback only) ────────────
export const loadStoredHistory = (): EmployeeHistoryEvent[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const cacheHistoryLocally = (events: EmployeeHistoryEvent[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
  } catch { /* non-critical */ }
};

/** @deprecated Use cacheHistoryLocally instead — preserved for backward compat */
export const saveStoredHistory = cacheHistoryLocally;

/**
 * Generate canonical joining milestone event for an employee
 */
export const createCanonicalJoiningEvent = (user: User): EmployeeHistoryEvent => {
  const joining = user.joining_date || '2024-04-01';
  return {
    id: `join-${user.id}`,
    employee_id: user.id,
    organization_id: user.organization_id,
    event_type: 'joining',
    effective_date: joining,
    title: 'Joined Rajmudra Group',
    description: `Inducted into ${user.department || 'Business Development'} department as ${user.designation || user.role} stationed at ${user.location || 'Corporate HQ - Mumbai'}.`,
    designation_after: user.designation || user.role,
    department_after: user.department || 'Business Development',
    team_after: user.team_name || 'Enterprise BD West',
    region_after: user.region || 'West Region',
    location_after: user.location || 'Corporate HQ - Mumbai',
    created_by_name: 'HR Onboarding Team',
    created_at: `${joining}T09:00:00.000Z`,
    updated_at: `${joining}T09:00:00.000Z`,
  };
};

/**
 * Fetch chronological career history for an employee
 */
/**
 * Transform a raw DB row into a typed EmployeeHistoryEvent
 */
function transformHistoryFromDB(d: any): EmployeeHistoryEvent {
  return {
    id: d.id,
    employee_id: d.employee_id,
    organization_id: d.organization_id,
    event_type: d.event_type as EmployeeEventType,
    effective_date: d.effective_date,
    title: d.title,
    description: d.description,
    previous_value: d.previous_value,
    new_value: d.new_value,
    designation_before: d.designation_before,
    designation_after: d.designation_after,
    department_before: d.department_before,
    department_after: d.department_after,
    team_before: d.team_before,
    team_after: d.team_after,
    region_before: d.region_before,
    region_after: d.region_after,
    manager_before: d.manager_before,
    manager_after: d.manager_after,
    location_before: d.location_before,
    location_after: d.location_after,
    created_by: d.created_by,
    created_by_name: d.created_by_name,
    created_at: d.created_at,
    updated_at: d.updated_at,
  };
}

/**
 * Fetch all employee_history records for the entire organization.
 * Used during refreshCRMData to bulk-load history from Supabase (authoritative).
 */
export async function fetchAllOrgHistory(orgId: string): Promise<EmployeeHistoryEvent[]> {
  if (!isSupabaseConfigured()) return loadStoredHistory();
  try {
    const { data, error } = await (supabase
      .from('employee_history') as any)
      .select('*')
      .eq('organization_id', orgId)
      .order('effective_date', { ascending: false });

    if (!error && data && data.length > 0) {
      const events = (data as any[]).map(transformHistoryFromDB);
      cacheHistoryLocally(events); // cache for offline
      return events;
    }
    if (error) console.warn('fetchAllOrgHistory error:', error);
  } catch (err) {
    console.warn('fetchAllOrgHistory fallback to local cache:', err);
  }
  return loadStoredHistory();
}

/**
 * Fetch chronological career history for a single employee.
 * Supabase-first, localStorage as fallback.
 */
export async function fetchEmployeeHistory(employeeId: string, user?: User): Promise<EmployeeHistoryEvent[]> {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await (supabase
        .from('employee_history') as any)
        .select('*')
        .eq('employee_id', employeeId)
        .order('effective_date', { ascending: false });

      if (!error && data && data.length > 0) {
        const events = (data as any[]).map(transformHistoryFromDB);
        return events;
      }
    } catch (err) {
      console.warn('Supabase fetchEmployeeHistory fallback to local:', err);
    }
  }

  // Fallback: local cache
  const localHistory = loadStoredHistory().filter((h) => h.employee_id === employeeId);

  // If no history at all and user is provided, generate canonical joining event
  if (localHistory.length === 0 && user) {
    return [createCanonicalJoiningEvent(user)];
  }

  return localHistory.sort((a, b) => new Date(b.effective_date).getTime() - new Date(a.effective_date).getTime());
}

/**
 * Fire-and-forget audit log for career events
 */
async function logCareerAudit(record: EmployeeHistoryEvent, actorUser?: User) {
  try {
    await logAuditEvent({
      organizationId: record.organization_id,
      userId: actorUser?.id,
      userName: actorUser?.name || record.created_by_name,
      action: 'CAREER_EVENT_CREATED',
      entityType: 'employee_history',
      entityId: record.id,
      newValues: {
        employee_id: record.employee_id,
        event_type: record.event_type,
        title: record.title,
        effective_date: record.effective_date,
      },
      metadata: { source: 'careerHistoryService', title: record.title },
    });
  } catch { /* non-critical */ }
}

/**
 * Add a new career event manually (by authorized admin/manager)
 */
export async function addCareerHistoryEvent(
  event: Omit<EmployeeHistoryEvent, 'id' | 'created_at' | 'updated_at'>,
  actorUser?: User
): Promise<EmployeeHistoryEvent> {
  const newId = crypto.randomUUID();
  const now = new Date().toISOString();

  const newRecord: EmployeeHistoryEvent = {
    ...event,
    id: newId,
    created_at: now,
    updated_at: now,
    created_by_name: event.created_by_name || actorUser?.name || 'System Administrator',
  };

  const dbPayload = {
    id: newRecord.id,
    employee_id: newRecord.employee_id,
    organization_id: newRecord.organization_id,
    event_type: newRecord.event_type,
    effective_date: newRecord.effective_date,
    title: newRecord.title,
    description: newRecord.description,
    previous_value: newRecord.previous_value || {},
    new_value: newRecord.new_value || {},
    designation_before: newRecord.designation_before,
    designation_after: newRecord.designation_after,
    department_before: newRecord.department_before,
    department_after: newRecord.department_after,
    team_before: newRecord.team_before,
    team_after: newRecord.team_after,
    region_before: newRecord.region_before,
    region_after: newRecord.region_after,
    manager_before: newRecord.manager_before,
    manager_after: newRecord.manager_after,
    location_before: newRecord.location_before,
    location_after: newRecord.location_after,
    created_by: actorUser?.id,
    created_by_name: newRecord.created_by_name,
    created_at: now,
    updated_at: now,
  };

  // 1. Supabase is the authoritative store — insert there first
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await (supabase.from('employee_history') as any)
        .insert(dbPayload)
        .select()
        .single();

      if (error) {
        console.error('Supabase addCareerHistoryEvent insert failed:', error);
        // Fall through to local cache
      } else if (data) {
        const saved = transformHistoryFromDB(data);
        // Update local cache
        const allHistory = loadStoredHistory();
        allHistory.unshift(saved);
        cacheHistoryLocally(allHistory);
        // Audit (non-blocking)
        logCareerAudit(saved, actorUser);
        return saved;
      }
    } catch (err) {
      console.warn('Supabase addCareerHistoryEvent exception, saving to local cache:', err);
    }
  }

  // 2. Fallback: save locally only (offline / Supabase unavailable)
  const allHistory = loadStoredHistory();
  allHistory.unshift(newRecord);
  cacheHistoryLocally(allHistory);

  // Audit (non-blocking)
  logCareerAudit(newRecord, actorUser);

  return newRecord;
}

/**
 * Automatically compare old profile and new profile updates,
 * generating corresponding structured employee_history events.
 */
export async function detectAndRecordAutoHistory(
  oldUser: User,
  updates: Partial<User>,
  actorUser?: User
): Promise<EmployeeHistoryEvent[]> {
  const generatedEvents: EmployeeHistoryEvent[] = [];
  const today = new Date().toISOString().split('T')[0];
  const actorName = actorUser?.name || 'System Administrator';

  // 1. Designation Change / Promotion
  if (updates.designation && updates.designation !== oldUser.designation) {
    const isPromotion =
      updates.designation.toLowerCase().includes('senior') ||
      updates.designation.toLowerCase().includes('lead') ||
      updates.designation.toLowerCase().includes('manager') ||
      updates.designation.toLowerCase().includes('director') ||
      updates.designation.toLowerCase().includes('head');

    const eventType: EmployeeEventType = isPromotion ? 'promotion' : 'designation_change';
    const title = isPromotion
      ? `Promoted to ${updates.designation}`
      : `Designation Updated to ${updates.designation}`;

    const ev = await addCareerHistoryEvent(
      {
        employee_id: oldUser.id,
        organization_id: oldUser.organization_id,
        event_type: eventType,
        effective_date: today,
        title,
        description: `Designation transitioned from "${oldUser.designation || 'BD Executive'}" to "${updates.designation}".`,
        designation_before: oldUser.designation,
        designation_after: updates.designation,
        previous_value: { designation: oldUser.designation },
        new_value: { designation: updates.designation },
        created_by_name: actorName,
      },
      actorUser
    );
    generatedEvents.push(ev);
  }

  // 2. Department Change
  if (updates.department && updates.department !== oldUser.department) {
    const ev = await addCareerHistoryEvent(
      {
        employee_id: oldUser.id,
        organization_id: oldUser.organization_id,
        event_type: 'department_change',
        effective_date: today,
        title: `Transferred to ${updates.department}`,
        description: `Department changed from "${oldUser.department || 'Business Development'}" to "${updates.department}".`,
        department_before: oldUser.department,
        department_after: updates.department,
        previous_value: { department: oldUser.department },
        new_value: { department: updates.department },
        created_by_name: actorName,
      },
      actorUser
    );
    generatedEvents.push(ev);
  }

  // 3. Team Change
  if (
    (updates.team_name && updates.team_name !== oldUser.team_name) ||
    (updates.team_id && updates.team_id !== oldUser.team_id)
  ) {
    const newTeamName = updates.team_name || 'Assigned Team';
    const ev = await addCareerHistoryEvent(
      {
        employee_id: oldUser.id,
        organization_id: oldUser.organization_id,
        event_type: 'team_change',
        effective_date: today,
        title: `Team Reassigned to ${newTeamName}`,
        description: `Reassigned from "${oldUser.team_name || 'Previous Team'}" to "${newTeamName}".`,
        team_before: oldUser.team_name,
        team_after: newTeamName,
        previous_value: { team_id: oldUser.team_id, team_name: oldUser.team_name },
        new_value: { team_id: updates.team_id, team_name: newTeamName },
        created_by_name: actorName,
      },
      actorUser
    );
    generatedEvents.push(ev);
  }

  // 4. Region Change
  if (updates.region && updates.region !== oldUser.region) {
    const ev = await addCareerHistoryEvent(
      {
        employee_id: oldUser.id,
        organization_id: oldUser.organization_id,
        event_type: 'region_change',
        effective_date: today,
        title: `Territory Transferred to ${updates.region}`,
        description: `Regional jurisdiction transferred from "${oldUser.region || 'Territory'}" to "${updates.region}".`,
        region_before: oldUser.region,
        region_after: updates.region,
        previous_value: { region: oldUser.region },
        new_value: { region: updates.region },
        created_by_name: actorName,
      },
      actorUser
    );
    generatedEvents.push(ev);
  }

  // 5. Manager Change
  if (
    (updates.manager_name && updates.manager_name !== oldUser.manager_name) ||
    (updates.manager_id && updates.manager_id !== oldUser.manager_id)
  ) {
    const newMgrName = updates.manager_name || 'Reporting Manager';
    const ev = await addCareerHistoryEvent(
      {
        employee_id: oldUser.id,
        organization_id: oldUser.organization_id,
        event_type: 'manager_change',
        effective_date: today,
        title: `Reporting Manager Reassigned to ${newMgrName}`,
        description: `Reporting hierarchy changed from "${oldUser.manager_name || 'None'}" to "${newMgrName}".`,
        manager_before: oldUser.manager_name,
        manager_after: newMgrName,
        previous_value: { manager_id: oldUser.manager_id, manager_name: oldUser.manager_name },
        new_value: { manager_id: updates.manager_id, manager_name: newMgrName },
        created_by_name: actorName,
      },
      actorUser
    );
    generatedEvents.push(ev);
  }

  // 6. Location Change
  if (updates.location && updates.location !== oldUser.location) {
    const ev = await addCareerHistoryEvent(
      {
        employee_id: oldUser.id,
        organization_id: oldUser.organization_id,
        event_type: 'location_change',
        effective_date: today,
        title: `Base Location Relocated to ${updates.location}`,
        description: `Base office location moved from "${oldUser.location || 'Headquarters'}" to "${updates.location}".`,
        location_before: oldUser.location,
        location_after: updates.location,
        previous_value: { location: oldUser.location },
        new_value: { location: updates.location },
        created_by_name: actorName,
      },
      actorUser
    );
    generatedEvents.push(ev);
  }

  // 7. Responsibility / Regional Owner Change
  if (updates.is_regional_owner !== undefined && updates.is_regional_owner !== oldUser.is_regional_owner) {
    const isOwner = updates.is_regional_owner;
    const title = isOwner
      ? `Appointed Regional Territory Owner - ${updates.region || oldUser.region || 'West'}`
      : `Regional Owner Responsibility Relinquished`;

    const description = isOwner
      ? `Assumed end-to-end commercial command, fleet quota governance, and revenue pipeline leadership across ${updates.region || oldUser.region || 'assigned territory'}.`
      : `Regional territory ownership authority relinquished for ${oldUser.region || 'assigned territory'}.`;

    const ev = await addCareerHistoryEvent(
      {
        employee_id: oldUser.id,
        organization_id: oldUser.organization_id,
        event_type: 'responsibility_change',
        effective_date: today,
        title,
        description,
        previous_value: { is_regional_owner: oldUser.is_regional_owner },
        new_value: { is_regional_owner: updates.is_regional_owner },
        created_by_name: actorName,
      },
      actorUser
    );
    generatedEvents.push(ev);
  }

  return generatedEvents;
}
