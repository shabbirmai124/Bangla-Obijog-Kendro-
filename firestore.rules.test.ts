import test from 'node:test';
import assert from 'node:assert/strict';
import {
  generateTrackingId,
  computeDossierSha256,
  verifyDossierIntegrity,
  encryptConfidentialPayload,
  decryptConfidentialPayload,
  calculateExpiryAnalysis,
  validateObjectionInput,
  evaluateFirestoreObjectionRule,
  BLUEPRINT_CONSTRAINTS,
} from './src/utils/cryptoAndValidation';

const SERVER_TIME = '2026-11-07T10:00:00.000Z';

function createValidObjectionPayload(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    trackingId: 'OBJ-2026-849201',
    title: 'Dispensing Expired Amoxicillin 500mg Capsules at Central Pharmacy',
    category: 'expired_medicine',
    severity: 'critical',
    status: 'submitted',
    visibility: 'public',
    establishmentName: 'MetroCare Central Pharmacy Branch #14',
    jurisdiction: 'Central Metropolitan District',
    batchNumber: 'LOT-AB23101',
    expiryDate: '2026-08-15',
    manufacturedDate: '2023-08-15',
    description:
      'Purchased two blister packs of Amoxicillin 500mg capsules. Printed expiration date on the foil blister clearly shows 08/2026, nearly three months overdue.',
    sha256Hash: 'a'.repeat(64),
    isEncrypted: false,
    encryptedPayload: '',
    encryptionIv: '',
    mediaType: 'image',
    mediaUrl: '/src/assets/images/evidence_medicine_blister_batch_1794048839663.jpg',
    mediaCaption: 'Macro inspection photo of blister pack LOT-AB23101.',
    authorId: 'citizen_uid_01',
    reporterAlias: 'Citizen Observer #412',
    authorityBadgeId: '',
    authorityNote: '',
    enforcementAction: '',
    createdAt: SERVER_TIME,
    updatedAt: SERVER_TIME,
    ...overrides,
  };
}

test('Tracking ID generator produces blueprint-compliant OBJ-2026-XXXXXX codes', () => {
  const randomId = generateTrackingId();
  assert.equal(BLUEPRINT_CONSTRAINTS.trackingId.pattern.test(randomId), true);
  const deterministicId = generateTrackingId('849201');
  assert.equal(deterministicId, 'OBJ-2026-849201');
});

test('SHA-256 cryptographic dossier seal verifies intact records and catches tampering', async () => {
  const baseFields = {
    trackingId: 'OBJ-2026-849201',
    title: 'Expired Amoxicillin 500mg Blister Pack',
    category: 'expired_medicine',
    establishmentName: 'Central Pharmacy',
    jurisdiction: 'District 4',
    batchNumber: 'LOT-AB23101',
    expiryDate: '2026-08-15',
    manufacturedDate: '2023-08-15',
    description: 'Blister pack sold after August 2026 expiration date.',
  };

  const hash = await computeDossierSha256(baseFields);
  assert.equal(hash.length, 64);
  assert.equal(BLUEPRINT_CONSTRAINTS.sha256Hash.pattern.test(hash), true);

  const intactCheck = await verifyDossierIntegrity({
    ...baseFields,
    category: 'expired_medicine',
    sha256Hash: hash,
  });
  assert.equal(intactCheck.valid, true);

  const tamperedCheck = await verifyDossierIntegrity({
    ...baseFields,
    category: 'expired_medicine',
    expiryDate: '2027-08-15', // tampered expiry date
    sha256Hash: hash,
  });
  assert.equal(tamperedCheck.valid, false);
});

test('AES-256-GCM encryption and decryption round-trip with authentication tag protection', async () => {
  const secretNote = 'Warehouse supervisor instructed staff to relabel carton #44B in backroom.';
  const passphrase = 'correct-horse-battery-staple';

  const encrypted = await encryptConfidentialPayload(secretNote, passphrase);
  assert.ok(encrypted.encryptedPayload.length > 0);
  assert.ok(encrypted.encryptionIv.length > 0);
  assert.notEqual(encrypted.encryptedPayload, secretNote);

  const decryptedOk = await decryptConfidentialPayload(
    encrypted.encryptedPayload,
    encrypted.encryptionIv,
    passphrase
  );
  assert.equal(decryptedOk.success, true);
  assert.equal(decryptedOk.plaintext, secretNote);

  const decryptedWrongKey = await decryptConfidentialPayload(
    encrypted.encryptedPayload,
    encrypted.encryptionIv,
    'wrong-passphrase'
  );
  assert.equal(decryptedWrongKey.success, false);
});

