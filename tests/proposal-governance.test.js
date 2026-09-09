/**
 * Proposal Governance & Separation of Duties (SoD) Verification Suite
 * Tests proposal lifecycle, version lineage, and self-approval prevention.
 */

const assert = require('assert');

class ProposalGovernanceEngine {
  constructor() {
    this.proposals = [];
    this.auditLogs = [];
  }

  createProposal(payload) {
    const nextVersion = this.proposals.filter((p) => p.opportunityId === payload.opportunityId).length + 1;
    const proposal = {
      id: `prop-${Date.now()}-${nextVersion}`,
      opportunityId: payload.opportunityId,
      clientId: payload.clientId,
      ownerId: payload.ownerId,
      submittedBy: payload.submittedBy,
      submittedByName: payload.submittedByName,
      versionNumber: nextVersion,
      versionLabel: `v${nextVersion}.0`,
      status: 'draft',
      totalCommercialValueINR: payload.totalCommercialValueINR,
      marginPct: payload.marginPct,
    };
    this.proposals.push(proposal);
    return proposal;
  }

  submitForReview(proposalId, callerId) {
    const p = this.proposals.find((prop) => prop.id === proposalId);
    if (!p) return { success: false, error: 'Proposal not found' };
    p.status = 'under_review';
    p.submittedBy = callerId;
    return { success: true, proposal: p };
  }

  approveProposal(proposalId, approverId, approverRole, approverName, remarks) {
    const p = this.proposals.find((prop) => prop.id === proposalId);
    if (!p) return { success: false, error: 'Proposal not found' };

    // 1. RBAC Check
    if (!['super_admin', 'bd_director', 'bd_manager'].includes(approverRole)) {
      return { success: false, status: 403, error: 'Unauthorized: User does not have proposal approval rights.' };
    }

    // 2. Separation of Duties (SoD) Check: Author / Owner cannot approve own proposal
    if (approverId === p.ownerId || approverId === p.submittedBy) {
      return {
        success: false,
        status: 403,
        error: 'Separation of Duties Violation: You cannot approve a commercial proposal that you created or submitted.',
      };
    }

    // 3. Supersede previous approved versions for this opportunity
    this.proposals.forEach((prop) => {
      if (prop.opportunityId === p.opportunityId && prop.id !== p.id && prop.status === 'approved') {
        prop.status = 'superseded';
      }
    });

    p.status = 'approved';
    p.approvedBy = approverId;
    p.approvedByName = approverName;
    p.approvedAt = new Date().toISOString();

    this.auditLogs.push({
      action: 'APPROVE_PROPOSAL',
      proposalId: p.id,
      approverId,
      remarks,
    });

    return { success: true, proposal: p };
  }

  rejectProposal(proposalId, approverId, approverRole, approverName, reason) {
    const p = this.proposals.find((prop) => prop.id === proposalId);
    if (!p) return { success: false, error: 'Proposal not found' };

    if (!reason || !reason.trim()) {
      return { success: false, status: 400, error: 'Rejection requires a documented reason.' };
    }

    p.status = 'rejected';
    p.rejectionReason = reason.trim();
    p.approvedBy = approverId;
    p.approvedByName = approverName;

    return { success: true, proposal: p };
  }
}

