import https from 'node:https';

const SUPABASE_URL = 'https://lyaryldpiviaytcarbtn.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5YXJ5bGRwaXZpYXl0Y2FyYnRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEzNTcwMDAsImV4cCI6MjA1NjkzMzAwMH0.corpbd_production_anon_key';

function fetchJSON(path, headers = {}) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(`${SUPABASE_URL}${path}`);
    const req = https.request({
      hostname: parsedUrl.hostname,
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'GET',
      headers: {
        'apikey': ANON_KEY,
        'Authorization': `Bearer ${ANON_KEY}`,
        'Content-Type': 'application/json',
        ...headers
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, headers: res.headers, data: json });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, raw: data });
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function captureBaseline() {
  console.log('==================================================');
  console.log('STEP 12.17 — PRODUCTION BASELINE CAPTURE');
  console.log('==================================================\n');

  // Fetch all profiles
  const profilesRes = await fetchJSON('/rest/v1/profiles?select=*');
  const profiles = Array.isArray(profilesRes.data) ? profilesRes.data : [];

  console.log(`Total Profiles: ${profiles.length}`);

  const activeProfiles = profiles.filter(p => p.status === 'active' || p.is_active === true || p.status === undefined);
  const inactiveProfiles = profiles.filter(p => p.status === 'inactive' || p.status === 'suspended' || p.is_active === false);

  console.log(`- Active Profiles: ${activeProfiles.length}`);
  console.log(`- Inactive/Suspended Profiles: ${inactiveProfiles.length}`);

  // Breakdown by department
  const byDept = {};
  profiles.forEach(p => {
    const dept = p.department || 'Unassigned';
    byDept[dept] = (byDept[dept] || 0) + 1;
  });
  console.log('\nProfiles by Department:');
  Object.entries(byDept).forEach(([dept, count]) => {
    console.log(`  • ${dept}: ${count}`);
  });

  // Breakdown by role
  const byRole = {};
  profiles.forEach(p => {
    const role = p.role || 'Unassigned';
    byRole[role] = (byRole[role] || 0) + 1;
  });
  console.log('\nProfiles by Role:');
  Object.entries(byRole).forEach(([role, count]) => {
    console.log(`  • ${role}: ${count}`);
  });

  // Breakdown by region
  const byRegion = {};
  profiles.forEach(p => {
    const region = p.region || 'Unassigned';
    byRegion[region] = (byRegion[region] || 0) + 1;
  });
  console.log('\nProfiles by Region:');
  Object.entries(byRegion).forEach(([region, count]) => {
    console.log(`  • ${region}: ${count}`);
  });

  // Breakdown by team
  const byTeam = {};
  profiles.forEach(p => {
    const team = p.team || p.team_id || 'None / Unassigned';
    byTeam[team] = (byTeam[team] || 0) + 1;
  });
  console.log('\nProfiles by Team:');
  Object.entries(byTeam).forEach(([team, count]) => {
    console.log(`  • ${team}: ${count}`);
  });

  // Hierarchy
  const withManager = profiles.filter(p => !!p.manager_id || !!p.manager);
  const withoutManager = profiles.filter(p => !p.manager_id && !p.manager);
  console.log(`\nHierarchy Distribution:`);
  console.log(`  • With Reporting Manager: ${withManager.length}`);
  console.log(`  • Without Reporting Manager (Top-level/Root): ${withoutManager.length}`);

  // Role permissions count
  const rolePermsRes = await fetchJSON('/rest/v1/role_permissions?select=*', {
    'Prefer': 'count=exact',
    'Range-Unit': 'items',
    'Range': '0-0'
  });
  const rolePermCount = rolePermsRes.headers['content-range']?.split('/')[1] || (Array.isArray(rolePermsRes.data) ? rolePermsRes.data.length : '0');
  console.log(`\nTotal role_permissions rows: ${rolePermCount}`);

  // Audit log count
  const auditRes = await fetchJSON('/rest/v1/audit_logs?select=*', {
    'Prefer': 'count=exact',
    'Range-Unit': 'items',
    'Range': '0-0'
  });
  const auditCount = auditRes.headers['content-range']?.split('/')[1] || (Array.isArray(auditRes.data) ? auditRes.data.length : '0');
  console.log(`Total audit_logs rows: ${auditCount}`);

  // Specific employee verification: Devika Pangam & Akshay Tambe
  console.log('\n--------------------------------------------------');
  console.log('Verifying Known Production Employees:');
  console.log('--------------------------------------------------');

  const devika = profiles.find(p => p.email?.toLowerCase() === 'devika@rajmudragroup.com' || p.full_name?.includes('Devika'));
  if (devika) {
    console.log(`🟢 Devika Pangam found:`);
    console.log(`   - ID: ${devika.id}`);
    console.log(`   - Email: ${devika.email}`);
    console.log(`   - Role: ${devika.role}`);
    console.log(`   - Status: ${devika.status || 'active'}`);
    console.log(`   - Org ID: ${devika.organization_id}`);
  } else {
    console.log(`🔴 Devika Pangam not found!`);
  }

  const akshay = profiles.find(p => p.email?.toLowerCase() === 'connect@rajmudragroup.com' || p.full_name?.includes('Akshay'));
  if (akshay) {
    console.log(`🟢 Akshay Tambe found:`);
    console.log(`   - ID: ${akshay.id}`);
    console.log(`   - Email: ${akshay.email}`);
    console.log(`   - Role: ${akshay.role}`);
    console.log(`   - Manager ID: ${akshay.manager_id}`);
    console.log(`   - Manager Name: ${akshay.manager}`);
    console.log(`   - Region: ${akshay.region}`);
    console.log(`   - Team: ${akshay.team || 'NULL'}`);
    console.log(`   - Status: ${akshay.status || 'active'}`);
    console.log(`   - Org ID: ${akshay.organization_id}`);
  } else {
    console.log(`🔴 Akshay Tambe not found!`);
  }

  console.log('\n==================================================');
  console.log('BASELINE CAPTURE COMPLETED SUCCESSFULLY');
  console.log('==================================================\n');
}

captureBaseline().catch(console.error);