test('Expiry date delta analyzer calculates overdue days and critical severity for medicine and food', () => {
  const medAnalysis = calculateExpiryAnalysis('2026-09-01', 'expired_medicine', '2026-11-07');
  assert.equal(medAnalysis.isExpired, true);
  assert.equal(medAnalysis.daysDelta, 67);
  assert.equal(medAnalysis.recommendedSeverity, 'critical');

  const foodAnalysis = calculateExpiryAnalysis('2026-10-20', 'expired_food', '2026-11-07');
  assert.equal(foodAnalysis.isExpired, true);
  assert.equal(foodAnalysis.daysDelta, 18);
  assert.equal(foodAnalysis.recommendedSeverity, 'critical');
});

test('Citizen input validator enforces required expiryDate for expired_medicine and expired_food', () => {
  const missingExpiry = validateObjectionInput({
    title: 'Expired Infant Formula Tins on Shelf',
    category: 'expired_food',
    establishmentName: 'FreshMart Hypermarket',
    jurisdiction: 'North Sector',
    batchNumber: 'BATCH-9921',
    expiryDate: '',
    manufacturedDate: '2025-10-01',
    description: 'Observed six tins of infant formula past their printed expiration date.',
    mediaType: 'none',
    mediaUrl: '',
    mediaCaption: '',
    reporterAlias: 'Citizen Inspector 09',
  });
  assert.equal(missingExpiry.valid, false);
  assert.ok(missingExpiry.errors.expiryDate);

  // General public/civic problems do not require expiryDate and validate reporterAge
  const validCivicProblem = validateObjectionInput({
    title: 'Illegal Medical Waste Dumping & Excessive Emergency Diagnostic Fee Charging',
    category: 'public_safety',
    establishmentName: 'Metropolitan General Hospital Zone',
    jurisdiction: 'Sylhet City Corporation — Ward 8',
    batchNumber: 'GEN-CIVIC-9910',
    expiryDate: '',
    manufacturedDate: '',
    description: 'Uncovered hazardous medical waste dumped along public walkway with photo evidence.',
    mediaType: 'image',
    mediaUrl: '/sample.jpg',
    mediaCaption: 'Photo evidence of public hazard',
    reporterAlias: 'Citizen Observer #704',
    reporterAge: '29',
  });
  assert.equal(validCivicProblem.valid, true);

  const invalidAge = validateObjectionInput({
    title: 'Illegal Medical Waste Dumping & Excessive Emergency Diagnostic Fee Charging',
    category: 'public_safety',
    establishmentName: 'Metropolitan General Hospital Zone',
    jurisdiction: 'Sylhet City Corporation — Ward 8',
    batchNumber: 'GEN-CIVIC-9910',
    expiryDate: '',
    manufacturedDate: '',
    description: 'Uncovered hazardous medical waste dumped along public walkway with photo evidence.',
    mediaType: 'image',
    mediaUrl: '/sample.jpg',
    mediaCaption: 'Photo evidence of public hazard',
    reporterAlias: 'Citizen Observer #704',
    reporterAge: '5',
  });
  assert.equal(invalidAge.valid, false);
  assert.ok(invalidAge.errors.reporterAge);
});

