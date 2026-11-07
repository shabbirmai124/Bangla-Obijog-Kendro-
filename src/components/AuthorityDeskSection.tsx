import React, { useState, useEffect } from 'react';
import {
  ObjectionRecord,
  ObjectionStatus,
  ObjectionSeverity,
  AuthorityUpdateInput,
} from '../types/objection';
import {
  LanguageMode,
  CATEGORY_LABELS_I18N,
  STATUS_LABELS_I18N,
  SEVERITY_LABELS_I18N,
  DIRECTORATE_MAPPING,
  getLocalizedDossier,
  formatLocalizedExpiryStatus,
  toBengaliDigits,
} from '../i18n/translations';
import {
  calculateExpiryAnalysis,
  verifyDossierIntegrity,
  decryptConfidentialPayload,
} from '../utils/cryptoAndValidation';
import { DEMO_DECRYPTION_PASSPHRASE } from '../data/seedObjections';
import { EvidenceMediaViewer } from './EvidenceMediaViewer';
import {
  ShieldCheck,
  CheckCircle2,
  Lock,
  Unlock,
  UserCheck,
  LogIn,
  LogOut,
  ClipboardCheck,
} from 'lucide-react';
import { User } from '../lib/firebase';

interface AuthorityDeskSectionProps {
  objections: ObjectionRecord[];
  selectedObjectionId: string;
  onSelectObjectionId: (id: string) => void;
  onAuthorityUpdate: (update: AuthorityUpdateInput) => Promise<void>;
  currentUser: User | null;
  onSignInGoogle: () => Promise<void>;
  onSignOut: () => Promise<void>;
  lang: LanguageMode;
}