function runTests() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  📑 Running Proposal Governance & Separation of Duties Suite');
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

  const engine = new ProposalGovernanceEngine();
  const authorUserId = 'u-bd-exec-1';
  const directorUserId = 'u-bd-director';
  const viewerUserId = 'u-analyst';

  // Test 1: Draft proposal creation & version numbering
  test('Create Proposal Version 1.0 with draft status', () => {
    const p1 = engine.createProposal({
      opportunityId: 'opp-tcs-1',
      clientId: 'cl-tcs',
      ownerId: authorUserId,
      submittedBy: authorUserId,
      submittedByName: 'Anand Shinde',
      totalCommercialValueINR: 50000000,
      marginPct: 22.0,
    });

    assert.strictEqual(p1.versionNumber, 1);
    assert.strictEqual(p1.versionLabel, 'v1.0');
    assert.strictEqual(p1.status, 'draft');
  });

  // Test 2: Submit for review
  test('Transition proposal from draft to under_review', () => {
    const p1 = engine.proposals[0];
    const res = engine.submitForReview(p1.id, authorUserId);
    assert.strictEqual(res.success, true);
    assert.strictEqual(p1.status, 'under_review');
  });

  // Test 3: Separation of Duties — Author CANNOT approve own proposal
  test('Separation of Duties: Block author from self-approving proposal', () => {
    const p1 = engine.proposals[0];
    const res = engine.approveProposal(p1.id, authorUserId, 'bd_manager', 'Anand Shinde', 'Self approving');
    assert.strictEqual(res.success, false);
    assert.strictEqual(res.status, 403);
    assert.ok(res.error.includes('Separation of Duties Violation'));
  });

  // Test 4: RBAC Check — Unauthorized roles cannot approve
  test('RBAC Enforcement: Analyst / Viewer cannot approve proposal', () => {
    const p1 = engine.proposals[0];
    const res = engine.approveProposal(p1.id, viewerUserId, 'analyst', 'Analyst User', 'Approving');
    assert.strictEqual(res.success, false);
    assert.strictEqual(res.status, 403);
  });

  // Test 5: Independent Director approval succeeds
  test('Independent Authority: BD Director successfully approves proposal', () => {
    const p1 = engine.proposals[0];
    const res = engine.approveProposal(
      p1.id,
      directorUserId,
      'bd_director',
      'Vikram Shinde',
      'Commercial margins validated.'
    );
    assert.strictEqual(res.success, true);
    assert.strictEqual(p1.status, 'approved');
    assert.strictEqual(p1.approvedBy, directorUserId);
  });

  // Test 6: Rejection requires documented reason
  test('Rejection enforcement requires documented reason', () => {
    const p2 = engine.createProposal({
      opportunityId: 'opp-wipro-2',
      clientId: 'cl-wipro',
      ownerId: authorUserId,
      submittedBy: authorUserId,
      totalCommercialValueINR: 20000000,
      marginPct: 10.0,
    });

    const failedRejection = engine.rejectProposal(p2.id, directorUserId, 'bd_director', 'Vikram Shinde', '');
    assert.strictEqual(failedRejection.success, false);
    assert.strictEqual(failedRejection.status, 400);

    const validRejection = engine.rejectProposal(
      p2.id,
      directorUserId,
      'bd_director',
      'Vikram Shinde',
      'Margin is 10%, which is below our 18% floor.'
    );
    assert.strictEqual(validRejection.success, true);
    assert.strictEqual(p2.status, 'rejected');
  });

  // Test 7: Versioning and Superseded status
  test('Versioning: New approved proposal v2.0 transitions v1.0 to superseded', () => {
    const p1 = engine.proposals.find((p) => p.opportunityId === 'opp-tcs-1');
    assert.strictEqual(p1.status, 'approved');

    // Create v2 for same opportunity
    const p2 = engine.createProposal({
      opportunityId: 'opp-tcs-1',
      clientId: 'cl-tcs',
      ownerId: authorUserId,
      submittedBy: authorUserId,
      totalCommercialValueINR: 55000000,
      marginPct: 24.0,
    });

    assert.strictEqual(p2.versionNumber, 2);
    assert.strictEqual(p2.versionLabel, 'v2.0');

    // Approve v2 by director
    engine.approveProposal(p2.id, directorUserId, 'bd_director', 'Vikram Shinde', 'Revised rates accepted.');

    assert.strictEqual(p2.status, 'approved');
    assert.strictEqual(p1.status, 'superseded', 'Previous approved version v1.0 must be superseded');
  });

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`  Summary: ${passed} / ${total} Tests Passed (${((passed / total) * 100).toFixed(0)}%)`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  if (passed !== total) {
    process.exit(1);
  }
}

runTests();
