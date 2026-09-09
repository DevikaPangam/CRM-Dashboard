/**
 * Realtime Pipeline Verification Test Suite
 * Tests realtime state reconciliation, deduplication, and cross-organization filtering.
 */

const assert = require('assert');

// Mock Realtime Dispatcher
class MockRealtimeDispatcher {
  constructor() {
    this.subscriptions = new Map();
  }

  subscribe(channelName, table, filter, callback) {
    const key = `${channelName}:${table}`;
    if (!this.subscriptions.has(key)) {
      this.subscriptions.set(key, []);
    }
    this.subscriptions.get(key).push({ filter, callback });

    return () => {
      const list = this.subscriptions.get(key) || [];
      this.subscriptions.set(
        key,
        list.filter((s) => s.callback !== callback)
      );
    };
  }

  publish(table, eventType, record, oldRecord) {
    for (const [key, listeners] of this.subscriptions.entries()) {
      if (key.endsWith(`:${table}`)) {
        listeners.forEach(({ filter, callback }) => {
          // Check filter e.g. organization_id=eq.123
          let match = true;
          if (filter) {
            const [field, val] = filter.split('=eq.');
            const recordVal = record ? record[field] : oldRecord ? oldRecord[field] : null;
            if (recordVal !== val) match = false;
          }
          if (match) {
            callback({ eventType, new: record, old: oldRecord });
          }
        });
      }
    }
  }
}

function runTests() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  ⚡ Running Supabase Realtime Pipeline Verification Suite');
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

  const dispatcher = new MockRealtimeDispatcher();
  const ORG_A = 'org-rajmudra-1';
  const ORG_B = 'org-competitor-2';

  // State representation
  let opportunitiesState = [];
  let userStatusState = 'Active';

  // Subscribe User A (Org A)
  const unsubscribeOpps = dispatcher.subscribe(
    `crm_realtime_${ORG_A}`,
    'opportunities',
    `organization_id=eq.${ORG_A}`,
    (payload) => {
      if (payload.eventType === 'INSERT' && payload.new) {
        if (!opportunitiesState.some((o) => o.id === payload.new.id)) {
          opportunitiesState = [payload.new, ...opportunitiesState];
        }
      } else if (payload.eventType === 'UPDATE' && payload.new) {
        opportunitiesState = opportunitiesState.map((o) =>
          o.id === payload.new.id ? payload.new : o
        );
      } else if (payload.eventType === 'DELETE' && payload.old) {
        opportunitiesState = opportunitiesState.filter((o) => o.id !== payload.old.id);
      }
    }
  );

  const unsubscribeProfile = dispatcher.subscribe(
    `crm_realtime_${ORG_A}`,
    'profiles',
    `id=eq.user-001`,
    (payload) => {
      if (payload.new && (payload.new.status === 'inactive' || payload.new.status === 'suspended')) {
        userStatusState = 'Inactive';
      }
    }
  );

  // Test 1: INSERT event updates state
  test('Realtime INSERT: Collaborative creation adds opportunity to state', () => {
    dispatcher.publish(
      'opportunities',
      'INSERT',
      { id: 'opp-101', title: 'Tech Mahindra Fleet Contract', organization_id: ORG_A, deal_value_inr: 5000000 },
      null
    );

    assert.strictEqual(opportunitiesState.length, 1);
    assert.strictEqual(opportunitiesState[0].title, 'Tech Mahindra Fleet Contract');
  });

  // Test 2: Optimistic deduplication
  test('Realtime Deduplication: Duplicate INSERT ignores already present optimistic ID', () => {
    // Current client did optimistic insert
    opportunitiesState = [{ id: 'opp-101', title: 'Tech Mahindra Fleet Contract' }];

    // Server broadcasts INSERT for same ID
    dispatcher.publish(
      'opportunities',
      'INSERT',
      { id: 'opp-101', title: 'Tech Mahindra Fleet Contract', organization_id: ORG_A },
      null
    );

    assert.strictEqual(opportunitiesState.length, 1, 'State must not duplicate existing opportunity');
  });

  // Test 3: UPDATE event
  test('Realtime UPDATE: Stage change from another collaborator updates state', () => {
    dispatcher.publish(
      'opportunities',
      'UPDATE',
      { id: 'opp-101', title: 'Tech Mahindra Fleet Contract', organization_id: ORG_A, stage: 'Commercial Negotiation' },
      { id: 'opp-101', organization_id: ORG_A }
    );

    assert.strictEqual(opportunitiesState.length, 1);
    assert.strictEqual(opportunitiesState[0].stage, 'Commercial Negotiation');
  });

  // Test 4: Cross-Organization Isolation
  test('Cross-Organization Isolation: Events in Org B do not pollute Org A state', () => {
    dispatcher.publish(
      'opportunities',
      'INSERT',
      { id: 'opp-999', title: 'Tenant B Secret Deal', organization_id: ORG_B },
      null
    );

    const hasOrgBRecord = opportunitiesState.some((o) => o.id === 'opp-999');
    assert.strictEqual(hasOrgBRecord, false, 'Tenant A state must never receive Tenant B records');
  });

  // Test 5: DELETE event
  test('Realtime DELETE: Deletion removes opportunity from state', () => {
    dispatcher.publish('opportunities', 'DELETE', null, { id: 'opp-101', organization_id: ORG_A });
    assert.strictEqual(opportunitiesState.length, 0);
  });

  // Test 6: Profile status revocation
  test('Realtime Profile Change: Status suspension immediately reflects in client state', () => {
    assert.strictEqual(userStatusState, 'Active');
    dispatcher.publish(
      'profiles',
      'UPDATE',
      { id: 'user-001', status: 'suspended', role: 'bd_exec' },
      { id: 'user-001' }
    );
    assert.strictEqual(userStatusState, 'Inactive');
  });

  // Test 7: Unsubscribe & Cleanup
  test('Cleanup: Unsubscribing dismantles listeners and stops updates', () => {
    unsubscribeOpps();
    unsubscribeProfile();

    dispatcher.publish(
      'opportunities',
      'INSERT',
      { id: 'opp-202', title: 'Post-Unsubscribe Deal', organization_id: ORG_A },
      null
    );

    assert.strictEqual(opportunitiesState.length, 0, 'No updates should occur after unsubscribe');
  });

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`  Summary: ${passed} / ${total} Tests Passed (${((passed / total) * 100).toFixed(0)}%)`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  if (passed !== total) {
    process.exit(1);
  }
}

runTests();