export const AuthorityDeskSection: React.FC<AuthorityDeskSectionProps> = ({
  objections,
  selectedObjectionId,
  onSelectObjectionId,
  onAuthorityUpdate,
  currentUser,
  onSignInGoogle,
  onSignOut,
  lang,
}) => {
  const rawActiveDossier =
    objections.find((o) => o.id === selectedObjectionId) || objections[0] || null;
  const activeDossier = rawActiveDossier
    ? getLocalizedDossier(rawActiveDossier, lang)
    : null;

  const [status, setStatus] = useState<ObjectionStatus>('verified_violation');
  const [severity, setSeverity] = useState<ObjectionSeverity>('critical');
  const [authorityBadgeId, setAuthorityBadgeId] = useState('DGDA-MAGISTRATE-8821');
  const [authorityNote, setAuthorityNote] = useState('');
  const [enforcementAction, setEnforcementAction] = useState('');
  const [formError, setFormError] = useState('');
  const [updateSuccessBanner, setUpdateSuccessBanner] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const [hashValid, setHashValid] = useState<boolean | null>(null);
  const [decryptedNote, setDecryptedNote] = useState<string | null>(null);

  const catLabels = CATEGORY_LABELS_I18N[lang];
  const statusLabels = STATUS_LABELS_I18N[lang];
  const severityLabels = SEVERITY_LABELS_I18N[lang];

  useEffect(() => {
    if (!rawActiveDossier) return;
    const localized = getLocalizedDossier(rawActiveDossier, lang);
    setStatus(
      rawActiveDossier.status === 'submitted' ? 'under_investigation' : rawActiveDossier.status
    );
    setSeverity(rawActiveDossier.severity);
    setAuthorityBadgeId(rawActiveDossier.authorityBadgeId || 'DGDA-INSP-8821');
    setAuthorityNote(localized.authorityNote || '');
    setEnforcementAction(localized.enforcementAction || '');
    setFormError('');
    setDecryptedNote(null);

    verifyDossierIntegrity(rawActiveDossier).then((res) => {
      setHashValid(res.valid);
    });
  }, [rawActiveDossier, lang]);

  const handleApplyQuickInspectionTemplate = (
    templateType: 'confirm_violation' | 'quarantine' | 'resolve'
  ) => {
    if (!activeDossier) return;
    setFormError('');
    if (templateType === 'confirm_violation') {
      setStatus('verified_violation');
      setSeverity('critical');
      setAuthorityBadgeId('DGDA-INSP-8821');
      setAuthorityNote(
        lang === 'bn'
          ? `সরেজমিন পরিদর্শনে ${activeDossier.establishmentName}-এ ব্যাচ ${activeDossier.batchNumber} মেয়াদোত্তীর্ণ (${
              activeDossier.expiryDate || 'যাচাইকৃত'
            }) অবস্থায় পাওয়া গেছে। অবশিষ্ট মজুদ জব্দ করে ল্যাবরেটরি পরীক্ষার জন্য সিলগালা করা হয়েছে।`
          : `On-site inspection at ${activeDossier.establishmentName} confirmed batch ${activeDossier.batchNumber} past expiration (${
              activeDossier.expiryDate || 'verified'
            }). Remaining stock impounded and sealed for laboratory assay.`
      );
      setEnforcementAction(
        lang === 'bn'
          ? `ভ্রাম্যমাণ আদালত কর্তৃক ব্যাচ ${activeDossier.batchNumber} জব্দ ও ভোক্তা অধিকার সংরক্ষণ আইনে জরিমানা আদায়।`
          : `Mandatory Batch Recall & Mobile Court Fine executed for batch ${activeDossier.batchNumber}.`
      );
    } else if (templateType === 'quarantine') {
      setStatus('under_investigation');
      setSeverity('high');
      setAuthorityBadgeId('BFSA-FOOD-4410');
      setAuthorityNote(
        lang === 'bn'
          ? `বিএসটিআই ও নিরাপদ খাদ্য কর্তৃপক্ষের পরিদর্শক দল ${activeDossier.batchNumber} ব্যাচের নমুনা সংগ্রহ করে ২৪ ঘণ্টার মাইক্রোবায়োলজিক্যাল ল্যাব পরীক্ষায় পাঠিয়েছে।`
          : `BFSA & BSTI inspection unit collected samples of batch ${activeDossier.batchNumber} for 24-hour microbiological laboratory culture.`
      );
      setEnforcementAction(
        lang === 'bn'
          ? `ল্যাবরেটরি রিপোর্ট না আসা পর্যন্ত সংশ্লিষ্ট লট (${activeDossier.batchNumber}) বিক্রয় সাময়িক স্থগিত আদেশ।`
          : `Temporary Quarantine Order issued on lot ${activeDossier.batchNumber} pending laboratory report.`
      );
    } else {
      setStatus('resolved');
      setSeverity('routine');
      setAuthorityBadgeId('DNCRP-COMP-3310');
      setAuthorityNote(
        lang === 'bn'
          ? `মেয়াদোত্তীর্ণ সম্পূর্ণ মজুদ (${activeDossier.batchNumber}) ম্যাজিস্ট্রেটের উপস্থিতিতে ধ্বংস করা হয়েছে এবং ডিজিটাল বারকোড লক যাচাই করা হয়েছে।`
          : `All expired units (${activeDossier.batchNumber}) destroyed under magistrate supervision and POS barcode expiry lock verified.`
      );
      setEnforcementAction(
        lang === 'bn'
          ? `চূড়ান্ত নিষ্পত্তি ও কমপ্লায়েন্স সনদ প্রদান।`
          : `Compliance Remediation Certified — full stock audit completed.`
      );
    }
  };

  const handleCommitUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeDossier) return;

    if (!authorityBadgeId.trim() || authorityBadgeId.trim().length < 3) {
      setFormError(
        lang === 'bn'
          ? 'সরকারি পরিদর্শক ব্যাজ নম্বর আবশ্যক (কমপক্ষে ৩ অক্ষর)।'
          : 'Official Inspector Badge ID is required (minimum 3 characters).'
      );
      return;
    }
    if (!authorityNote.trim() || authorityNote.trim().length < 10) {
      setFormError(
        lang === 'bn'
          ? 'মাঠ পরিদর্শন ও যাচাই প্রতিবেদন কমপক্ষে ১০ অক্ষরের হতে হবে।'
          : 'Official Inspection & Verification Report must be at least 10 characters.'
      );
      return;
    }

    setFormError('');
    setIsUpdating(true);
    try {
      await onAuthorityUpdate({
        objectionId: activeDossier.id,
        status,
        severity,
        authorityBadgeId: authorityBadgeId.trim(),
        authorityNote: authorityNote.trim(),
        enforcementAction: enforcementAction.trim(),
      });
      setUpdateSuccessBanner(
        lang === 'bn'
          ? `${activeDossier.trackingId} নথির সরকারি অবস্থা "${statusLabels[status]}" হিসেবে (${authorityBadgeId.trim()}) আপডেট করা হয়েছে।`
          : `Official status for ${activeDossier.trackingId} updated to "${statusLabels[status]}" by ${authorityBadgeId.trim()}.`
      );
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setTimeout(() => setUpdateSuccessBanner(''), 5000);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAutoDecryptWhistleblower = async () => {
    if (!rawActiveDossier || !rawActiveDossier.isEncrypted) return;
    const res = await decryptConfidentialPayload(
      rawActiveDossier.encryptedPayload,
      rawActiveDossier.encryptionIv,
      DEMO_DECRYPTION_PASSPHRASE
    );
    if (res.success) {
      setDecryptedNote(res.plaintext);
    } else {
      setDecryptedNote(
        lang === 'bn'
          ? 'নাগরিকের নির্ধারিত কাস্টম পাসফ্রেজ প্রয়োজন।'
          : 'Requires citizen-supplied custom passphrase.'
      );
    }
  };

  return (
    <section
      id="authority-desk-section"
      aria-labelledby="authority-desk-heading"
      className="max-w-[1360px] mx-auto px-6 py-12"
    >
      {/* Header & Inspector Credentials Bar */}
      <div className="pb-6 border-b border-[#E2DCD3] flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <p className="text-xs uppercase tracking-widest text-[#14532D] font-semibold">
            {lang === 'bn'
              ? '০৪. সরকারি কর্তৃপক্ষ ও ভ্রাম্যমাণ আদালত যাচাই ডেস্ক'
              : '04. REGULATORY AUTHORITY VERIFICATION & ENFORCEMENT CONSOLE'}
          </p>
          <h2
            id="authority-desk-heading"
            className="mt-1 text-2xl sm:text-3xl font-serif-display font-semibold text-[#1C1917]"
          >
            {lang === 'bn'
              ? 'সরকারি পরিদর্শক যাচাই, ল্যাব অ্যাস ও অবস্থা আপডেট কনসোল'
              : 'Authority Inspection, Batch Assay & Status Updates'}
          </h2>
          <p className="mt-2 text-sm text-[#57534E] max-w-2xl">
            {lang === 'bn'
              ? 'ঔষধ প্রশাসন, নিরাপদ খাদ্য কর্তৃপক্ষ, বিএসটিআই এবং ভোক্তা অধিকার সংরক্ষণ অধিদপ্তরের কর্মকর্তাগণ এখান থেকে অভিযোগের প্রমাণ যাচাই ও গৃহীত ব্যবস্থা আপডেট করেন।'
              : 'Accredited regulatory authorities verify citizen objections, validate SHA-256 evidence hashes, inspect expired medicine/food batches, and publish official enforcement updates.'}
          </p>
        </div>

        {/* Google Admin Auth & Inspector Credential Control */}
        <div className="p-4 bg-white border border-[#D6CEBE] rounded-xl flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2.5">
            <UserCheck className="w-4 h-4 text-[#14532D]" />
            <div className="text-xs">
              <p className="font-semibold text-[#1C1917]">
                {currentUser
                  ? lang === 'bn'
                    ? `যাচাইকৃত কর্মকর্তা: ${currentUser.email}`
                    : `Authenticated: ${currentUser.email}`
                  : lang === 'bn'
                  ? 'অনুমোদিত পরিদর্শক সেশন সক্রিয়'
                  : 'Accredited Inspector Session Active'}
              </p>
              <p className="text-[#57534E]">
                {currentUser
                  ? lang === 'bn'
                    ? 'ক্লাউড ডাটাবেস ও লোকাল লেজার সিঙ্ক সক্রিয়'
                    : 'Cloud Firestore RBAC + Local Ledger Sync'
                  : lang === 'bn'
                  ? 'ঔষধ প্রশাসন · নিরাপদ খাদ্য · ভোক্তা অধিকার যাচাই কনসোল'
                  : 'DGDA · BFSA · DNCRP Verification Console'}
              </p>
            </div>
          </div>

          {currentUser ? (
            <button
              type="button"
              onClick={onSignOut}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#1C1917] bg-[#EBE6DF] hover:bg-[#DFD8CE] rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{lang === 'bn' ? 'লগআউট' : 'Sign Out'}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onSignInGoogle}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#14532D] border border-[#14532D]/30 hover:bg-[#14532D]/5 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>{lang === 'bn' ? 'সরকারি গুগল লগইন' : 'Google Authority Login'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Main 12-Column Workspace */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left 4 Columns: Dossier Verification Queue */}
        <div className="lg:col-span-4 bg-white border border-[#E2DCD3] rounded-xl overflow-hidden">
          <div className="p-4 bg-[#F3EFE6] border-b border-[#E2DCD3] flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#1C1917]">
              {lang === 'bn'
                ? `যাচাই অপেক্ষমাণ তালিকা (${toBengaliDigits(objections.length)})`
                : `Dossier Verification Queue (${objections.length})`}
            </span>
            <span className="text-xs font-mono-tabular text-[#57534E]">
              {lang === 'bn' ? 'নির্বাচন করুন' : 'Select to Verify'}
            </span>
          </div>

          <div className="divide-y divide-[#EBE6DF] max-h-[680px] overflow-y-auto">
            {objections.map((rawItem) => {
              const item = getLocalizedDossier(rawItem, lang);
              const isSelected = activeDossier?.id === item.id;
              const expInfo = calculateExpiryAnalysis(item.expiryDate, item.category);
              const expText = formatLocalizedExpiryStatus(expInfo.statusLabel, lang);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectObjectionId(item.id)}
                  aria-label={`Select dossier ${item.trackingId} for authority verification`}
                  className={`w-full text-left p-4 transition-colors cursor-pointer ${
                    isSelected ? 'bg-[#F3EFE6]' : 'hover:bg-[#FBF9F5]'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-mono-tabular">
                    <span className="font-bold text-[#14532D]">{item.trackingId}</span>
                    <span className="text-[#57534E]">{statusLabels[item.status]}</span>
                  </div>
                  <p className="mt-1 text-sm font-serif-display font-semibold text-[#1C1917] line-clamp-2">
                    {item.title}
                  </p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs text-[#57534E]">
                    <span>{catLabels[item.category]}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono-tabular">{item.batchNumber}</span>
                    {expInfo.isExpired && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="text-[#9A3412] font-semibold">{expText}</span>
                      </>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right 8 Columns: Active Dossier Verification & Official Update Form */}
        {activeDossier && (
          <div className="lg:col-span-8 space-y-6">
            {updateSuccessBanner && (
              <div
                role="status"
                data-testid="authority-update-banner"
                className="p-4 bg-[#F3EFE6] border-2 border-[#14532D] rounded-xl flex items-center gap-3 text-xs font-semibold text-[#14532D]"
              >
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{updateSuccessBanner}</span>
              </div>
            )}

            {/* Dossier Evidentiary Summary Card */}
            <div className="bg-white border border-[#E2DCD3] rounded-xl p-6 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#EBE6DF] pb-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-[#57534E]">
                    <span className="font-mono-tabular font-bold text-[#14532D] text-sm">
                      {activeDossier.trackingId}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{catLabels[activeDossier.category]}</span>
                    <span aria-hidden="true">·</span>
                    <span className="text-[#1E3A8A] font-semibold">
                      {lang === 'bn'
                        ? DIRECTORATE_MAPPING[activeDossier.category].bn
                        : DIRECTORATE_MAPPING[activeDossier.category].en}
                    </span>
                  </div>
                  <h3 className="mt-1 text-xl font-serif-display font-semibold text-[#1C1917]">
                    {activeDossier.title}
                  </h3>
                </div>

                <div className="flex items-center gap-2 text-xs font-mono-tabular text-[#14532D] bg-[#F3EFE6] px-3 py-1.5 rounded-md border border-[#D6CEBE]">
                  <ShieldCheck className="w-4 h-4" />
                  <span>
                    {hashValid !== false
                      ? lang === 'bn'
                        ? 'ডিজিটাল সিল সঠিক'
                        : 'SHA-256 SEAL VALID'
                      : lang === 'bn'
                      ? 'হ্যাশ অমিল'
                      : 'HASH MISMATCH'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs bg-[#FBF9F5] p-4 rounded-lg border border-[#EBE6DF]">
                <div>
                  <span className="text-[#57534E] block">
                    {lang === 'bn' ? 'অভিযুক্ত প্রতিষ্ঠান ও এলাকা' : 'Establishment & Jurisdiction'}
                  </span>
                  <strong className="text-[#1C1917] block mt-0.5">
                    {activeDossier.establishmentName}
                  </strong>
                  <span className="text-[#57534E]">{activeDossier.jurisdiction}</span>
                </div>
                <div>
                  <span className="text-[#57534E] block">
                    {lang === 'bn' ? 'ব্যাচ নম্বর' : 'Batch / Lot Identifier'}
                  </span>
                  <strong className="font-mono-tabular text-[#1C1917] block mt-0.5">
                    {activeDossier.batchNumber}
                  </strong>
                  <span className="font-mono-tabular text-[#57534E]">
                    {lang === 'bn' ? 'উৎপাদন:' : 'MFG:'}{' '}
                    {activeDossier.manufacturedDate || (lang === 'bn' ? 'উল্লেখ নেই' : 'N/A')}
                  </span>
                </div>
                <div>
                  <span className="text-[#57534E] block">
                    {lang === 'bn' ? 'মুদ্রিত মেয়াদ ও বিশ্লেষণ' : 'Printed Expiry & Delta'}
                  </span>
                  <strong className="font-mono-tabular text-[#9A3412] block mt-0.5">
                    {lang === 'bn' ? 'মেয়াদ:' : 'EXP:'}{' '}
                    {activeDossier.expiryDate || (lang === 'bn' ? 'প্রযোজ্য নয়' : 'Not applicable')}
                  </strong>
                  <span className="text-[#57534E]">
                    {formatLocalizedExpiryStatus(
                      calculateExpiryAnalysis(activeDossier.expiryDate, activeDossier.category)
                        .statusLabel,
                      lang
                    )}
                  </span>
                </div>
              </div>

              <p className="text-sm text-[#44403C] leading-relaxed">{activeDossier.description}</p>

              {/* Encrypted Whistleblower Lead Inspection */}
              {activeDossier.isEncrypted && (
                <div className="p-4 bg-[#F3EFE6] border border-[#D6CEBE] rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#1C1917] flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-[#14532D]" />
                      <span>
                        {lang === 'bn'
                          ? 'এনক্রিপ্টেড গোপনীয় সরবরাহ-চেইন তথ্য সংযুক্ত'
                          : 'AES-256-GCM Confidential Supply-Chain Lead Attached'}
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={handleAutoDecryptWhistleblower}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-white bg-[#14532D] rounded hover:bg-[#0F3F22] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <Unlock className="w-3 h-3" />
                      <span>
                        {lang === 'bn' ? 'পরিদর্শক কী দিয়ে ডিক্রিপ্ট' : 'Decrypt with Authority Key'}
                      </span>
                    </button>
                  </div>
                  {decryptedNote && (
                    <p className="text-xs text-[#1C1917] bg-white p-2.5 rounded border border-[#D6CEBE]">
                      <strong>{lang === 'bn' ? 'ডিক্রিপ্টকৃত তথ্য:' : 'Decrypted Lead:'}</strong>{' '}
                      {decryptedNote}
                    </p>
                  )}
                </div>
              )}

              <EvidenceMediaViewer
                mediaType={activeDossier.mediaType}
                mediaUrl={activeDossier.mediaUrl}
                mediaCaption={activeDossier.mediaCaption}
                batchNumber={activeDossier.batchNumber}
                expiryDate={activeDossier.expiryDate}
                compact
                lang={lang}
              />
            </div>

            {/* Official Authority Status & Verification Form */}
            <form
              onSubmit={handleCommitUpdate}
              className="bg-white border border-[#E2DCD3] rounded-xl p-6 sm:p-8 space-y-5"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#EBE6DF] pb-4">
                <div className="flex items-center gap-2">
                  <ClipboardCheck className="w-5 h-5 text-[#14532D] shrink-0" />
                  <h4 className="text-base font-serif-display font-semibold text-[#1C1917]">
                    {lang === 'bn'
                      ? 'সরকারি যাচাই প্রতিবেদন ও অবস্থা আপডেট লিপিবদ্ধ করুন'
                      : 'Record Official Authority Verification & Status Update'}
                  </h4>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleApplyQuickInspectionTemplate('confirm_violation')}
                    className="px-2.5 py-1 text-xs font-medium bg-[#EBE6DF] hover:bg-[#DFD8CE] text-[#1C1917] rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    {lang === 'bn' ? 'অভিযোগ প্রমাণিত' : 'Confirm Violation'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyQuickInspectionTemplate('quarantine')}
                    className="px-2.5 py-1 text-xs font-medium bg-[#EBE6DF] hover:bg-[#DFD8CE] text-[#1C1917] rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    {lang === 'bn' ? 'ল্যাব কোয়ারেন্টাইন' : 'Lab Quarantine'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyQuickInspectionTemplate('resolve')}
                    className="px-2.5 py-1 text-xs font-medium bg-[#EBE6DF] hover:bg-[#DFD8CE] text-[#1C1917] rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    {lang === 'bn' ? 'নিষ্পত্তি সম্পন্ন' : 'Mark Resolved'}
                  </button>
                </div>
              </div>

              {formError && (
                <p className="p-3 text-xs text-[#9A3412] bg-orange-50 border border-orange-200 rounded-lg">
                  {formError}
                </p>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label
                    htmlFor="authority-status-select"
                    className="block text-xs font-semibold text-[#1C1917] mb-1.5"
                  >
                    {lang === 'bn' ? 'অভিযোগের সরকারি অবস্থা *' : 'Official Dossier Status *'}
                  </label>
                  <select
                    id="authority-status-select"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as ObjectionStatus)}
                    className="w-full px-3 py-2 text-xs bg-[#FBF9F5] border border-[#D6CEBE] rounded-lg text-[#1C1917] font-medium"
                  >
                    {(Object.keys(statusLabels) as ObjectionStatus[]).map((st) => (
                      <option key={st} value={st}>
                        {statusLabels[st]}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="authority-severity-select"
                    className="block text-xs font-semibold text-[#1C1917] mb-1.5"
                  >
                    {lang === 'bn' ? 'ঝুঁকি মাত্রা *' : 'Assessed Severity Tier *'}
                  </label>
                  <select
                    id="authority-severity-select"
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value as ObjectionSeverity)}
                    className="w-full px-3 py-2 text-xs bg-[#FBF9F5] border border-[#D6CEBE] rounded-lg text-[#1C1917] font-medium"
                  >
                    {(Object.keys(severityLabels) as ObjectionSeverity[]).map((sev) => (
                      <option key={sev} value={sev}>
                        {severityLabels[sev]}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="authority-badge-input"
                    className="block text-xs font-semibold text-[#1C1917] mb-1.5"
                  >
                    {lang === 'bn'
                      ? 'পরিদর্শক / ম্যাজিস্ট্রেট ব্যাজ নম্বর *'
                      : 'Inspector Badge / Credential ID *'}
                  </label>
                  <input
                    id="authority-badge-input"
                    type="text"
                    value={authorityBadgeId}
                    onChange={(e) => setAuthorityBadgeId(e.target.value)}
                    placeholder="e.g. DGDA-INSP-8821"
                    className="w-full px-3 py-2 text-xs font-mono-tabular bg-[#FBF9F5] border border-[#D6CEBE] rounded-lg text-[#1C1917]"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="authority-note-input"
                  className="block text-xs font-semibold text-[#1C1917] mb-1.5"
                >
                  {lang === 'bn'
                    ? 'মাঠ পরিদর্শন ও ল্যাবরেটরি যাচাই প্রতিবেদন *'
                    : 'Official Field Inspection & Laboratory Verification Report *'}
                </label>
                <textarea
                  id="authority-note-input"
                  rows={3}
                  value={authorityNote}
                  onChange={(e) => setAuthorityNote(e.target.value)}
                  placeholder={
                    lang === 'bn'
                      ? 'ল্যাবরেটরি ব্যাচ পরীক্ষার ফলাফল, জব্দকৃত মজুদের সংখ্যা বা মাঠ পরিদর্শনের বিবরণ লিখুন...'
                      : 'Enter official laboratory batch assay results, stock seizure counts, or field inspection findings...'
                  }
                  className="w-full px-3.5 py-2.5 text-sm bg-[#FBF9F5] border border-[#D6CEBE] rounded-lg text-[#1C1917]"
                />
              </div>

              <div>
                <label
                  htmlFor="authority-enforcement-input"
                  className="block text-xs font-semibold text-[#1C1917] mb-1.5"
                >
                  {lang === 'bn'
                    ? 'ভ্রাম্যমাণ আদালতের দণ্ড বা জব্দ আদেশ'
                    : 'Regulatory Enforcement Action / Recall Directive'}
                </label>
                <input
                  id="authority-enforcement-input"
                  type="text"
                  value={enforcementAction}
                  onChange={(e) => setEnforcementAction(e.target.value)}
                  placeholder={
                    lang === 'bn'
                      ? 'যেমন: বাধ্যতামূলক ব্যাচ প্রত্যাহার আদেশ জারি এবং লাইসেন্স স্থগিত।'
                      : 'e.g. Mandatory Batch Recall Notice #DR-2026-119 issued; license suspended.'
                  }
                  className="w-full px-3.5 py-2.5 text-sm bg-[#FBF9F5] border border-[#D6CEBE] rounded-lg text-[#1C1917]"
                />
              </div>

              <div className="pt-2 flex items-center justify-between gap-4">
                <span className="text-xs text-[#57534E]">
                  {lang === 'bn' ? 'এই আদেশটি স্থায়ীভাবে ' : 'Updates are permanently appended to '}
                  <strong className="font-mono-tabular text-[#1C1917]">
                    {activeDossier.trackingId}
                  </strong>
                  {lang === 'bn' ? ' নথির অডিট লগে যুক্ত হবে।' : ' Chain-of-Custody log.'}
                </span>
                <button
                  type="submit"
                  disabled={isUpdating}
                  aria-label="Commit Official Update"
                  className="px-5 py-2.5 text-xs font-semibold text-white bg-[#14532D] rounded-lg hover:bg-[#0F3F22] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  {isUpdating
                    ? lang === 'bn'
                      ? 'সরকারি আপডেট সংরক্ষিত হচ্ছে...'
                      : 'Recording Official Update...'
                    : lang === 'bn'
                    ? 'সরকারি আপডেট নিশ্চিত করুন'
                    : 'Commit Official Update'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </section>
  );
};
