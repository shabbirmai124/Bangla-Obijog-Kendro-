import {
  NewObjectionInput,
  ObjectionCategory,
  ObjectionRecord,
  ObjectionSeverity,
  ObjectionStatus,
  ObjectionVisibility,
  EvidenceMediaType,
} from '../types/objection';

/**
 * Verbatim schema constraints synced with firebase-blueprint.json and firestore.rules
 */
export const BLUEPRINT_CONSTRAINTS = {
  trackingId: {
    minLength: 10,
    maxLength: 32,
    pattern: /^OBJ-2026-[0-9A-Z]{6}$/,
  },
  title: { minLength: 5, maxLength: 160 },
  establishmentName: { minLength: 2, maxLength: 140 },
  jurisdiction: { minLength: 2, maxLength: 120 },
  batchNumber: { minLength: 1, maxLength: 64 },
  expiryDate: { maxLength: 32 },
  manufacturedDate: { maxLength: 32 },
  description: { minLength: 10, maxLength: 2000 },
  sha256Hash: {
    length: 64,
    pattern: /^[a-f0-9]{64}$/,
  },
  encryptedPayload: { maxLength: 4000 },
  encryptionIv: { maxLength: 64 },
  mediaUrl: { maxLength: 250000 },
  mediaCaption: { maxLength: 240 },
  authorId: {
    minLength: 1,
    maxLength: 128,
    pattern: /^[a-zA-Z0-9_\-]+$/,
  },
  reporterAlias: { minLength: 2, maxLength: 80 },
  authorityBadgeId: { maxLength: 64 },
  authorityNote: { maxLength: 2000 },
  enforcementAction: { maxLength: 500 },
  idPattern: /^[a-zA-Z0-9_\-]+$/,
} as const;

const ALLOWED_CATEGORIES: ObjectionCategory[] = [
  'expired_medicine',
  'expired_food',
  'adulterated_goods',
  'price_violation',
  'civic_infrastructure',
  'public_safety',
];

const ALLOWED_SEVERITIES: ObjectionSeverity[] = [
  'routine',
  'elevated',
  'high',
  'critical',
];

const ALLOWED_STATUSES: ObjectionStatus[] = [
  'submitted',
  'under_investigation',
  'verified_violation',
  'enforcement_action',
  'resolved',
  'dismissed',
];

const ALLOWED_VISIBILITIES: ObjectionVisibility[] = ['public', 'restricted'];
const ALLOWED_MEDIA_TYPES: EvidenceMediaType[] = ['none', 'image', 'video'];

/**
 * Generates a unique tracking ID formatted as OBJ-2026-XXXXXX
 */
export function generateTrackingId(deterministicSuffix?: string): string {
  const alphabet = '0123456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  if (deterministicSuffix && /^[0-9A-Z]{6}$/.test(deterministicSuffix)) {
    return `OBJ-2026-${deterministicSuffix}`;
  }
  const bytes = new Uint8Array(6);
  if (typeof globalThis.crypto !== 'undefined' && globalThis.crypto.getRandomValues) {
    globalThis.crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < 6; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += alphabet[bytes[i] % alphabet.length];
  }
  return `OBJ-2026-${code}`;
}

/**
 * Canonical string representation of an objection's core evidentiary fields for SHA-256 sealing
 */
export function buildCanonicalEvidenceString(fields: {
  trackingId: string;
  title: string;
  category: string;
  establishmentName: string;
  jurisdiction: string;
  batchNumber: string;
  expiryDate: string;
  manufacturedDate: string;
  description: string;
}): string {
  return [
    `v1`,
    fields.trackingId.trim(),
    fields.title.trim(),
    fields.category.trim(),
    fields.establishmentName.trim(),
    fields.jurisdiction.trim(),
    fields.batchNumber.trim(),
    fields.expiryDate.trim(),
    fields.manufacturedDate.trim(),
    fields.description.trim(),
  ].join('|');
}

/**
 * Computes a real 64-character hex SHA-256 digest using Web Crypto API
 */
