import fs from 'fs';

console.log('=== STEP 11 UX & WORKFLOW POLISH VERIFICATION AUDIT ===\n');

let passCount = 0;
let failCount = 0;

function assert(condition, description) {
  if (condition) {
    console.log(`  🟢 PASS: ${description}`);
    passCount++;
  } else {
    console.error(`  🔴 FAIL: ${description}`);
    failCount++;
  }
}

// 1. Accessibility ARIA Labels & Semantic HTML
console.log('1. Accessibility & ARIA Label Audit:');
const followupsCode = fs.readFileSync('src/components/tabs/FollowupsTab.tsx', 'utf8');
assert(followupsCode.includes('aria-label="Follow-up and Action Item Tracker"'), 'Section accessibility label present');
assert(followupsCode.includes('aria-label="Search follow-up tasks"'), 'Search input ARIA label present');
assert(followupsCode.includes('aria-label="Filter follow-up tasks by status"'), 'Status filter dropdown ARIA label present');
assert(followupsCode.includes('aria-label={`Mark task completed: ${fol.description}`}'), 'Mark Completed button ARIA label present');
assert(followupsCode.includes('aria-label={`Delete task: ${fol.description}`}'), 'Delete task button ARIA label present');

// 2. Permission-Aware Action Controls
console.log('\n2. Permission-Aware UX Action Controls:');
assert(followupsCode.includes('const { can, currentRole } = useRBAC();'), 'Live useRBAC hook used for action permission checks');
assert(followupsCode.includes('disabled={!canCreate}'), 'Schedule Followup button disabled when unauthorized');
assert(followupsCode.includes('disabled={!canEdit}'), 'Mark Completed button disabled when unauthorized');
assert(followupsCode.includes('disabled={!canDelete}'), 'Delete task button disabled when unauthorized');

// 3. Overdue Workflow & Visual Indicators
console.log('\n3. Overdue Workflow & Alert Banner:');
assert(followupsCode.includes('role="alert"'), 'Overdue banner uses accessible role="alert"');
assert(followupsCode.includes('{compStatus === \'Overdue\' ? \'⚠ Overdue\' : compStatus}'), 'Clear visual overdue badge indicator rendered');

// 4. Safety Invariants Check
console.log('\n4. Security & Non-Destructive Safety Invariants:');
const rbacCode = fs.readFileSync('src/utils/rbacPermissions.ts', 'utf8');
assert(!rbacCode.includes('devika.p@rajmudragroup.com'), 'Zero email-based admin bypass in RBAC engine');

const envCode = fs.readFileSync('.env', 'utf8');
assert(!envCode.includes('SUPABASE_SERVICE_ROLE_KEY'), 'No service_role key in frontend .env');

console.log(`\n==================================================`);
console.log(`Step 11 UX Verification: ${passCount} Passed, ${failCount} Failed`);
console.log(`==================================================\n`);
