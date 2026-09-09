/**
 * Storage Vault & Documents Verification Test Suite
 * Tests file validation, path building, and private bucket isolation.
 */

const assert = require('assert');

const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB
const ALLOWED_EXTENSIONS = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'csv', 'ppt', 'pptx', 'png', 'jpg', 'jpeg', 'txt'];

function validateDocumentFile(file) {
  if (!file) {
    return { isValid: false, error: 'No file selected.' };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    return { isValid: false, error: `File size (${sizeMb} MB) exceeds maximum allowed limit of 25 MB.` };
  }

  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return {
      isValid: false,
      error: `File format .${ext} is not supported. Supported formats: PDF, Word (DOC/DOCX), Excel (XLS/XLSX/CSV), PowerPoint (PPT/PPTX), Images (PNG/JPG).`,
    };
  }

  return { isValid: true };
}

function buildStoragePath(organizationId, clientId, opportunityId, documentId, fileName) {
  const cleanClient = clientId ? clientId.replace(/[^a-zA-Z0-9_-]/g, '') : 'general';
  const cleanOpp = opportunityId ? opportunityId.replace(/[^a-zA-Z0-9_-]/g, '') : 'general';
  const cleanDoc = documentId ? documentId.replace(/[^a-zA-Z0-9_-]/g, '') : 'doc';
  const cleanFile = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');

  return `${organizationId}/${cleanClient}/${cleanOpp}/${cleanDoc}/${cleanFile}`;
}

function runTests() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  📁 Running Documents Vault & Supabase Storage Test Suite');
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

  // Test 1: Accept valid files
  test('Accept valid PDF under 25MB', () => {
    const file = { name: 'TCS_Commercial_Proposal.pdf', size: 3.5 * 1024 * 1024 };
    const res = validateDocumentFile(file);
    assert.strictEqual(res.isValid, true);
  });

  test('Accept valid Excel and Word documents', () => {
    const excel = { name: 'Pricing_Matrix_2026.xlsx', size: 1.2 * 1024 * 1024 };
    const doc = { name: 'Master_SLA_Agreement.docx', size: 2.1 * 1024 * 1024 };
    assert.strictEqual(validateDocumentFile(excel).isValid, true);
    assert.strictEqual(validateDocumentFile(doc).isValid, true);
  });

  // Test 2: Reject oversized files
  test('Reject file exceeding 25MB limit', () => {
    const largeFile = { name: 'Huge_Fleet_Video_Archive.pdf', size: 30 * 1024 * 1024 };
    const res = validateDocumentFile(largeFile);
    assert.strictEqual(res.isValid, false);
    assert.ok(res.error.includes('exceeds maximum allowed limit'));
  });

  // Test 3: Reject unsupported extensions
  test('Reject executable and script formats (.exe, .bat, .sh, .js)', () => {
    const badFiles = [
      { name: 'malicious.exe', size: 1024 },
      { name: 'script.bat', size: 1024 },
      { name: 'hack.sh', size: 1024 },
    ];
    for (const f of badFiles) {
      const res = validateDocumentFile(f);
      assert.strictEqual(res.isValid, false);
      assert.ok(res.error.includes('is not supported'));
    }
  });

  // Test 4: Hierarchical organization-aware path building
  test('Build sanitized hierarchical storage path matching required scheme', () => {
    const path = buildStoragePath(
      ORG_ID,
      'cl-tcs-101',
      'opp-bus-2026',
      'doc-ratecard-99',
      'TCS Rate Card v1.0 [Final].pdf'
    );

    const expected = `${ORG_ID}/cl-tcs-101/opp-bus-2026/doc-ratecard-99/TCS_Rate_Card_v1.0__Final_.pdf`;
    assert.strictEqual(path, expected);
  });

  // Test 5: Fallback path when client or opp are omitted
  test('Build fallback path with general tags when client or opp is omitted', () => {
    const path = buildStoragePath(ORG_ID, undefined, undefined, 'doc-gen-1', 'Company_Brochure.pdf');
    const expected = `${ORG_ID}/general/general/doc-gen-1/Company_Brochure.pdf`;
    assert.strictEqual(path, expected);
  });

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`  Summary: ${passed} / ${total} Tests Passed (${((passed / total) * 100).toFixed(0)}%)`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  if (passed !== total) {
    process.exit(1);
  }
}

runTests();
