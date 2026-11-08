import React, { useState, useMemo } from 'react';
import {
  ObjectionRecord,
  ObjectionCategory,
  ObjectionStatus,
} from '../types/objection';
import {
  LanguageMode,
  UI_TEXT,
  CATEGORY_LABELS_I18N,
  STATUS_LABELS_I18N,
  SEVERITY_LABELS_I18N,
  DIRECTORATE_MAPPING,
  getLocalizedDossier,
  formatLocalizedExpiryStatus,
  toBengaliDigits,
} from '../i18n/translations';
import { calculateExpiryAnalysis } from '../utils/cryptoAndValidation';
import { EvidenceMediaViewer } from './EvidenceMediaViewer';
import {
  Search,
  ShieldCheck,
  Lock,
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileVideo,
  Image as ImageIcon,
  ArrowUpRight,
} from 'lucide-react';

interface PublicRegistrySectionProps {
  objections: ObjectionRecord[];
  onInspectDossier: (objection: ObjectionRecord) => void;
  onTrackObjection: (trackingId: string) => void;
  onVerifyInAuthorityDesk: (objectionId: string) => void;
  onFileNewClick: () => void;
  lang: LanguageMode;
}

type CategoryFilter = 'all' | ObjectionCategory;

export const PublicRegistrySection: React.FC<PublicRegistrySectionProps> = ({
  objections,
  onInspectDossier,
  onTrackObjection,
  onVerifyInAuthorityDesk,
  onFileNewClick,
  lang,
}) => {
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | ObjectionStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const t = UI_TEXT[lang];
  const catLabels = CATEGORY_LABELS_I18N[lang];
  const statusLabels = STATUS_LABELS_I18N[lang];
  const severityLabels = SEVERITY_LABELS_I18N[lang];

  const filterButtons: { id: CategoryFilter; label: string }[] = [
    { id: 'all', label: t.filterAll },
    { id: 'expired_medicine', label: t.filterMed },
    { id: 'expired_food', label: t.filterFood },
    { id: 'price_violation', label: t.filterPrice },
    { id: 'adulterated_goods', label: t.filterAdulterated },
    { id: 'public_safety', label: t.filterSafety },
  ];

  const filteredObjections = useMemo(() => {
    return objections.filter((rawItem) => {
      if (categoryFilter !== 'all' && rawItem.category !== categoryFilter) {
        return false;
      }
      if (statusFilter !== 'all' && rawItem.status !== statusFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const bnItem = getLocalizedDossier(rawItem, 'bn');
        const enItem = getLocalizedDossier(rawItem, 'en');
        const searchable = [
          rawItem.trackingId,
          rawItem.batchNumber,
          bnItem.title,
          bnItem.establishmentName,
          bnItem.jurisdiction,
          enItem.title,
          enItem.establishmentName,
          enItem.jurisdiction,
        ]
          .join(' ')
          .toLowerCase();
        return searchable.includes(q);
      }
      return true;
    });
  }, [objections, categoryFilter, statusFilter, searchQuery]);

  const getStatusIcon = (status: ObjectionStatus) => {
    switch (status) {
      case 'verified_violation':
      case 'enforcement_action':
        return <AlertTriangle className="w-3.5 h-3.5 text-[#C8102E] shrink-0" />;
      case 'resolved':
        return <CheckCircle2 className="w-3.5 h-3.5 text-[#006A4E] shrink-0" />;
      default:
        return <Clock className="w-3.5 h-3.5 text-[#1E3A8A] shrink-0" />;
    }
  };

  return (
    <section
      id="public-registry-section"
      aria-labelledby="registry-heading"
      className="max-w-[1360px] mx-auto px-6 py-12"
    >
      {/* Section Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-6 border-b border-[#CBD5E1]">
        <div>
          <p className="text-xs uppercase tracking-widest text-[#006A4E] font-semibold">
            {t.registryKicker}
          </p>
          <h2
            id="registry-heading"
            className="mt-1 text-2xl sm:text-3xl font-serif-display font-semibold text-[#0F172A]"
          >
            {t.registryTitle}
          </h2>
          <p className="mt-2 text-sm text-[#475569] max-w-2xl">{t.registrySubtitle}</p>
        </div>

        {/* Search & Status Filter Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative min-w-[260px]">
            <Search className="w-4 h-4 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              aria-label="Search objections by tracking ID, batch number, or establishment"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-[#CBD5E1] rounded-lg text-[#0F172A] placeholder:text-[#64748B] focus:outline-none focus:border-[#006A4E]"
            />
          </div>

          <label className="sr-only" htmlFor="registry-status-select">
            Filter by verification status
          </label>
          <select
            id="registry-status-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | ObjectionStatus)}
            className="px-3 py-2 text-xs bg-white border border-[#CBD5E1] rounded-lg text-[#0F172A] focus:outline-none focus:border-[#006A4E]"
          >
            <option value="all">
              {t.allStatuses} (
              {lang === 'bn' ? toBengaliDigits(objections.length) : objections.length})
            </option>
            <option value="submitted">{statusLabels.submitted}</option>
            <option value="under_investigation">{statusLabels.under_investigation}</option>
            <option value="verified_violation">{statusLabels.verified_violation}</option>
            <option value="enforcement_action">{statusLabels.enforcement_action}</option>
            <option value="resolved">{statusLabels.resolved}</option>
          </select>
        </div>
      </div>

      {/* Interactive Segmented Category Filter Bar (Functional Buttons) */}
      <div className="mt-6 flex items-center justify-between gap-4 flex-wrap">
        <div
          role="group"
          aria-label="Filter dossiers by regulatory category"
          className="flex items-center gap-1 p-1 bg-[#E2E8F0] rounded-lg overflow-x-auto max-w-full"
        >
          {filterButtons.map((btn) => {
            const active = categoryFilter === btn.id;
            return (
              <button
                key={btn.id}
                type="button"
                onClick={() => setCategoryFilter(btn.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  active
                    ? 'bg-[#006A4E] text-white shadow-xs font-semibold'
                    : 'text-[#334155] hover:text-[#0F172A] hover:bg-white/60'
                }`}
              >
                {btn.label}
              </button>
            );
          })}
        </div>

        <div className="text-xs text-[#475569] font-mono-tabular">
          {lang === 'bn'
            ? `মোট ${toBengaliDigits(objections.length)}টি সিলযুক্ত নথির মধ্যে ${toBengaliDigits(
                filteredObjections.length
              )}টি প্রদর্শিত হচ্ছে`
            : `Showing ${filteredObjections.length} of ${objections.length} sealed dossiers`}
        </div>
      </div>

      {/* Dossier List */}
      {filteredObjections.length === 0 ? (
        <div className="mt-8 p-12 text-center bg-white border border-[#CBD5E1] rounded-xl">
          <p className="font-serif-display text-lg text-[#0F172A]">
            {lang === 'bn'
              ? 'আপনার অনুসন্ধান বা ফিল্টারের সাথে কোনো অভিযোগ নথি মেলেনি।'
              : 'No public objection dossiers match your current filter criteria.'}
          </p>
          <div className="mt-4 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => {
                setCategoryFilter('all');
                setStatusFilter('all');
                setSearchQuery('');
              }}
              className="px-4 py-2 text-xs font-semibold text-[#0F172A] bg-[#E2E8F0] rounded-lg hover:bg-[#CBD5E1] transition-colors"
            >
              {lang === 'bn' ? 'ফিল্টার রিসেট করুন' : 'Reset Filters'}
            </button>
            <button
              type="button"
              onClick={onFileNewClick}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#006A4E] rounded-lg hover:bg-[#00523C] transition-colors"
            >
              {lang === 'bn' ? 'নতুন অভিযোগ দাখিল করুন' : 'File New Objection'}
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-6 divide-y divide-[#E2E8F0] border border-[#CBD5E1] bg-white rounded-xl overflow-hidden">
          {filteredObjections.map((rawItem) => {
            const item = getLocalizedDossier(rawItem, lang);
            const expiryInfo = calculateExpiryAnalysis(item.expiryDate, item.category);
            const expiryText = formatLocalizedExpiryStatus(expiryInfo.statusLabel, lang);
            const directorate = DIRECTORATE_MAPPING[item.category];
            return (
              <article
                key={item.id}
                data-testid={`dossier-row-${item.trackingId}`}
                className="p-6 hover:bg-[#F8FAFC] transition-colors"
              >
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  {/* Left & Center Dossier Details (8 cols) */}
                  <div className="lg:col-span-8">
                    {/* Clean unboxed inline metadata with typographic separators (Zero-Pill Discipline) */}
                    <div className="flex flex-wrap items-center gap-2 text-xs text-[#475569]">
                      <span className="font-mono-tabular font-bold text-[#006A4E]">
                        {item.trackingId}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="font-medium text-[#0F172A]">
                        {catLabels[item.category]}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="text-[#1E3A8A] font-medium">
                        {lang === 'bn' ? directorate.bn : directorate.en}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="inline-flex items-center gap-1 font-medium text-[#0F172A]">
                        {getStatusIcon(item.status)}
                        <span>{statusLabels[item.status]}</span>
                      </span>
                      <span aria-hidden="true">·</span>
                      <span
                        className={
                          item.severity === 'critical'
                            ? 'text-[#C8102E] font-semibold'
                            : 'text-[#475569]'
                        }
                      >
                        {severityLabels[item.severity]}
                      </span>
                      {item.isEncrypted && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="inline-flex items-center gap-1 text-[#1E3A8A]">
                            <Lock className="w-3 h-3" />
                            <span>
                              {lang === 'bn' ? 'এনক্রিপ্টেড' : 'AES-256-GCM'}
                            </span>
                          </span>
                        </>
                      )}
                    </div>

                    {/* Primary Dossier Headline */}
                    <h3 className="mt-2 text-lg font-serif-display font-semibold text-[#0F172A] leading-snug">
                      {item.title}
                    </h3>

                    {/* Establishment, Jurisdiction, Batch, and Expiry Metadata Line */}
                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#334155]">
                      <span>
                        <strong className="font-semibold text-[#0F172A]">
                          {lang === 'bn' ? 'প্রতিষ্ঠান:' : 'Establishment:'}
                        </strong>{' '}
                        {item.establishmentName}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>
                        <strong className="font-semibold text-[#0F172A]">
                          {lang === 'bn' ? 'এলাকা:' : 'Jurisdiction:'}
                        </strong>{' '}
                        {item.jurisdiction}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono-tabular">
                        <strong className="font-sans font-semibold text-[#0F172A]">
                          {lang === 'bn' ? 'ব্যাচ নম্বর:' : 'Batch/Lot:'}
                        </strong>{' '}
                        {item.batchNumber}
                      </span>
                      {item.expiryDate && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono-tabular text-[#C8102E] font-medium">
                            {lang === 'bn' ? 'মেয়াদ উত্তীর্ণের তারিখ:' : 'Printed Exp:'}{' '}
                            {item.expiryDate} ({expiryText})
                          </span>
                        </>
                      )}
                    </div>

                    {/* Factual Description Excerpt */}
                    <p className="mt-3 text-sm text-[#334155] leading-relaxed">
                      {item.description}
                    </p>

                    {/* Authority Verification / Enforcement Note if present */}
                    {(item.authorityNote || item.enforcementAction) && (
                      <div className="mt-4 p-3.5 bg-[#F1F5F9] border border-[#CBD5E1] rounded-lg text-xs text-[#0F172A]">
                        <div className="flex flex-wrap items-center gap-2 text-[#475569] mb-1">
                          <ShieldCheck className="w-3.5 h-3.5 text-[#006A4E]" />
                          <span className="font-semibold text-[#0F172A]">
                            {lang === 'bn'
                              ? 'সরকারি কর্তৃপক্ষের তদন্ত ও যাচাই প্রতিবেদন'
                              : 'Official Authority Verification'}
                          </span>
                          {item.authorityBadgeId && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="font-mono-tabular">
                                {lang === 'bn' ? 'পরিদর্শক ব্যাজ:' : 'Inspector Badge:'}{' '}
                                {item.authorityBadgeId}
                              </span>
                            </>
                          )}
                        </div>
                        {item.authorityNote && <p className="mt-1">{item.authorityNote}</p>}
                        {item.enforcementAction && (
                          <p className="mt-1.5 font-semibold text-[#006A4E]">
                            {lang === 'bn' ? 'সরকারি আদেশ:' : 'Directive:'} {item.enforcementAction}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Cryptographic Seal & Action Controls */}
                    <div className="mt-4 pt-3 border-t border-[#E2E8F0] flex flex-wrap items-center justify-between gap-4">
                      <div className="flex items-center gap-2 text-xs font-mono-tabular text-[#475569]">
                        <span>
                          {lang === 'bn' ? 'ডিজিটাল সিল:' : 'SHA-256:'}{' '}
                          {item.sha256Hash.slice(0, 18)}…
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>
                          {lang === 'bn' ? 'দাখিল:' : 'Filed'} {item.createdAt.slice(0, 10)}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2.5">
                        <button
                          type="button"
                          onClick={() => onTrackObjection(item.trackingId)}
                          aria-label={`Track status for ${item.trackingId}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-[#006A4E] bg-[#ECFDF5] border border-[#006A4E]/25 hover:bg-[#D1FAE5] rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                        >
                          <span>
                            {lang === 'bn' ? 'ট্র্যাক করুন:' : 'Track'} {item.trackingId}
                          </span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => onInspectDossier(rawItem)}
                          aria-label={`Inspect evidence for ${item.trackingId}`}
                          className="px-3 py-1.5 text-xs font-medium text-[#0F172A] border border-[#CBD5E1] hover:bg-[#F1F5F9] rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                        >
                          {lang === 'bn' ? 'বিস্তারিত নথি দেখুন' : 'Inspect Full Dossier'}
                        </button>

                        <button
                          type="button"
                          onClick={() => onVerifyInAuthorityDesk(item.id)}
                          aria-label={`Authority verify ${item.trackingId}`}
                          className="px-3 py-1.5 text-xs font-medium text-[#475569] hover:text-[#0F172A] underline underline-offset-4 whitespace-nowrap shrink-0 cursor-pointer"
                        >
                          {lang === 'bn' ? 'কর্তৃপক্ষ যাচাই' : 'Authority Review'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Compact Evidence Media Preview (4 cols) */}
                  <div className="lg:col-span-4">
                    <div className="flex items-center justify-between text-xs text-[#475569] mb-1.5">
                      <span className="inline-flex items-center gap-1 font-medium text-[#0F172A]">
                        {item.mediaType === 'video' ? (
                          <>
                            <FileVideo className="w-3.5 h-3.5 text-[#006A4E]" />
                            <span>
                              {lang === 'bn' ? 'ভিডিও প্রমাণ সংযুক্ত' : 'Video Evidence Attached'}
                            </span>
                          </>
                        ) : (
                          <>
                            <ImageIcon className="w-3.5 h-3.5 text-[#006A4E]" />
                            <span>
                              {lang === 'bn' ? 'আলোকচিত্র প্রমাণ' : 'Photographic Evidence'}
                            </span>
                          </>
                        )}
                      </span>
                      <span className="font-mono-tabular">{item.batchNumber}</span>
                    </div>
                    <EvidenceMediaViewer
                      mediaType={item.mediaType}
                      mediaUrl={item.mediaUrl}
                      mediaCaption={item.mediaCaption}
                      batchNumber={item.batchNumber}
                      expiryDate={item.expiryDate}
                      compact
                      lang={lang}
                    />
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
};
