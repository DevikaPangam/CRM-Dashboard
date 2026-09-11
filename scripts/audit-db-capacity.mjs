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

async function runAudit() {
  console.log('=== STEP 8.1 LIVE DATABASE READ-ONLY AUDIT ===\n');
  
  // 1. Fetch OpenAPI schema definition
  const schemaRes = await fetchJSON('/rest/v1/?apikey=' + ANON_KEY);
  let allTablesInSchema = [];
  if (schemaRes.status === 200 && schemaRes.data && schemaRes.data.definitions) {
    allTablesInSchema = Object.keys(schemaRes.data.definitions);
    console.log(`Discovered ${allTablesInSchema.length} tables/views in OpenAPI schema:`);
    console.log(allTablesInSchema.join(', '));
  } else {
    console.log('Could not fetch OpenAPI schema definition directly, status:', schemaRes.status);
  }

  // Known CRM tables to audit
  const crmTables = [
    'organizations',
    'teams',
    'profiles',
    'role_permissions',
    'clients',
    'contacts',
    'opportunities',
    'activities',
    'followups',
    'documents',
    'proposals',
    'internal_tasks',
    'employee_history',
    'employee_kras',
    'employee_kpis',
    'employee_performance_reviews',
    'audit_logs',
    'notifications'
  ];

  // Merge any additional tables discovered in OpenAPI schema
  const auditTargetTables = Array.from(new Set([...crmTables, ...allTablesInSchema]));

  console.log('\n--- Table Row Counts & Basic Probe ---');
  const tableData = {};
  for (const table of auditTargetTables) {
    // Request exact count using Range header
    const res = await fetchJSON(`/rest/v1/${table}?select=*`, {
      'Prefer': 'count=exact',
      'Range-Unit': 'items',
      'Range': '0-0'
    });

    const contentRange = res.headers['content-range'] || '';
    const totalCount = contentRange.split('/')[1] || (Array.isArray(res.data) ? res.data.length : 'N/A');
    tableData[table] = {
      status: res.status,
      count: totalCount,
      sample: Array.isArray(res.data) ? res.data : []
    };
    console.log(`Table '${table.padEnd(30)}': HTTP ${res.status} | Count: ${totalCount}`);
  }

  // Inspect profiles specifically
  console.log('\n--- Profiles Detail Probe ---');
  const profRes = await fetchJSON('/rest/v1/profiles?select=*');
  if (Array.isArray(profRes.data)) {
    console.log(`Found ${profRes.data.length} profile records:`);
    profRes.data.forEach(p => {
      console.log(`- ID: ${p.id} | Email: ${p.email} | Role: ${p.role} | Org: ${p.org_id} | Created: ${p.created_at}`);
    });
  } else {
    console.log('Profiles data response:', profRes);
  }

  // Inspect audit logs
  console.log('\n--- Audit Logs Detail Probe ---');
  const auditRes = await fetchJSON('/rest/v1/audit_logs?select=*&order=created_at.desc&limit=10');
  console.log('Audit logs status:', auditRes.status, 'Count header:', auditRes.headers['content-range']);
  if (Array.isArray(auditRes.data)) {
    console.log('Recent 10 audit logs:', auditRes.data);
  }

  // Inspect notifications
  console.log('\n--- Notifications Detail Probe ---');
  const notifRes = await fetchJSON('/rest/v1/notifications?select=*&order=created_at.desc&limit=10');
  console.log('Notifications status:', notifRes.status, 'Count header:', notifRes.headers['content-range']);
  if (Array.isArray(notifRes.data)) {
    console.log('Recent 10 notifications:', notifRes.data);
  }

  // Inspect documents
  console.log('\n--- Documents Metadata Probe ---');
  const docRes = await fetchJSON('/rest/v1/documents?select=*');
  console.log('Documents status:', docRes.status, 'Count header:', docRes.headers['content-range']);
  if (Array.isArray(docRes.data)) {
    console.log(`Found ${docRes.data.length} document metadata records:`, docRes.data);
  }

  // Inspect clients & contacts
  console.log('\n--- Clients & Contacts Probe ---');
  const clientRes = await fetchJSON('/rest/v1/clients?select=*');
  console.log(`Clients (${clientRes.data?.length || 0}):`, clientRes.data);
  const contactRes = await fetchJSON('/rest/v1/contacts?select=*');
  console.log(`Contacts (${contactRes.data?.length || 0}):`, contactRes.data);

  // Inspect opportunities
  console.log('\n--- Opportunities Probe ---');
  const oppRes = await fetchJSON('/rest/v1/opportunities?select=*');
  console.log(`Opportunities (${oppRes.data?.length || 0}):`, oppRes.data);

  // Inspect activities & followups
  console.log('\n--- Activities & Followups Probe ---');
  const actRes = await fetchJSON('/rest/v1/activities?select=*');
  console.log(`Activities (${actRes.data?.length || 0}):`, actRes.data);
  const folRes = await fetchJSON('/rest/v1/followups?select=*');
  console.log(`Followups (${folRes.data?.length || 0}):`, folRes.data);

  // Inspect employee history & KRAs / KPIs
  console.log('\n--- Employee HR Probe ---');
  const empHistRes = await fetchJSON('/rest/v1/employee_history?select=*');
  console.log(`Employee History (${empHistRes.data?.length || 0}):`, empHistRes.data);
  const kraRes = await fetchJSON('/rest/v1/employee_kras?select=*');
  console.log(`Employee KRAs (${kraRes.data?.length || 0}):`, kraRes.data);
  const kpiRes = await fetchJSON('/rest/v1/employee_kpis?select=*');
  console.log(`Employee KPIs (${kpiRes.data?.length || 0}):`, kpiRes.data);

  // Check RPCs or custom inspection functions if defined
  console.log('\n--- Custom Functions Check ---');
  const rpcRes = await fetchJSON('/rest/v1/rpc/get_db_size');
  console.log('RPC get_db_size status:', rpcRes.status, rpcRes.data);

}

runAudit().catch(console.error);
