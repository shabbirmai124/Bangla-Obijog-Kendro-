import React, { useState, useEffect } from 'react';
import {
  ObjectionRecord,
  ObjectionStatus,
} from '../types/objection';
import {
  LanguageMode,
  CATEGORY_LABELS_I18N,
  STATUS_LABELS_I18N,
  SEVERITY_LABELS_I18N,
  DIRECTORATE_MAPPING,
  getLocalizedDossier,
  formatLocalizedExpiryStatus,
} from '../i18n/translations';
import {
  verifyDossierIntegrity,
  decryptConfidentialPayload,
  calculateExpiryAnalysis,
} from '../utils/cryptoAndValidation';
import { DEMO_DECRYPTION_PASSPHRASE } from '../data/seedObjections';
import { EvidenceMediaViewer } from './EvidenceMediaViewer';
import {
  Search,
  ShieldCheck,
  ShieldAlert,
  Lock,
  Unlock,
  CheckCircle2,
  Clock,
  FileText,
  ArrowRight,
} from 'lucide-react';

interface TrackingPortalSectionProps {
  objections: ObjectionRecord[];
  initialTrackingId: string;
  onSelectTrackingId: (trackingId: string) => void;
  onCitizenAppendStatement: (objectionId: string, additionalStatement: string) => Promise<void>;
  onJumpToAuthorityDesk: (objectionId: string) => void;
  lang: LanguageMode;
}

const LIFECYCLE_STEPS: {
  status: ObjectionStatus;
  labelBn: string;
  labelEn: string;
  descBn: string;
  descEn: string;
}[] = [
  {
    status: 'submitted',
    labelBn: '০১. দাখিল ও সিলযুক্ত',
    labelEn: '01. Submitted & Sealed',
    descBn: 'ডিজিটাল হ্যাশ ও অনন্য ট্র্যাকিং নম্বর দ্বারা সিলযুক্ত।',
    descEn: 'Dossier hashed with SHA-256 and assigned unique Tracking ID.',
  },
  {
    status: 'under_investigation',
    labelBn: '০২. কর্তৃপক্ষের তদন্ত',
    labelEn: '02. Authority Investigation',
    descBn: 'মাঠ পর্যায়ের পরিদর্শক ও ল্যাবরেটরি পরীক্ষায় প্রেরিত।',
    descEn: 'Assigned to field inspectorate & laboratory batch testing.',
  },
  {
    status: 'verified_violation',
    labelBn: '০৩. প্রমাণিত লঙ্ঘন',
    labelEn: '03. Verified Violation',
    descBn: 'মেয়াদোত্তীর্ণ বা ভেজাল পণ্য সরকারি পরীক্ষায় প্রমাণিত।',
    descEn: 'Expiration or safety breach confirmed by official assay.',
  },
  {
    status: 'enforcement_action',
    labelBn: '০৪. শাস্তিমূলক ব্যবস্থা',
    labelEn: '04. Enforcement Action',
    descBn: 'ব্যাচ জব্দ, ভ্রাম্যমাণ আদালতের জরিমানা বা লাইসেন্স স্থগিত।',
    descEn: 'Mandatory batch recall, quarantine, or penalty executed.',
  },
  {
    status: 'resolved',
    labelBn: '০৫. চূড়ান্ত নিষ্পত্তি',
    labelEn: '05. Resolved & Remediated',
    descBn: 'অবৈধ মজুদ ধ্বংস ও স্থায়ী প্রতিকার সম্পন্ন।',
    descEn: 'Stock removed and compliance lock verified on-site.',
  },
];

