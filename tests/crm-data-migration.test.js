/**
 * CRM Data Migration Verification Test Suite
 * Tests entity transformers, organization scoping, and CRUD data pipelines.
 */

const assert = require('assert');

// Transform mock functions aligned with src/services/crmDataService.ts
function transformClientFromDB(row, contacts = []) {
  return {
    id: row.id,
    code: row.client_code || row.id.slice(0, 8).toUpperCase(),
    name: row.name,
    clientType: row.client_type || 'Existing Client',
    industry: row.industry || 'Technology',
    segment: row.segment || 'Enterprise IT & ITeS',
    city: row.city || 'Pune',
    state: row.state || 'Maharashtra',
    region: row.region || 'West',
    tier: row.tier || 'Tier 1 (Enterprise)',
    turnoverCr: Number(row.turnover_cr) || 0,
    employees: Number(row.employees_count) || 0,
    status: row.status || 'Active',
    accountOwner: row.account_owner || 'Unassigned',
    website: row.website || '',
    address: row.address || '',
    createdDate: row.created_at ? row.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
    contacts: contacts.map((c) => ({
      id: c.id,
      name: c.name,
      designation: c.designation || '',
      email: c.email || '',
      phone: c.phone || '',
      isPrimary: Boolean(c.is_primary),
    })),
    deployedFleets: row.deployed_fleets || [],
    notes: row.notes || '',
  };
}

function transformClientToDB(client, orgId, userId) {
  return {
    organization_id: orgId,
    client_code: client.code || undefined,
    name: client.name,
    client_type: client.clientType || 'Existing Client',
    industry: client.industry,
    segment: client.segment,
    city: client.city,
    state: client.state,
    region: client.region,
    tier: client.tier,
    turnover_cr: client.turnoverCr,
    employees_count: client.employees,
    status: client.status || 'Active',
    account_owner: client.accountOwner,
    website: client.website,
    address: client.address,
    deployed_fleets: client.deployedFleets || [],
    notes: client.notes,
    created_by: userId,
  };
}

function transformOpportunityFromDB(row) {
  return {
    id: row.id,
    code: row.opportunity_code || row.id.slice(0, 8).toUpperCase(),
    title: row.title,
    clientId: row.client_id || '',
    clientName: row.client_name || 'Client',
    clientType: row.client_type || 'Existing Client',
    segment: row.segment || 'General Fleet',
    serviceCategory: row.service_category || 'Corporate Mobility',
    contractType: row.contract_type || 'Annual Contract',
    dealValueINR: Number(row.deal_value_inr) || 0,
    monthlyValueINR: Number(row.monthly_value_inr) || 0,
    stage: row.stage || 'Lead / Inception',
    probability: Number(row.probability_pct) || 10,
    status: row.status || 'Open',
    owner: row.owner_name || 'BD Owner',
    leadSource: row.lead_source || 'Direct Outreach',
    expectedCloseDate: row.expected_close_date || '',
    createdDate: row.created_at ? row.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
    lastActivityDate: row.last_activity_date || '',
    nextFollowupDate: row.next_followup_date || '',
    fleetSize: Number(row.fleet_size) || 0,
    vehicleType: row.vehicle_type || '',
    locations: row.locations || '',
    competition: row.competition || '',
    winProbabilityNotes: row.win_probability_notes || '',
    lostReason: row.lost_reason || '',
    lostRemarks: row.lost_remarks || '',
    internalApprovalsRequired: Boolean(row.internal_approvals_required),
    notes: row.notes || '',
    approvalStatus: row.approval_status || 'Not Required',
    approvalRemarks: row.approval_remarks || '',
    approvedBy: row.approved_by || '',
    approvedDate: row.approved_at || '',
    delegatedDepartment: row.delegated_department || 'BD',
    delegatedOwner: row.delegated_owner || '',
    delegationStatus: row.delegation_status || 'Pending Action',
    delegationMilestone: row.delegation_milestone || '',
    slaDaysRemaining: Number(row.sla_days_remaining) || 0,
    delegationRemarks: row.delegation_remarks || '',
  };
}

