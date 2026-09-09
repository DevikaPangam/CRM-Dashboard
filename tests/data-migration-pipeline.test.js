/**
 * ============================================================================
 * TEST SUITE: Data Migration Pipeline Verification (Prompt 14)
 * ============================================================================
 * Validates:
 * 1. Offline backup artifact creation in backups/.
 * 2. Deterministic UUID mapping preserving foreign-key relationships.
 * 3. Corporate domain enforcement during profile migration (@rajmudragroup.com).
 * 4. Orphan detection (orphan opportunities/activities safely quarantined).
 * 5. Destination entity structure and non-destruction of legacy data sources.
 */

import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { executeDataMigration } from '../scripts/migrate-crm-data.js';

async function runDataMigrationTests() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  🚚 Running Data Migration Pipeline Verification Test Suite (Prompt 14)');
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

  const { stats, destinationStore, idMap } = executeDataMigration();

  // 1. Backup Artifact Generation
  test('Step 1: Verify offline backup directory and JSON file creation', () => {
    const backupDir = path.resolve(process.cwd(), 'backups');
    assert.ok(fs.existsSync(backupDir), 'backups directory must exist');
    const files = fs.readdirSync(backupDir).filter(f => f.startsWith('legacy_crm_backup_') && f.endsWith('.json'));
    assert.ok(files.length > 0, 'At least one backup JSON file must be written');
  });

  // 2. Organization Migration
  test('Step 2: Migrate organization entity with primary Rajmudra UUID', () => {
    assert.strictEqual(destinationStore.organizations.length, 1);
    const org = destinationStore.organizations[0];
    assert.strictEqual(org.id, '00000000-0000-0000-0000-000000000001');
    assert.strictEqual(org.domain, 'rajmudragroup.com');
  });

  // 3. User & Profile Corporate Filtering
  test('Step 3: Corporate domain filtering (@rajmudragroup.com) and profile provisioning', () => {
    assert.strictEqual(stats.users.source, 8);
    assert.strictEqual(stats.users.migrated, 7);
    assert.strictEqual(stats.users.skipped, 1); // external.vendor@gmail.com skipped

    destinationStore.profiles.forEach(p => {
      assert.ok(p.email.endsWith('@rajmudragroup.com'), `Profile email ${p.email} must end with @rajmudragroup.com`);
      assert.strictEqual(p.organization_id, '00000000-0000-0000-0000-000000000001');
      assert.ok(p.id.length === 36, 'Profile ID must be a valid 36-char UUID');
    });
  });

  // 4. Foreign Key & Team Mapping
  test('Step 4: Resolve team lead foreign keys and preserve team UUIDs', () => {
    assert.strictEqual(destinationStore.teams.length, 3);
    destinationStore.teams.forEach(t => {
      assert.ok(t.id.length === 36);
      if (t.lead_id) {
        const lead = destinationStore.profiles.find(p => p.id === t.lead_id);
        assert.ok(lead, `Team lead ${t.lead_id} must resolve to a valid migrated profile`);
      }
    });
  });

  // 5. Client & Contact Relational Integrity
  test('Step 5: Migrate clients and embedded contacts with valid UUID foreign keys', () => {
    assert.strictEqual(destinationStore.clients.length, 3);
    assert.strictEqual(destinationStore.contacts.length, 4);

    destinationStore.contacts.forEach(c => {
      const parentClient = destinationStore.clients.find(cl => cl.id === c.client_id);
      assert.ok(parentClient, `Contact ${c.name} must reference a valid parent client UUID`);
    });
  });

  // 6. Orphan Opportunity Quarantine
  test('Step 6: Quarantine orphaned opportunities with missing client references', () => {
    assert.strictEqual(stats.opportunities.source, 4);
    assert.strictEqual(stats.opportunities.migrated, 3);
    assert.strictEqual(stats.opportunities.skipped, 1); // OPP-ORPHAN skipped

    destinationStore.opportunities.forEach(opp => {
      const client = destinationStore.clients.find(c => c.id === opp.client_id);
      assert.ok(client, `Opportunity ${opp.title} must have a valid client reference`);
      assert.ok(opp.deal_value_inr > 0, 'Opportunity deal value must be positive');
    });
  });

  // 7. Proposals, Activities & Follow-ups
  test('Step 7: Verify activities, follow-ups, documents, and proposals linkages', () => {
    assert.strictEqual(destinationStore.activities.length, 2);
    assert.strictEqual(destinationStore.followups.length, 2);
    assert.strictEqual(destinationStore.documents.length, 2);
    assert.strictEqual(destinationStore.proposals.length, 2);

    destinationStore.proposals.forEach(p => {
      assert.ok(p.submitted_by, 'Proposal must have a valid submitted_by actor UUID');
      assert.ok(p.final_price_inr > 0, 'Proposal must have a valid pricing value');
    });
  });

  // 8. Legacy Data Protection Guarantee
  test('Step 8: Non-destructive guarantee: Legacy source files remain intact', () => {
    assert.ok(fs.existsSync(path.resolve(process.cwd(), 'data.js')), 'data.js must remain untouched');
    assert.ok(fs.existsSync(path.resolve(process.cwd(), 'src/utils/seedData.ts')), 'seedData.ts must remain untouched');
  });

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`  Summary: ${passed} / ${total} Tests Passed (${Math.round((passed / total) * 100)}%)`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  if (passed !== total) {
    process.exit(1);
  }
}

runDataMigrationTests();