export async function computeDossierSha256(fields: {
  trackingId: string;
  title: string;
  category: string;
  establishmentName: string;
  jurisdiction: string;
  batchNumber: string;
  expiryDate: string;
  manufacturedDate: string;
  description: string;
}): Promise<string> {
  const canonical = buildCanonicalEvidenceString(fields);
  const encoder = new TextEncoder();
  const data = encoder.encode(canonical);
  const hashBuffer = await globalThis.crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Verifies whether an ObjectionRecord's stored sha256Hash matches its current evidentiary fields
 */
export async function verifyDossierIntegrity(record: Pick<
  ObjectionRecord,
  | 'trackingId'
  | 'title'
  | 'category'
  | 'establishmentName'
  | 'jurisdiction'
  | 'batchNumber'
  | 'expiryDate'
  | 'manufacturedDate'
  | 'description'
  | 'sha256Hash'
>): Promise<{ valid: boolean; computedHash: string }> {
  const computedHash = await computeDossierSha256(record);
  return {
    valid: computedHash === record.sha256Hash,
    computedHash,
  };
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return typeof btoa === 'function'
    ? btoa(binary)
    : Buffer.from(bytes).toString('base64');
}

function base64ToBytes(base64: string): Uint8Array<ArrayBuffer> {
  if (typeof atob === 'function') {
    const binary = atob(base64);
    const bytes = new Uint8Array(new ArrayBuffer(binary.length));
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }
  const buf = Buffer.from(base64, 'base64');
  const out = new Uint8Array(new ArrayBuffer(buf.length));
  out.set(buf);
  return out;
}

async function deriveAesGcmKey(passphrase: string, saltText = 'AEGIS_CIVIC_2026_SALT'): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const baseKey = await globalThis.crypto.subtle.importKey(
    'raw',
    encoder.encode(passphrase),
    'PBKDF2',
    false,
    ['deriveKey']
  );
  return globalThis.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode(saltText),
      iterations: 100000,
      hash: 'SHA-256',
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Client-side AES-256-GCM encryption for confidential whistleblower/witness evidence
 */
export async function encryptConfidentialPayload(
  plaintext: string,
  passphrase: string
): Promise<{ encryptedPayload: string; encryptionIv: string }> {
  if (!plaintext.trim() || !passphrase.trim()) {
    return { encryptedPayload: '', encryptionIv: '' };
  }
  const key = await deriveAesGcmKey(passphrase);
  const iv = new Uint8Array(12);
  globalThis.crypto.getRandomValues(iv);
  const encoder = new TextEncoder();
  const cipherBuffer = await globalThis.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(plaintext)
  );
  return {
    encryptedPayload: bytesToBase64(new Uint8Array(cipherBuffer)),
    encryptionIv: bytesToBase64(iv),
  };
}

/**
 * Client-side AES-256-GCM decryption using the citizen or inspector passphrase
 */
export async function decryptConfidentialPayload(
  encryptedPayload: string,
  encryptionIv: string,
  passphrase: string
): Promise<{ success: boolean; plaintext: string; error?: string }> {
  try {
    if (!encryptedPayload || !encryptionIv) {
      return { success: false, plaintext: '', error: 'No encrypted payload present.' };
    }
    if (!passphrase.trim()) {
      return { success: false, plaintext: '', error: 'Decryption passphrase is required.' };
    }
    const key = await deriveAesGcmKey(passphrase);
    const iv = base64ToBytes(encryptionIv);
    const cipherBytes = base64ToBytes(encryptedPayload);
    const plainBuffer = await globalThis.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      cipherBytes
    );
    const decoder = new TextDecoder();
    return {
      success: true,
      plaintext: decoder.decode(plainBuffer),
    };
  } catch {
    return {
      success: false,
      plaintext: '',
      error: 'Authentication tag mismatch — invalid passphrase or tampered ciphertext.',
    };
  }
}

/**
 * Calculates expiration delta and severity assessment for medicine and food objections
 */
