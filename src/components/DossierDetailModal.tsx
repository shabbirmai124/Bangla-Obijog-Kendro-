import React from 'react';
import { ObjectionRecord } from '../types/objection';
import {
  LanguageMode,
  CATEGORY_LABELS_I18N,
  STATUS_LABELS_I18N,
  SEVERITY_LABELS_I18N,
  DIRECTORATE_MAPPING,
  getLocalizedDossier,
  formatLocalizedExpiryStatus,
} from '../i18n/translations';
import { calculateExpiryAnalysis } from '../utils/cryptoAndValidation';
import { EvidenceMediaViewer } from './EvidenceMediaViewer';
import { X, ShieldCheck, ArrowRight, Globe } from 'lucide-react';

interface DossierDetailModalProps {
  dossier: ObjectionRecord | null;
  onClose: () => void;
  onOpenInTracker: (trackingId: string) => void;
  onOpenInAuthorityDesk: (id: string) => void;
  lang: LanguageMode;
  onChangeLang?: (lang: LanguageMode) => void;
}

export const DossierDetailModal: React.FC<DossierDetailModalProps> = ({
  dossier: rawDossier,
  onClose,
  onOpenInTracker,
  onOpenInAuthorityDesk,
  lang,
  onChangeLang,
}) => {
  if (!rawDossier) return null;

  const dossier = getLocalizedDossier(rawDossier, lang);
  const expiryInfo = calculateExpiryAnalysis(dossier.expiryDate, dossier.category);
  const expiryText = formatLocalizedExpiryStatus(expiryInfo.statusLabel, lang);
  const catLabels = CATEGORY_LABELS_I18N[lang];
  const statusLabels = STATUS_LABELS_I18N[lang];
  const severityLabels = SEVERITY_LABELS_I18N[lang];
  const directorate = DIRECTORATE_MAPPING[dossier.category];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-dossier-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-xs overflow-y-auto"
    >
      <div className="relative w-full max-w-3xl bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl overflow-hidden my-auto max-h-[90vh] flex flex-col">
        {/* Top Modal Header */}
        <div className="px-6 py-4 bg-[#F1F5F9] border-b border-[#CBD5E1] flex items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono-tabular">
            <span className="font-bold text-[#006A4E]">{dossier.trackingId}</span>
            <span aria-hidden="true">·</span>
            <span className="text-[#0F172A] font-sans font-medium">
              {catLabels[dossier.category]}
            </span>
            <span aria-hidden="true">·</span>
            <span className="text-[#1E3A8A] font-sans font-medium">
              {lang === 'bn' ? directorate.bn : directorate.en}
            </span>
            <span aria-hidden="true">·</span>
            <span className="text-[#475569] font-sans">{statusLabels[dossier.status]}</span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onChangeLang && (
              <button
                type="button"
                onClick={() => onChangeLang(lang === 'bn' ? 'en' : 'bn')}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-[#006A4E] bg-white border border-[#CBD5E1] rounded-md hover:bg-[#ECFDF5] transition-colors cursor-pointer"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>{lang === 'bn' ? 'English' : 'বাংলা'}</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close dossier inspection modal"
              className="p-1.5 rounded-lg text-[#475569] hover:text-[#0F172A] hover:bg-[#E2E8F0] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          <div>
            <h3
              id="modal-dossier-title"
              className="text-xl sm:text-2xl font-serif-display font-semibold text-[#0F172A]"
            >
              {dossier.title}
            </h3>
            <p className="mt-1.5 text-xs text-[#475569]">
              {lang === 'bn' ? 'প্রতিষ্ঠান:' : 'Establishment:'}{' '}
              <strong className="text-[#0F172A]">{dossier.establishmentName}</strong> ·{' '}
              {lang === 'bn' ? 'এলাকা:' : 'Jurisdiction:'}{' '}
              <strong className="text-[#0F172A]">{dossier.jurisdiction}</strong> ·{' '}
              {lang === 'bn' ? 'ঝুঁকি:' : 'Severity:'}{' '}
              <strong className="text-[#0F172A]">{severityLabels[dossier.severity]}</strong>
            </p>
          </div>

          <dl className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-white border border-[#CBD5E1] rounded-lg text-xs">
            <div>
              <dt className="text-[#475569]">
                {lang === 'bn' ? 'ব্যাচ নম্বর' : 'Batch / Lot Number'}
              </dt>
              <dd className="font-mono-tabular font-semibold text-[#0F172A] mt-0.5">
                {dossier.batchNumber}
              </dd>
            </div>
            <div>
              <dt className="text-[#475569]">
                {lang === 'bn' ? 'মেয়াদ উত্তীর্ণের তারিখ' : 'Printed Expiry Date'}
              </dt>
              <dd className="font-mono-tabular font-semibold text-[#C8102E] mt-0.5">
                {dossier.expiryDate || (lang === 'bn' ? 'উল্লেখ নেই' : 'Not specified')} (
                {expiryText})
              </dd>
            </div>
            <div>
              <dt className="text-[#475569]">
                {lang === 'bn' ? 'অভিযোগকারীর ছদ্মনাম' : 'Filing Citizen Alias'}
              </dt>
              <dd className="font-semibold text-[#0F172A] mt-0.5">{dossier.reporterAlias}</dd>
            </div>
          </dl>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#475569] mb-1.5">
              {lang === 'bn' ? 'অভিযোগের বিস্তারিত বিবরণ' : 'Factual Objection Statement'}
            </h4>
            <p className="text-sm text-[#0F172A] leading-relaxed bg-white p-4 border border-[#CBD5E1] rounded-lg">
              {dossier.description}
            </p>
          </div>

          <EvidenceMediaViewer
            mediaType={dossier.mediaType}
            mediaUrl={dossier.mediaUrl}
            mediaCaption={dossier.mediaCaption}
            batchNumber={dossier.batchNumber}
            expiryDate={dossier.expiryDate}
            lang={lang}
          />

          {(dossier.authorityNote || dossier.enforcementAction) && (
            <div className="p-4 bg-[#ECFDF5] border border-[#006A4E]/30 rounded-lg space-y-1.5 text-xs">
              <div className="flex items-center gap-2 font-semibold text-[#006A4E]">
                <ShieldCheck className="w-4 h-4" />
                <span>
                  {lang === 'bn'
                    ? `সরকারি যাচাই প্রতিবেদন (${dossier.authorityBadgeId || 'পরিদর্শক'})`
                    : `Official Authority Verification (${dossier.authorityBadgeId || 'Inspectorate'})`}
                </span>
              </div>
              {dossier.authorityNote && <p className="text-[#0F172A]">{dossier.authorityNote}</p>}
              {dossier.enforcementAction && (
                <p className="font-semibold text-[#006A4E]">
                  {lang === 'bn' ? 'সরকারি আদেশ:' : 'Directive:'} {dossier.enforcementAction}
                </p>
              )}
            </div>
          )}

          <div className="p-3.5 bg-[#F8FAFC] border border-[#CBD5E1] text-[#0F172A] rounded-lg text-xs font-mono-tabular">
            <span className="text-[#475569] block mb-0.5">
              {lang === 'bn'
                ? 'ডিজিটাল অখণ্ডতা হ্যাশ (SHA-256):'
                : 'SHA-256 INTEGRITY DIGEST:'}
            </span>
            <span className="text-[#006A4E] font-semibold break-all">{dossier.sha256Hash}</span>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-[#F1F5F9] border-t border-[#CBD5E1] flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => {
              const id = dossier.id;
              onClose();
              onOpenInAuthorityDesk(id);
            }}
            className="px-3.5 py-2 text-xs font-semibold text-[#0F172A] bg-white border border-[#CBD5E1] rounded-lg hover:bg-[#E2E8F0] transition-colors cursor-pointer"
          >
            {lang === 'bn' ? 'কর্তৃপক্ষ ডেস্কে যাচাই করুন' : 'Verify in Authority Desk'}
          </button>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-medium text-[#475569] hover:text-[#0F172A] cursor-pointer"
            >
              {lang === 'bn' ? 'বন্ধ করুন' : 'Close'}
            </button>
            <button
              type="button"
              onClick={() => {
                const code = dossier.trackingId;
                onClose();
                onOpenInTracker(code);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#006A4E] rounded-lg hover:bg-[#00523C] transition-colors cursor-pointer"
            >
              <span>
                {lang === 'bn'
                  ? 'সম্পূর্ণ ট্র্যাকিং ও ডিক্রিপ্ট খুলুন'
                  : 'Open Full Tracker & Decrypt'}
              </span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