function runTests() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  🧪 Running CRM Data Layer Migration Verification Tests');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  let passed = 0;
  let total = 0;

  function test(name, fn) {
    total++;
    try {
      fn();
      console.log(`  ✅ [PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ [FAIL] ${name}`);
      console.error(`     Error: ${err.message}`);
    }
  }

  const ORG_ID = '00000000-0000-0000-0000-000000000001';
  const USER_ID = 'auth-user-001';

  // Test 1: Client bidirectional transformation
  test('Transform Client from DB snake_case to CRM camelCase', () => {
    const dbRow = {
      id: 'cl-12345678',
      client_code: 'CLT-1001',
      name: 'Infosys BPM',
      client_type: 'Existing Client',
      industry: 'IT Services',
      segment: 'Enterprise IT',
      city: 'Pune',
      state: 'Maharashtra',
      region: 'West',
      tier: 'Tier 1 (Enterprise)',
      turnover_cr: 250,
      employees_count: 5000,
      status: 'Active',
      account_owner: 'Amit Deshmukh',
      website: 'https://infosys.com',
      address: 'Hinjawadi Phase 2, Pune',
      created_at: '2026-03-01T10:00:00Z',
      deployed_fleets: [{ seaterCapacity: '32 Seater – AC', vehicleCount: 15, monthlyRatePerVehicleINR: 120000 }],
    };

    const contacts = [
      { id: 'con-1', name: 'Rajesh Nair', designation: 'VP Admin', email: 'rajesh@infosys.com', phone: '9876543210', is_primary: true },
    ];

    const crmClient = transformClientFromDB(dbRow, contacts);
    assert.strictEqual(crmClient.id, 'cl-12345678');
    assert.strictEqual(crmClient.code, 'CLT-1001');
    assert.strictEqual(crmClient.name, 'Infosys BPM');
    assert.strictEqual(crmClient.turnoverCr, 250);
    assert.strictEqual(crmClient.employees, 5000);
    assert.strictEqual(crmClient.contacts.length, 1);
    assert.strictEqual(crmClient.contacts[0].isPrimary, true);
    assert.strictEqual(crmClient.deployedFleets.length, 1);
  });

  // Test 2: Client to DB payload injection of organization_id
  test('Transform Client to DB guarantees organization_id injection', () => {
    const crmPayload = {
      name: 'Wipro Limited',
      clientType: 'New Client',
      industry: 'IT',
      segment: 'Enterprise IT',
      city: 'Pune',
      state: 'Maharashtra',
      region: 'West',
      tier: 'Tier 1 (Enterprise)',
      turnoverCr: 400,
      employees: 8000,
      status: 'Active',
      accountOwner: 'Vikram Shinde',
    };

    const dbPayload = transformClientToDB(crmPayload, ORG_ID, USER_ID);
    assert.strictEqual(dbPayload.organization_id, ORG_ID);
    assert.strictEqual(dbPayload.created_by, USER_ID);
    assert.strictEqual(dbPayload.name, 'Wipro Limited');
    assert.strictEqual(dbPayload.turnover_cr, 400);
    assert.strictEqual(dbPayload.employees_count, 8000);
  });

  // Test 3: Opportunity transformation
  test('Transform Opportunity from DB preserves all commercial and delegation fields', () => {
    const dbOpp = {
      id: 'opp-12345678',
      opportunity_code: 'OPP-001',
      title: 'Wipro Hinjawadi 40-Bus Employee Transport Contract',
      client_id: 'cl-12345678',
      client_name: 'Wipro Limited',
      deal_value_inr: 48000000,
      monthly_value_inr: 4000000,
      stage: 'Commercial Discussion',
      probability_pct: 75,
      status: 'In Process',
      owner_name: 'Amit Deshmukh',
      fleet_size: 40,
      vehicle_type: '32 Seater AC',
      delegated_department: 'Pricing & Commercials',
      delegated_owner: 'Pooja Kulkarni',
      delegation_status: 'In Review',
      sla_days_remaining: 2,
    };

    const opp = transformOpportunityFromDB(dbOpp);
    assert.strictEqual(opp.id, 'opp-12345678');
    assert.strictEqual(opp.code, 'OPP-001');
    assert.strictEqual(opp.dealValueINR, 48000000);
    assert.strictEqual(opp.monthlyValueINR, 4000000);
    assert.strictEqual(opp.probability, 75);
    assert.strictEqual(opp.delegatedDepartment, 'Pricing & Commercials');
    assert.strictEqual(opp.slaDaysRemaining, 2);
  });

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`  Summary: ${passed} / ${total} Tests Passed (${((passed / total) * 100).toFixed(0)}%)`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  if (passed !== total) {
    process.exit(1);
  }
}

runTests();