export function calculateExpiryAnalysis(
  expiryDateStr: string,
  category: ObjectionCategory,
  referenceDateStr = '2026-11-07'
): {
  isExpired: boolean;
  daysDelta: number | null;
  statusLabel: string;
  recommendedSeverity: ObjectionSeverity;
} {
  if (!expiryDateStr || !/^\d{4}-\d{2}-\d{2}$/.test(expiryDateStr)) {
    const defaultSeverity: ObjectionSeverity =
      category === 'expired_medicine' || category === 'adulterated_goods'
        ? 'high'
        : category === 'expired_food' || category === 'public_safety'
        ? 'elevated'
        : 'routine';
    return {
      isExpired: false,
      daysDelta: null,
      statusLabel: 'No batch expiry date specified',
      recommendedSeverity: defaultSeverity,
    };
  }

  const expTime = Date.parse(`${expiryDateStr}T00:00:00Z`);
  const refTime = Date.parse(`${referenceDateStr}T00:00:00Z`);
  if (Number.isNaN(expTime) || Number.isNaN(refTime)) {
    return {
      isExpired: false,
      daysDelta: null,
      statusLabel: 'Invalid date format',
      recommendedSeverity: 'routine',
    };
  }

  const diffDays = Math.round((refTime - expTime) / (1000 * 60 * 60 * 24));
  if (diffDays > 0) {
    let recommendedSeverity: ObjectionSeverity = 'elevated';
    if (category === 'expired_medicine') {
      recommendedSeverity = diffDays >= 30 ? 'critical' : 'high';
    } else if (category === 'expired_food' || category === 'adulterated_goods') {
      recommendedSeverity = diffDays >= 14 ? 'critical' : 'high';
    } else if (diffDays >= 60) {
      recommendedSeverity = 'high';
    }

    return {
      isExpired: true,
      daysDelta: diffDays,
      statusLabel: `Expired ${diffDays} day${diffDays === 1 ? '' : 's'} ago`,
      recommendedSeverity,
    };
  }

  const daysRemaining = Math.abs(diffDays);
  return {
    isExpired: false,
    daysDelta: diffDays,
    statusLabel:
      daysRemaining === 0
        ? 'Expires today'
        : `Within shelf life (${daysRemaining} days remaining)`,
    recommendedSeverity: daysRemaining <= 7 ? 'elevated' : 'routine',
  };
}

/**
 * Validates citizen form input before submitting an objection
 */