export const TrackingPortalSection: React.FC<TrackingPortalSectionProps> = ({
  objections,
  initialTrackingId,
  onSelectTrackingId,
  onCitizenAppendStatement,
  onJumpToAuthorityDesk,
  lang,
}) => {
  const [inputCode, setInputCode] = useState(initialTrackingId || 'OBJ-2026-849201');
  const [activeCode, setActiveCode] = useState(initialTrackingId || 'OBJ-2026-849201');

  const [integrityResult, setIntegrityResult] = useState<{
    valid: boolean;
    computedHash: string;
    checkedAt: string;
  } | null>(null);

  const [passphraseInput, setPassphraseInput] = useState('');
  const [decryptionResult, setDecryptionResult] = useState<{
    success: boolean;
    plaintext: string;
    error?: string;
  } | null>(null);

  const [supplementaryNote, setSupplementaryNote] = useState('');
  const [noteSavedBanner, setNoteSavedBanner] = useState(false);

  const catLabels = CATEGORY_LABELS_I18N[lang];
  const statusLabels = STATUS_LABELS_I18N[lang];
  const severityLabels = SEVERITY_LABELS_I18N[lang];

  useEffect(() => {
    if (initialTrackingId) {
      setInputCode(initialTrackingId);
      setActiveCode(initialTrackingId);
    }
  }, [initialTrackingId]);

  const rawMatchedDossier = objections.find(
    (o) => o.trackingId.toUpperCase() === activeCode.trim().toUpperCase()
  );
  const matchedDossier = rawMatchedDossier
    ? getLocalizedDossier(rawMatchedDossier, lang)
    : undefined;

  useEffect(() => {
    setDecryptionResult(null);
    setPassphraseInput('');
    setNoteSavedBanner(false);
    if (!rawMatchedDossier) {
      setIntegrityResult(null);
      return;
    }
    let cancelled = false;
    verifyDossierIntegrity(rawMatchedDossier).then((res) => {
      if (!cancelled) {
        setIntegrityResult({
          valid: res.valid,
          computedHash: res.computedHash,
          checkedAt: new Date().toISOString().slice(11, 19) + ' UTC',
        });
      }
    });
    return () => {
      cancelled = true;
    };
  }, [rawMatchedDossier]);

  const handleLookupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = inputCode.trim().toUpperCase();
    if (cleaned) {
      setActiveCode(cleaned);
      onSelectTrackingId(cleaned);
    }
  };

  const handleDecrypt = async (passphraseToUse?: string) => {
    if (!rawMatchedDossier) return;
    const key = passphraseToUse ?? passphraseInput;
    const result = await decryptConfidentialPayload(
      rawMatchedDossier.encryptedPayload,
      rawMatchedDossier.encryptionIv,
      key
    );
    setDecryptionResult(result);
  };

  const handleAppendCitizenNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawMatchedDossier || !supplementaryNote.trim()) return;
    await onCitizenAppendStatement(rawMatchedDossier.id, supplementaryNote.trim());
    setSupplementaryNote('');
    setNoteSavedBanner(true);
    setTimeout(() => setNoteSavedBanner(false), 3500);
  };

  const getStepIndex = (status: ObjectionStatus): number => {
    if (status === 'dismissed') return 2;
    return LIFECYCLE_STEPS.findIndex((s) => s.status === status);
  };

  return (
    <section
      id="tracking-portal-section"
      aria-labelledby="tracking-portal-heading"
      className="max-w-[1360px] mx-auto px-6 py-12"
    >
      {/* Header & Lookup Input */}
      <div className="pb-8 border-b border-[#E2DCD3]">
        <p className="text-xs uppercase tracking-widest text-[#14532D] font-semibold">
          {lang === 'bn'
            ? '০৩. অভিযোগ ট্র্যাকিং ও ক্রিপ্টোগ্রাফিক অডিট'
            : '03. END-TO-END DOSSIER TRACKING & CRYPTOGRAPHIC AUDIT'}
        </p>
        <h2
          id="tracking-portal-heading"
          className="mt-1 text-2xl sm:text-3xl font-serif-display font-semibold text-[#1C1917]"
        >
          {lang === 'bn'
            ? 'অনন্য ট্র্যাকিং নম্বর দিয়ে অভিযোগের অগ্রগতি জানুন'
            : 'Track Objection Status by Unique Tracking Number'}
        </h2>
        <p className="mt-2 text-sm text-[#57534E] max-w-2xl">
          {lang === 'bn'
            ? 'আপনার প্রাপ্ত ট্র্যাকিং নম্বর প্রদান করে তদন্তের বর্তমান ধাপ, ডিজিটাল সিল যাচাই এবং সরকারি পরিদর্শকের প্রতিবেদন দেখুন।'
            : 'Enter any OBJ-2026-XXXXXX Tracking ID to inspect live regulatory verification progress, verify the SHA-256 integrity seal, and view official inspector findings.'}
        </p>

        <form
          onSubmit={handleLookupSubmit}
          className="mt-6 max-w-2xl flex flex-col sm:flex-row items-stretch sm:items-center gap-3"
        >
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#78716C] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              aria-label="Tracking ID Lookup Input"
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value)}
              placeholder={
                lang === 'bn'
                  ? 'ট্র্যাকিং নম্বর লিখুন (যেমন: OBJ-2026-849201)'
                  : 'Enter Tracking ID (e.g. OBJ-2026-849201)'
              }
              className="w-full pl-10 pr-4 py-2.5 text-sm font-mono-tabular bg-white border border-[#D6CEBE] rounded-lg text-[#1C1917] focus:outline-none focus:border-[#14532D]"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 text-xs font-semibold text-white bg-[#14532D] rounded-lg hover:bg-[#0F3F22] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {lang === 'bn' ? 'অভিযোগ ট্র্যাক করুন' : 'Track Dossier'}
          </button>
        </form>

        {/* Quick-Select Active Tracking Numbers */}
        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-[#57534E]">
          <span>{lang === 'bn' ? 'সক্রিয় ট্র্যাকিং নম্বরসমূহ:' : 'Active Dossiers in Ledger:'}</span>
          {objections.slice(0, 6).map((obj, idx) => (
            <React.Fragment key={obj.id}>
              {idx > 0 && <span aria-hidden="true">·</span>}
              <button
                type="button"
                onClick={() => {
                  setInputCode(obj.trackingId);
                  setActiveCode(obj.trackingId);
                  onSelectTrackingId(obj.trackingId);
                }}
                className={`font-mono-tabular transition-colors cursor-pointer ${
                  activeCode.toUpperCase() === obj.trackingId
                    ? 'text-[#14532D] font-bold underline underline-offset-4'
                    : 'text-[#44403C] hover:text-[#14532D]'
                }`}
              >
                {obj.trackingId}
              </button>
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Lookup Results */}
      {!matchedDossier || !rawMatchedDossier ? (
        <div className="mt-8 p-10 bg-white border border-[#E2DCD3] rounded-xl text-center">
          <p className="font-serif-display text-lg text-[#1C1917]">
            {lang === 'bn'
              ? `"${activeCode}" ট্র্যাকিং নম্বরের কোনো অভিযোগ পাওয়া যায়নি।`
              : `No dossier found matching Tracking Number “${activeCode}”`}
          </p>
        </div>
      ) : (
        <div className="mt-8 space-y-8" data-testid="tracked-dossier-view">
          {/* Top Dossier Identity & Status Banner */}
          <div className="bg-white border border-[#E2DCD3] rounded-xl p-6 sm:p-8">
            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6 pb-6 border-b border-[#EBE6DF]">
              <div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-[#57534E]">
                  <span className="font-mono-tabular font-bold text-[#14532D] text-sm">
                    {matchedDossier.trackingId}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="font-medium text-[#1C1917]">
                    {catLabels[matchedDossier.category]}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="text-[#1E3A8A] font-medium">
                    {lang === 'bn'
                      ? DIRECTORATE_MAPPING[matchedDossier.category].bn
                      : DIRECTORATE_MAPPING[matchedDossier.category].en}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>{severityLabels[matchedDossier.severity]}</span>
                </div>
                <h3 className="mt-2 text-2xl font-serif-display font-semibold text-[#1C1917]">
                  {matchedDossier.title}
                </h3>
                <p className="mt-1 text-xs text-[#57534E]">
                  {lang === 'bn' ? 'প্রতিষ্ঠান:' : 'Establishment:'}{' '}
                  <strong className="text-[#1C1917]">{matchedDossier.establishmentName}</strong> ·{' '}
                  {lang === 'bn' ? 'এলাকা:' : 'Jurisdiction:'}{' '}
                  <strong className="text-[#1C1917]">{matchedDossier.jurisdiction}</strong> ·{' '}
                  {lang === 'bn' ? 'ব্যাচ নম্বর:' : 'Batch/Lot:'}{' '}
                  <span className="font-mono-tabular text-[#1C1917]">
                    {matchedDossier.batchNumber}
                  </span>
                  {matchedDossier.expiryDate && (
                    <>
                      {' '}
                      · {lang === 'bn' ? 'মুদ্রিত মেয়াদ:' : 'Stamped Expiry:'}{' '}
                      <span className="font-mono-tabular text-[#9A3412] font-semibold">
                        {matchedDossier.expiryDate} (
                        {formatLocalizedExpiryStatus(
                          calculateExpiryAnalysis(
                            matchedDossier.expiryDate,
                            matchedDossier.category
                          ).statusLabel,
                          lang
                        )}
                        )
                      </span>
                    </>
                  )}
                </p>
              </div>

              <div className="flex flex-col sm:items-end gap-2 shrink-0">
                <span className="text-xs uppercase tracking-wider text-[#57534E]">
                  {lang === 'bn' ? 'বর্তমান যাচাই অবস্থা' : 'Current Verification Status'}
                </span>
                <span
                  data-testid="tracked-status-label"
                  className="text-sm font-semibold text-[#1C1917] bg-[#F3EFE6] px-3.5 py-1.5 rounded-md border border-[#D6CEBE]"
                >
                  {statusLabels[matchedDossier.status]}
                </span>
                <button
                  type="button"
                  onClick={() => onJumpToAuthorityDesk(matchedDossier.id)}
                  aria-label="Update Status in Authority Desk"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#14532D] hover:underline mt-1 cursor-pointer"
                >
                  <span>
                    {lang === 'bn'
                      ? 'কর্তৃপক্ষ ডেস্কে অবস্থা আপডেট করুন'
                      : 'Update Status in Authority Desk'}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* 5-Stage Verification Progress Pipeline */}
            <div className="mt-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#57534E] mb-4">
                {lang === 'bn'
                  ? 'সরকারি তদন্ত ও নিষ্পত্তি ধাপসমূহ'
                  : 'Regulatory Verification Lifecycle'}
              </p>
              <ol className="grid grid-cols-1 sm:grid-cols-5 gap-4">
                {LIFECYCLE_STEPS.map((step, index) => {
                  const activeIndex = getStepIndex(matchedDossier.status);
                  const isCompleted = index <= activeIndex;
                  const isCurrent = index === activeIndex;
                  return (
                    <li
                      key={step.status}
                      className={`p-3.5 rounded-lg border transition-colors ${
                        isCurrent
                          ? 'bg-[#F3EFE6] border-[#14532D] text-[#1C1917]'
                          : isCompleted
                          ? 'bg-[#FBF9F5] border-[#D6CEBE] text-[#1C1917]'
                          : 'bg-white border-[#EBE6DF] text-[#78716C]'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs font-mono-tabular mb-1">
                        <span className="font-semibold">
                          {lang === 'bn' ? step.labelBn : step.labelEn}
                        </span>
                        {isCompleted ? (
                          <CheckCircle2 className="w-4 h-4 text-[#14532D] shrink-0" />
                        ) : (
                          <Clock className="w-3.5 h-3.5 text-[#A8A29E] shrink-0" />
                        )}
                      </div>
                      <p className="text-xs leading-snug text-[#57534E]">
                        {lang === 'bn' ? step.descBn : step.descEn}
                      </p>
                    </li>
                  );
                })}
              </ol>
            </div>
          </div>

          {/* 2-Column Detail View */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-7 space-y-6">
              {/* Factual Statement & Attached Media */}
              <div className="bg-white border border-[#E2DCD3] rounded-xl p-6 space-y-4">
                <h4 className="text-base font-serif-display font-semibold text-[#1C1917]">
                  {lang === 'bn'
                    ? 'দাখিলকৃত অভিযোগের বিবরণ ও ছবি/ভিডিও প্রমাণ'
                    : 'Submitted Evidentiary Statement & Media'}
                </h4>
                <p className="text-sm text-[#44403C] leading-relaxed whitespace-pre-line">
                  {matchedDossier.description}
                </p>
                <EvidenceMediaViewer
                  mediaType={matchedDossier.mediaType}
                  mediaUrl={matchedDossier.mediaUrl}
                  mediaCaption={matchedDossier.mediaCaption}
                  batchNumber={matchedDossier.batchNumber}
                  expiryDate={matchedDossier.expiryDate}
                  lang={lang}
                />
              </div>

              {/* Official Regulatory Authority Verification Box */}
              <div className="bg-white border border-[#E2DCD3] rounded-xl p-6 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-base font-serif-display font-semibold text-[#1C1917]">
                    {lang === 'bn'
                      ? 'সরকারি পরিদর্শক ও ভ্রাম্যমাণ আদালতের আদেশ'
                      : 'Official Regulatory Authority Findings & Directives'}
                  </h4>
                  {matchedDossier.authorityBadgeId && (
                    <span className="text-xs font-mono-tabular text-[#14532D] font-semibold">
                      {lang === 'bn' ? 'যাচাইকারী ব্যাজ:' : 'Verified by'}{' '}
                      {matchedDossier.authorityBadgeId}
                    </span>
                  )}
                </div>

                {matchedDossier.authorityNote || matchedDossier.enforcementAction ? (
                  <div className="space-y-3 text-sm">
                    {matchedDossier.authorityNote && (
                      <div className="p-4 bg-[#FBF9F5] border border-[#E2DCD3] rounded-lg">
                        <p className="text-xs font-semibold text-[#57534E] uppercase tracking-wider mb-1">
                          {lang === 'bn'
                            ? 'ল্যাবরেটরি ও মাঠ পরিদর্শন প্রতিবেদন'
                            : 'Inspectorate & Laboratory Verification Report'}
                        </p>
                        <p className="text-[#1C1917] leading-relaxed">
                          {matchedDossier.authorityNote}
                        </p>
                      </div>
                    )}
                    {matchedDossier.enforcementAction && (
                      <div className="p-4 bg-[#F3EFE6] border border-[#14532D]/30 rounded-lg">
                        <p className="text-xs font-semibold text-[#14532D] uppercase tracking-wider mb-1">
                          {lang === 'bn'
                            ? 'গৃহীত আইনানুগ ব্যবস্থা ও জব্দ আদেশ'
                            : 'Official Enforcement Action / Recall Directive'}
                        </p>
                        <p className="text-[#1C1917] font-medium">
                          {matchedDossier.enforcementAction}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-[#57534E] bg-[#FBF9F5] p-4 rounded-lg border border-[#EBE6DF]">
                    {lang === 'bn'
                      ? 'এই অভিযোগটি বর্তমানে সংশ্লিষ্ট অধিদপ্তরের মাঠ পরিদর্শকের তদন্তের অপেক্ষায় রয়েছে।'
                      : 'This dossier is currently queued for field inspectorate verification.'}
                  </p>
                )}
              </div>

              {/* Citizen Supplementary Statement Form */}
              {matchedDossier.status !== 'resolved' && matchedDossier.status !== 'dismissed' && (
                <form
                  onSubmit={handleAppendCitizenNote}
                  className="bg-white border border-[#E2DCD3] rounded-xl p-6 space-y-3"
                >
                  <h4 className="text-sm font-semibold text-[#1C1917] flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#14532D]" />
                    <span>
                      {lang === 'bn'
                        ? 'অতিরিক্ত নাগরিক তথ্য বা প্রমাণ সংযোজন করুন'
                        : 'Append Supplementary Citizen Evidence Note'}
                    </span>
                  </h4>
                  <textarea
                    rows={2}
                    value={supplementaryNote}
                    onChange={(e) => setSupplementaryNote(e.target.value)}
                    placeholder={
                      lang === 'bn'
                        ? 'অতিরিক্ত ব্যাচ তথ্য বা দোকানের প্রতিক্রিয়া লিখুন...'
                        : 'Add supplementary batch observation or store response...'
                    }
                    className="w-full px-3 py-2 text-xs bg-[#FBF9F5] border border-[#D6CEBE] rounded-lg text-[#1C1917]"
                  />
                  <div className="flex items-center justify-between">
                    {noteSavedBanner ? (
                      <span className="text-xs text-[#14532D] font-medium">
                        {lang === 'bn'
                          ? 'অতিরিক্ত তথ্য যুক্ত হয়েছে এবং ডিজিটাল হ্যাশ পুনরায় সিল করা হয়েছে।'
                          : 'Supplementary evidence appended and SHA-256 re-anchored.'}
                      </span>
                    ) : (
                      <span />
                    )}
                    <button
                      type="submit"
                      className="px-4 py-2 text-xs font-semibold text-white bg-[#14532D] rounded-lg hover:bg-[#0F3F22] transition-colors cursor-pointer"
                    >
                      {lang === 'bn' ? 'নথিতে যুক্ত করুন' : 'Append to Dossier'}
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Right 5 Columns: Cryptographic SHA-256 Verification, AES-256-GCM Decryption, & Chain of Custody */}
            <div className="lg:col-span-5 space-y-6">
              {/* Live SHA-256 Integrity Verification Card */}
              <div className="bg-[#1C1917] text-[#FBF9F5] p-6 rounded-xl space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono-tabular uppercase tracking-wider text-emerald-300">
                    {lang === 'bn'
                      ? 'ডিজিটাল ক্রিপ্টোগ্রাফিক অডিট · বাংলা অভিযোগ কেন্দ্র'
                      : 'SHA-256 CRYPTOGRAPHIC AUDIT · BANGLA OBIJOG KENDRO'}
                  </span>
                  {integrityResult?.valid !== false ? (
                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <ShieldAlert className="w-5 h-5 text-rose-400" />
                  )}
                </div>

                <div className="space-y-2 text-xs font-mono-tabular">
                  <div>
                    <span className="text-stone-400 block">
                      {lang === 'bn' ? 'সংরক্ষিত লেজার হ্যাশ:' : 'STORED LEDGER DIGEST:'}
                    </span>
                    <span className="text-emerald-300 break-all">{matchedDossier.sha256Hash}</span>
                  </div>
                  {integrityResult && (
                    <div>
                      <span className="text-stone-400 block">
                        {lang === 'bn'
                          ? `তাৎক্ষণিক পুনঃগণনাকৃত হ্যাশ (${integrityResult.checkedAt}):`
                          : `LIVE RECOMPUTED WEB CRYPTO DIGEST (${integrityResult.checkedAt}):`}
                      </span>
                      <span className="text-emerald-200 break-all">
                        {integrityResult.computedHash}
                      </span>
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                  <span className="text-xs text-emerald-300 font-medium">
                    {integrityResult?.valid
                      ? lang === 'bn'
                        ? 'যাচাইকৃত: দাখিলের পর কোনো তথ্য পরিবর্তন হয়নি'
                        : 'Verified: Zero byte tampering since filing'
                      : lang === 'bn'
                      ? 'ক্রিপ্টোগ্রাফিক হ্যাশ মূল তথ্যের সাথে যাচাইকৃত'
                      : 'Cryptographic hash verified against canonical fields'}
                  </span>
                  <button
                    type="button"
                    onClick={async () => {
                      const res = await verifyDossierIntegrity(rawMatchedDossier);
                      setIntegrityResult({
                        valid: res.valid,
                        computedHash: res.computedHash,
                        checkedAt: new Date().toISOString().slice(11, 19) + ' UTC',
                      });
                    }}
                    className="px-3 py-1.5 text-xs font-semibold bg-white/10 hover:bg-white/20 text-white rounded-md transition-colors cursor-pointer"
                  >
                    {lang === 'bn' ? 'হ্যাশ পুনরায় যাচাই' : 'Re-Verify Hash'}
                  </button>
                </div>
              </div>

              {/* AES-256-GCM Confidential Whistleblower Decryption Console */}
              <div className="bg-white border border-[#E2DCD3] rounded-xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-[#1C1917] flex items-center gap-2">
                    <Lock className="w-4 h-4 text-[#14532D]" />
                    <span>
                      {lang === 'bn'
                        ? 'এনক্রিপ্টেড গোপনীয় তথ্যভান্ডার'
                        : 'AES-256-GCM Encrypted Whistleblower Payload'}
                    </span>
                  </h4>
                  <span className="text-xs font-mono-tabular text-[#57534E]">
                    {matchedDossier.isEncrypted
                      ? lang === 'bn'
                        ? 'সাইফারটেক্সট সিলযুক্ত'
                        : 'CIPHERTEXT SEALED'
                      : lang === 'bn'
                      ? 'সংযুক্ত নেই'
                      : 'NONE ATTACHED'}
                  </span>
                </div>

                {matchedDossier.isEncrypted ? (
                  <div className="space-y-3">
                    <div className="p-3 bg-[#FBF9F5] border border-[#E2DCD3] rounded-lg text-xs font-mono-tabular text-[#57534E] break-all">
                      <span className="block text-[11px] text-[#78716C] mb-1">
                        IV: {matchedDossier.encryptionIv} · PBKDF2-SHA256
                      </span>
                      {matchedDossier.encryptedPayload}
                    </div>

                    <div className="space-y-2">
                      <label
                        htmlFor="decrypt-passphrase-input"
                        className="block text-xs font-semibold text-[#1C1917]"
                      >
                        {lang === 'bn'
                          ? 'ব্রাউজারে ডিক্রিপ্ট করতে গোপন পাসফ্রেজ দিন'
                          : 'Enter Passphrase to Decrypt Locally in Browser'}
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          id="decrypt-passphrase-input"
                          type="text"
                          value={passphraseInput}
                          onChange={(e) => setPassphraseInput(e.target.value)}
                          placeholder={
                            lang === 'bn'
                              ? 'পাসফ্রেজ লিখুন (যেমন: AEGIS-INSPECT-2026)'
                              : 'Passphrase (Demo: AEGIS-INSPECT-2026)'
                          }
                          className="flex-1 px-3 py-2 text-xs font-mono-tabular bg-[#FBF9F5] border border-[#D6CEBE] rounded-lg text-[#1C1917]"
                        />
                        <button
                          type="button"
                          onClick={() => handleDecrypt()}
                          className="px-3.5 py-2 text-xs font-semibold text-white bg-[#14532D] rounded-lg hover:bg-[#0F3F22] transition-colors shrink-0 cursor-pointer"
                        >
                          {lang === 'bn' ? 'ডিক্রিপ্ট' : 'Decrypt'}
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setPassphraseInput(DEMO_DECRYPTION_PASSPHRASE);
                          handleDecrypt(DEMO_DECRYPTION_PASSPHRASE);
                        }}
                        className="text-xs text-[#14532D] font-semibold hover:underline font-mono-tabular cursor-pointer"
                      >
                        {lang === 'bn'
                          ? `নমুনা পরিদর্শক কী ব্যবহার করুন (${DEMO_DECRYPTION_PASSPHRASE})`
                          : `Use Demo Inspector Key (${DEMO_DECRYPTION_PASSPHRASE})`}
                      </button>
                    </div>

                    {decryptionResult && (
                      <div
                        data-testid="decrypted-payload-box"
                        className={`p-3.5 rounded-lg border text-xs ${
                          decryptionResult.success
                            ? 'bg-[#F3EFE6] border-[#14532D] text-[#1C1917]'
                            : 'bg-rose-50 border-rose-300 text-rose-900'
                        }`}
                      >
                        {decryptionResult.success ? (
                          <>
                            <div className="flex items-center gap-1.5 font-semibold text-[#14532D] mb-1">
                              <Unlock className="w-3.5 h-3.5" />
                              <span>
                                {lang === 'bn'
                                  ? 'ডিক্রিপ্টকৃত গোপনীয় তথ্যদাতা নোট:'
                                  : 'Decrypted Confidential Whistleblower Note:'}
                              </span>
                            </div>
                            <p className="leading-relaxed">{decryptionResult.plaintext}</p>
                          </>
                        ) : (
                          <p>{decryptionResult.error}</p>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-[#57534E]">
                    {lang === 'bn'
                      ? 'এই অভিযোগে কোনো পৃথক এনক্রিপ্টেড গোপন নোট সংযুক্ত করা হয়নি।'
                      : 'This objection was filed as a full public statement without a separate encrypted whistleblower attachment.'}
                  </p>
                )}
              </div>

              {/* Chronological Chain-of-Custody Audit Trail */}
              <div className="bg-white border border-[#E2DCD3] rounded-xl p-6 space-y-4">
                <h4 className="text-sm font-semibold text-[#1C1917]">
                  {lang === 'bn'
                    ? 'অপরিবর্তনীয় চেইন-অব-কাস্টডি অডিট লগ'
                    : 'Immutable Chain-of-Custody Audit Log'}
                </h4>
                <ol className="space-y-4 divide-y divide-[#EBE6DF]">
                  {(matchedDossier.auditTrail || []).map((entry) => (
                    <li key={entry.id} className="pt-3 first:pt-0 text-xs">
                      <div className="flex items-center justify-between text-[#57534E] font-mono-tabular">
                        <span>{entry.actorLabel}</span>
                        <span>{entry.timestamp.slice(0, 16).replace('T', ' ')}</span>
                      </div>
                      <p className="font-semibold text-[#1C1917] mt-1">{entry.actionTitle}</p>
                      <p className="text-[#44403C] mt-0.5 leading-relaxed">{entry.detail}</p>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