test('Dirty Dozen Security Payloads: all 12 adversarial attacks return PERMISSION_DENIED', () => {
  const validCitizenAuth = {
    uid: 'citizen_uid_01',
    email: 'citizen@example.com',
    email_verified: true,
  };

  // Baseline valid creation succeeds
  const baseline = evaluateFirestoreObjectionRule({
    operation: 'create',
    docId: 'obj_valid_001',
    auth: validCitizenAuth,
    requestTimeIso: SERVER_TIME,
    incomingData: createValidObjectionPayload(),
  });
  assert.equal(baseline.allowed, true);

  // 1. Shadow Field Injection
  const p1 = evaluateFirestoreObjectionRule({
    operation: 'create',
    docId: 'obj_valid_001',
    auth: validCitizenAuth,
    requestTimeIso: SERVER_TIME,
    incomingData: createValidObjectionPayload({ isVerifiedByGov: true }),
  });
  assert.equal(p1.allowed, false);

  // 2. Identity Spoofing on Create
  const p2 = evaluateFirestoreObjectionRule({
    operation: 'create',
    docId: 'obj_valid_001',
    auth: { uid: 'attacker_uid', email: 'attacker@example.com', email_verified: true },
    requestTimeIso: SERVER_TIME,
    incomingData: createValidObjectionPayload({ authorId: 'citizen_uid_01' }),
  });
  assert.equal(p2.allowed, false);

  // 3. Unverified Email Spoof claiming Admin Email
  const p3 = evaluateFirestoreObjectionRule({
    operation: 'update',
    docId: 'obj_valid_001',
    auth: {
      uid: 'spoof_admin',
      email: 'mdshabbirmia516@gmail.com',
      email_verified: false,
    },
    requestTimeIso: SERVER_TIME,
    existingData: createValidObjectionPayload(),
    incomingData: createValidObjectionPayload({ status: 'verified_violation' }),
  });
  assert.equal(p3.allowed, false);

  // 4. Self-Verified Creation Shortcut
  const p4 = evaluateFirestoreObjectionRule({
    operation: 'create',
    docId: 'obj_valid_001',
    auth: validCitizenAuth,
    requestTimeIso: SERVER_TIME,
    incomingData: createValidObjectionPayload({ status: 'verified_violation' }),
  });
  assert.equal(p4.allowed, false);

  // 5. Client Timestamp Forgery
  const p5 = evaluateFirestoreObjectionRule({
    operation: 'create',
    docId: 'obj_valid_001',
    auth: validCitizenAuth,
    requestTimeIso: SERVER_TIME,
    incomingData: createValidObjectionPayload({ createdAt: '2020-01-01T00:00:00.000Z' }),
  });
  assert.equal(p5.allowed, false);

  // 6. Tracking ID Format Poisoning
  const p6 = evaluateFirestoreObjectionRule({
    operation: 'create',
    docId: 'obj_valid_001',
    auth: validCitizenAuth,
    requestTimeIso: SERVER_TIME,
    incomingData: createValidObjectionPayload({ trackingId: 'DROP_TABLE_123' }),
  });
  assert.equal(p6.allowed, false);

  // 7. SHA-256 Digest Tampering on Update
  const p7 = evaluateFirestoreObjectionRule({
    operation: 'update',
    docId: 'obj_valid_001',
    auth: validCitizenAuth,
    requestTimeIso: SERVER_TIME,
    existingData: createValidObjectionPayload(),
    incomingData: createValidObjectionPayload({ sha256Hash: 'b'.repeat(64) }),
  });
  assert.equal(p7.allowed, false);

  // 8. Citizen Privilege Escalation Update (setting status to resolved)
  const p8 = evaluateFirestoreObjectionRule({
    operation: 'update',
    docId: 'obj_valid_001',
    auth: validCitizenAuth,
    requestTimeIso: SERVER_TIME,
    existingData: createValidObjectionPayload(),
    incomingData: createValidObjectionPayload({
      status: 'resolved',
      authorityBadgeId: 'FAKE-BADGE-99',
    }),
  });
  assert.equal(p8.allowed, false);

  // 9. Terminal State Re-Opening (editing description after resolved)
  const p9 = evaluateFirestoreObjectionRule({
    operation: 'update',
    docId: 'obj_valid_001',
    auth: validCitizenAuth,
    requestTimeIso: SERVER_TIME,
    existingData: createValidObjectionPayload({ status: 'resolved' }),
    incomingData: createValidObjectionPayload({
      status: 'resolved',
      description: 'Attempting to modify closed dossier description after resolution.',
    }),
  });
  assert.equal(p9.allowed, false);

  // 10. Value Poisoning on Whitelisted Key (oversized description > 2000 chars)
  const p10 = evaluateFirestoreObjectionRule({
    operation: 'update',
    docId: 'obj_valid_001',
    auth: validCitizenAuth,
    requestTimeIso: SERVER_TIME,
    existingData: createValidObjectionPayload(),
    incomingData: createValidObjectionPayload({
      description: 'X'.repeat(2500),
    }),
  });
  assert.equal(p10.allowed, false);

  // 11. Unrestricted List Scraping of Restricted Dossiers by non-owner
  const p11 = evaluateFirestoreObjectionRule({
    operation: 'list',
    docId: 'obj_restricted_001',
    auth: { uid: 'other_user', email: 'other@example.com', email_verified: true },
    requestTimeIso: SERVER_TIME,
    existingData: createValidObjectionPayload({ visibility: 'restricted' }),
  });
  assert.equal(p11.allowed, false);

  // 12. Self-Assigned Admin Privilege Escalation
  const p12 = evaluateFirestoreObjectionRule({
    operation: 'create_admin',
    docId: 'citizen_uid_01',
    auth: validCitizenAuth,
    requestTimeIso: SERVER_TIME,
  });
  assert.equal(p12.allowed, false);
});