export function validateObjectionInput(input: NewObjectionInput): {
  valid: boolean;
  errors: Record<string, string>;
} {
  const errors: Record<string, string> = {};
  const title = input.title.trim();
  const establishment = input.establishmentName.trim();
  const jurisdiction = input.jurisdiction.trim();
  const batchNumber = input.batchNumber.trim();
  const description = input.description.trim();
  const reporterAlias = input.reporterAlias.trim();

  if (
    title.length < BLUEPRINT_CONSTRAINTS.title.minLength ||
    title.length > BLUEPRINT_CONSTRAINTS.title.maxLength
  ) {
    errors.title = `Headline must be between ${BLUEPRINT_CONSTRAINTS.title.minLength} and ${BLUEPRINT_CONSTRAINTS.title.maxLength} characters.`;
  }

  if (!ALLOWED_CATEGORIES.includes(input.category)) {
    errors.category = 'Please select a valid regulatory category.';
  }

  if (
    establishment.length < BLUEPRINT_CONSTRAINTS.establishmentName.minLength ||
    establishment.length > BLUEPRINT_CONSTRAINTS.establishmentName.maxLength
  ) {
    errors.establishmentName = `Establishment or manufacturer name must be ${BLUEPRINT_CONSTRAINTS.establishmentName.minLength}–${BLUEPRINT_CONSTRAINTS.establishmentName.maxLength} characters.`;
  }

  if (
    jurisdiction.length < BLUEPRINT_CONSTRAINTS.jurisdiction.minLength ||
    jurisdiction.length > BLUEPRINT_CONSTRAINTS.jurisdiction.maxLength
  ) {
    errors.jurisdiction = `City/District jurisdiction must be ${BLUEPRINT_CONSTRAINTS.jurisdiction.minLength}–${BLUEPRINT_CONSTRAINTS.jurisdiction.maxLength} characters.`;
  }

  if (
    batchNumber.length < BLUEPRINT_CONSTRAINTS.batchNumber.minLength ||
    batchNumber.length > BLUEPRINT_CONSTRAINTS.batchNumber.maxLength
  ) {
    errors.batchNumber = `Batch / Lot / Reference number is required (max ${BLUEPRINT_CONSTRAINTS.batchNumber.maxLength} chars).`;
  }

  if (
    (input.category === 'expired_medicine' || input.category === 'expired_food') &&
    !input.expiryDate.trim()
  ) {
    errors.expiryDate = 'Printed expiration date is required for medicine and food objections.';
  }

  if (
    description.length < BLUEPRINT_CONSTRAINTS.description.minLength ||
    description.length > BLUEPRINT_CONSTRAINTS.description.maxLength
  ) {
    errors.description = `Detailed statement must be between ${BLUEPRINT_CONSTRAINTS.description.minLength} and ${BLUEPRINT_CONSTRAINTS.description.maxLength} characters.`;
  }

  if (
    reporterAlias.length < BLUEPRINT_CONSTRAINTS.reporterAlias.minLength ||
    reporterAlias.length > BLUEPRINT_CONSTRAINTS.reporterAlias.maxLength
  ) {
    errors.reporterAlias = `Reporter alias must be ${BLUEPRINT_CONSTRAINTS.reporterAlias.minLength}–${BLUEPRINT_CONSTRAINTS.reporterAlias.maxLength} characters.`;
  }

  if (input.reporterAge !== undefined && input.reporterAge.trim() !== '') {
    const parsedAge = Number(input.reporterAge.trim());
    if (!Number.isInteger(parsedAge) || parsedAge < 10 || parsedAge > 120) {
      errors.reporterAge = 'Age must be a valid whole number between 10 and 120 years.';
    }
  }

  if (input.confidentialNote && input.confidentialNote.trim().length > 0) {
    if (!input.encryptionPassphrase || input.encryptionPassphrase.trim().length < 6) {
      errors.encryptionPassphrase =
        'A passphrase of at least 6 characters is required to encrypt confidential notes with AES-256-GCM.';
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Pure validator mirroring firestore.rules `isValidObjection` and access control gates
 * Used both for client defensive validation and for security rule unit testing (Dirty Dozen)
 */
const REQUIRED_OBJECTION_KEYS = [
  'trackingId',
  'title',
  'category',
  'severity',
  'status',
  'visibility',
  'establishmentName',
  'jurisdiction',
  'batchNumber',
  'expiryDate',
  'manufacturedDate',
  'description',
  'sha256Hash',
  'isEncrypted',
  'encryptedPayload',
  'encryptionIv',
  'mediaType',
  'mediaUrl',
  'mediaCaption',
  'authorId',
  'reporterAlias',
  'authorityBadgeId',
  'authorityNote',
  'enforcementAction',
  'createdAt',
  'updatedAt',
];

export function evaluateFirestoreObjectionRule(params: {
  operation: 'create' | 'update' | 'list' | 'get' | 'create_admin';
  docId: string;
  auth: { uid: string; email: string; email_verified: boolean; isAdmin?: boolean } | null;
  requestTimeIso: string;
  incomingData?: Record<string, unknown>;
  existingData?: Record<string, unknown>;
}): { allowed: boolean; reason?: string } {
  const { operation, docId, auth, requestTimeIso, incomingData, existingData } = params;

  const isSignedIn = auth !== null;
  const isVerifiedUser = isSignedIn && auth.email_verified === true;
  const isAdmin =
    isVerifiedUser &&
    (auth.isAdmin === true || auth.email === 'mdshabbirmia516@gmail.com');

  const isValidId =
    typeof docId === 'string' &&
    docId.length >= 1 &&
    docId.length <= 128 &&
    BLUEPRINT_CONSTRAINTS.idPattern.test(docId);

  if (operation === 'create_admin') {
    if (!isAdmin) {
      return { allowed: false, reason: 'PERMISSION_DENIED: Only verified admins can write /admins' };
    }
    return { allowed: true };
  }

  if (operation === 'list') {
    if (!existingData) {
      return { allowed: false, reason: 'PERMISSION_DENIED: Missing resource.data' };
    }
    if (
      existingData.visibility === 'public' ||
      (isSignedIn && existingData.authorId === auth.uid)
    ) {
      return { allowed: true };
    }
    return { allowed: false, reason: 'PERMISSION_DENIED: Query Enforcer rejected restricted list' };
  }

  if (!isValidId) {
    return { allowed: false, reason: 'PERMISSION_DENIED: Invalid document ID' };
  }

  if (operation === 'get') {
    if (!existingData) return { allowed: false, reason: 'PERMISSION_DENIED: Missing resource' };
    if (
      existingData.visibility === 'public' ||
      (isSignedIn && (existingData.authorId === auth.uid || isAdmin))
    ) {
      return { allowed: true };
    }
    return { allowed: false, reason: 'PERMISSION_DENIED: Unauthorized get on restricted dossier' };
  }

  if (!isVerifiedUser) {
    return { allowed: false, reason: 'PERMISSION_DENIED: Requires verified user authentication' };
  }

  if (!incomingData) {
    return { allowed: false, reason: 'PERMISSION_DENIED: Missing incoming payload' };
  }

  // Exact keys check (hasAll && hasOnly)
  const keys = Object.keys(incomingData);
  if (
    keys.length !== REQUIRED_OBJECTION_KEYS.length ||
    !REQUIRED_OBJECTION_KEYS.every((k) => keys.includes(k))
  ) {
    return { allowed: false, reason: 'PERMISSION_DENIED: Schema key mismatch (shadow or missing key)' };
  }

  const d = incomingData;
  const validBlueprint =
    typeof d.trackingId === 'string' &&
    d.trackingId.length >= BLUEPRINT_CONSTRAINTS.trackingId.minLength &&
    d.trackingId.length <= BLUEPRINT_CONSTRAINTS.trackingId.maxLength &&
    BLUEPRINT_CONSTRAINTS.trackingId.pattern.test(d.trackingId) &&
    typeof d.title === 'string' &&
    d.title.length >= BLUEPRINT_CONSTRAINTS.title.minLength &&
    d.title.length <= BLUEPRINT_CONSTRAINTS.title.maxLength &&
    typeof d.category === 'string' &&
    ALLOWED_CATEGORIES.includes(d.category as ObjectionCategory) &&
    typeof d.severity === 'string' &&
    ALLOWED_SEVERITIES.includes(d.severity as ObjectionSeverity) &&
    typeof d.status === 'string' &&
    ALLOWED_STATUSES.includes(d.status as ObjectionStatus) &&
    typeof d.visibility === 'string' &&
    ALLOWED_VISIBILITIES.includes(d.visibility as ObjectionVisibility) &&
    typeof d.establishmentName === 'string' &&
    d.establishmentName.length >= BLUEPRINT_CONSTRAINTS.establishmentName.minLength &&
    d.establishmentName.length <= BLUEPRINT_CONSTRAINTS.establishmentName.maxLength &&
    typeof d.jurisdiction === 'string' &&
    d.jurisdiction.length >= BLUEPRINT_CONSTRAINTS.jurisdiction.minLength &&
    d.jurisdiction.length <= BLUEPRINT_CONSTRAINTS.jurisdiction.maxLength &&
    typeof d.batchNumber === 'string' &&
    d.batchNumber.length >= BLUEPRINT_CONSTRAINTS.batchNumber.minLength &&
    d.batchNumber.length <= BLUEPRINT_CONSTRAINTS.batchNumber.maxLength &&
    typeof d.expiryDate === 'string' &&
    d.expiryDate.length <= BLUEPRINT_CONSTRAINTS.expiryDate.maxLength &&
    typeof d.manufacturedDate === 'string' &&
    d.manufacturedDate.length <= BLUEPRINT_CONSTRAINTS.manufacturedDate.maxLength &&
    typeof d.description === 'string' &&
    d.description.length >= BLUEPRINT_CONSTRAINTS.description.minLength &&
    d.description.length <= BLUEPRINT_CONSTRAINTS.description.maxLength &&
    typeof d.sha256Hash === 'string' &&
    d.sha256Hash.length === BLUEPRINT_CONSTRAINTS.sha256Hash.length &&
    BLUEPRINT_CONSTRAINTS.sha256Hash.pattern.test(d.sha256Hash) &&
    typeof d.isEncrypted === 'boolean' &&
    typeof d.encryptedPayload === 'string' &&
    d.encryptedPayload.length <= BLUEPRINT_CONSTRAINTS.encryptedPayload.maxLength &&
    typeof d.encryptionIv === 'string' &&
    d.encryptionIv.length <= BLUEPRINT_CONSTRAINTS.encryptionIv.maxLength &&
    typeof d.mediaType === 'string' &&
    ALLOWED_MEDIA_TYPES.includes(d.mediaType as EvidenceMediaType) &&
    typeof d.mediaUrl === 'string' &&
    d.mediaUrl.length <= BLUEPRINT_CONSTRAINTS.mediaUrl.maxLength &&
    typeof d.mediaCaption === 'string' &&
    d.mediaCaption.length <= BLUEPRINT_CONSTRAINTS.mediaCaption.maxLength &&
    typeof d.authorId === 'string' &&
    d.authorId.length >= BLUEPRINT_CONSTRAINTS.authorId.minLength &&
    d.authorId.length <= BLUEPRINT_CONSTRAINTS.authorId.maxLength &&
    BLUEPRINT_CONSTRAINTS.authorId.pattern.test(d.authorId) &&
    typeof d.reporterAlias === 'string' &&
    d.reporterAlias.length >= BLUEPRINT_CONSTRAINTS.reporterAlias.minLength &&
    d.reporterAlias.length <= BLUEPRINT_CONSTRAINTS.reporterAlias.maxLength &&
    typeof d.authorityBadgeId === 'string' &&
    d.authorityBadgeId.length <= BLUEPRINT_CONSTRAINTS.authorityBadgeId.maxLength &&
    typeof d.authorityNote === 'string' &&
    d.authorityNote.length <= BLUEPRINT_CONSTRAINTS.authorityNote.maxLength &&
    typeof d.enforcementAction === 'string' &&
    d.enforcementAction.length <= BLUEPRINT_CONSTRAINTS.enforcementAction.maxLength &&
    typeof d.createdAt === 'string' &&
    typeof d.updatedAt === 'string';

  if (!validBlueprint) {
    return { allowed: false, reason: 'PERMISSION_DENIED: Failed isValidObjection schema check' };
  }

  if (operation === 'create') {
    if (d.authorId !== auth.uid) {
      return { allowed: false, reason: 'PERMISSION_DENIED: authorId must match request.auth.uid' };
    }
    if (d.createdAt !== requestTimeIso || d.updatedAt !== requestTimeIso) {
      return { allowed: false, reason: 'PERMISSION_DENIED: Timestamps must equal request.time' };
    }
    if (
      !isAdmin &&
      (d.status !== 'submitted' ||
        d.authorityBadgeId !== '' ||
        d.authorityNote !== '' ||
        d.enforcementAction !== '')
    ) {
      return { allowed: false, reason: 'PERMISSION_DENIED: Citizens must initialize status as submitted' };
    }
    return { allowed: true };
  }

  if (operation === 'update') {
    if (!existingData) {
      return { allowed: false, reason: 'PERMISSION_DENIED: Missing existing document for update' };
    }
    if (
      d.authorId !== existingData.authorId ||
      d.createdAt !== existingData.createdAt ||
      d.trackingId !== existingData.trackingId ||
      d.sha256Hash !== existingData.sha256Hash ||
      d.updatedAt !== requestTimeIso
    ) {
      return { allowed: false, reason: 'PERMISSION_DENIED: Immutable field violation or stale updatedAt' };
    }

    const changedKeys = REQUIRED_OBJECTION_KEYS.filter(
      (k) => d[k] !== existingData[k]
    );

    const citizenAllowed = ['description', 'mediaType', 'mediaUrl', 'mediaCaption', 'updatedAt'];
    const adminAllowed = [
      'status',
      'severity',
      'authorityBadgeId',
      'authorityNote',
      'enforcementAction',
      'updatedAt',
    ];

    const isCitizenAction =
      existingData.authorId === auth.uid &&
      existingData.status !== 'resolved' &&
      existingData.status !== 'dismissed' &&
      changedKeys.every((k) => citizenAllowed.includes(k));

    const isAdminAction =
      isAdmin && changedKeys.every((k) => adminAllowed.includes(k));

    if (!isCitizenAction && !isAdminAction) {
      return { allowed: false, reason: 'PERMISSION_DENIED: Unauthorized update action or terminal state lock' };
    }

    return { allowed: true };
  }

  return { allowed: false, reason: 'PERMISSION_DENIED' };
}
