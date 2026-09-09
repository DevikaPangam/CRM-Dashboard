# CorpBD CRM — Operations & Administration Runbook

This runbook provides step-by-step Standard Operating Procedures (SOPs) for user administration, access control, incident response, and disaster recovery in **CorpBD CRM (Rajmudra Group)**.

---

## Runbook Index
- [1. Creating a New Employee](#1-creating-a-new-employee)
- [2. Activating an Employee](#2-activating-an-employee)
- [3. Deactivating an Employee](#3-deactivating-an-employee)
- [4. Changing User Role](#4-changing-user-role)
- [5. Changing Team Assignment](#5-changing-team-assignment)
- [6. Changing Manager Assignment](#6-changing-manager-assignment)
- [7. Resetting User Access & Credentials](#7-resetting-user-access--credentials)
- [8. Handling a Security Incident](#8-handling-a-security-incident)
- [9. Restoring from Database Backup](#9-restoring-from-database-backup)

---

### 1. Creating a New Employee

**Prerequisite:** Target user must have a valid `@rajmudragroup.com` email address.

#### Method A: Via CRM User Interface (Recommended)
1. Log in as a `super_admin` or `admin`.
2. Navigate to the **User & Access Management** tab (`UsersTab.tsx`).
3. Click the **"Add Employee / Provision User"** button.
4. Fill in the modal fields:
   - **Full Name**: e.g., `Rohit Deshmukh`
   - **Corporate Email**: `rohit.deshmukh@rajmudragroup.com`
   - **Role**: Select from dropdown (`bd_exec`, `bd_sr_exec`, `bd_manager`, etc.)
   - **Team**: Select team (e.g., `Enterprise BD West`)
   - **Reporting Manager**: Select direct manager.
   - **Initial Password / Invitation**: Generate temporary password or select "Send Invite Link".
5. Click **"Save & Provision"**.
6. The user receives an onboarding email with an activation link.

#### Method B: Via Server-Side Admin API
```bash
curl -X POST https://crm.rajmudragroup.com/api/admin/users \
  -H "Authorization: Bearer <SUPER_ADMIN_JWT>" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "rohit.deshmukh@rajmudragroup.com",
    "fullName": "Rohit Deshmukh",
    "role": "bd_exec",
    "teamId": "00000000-0000-0000-0001-000000000001",
    "managerId": "33333333-3333-3333-3333-333333333333"
  }'
```

---

### 2. Activating an Employee

1. Navigate to **User & Access Management**.
2. Locate the user in the directory table (filter by `Status: Inactive` or `Pending`).
3. Click the user row to open the **User Profile Drawer**.
4. Toggle status from `Inactive` to `Active`.
5. Confirm the action. 
6. An automated audit event `USER_ACTIVATED` is logged in `public.audit_logs`.

---

### 3. Deactivating an Employee

**Purpose:** Immediately revoke CRM and database access for departing or suspended staff.

1. Navigate to **User & Access Management**.
2. Locate the user in the directory.
3. Click **"Deactivate User"** in the action menu.
4. Confirm deactivation in the modal prompt.
5. **Immediate Effects:**
   - Profile `status` is set to `'inactive'`.
   - PostgreSQL RLS immediately blocks data queries (evaluates org ID to NULL).
   - Realtime websocket connections are terminated.
   - Any active auth sessions are revoked in Supabase Auth.
6. Reassign their active opportunities and clients to an active team member.

---

### 4. Changing User Role

1. Navigate to **User & Access Management**.
2. Select the target user and click **"Edit Role & Permissions"**.
3. Select the new role from the dropdown (`super_admin`, `bd_director`, `bd_manager`, `bd_sr_exec`, `bd_exec`, `management_viewer`, `analyst`).
4. Click **"Save Role"**.
5. The PostgreSQL trigger `protect_super_admin_role()` ensures only existing `super_admin` users can assign the `super_admin` role.
6. The change is logged in `public.audit_logs` with `old_values.role` and `new_values.role`.

---

### 5. Changing Team Assignment

1. Open **User & Access Management**.
2. Locate the user, click **"Edit Assignment"**.
3. Select the target team (e.g., from `TEAM-BD-WEST` to `TEAM-OPS-FLEET`).
4. Select the new team lead / manager.
5. Click **"Update Team"**.
6. All team-scoped opportunities and performance review aggregations update automatically in Realtime.

---

### 6. Changing Manager Assignment

1. Open the user profile drawer in **User & Access Management**.
2. In the **Reporting Structure** section, click **"Change Manager"**.
3. Select the new reporting manager from the list of active management users.
4. Click **"Confirm Hierarchy Change"**.
5. An audit event `MANAGER_CHANGED` is recorded.

---

### 7. Resetting User Access & Credentials

#### Option A: User Self-Service
1. On the CRM login page, the user clicks **"Forgot Password?"**.
2. User enters their `@rajmudragroup.com` email address.
3. Supabase Auth delivers a secure password recovery token link (15-minute expiry).
4. User enters their new compliant password and logs in.

#### Option B: Admin-Initiated Password Reset
1. Admin opens the user profile in **User & Access Management**.
2. Click **"Send Password Reset Email"**.
3. Supabase Auth dispatches recovery link to the user's verified corporate mailbox.

---

### 8. Handling a Security Incident

**Incident Scenarios:** Suspected compromised credentials, unauthorized export attempt, or rogue API access.

1. **Step 1: Immediate Account Containment**
   - Deactivate the compromised user account immediately in **User & Access Management**.
   - In Supabase Auth dashboard, click **"Revoke All Sessions"** for the target user ID.
2. **Step 2: Inspect Audit Trail & Deltas**
   - Go to **User & Access Management** $\rightarrow$ switch to **"Audit Trail & Delta Inspector"**.
   - Filter logs by `actor_user_id` or affected client/opportunity IDs.
   - Inspect `old_values` vs `new_values` for unauthorized modifications.
3. **Step 3: Storage Containment**
   - If unauthorized document downloads are suspected, verify access logs for bucket `crm-documents`.
   - Existing signed URLs expire automatically within 5 minutes.
4. **Step 4: Rotate API Credentials (If System-Wide Compromise)**
   - Regenerate `VITE_SUPABASE_PUBLISHABLE_KEY` and `SUPABASE_SERVICE_ROLE_KEY` in Supabase Project Settings.
   - Update server environment variables and restart backend service.
5. **Step 5: Post-Incident Review**
   - Export immutable audit logs to an external compliance archive.
   - Document root cause and implement preventative access controls.

---

### 9. Restoring from Database Backup

#### Point-in-Time Recovery (PITR) via Supabase Dashboard
1. Log in to the Supabase Cloud Console for the **Rajmudra Group Production** project.
2. Navigate to **Database** $\rightarrow$ **Backups**.
3. Select **"Point in Time Recovery"**.
4. Select the timestamp immediately prior to the data corruption or accidental deletion event.
5. Click **"Restore to Point in Time"**.
6. Verify table counts and relationship integrity:
   ```sql
   select 
     (select count(*) from public.clients) as client_count,
     (select count(*) from public.opportunities) as opp_count,
     (select count(*) from public.proposals) as proposal_count;
   ```

#### Offline JSON Backup Restore (If Restoring Specific Tables)
```bash
# Execute offline data migration script against database
node scripts/migrate-crm-data.js
```
