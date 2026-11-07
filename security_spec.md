# Security Specification (`security_spec.md`)

## 1. Data Invariants

1. **Default-Deny Catch-All**: All paths not explicitly matched under `/objections/{objectionId}` or `/admins/{adminId}` are unconditionally denied (`allow read, write: if false;`).
2. **Path Variable Hardening**: Document IDs `{objectionId}` and `{adminId}` on all single-document operations (`get`, `create`, `update`, `delete`) must satisfy `isValidId(id)` (`id is string && id.size() >= 1 && id.size() <= 128 && id.matches('^[a-zA-Z0-9_\\-]+$')`).
3. **Strict Schema & Volumetric Blueprint (`isValidObjection`)**:
   - Every write (`create` and `update`) to `/objections/{objectionId}` must pass `isValidObjection(incoming())`.
   - Exact key allowlisting and requirement check using `data.keys().hasAll([...]) && data.keys().hasOnly([...])` to block shadow fields.
   - Regex & length bounds enforced on `trackingId` (`^OBJ-2026-[0-9A-Z]{6}$`), `sha256Hash` (`^[a-f0-9]{64}$`), `authorId` (`^[a-zA-Z0-9_\-]+$`), and all string fields.
4. **Identity & Verified Email Integrity**:
   - Creating an objection requires `isSignedIn()`, `request.auth.token.email_verified == true`, `incoming().authorId == request.auth.uid`, and `incoming().status == 'submitted'` (unless `isAdmin()`).
5. **Temporal & Immutable Field Integrity**:
   - On `create`: `incoming().createdAt == request.time && incoming().updatedAt == request.time`.
   - On `update`: `incoming().createdAt == existing().createdAt && incoming().authorId == existing().authorId && incoming().trackingId == existing().trackingId && incoming().sha256Hash == existing().sha256Hash && incoming().updatedAt == request.time`.
6. **Terminal State Locking & Tiered Action Updates**:
   - Once `existing().status` reaches `'resolved'` or `'dismissed'`, non-admin updates are locked.
   - Citizen authors can only update `['description', 'mediaType', 'mediaUrl', 'mediaCaption', 'updatedAt']` while the objection is not in a terminal state.
   - Regulatory authorities (`isAdmin()`) can update `['status', 'severity', 'authorityBadgeId', 'authorityNote', 'enforcementAction', 'updatedAt']`.
7. **PII Isolation & Query Enforcement**:
   - No raw PII (emails, phone numbers, home addresses) is stored in `/objections/{objectionId}`; confidential whistleblower details are client-side encrypted with AES-256-GCM prior to transmission.
   - `allow list` on `/objections` enforces `resource.data.visibility == 'public' || (isSignedIn() && resource.data.authorId == request.auth.uid)`.

---

## 2. The "Dirty Dozen" Payloads (Adversarial Test Vectors)

1. **Payload 1 — Shadow Field Injection**: Valid `Objection` creation payload plus an undeclared `"isVerifiedByGov": true` field -> Rejected by `data.keys().hasOnly(...)`.
2. **Payload 2 — Identity Spoofing on Create**: Authenticated user `uid_attacker` submits an objection with `authorId: "uid_victim"` -> Rejected by `incoming().authorId == request.auth.uid`.
3. **Payload 3 — Unverified Email Spoof**: User with `email: "mdshabbirmia516@gmail.com"` but `email_verified: false` attempts an admin status transition -> Rejected by `request.auth.token.email_verified == true`.
4. **Payload 4 — Self-Verified Creation Shortcut**: Non-admin user creates an objection with initial `status: "verified_violation"` -> Rejected by `incoming().status == 'submitted'`.
5. **Payload 5 — Client Timestamp Forgery**: Payload supplies a backdated `createdAt` timestamp instead of `request.time` -> Rejected by `incoming().createdAt == request.time`.
6. **Payload 6 — Tracking ID Format Poisoning**: Payload supplies `trackingId: "DROP_TABLE_123"` -> Rejected by `data.trackingId.matches('^OBJ-2026-[0-9A-Z]{6}$')`.
7. **Payload 7 — SHA-256 Digest Tampering on Update**: Author attempts to modify `sha256Hash` during an update -> Rejected by `affectedKeys().hasOnly(...)` and `incoming().sha256Hash == existing().sha256Hash`.
8. **Payload 8 — Citizen Privilege Escalation Update**: Citizen author attempts to update `status` to `'resolved'` or set `authorityBadgeId` -> Rejected because citizen update action only allows `['description', 'mediaType', 'mediaUrl', 'mediaCaption', 'updatedAt']`.
9. **Payload 9 — Terminal State Re-Opening**: Citizen author attempts to edit `description` after `status` is already `'resolved'` -> Rejected by Terminal State Lock `!(existing().status in ['resolved', 'dismissed'])`.
10. **Payload 10 — Value Poisoning on Whitelisted Key**: Citizen updates `description` with a 50,000-character string or integer `12345` -> Rejected by `isValidObjection(incoming())` wrapping the `allow update` block.
11. **Payload 11 — Unrestricted List Scraping of Restricted Dossiers**: Client queries `/objections` without filtering `visibility == 'public'` or `authorId == request.auth.uid` on restricted records -> Rejected by `allow list` rule check on `resource.data`.
12. **Payload 12 — Self-Assigned Admin Privilege Escalation**: Non-admin user attempts to write a document to `/admins/{uid}` -> Rejected by `allow create, update, delete: if isAdmin();`.
