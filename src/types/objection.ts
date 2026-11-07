export type ObjectionCategory =
  | 'expired_medicine'
  | 'expired_food'
  | 'adulterated_goods'
  | 'price_violation'
  | 'civic_infrastructure'
  | 'public_safety';

export type ObjectionSeverity = 'routine' | 'elevated' | 'high' | 'critical';

export type ObjectionStatus =
  | 'submitted'
  | 'under_investigation'
  | 'verified_violation'
  | 'enforcement_action'
  | 'resolved'
  | 'dismissed';

export type ObjectionVisibility = 'public' | 'restricted';

export type EvidenceMediaType = 'none' | 'image' | 'video';

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actorRole: 'citizen' | 'system_crypto' | 'regulatory_authority';
  actorLabel: string;
  actionTitle: string;
  detail: string;
  statusAfter: ObjectionStatus;
}

export interface ObjectionRecord {
  id: string;
  trackingId: string;
  title: string;
  category: ObjectionCategory;
  severity: ObjectionSeverity;
  status: ObjectionStatus;
  visibility: ObjectionVisibility;
  establishmentName: string;
  jurisdiction: string;
  batchNumber: string;
  expiryDate: string;
  manufacturedDate: string;
  description: string;
  sha256Hash: string;
  isEncrypted: boolean;
  encryptedPayload: string;
  encryptionIv: string;
  mediaType: EvidenceMediaType;
  mediaUrl: string;
  mediaCaption: string;
  authorId: string;
  reporterAlias: string;
  reporterAge?: string;
  authorityBadgeId: string;
  authorityNote: string;
  enforcementAction: string;
  createdAt: string;
  updatedAt: string;
  auditTrail?: AuditLogEntry[];
}

export interface NewObjectionInput {
  title: string;
  category: ObjectionCategory;
  establishmentName: string;
  jurisdiction: string;
  batchNumber: string;
  expiryDate: string;
  manufacturedDate: string;
  description: string;
  confidentialNote?: string;
  encryptionPassphrase?: string;
  mediaType: EvidenceMediaType;
  mediaUrl: string;
  mediaCaption: string;
  reporterAlias: string;
  reporterAge?: string;
  visibility?: ObjectionVisibility;
}

export interface AuthorityUpdateInput {
  objectionId: string;
  status: ObjectionStatus;
  severity: ObjectionSeverity;
  authorityBadgeId: string;
  authorityNote: string;
  enforcementAction: string;
}

export const CATEGORY_LABELS: Record<ObjectionCategory, string> = {
  expired_medicine: 'Expired Pharmaceuticals',
  expired_food: 'Expired Food & Dairy',
  adulterated_goods: 'Counterfeit / Adulterated Goods',
  price_violation: 'Essential Goods Price Gouging',
  civic_infrastructure: 'Civic & Utility Hazard',
  public_safety: 'Public Health & Sanitation',
};

export const STATUS_LABELS: Record<ObjectionStatus, string> = {
  submitted: 'Submitted & Sealed',
  under_investigation: 'Under Authority Investigation',
  verified_violation: 'Verified Regulatory Violation',
  enforcement_action: 'Enforcement Action Issued',
  resolved: 'Resolved & Remediated',
  dismissed: 'Reviewed — No Violation Found',
};

export const SEVERITY_LABELS: Record<ObjectionSeverity, string> = {
  routine: 'Routine Review',
  elevated: 'Elevated Notice',
  high: 'High Priority',
  critical: 'Critical Public Hazard',
};
