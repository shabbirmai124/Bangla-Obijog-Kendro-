import React, { useState } from 'react';
import { HERO_ARCHIVE_IMAGE } from '../data/seedObjections';
import { ObjectionRecord } from '../types/objection';
import { Search, Shield, FileCheck2, Lock } from 'lucide-react';
import { ActiveTab } from './Header';
import { LanguageMode, UI_TEXT, toBengaliDigits } from '../i18n/translations';

interface HeroArchiveSectionProps {
  objections: ObjectionRecord[];
  onQuickTrack: (trackingId: string) => void;
  onNavigateTab: (tab: ActiveTab) => void;
  lang: LanguageMode;
}

export const HeroArchiveSection: React.FC<HeroArchiveSectionProps> = ({
  objections,
  onQuickTrack,
  onNavigateTab,
  lang,
}) => {
  const [trackingQuery, setTrackingQuery] = useState('');
  const [heroImgError, setHeroImgError] = useState(false);
  const t = UI_TEXT[lang];

  const totalCount = objections.length;
  const expiredMedFoodCount = objections.filter(
    (o) => o.category === 'expired_medicine' || o.category === 'expired_food'
  ).length;
  const verifiedOrActionCount = objections.filter(
    (o) =>
      o.status === 'verified_violation' ||
      o.status === 'enforcement_action' ||
      o.status === 'resolved'
  ).length;
  const encryptedCount = objections.filter((o) => o.isEncrypted).length;

  const formatNum = (n: number) => (lang === 'bn' ? toBengaliDigits(n) : String(n));

  const handleTrackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = trackingQuery.trim().toUpperCase();
    if (cleaned) {
      onQuickTrack(cleaned);
    } else {
      onQuickTrack('OBJ-2026-849201');
    }
  };

  return (
    <section className="border-b border-[#CBD5E1] bg-[#F8FAFC]">
      {/* Main 2-Column Split Hero */}
      <div className="max-w-[1360px] mx-auto px-6 py-10 lg:py-14">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
          {/* Left Column: Editorial Lead & Instant Tracking Lookup */}
          <div className="lg:col-span-7 flex flex-col justify-between">
            <div>
              <p className="text-xs uppercase tracking-widest text-[#006A4E] font-semibold">
                {t.heroKicker}
              </p>
              <h1
                className="mt-3 text-3xl sm:text-4xl lg:text-[2.65rem] font-serif-display font-semibold text-[#0F172A] leading-[1.2] tracking-tight"
                style={{ textWrap: 'balance' }}
              >
                {t.heroHeadline}
              </h1>
              <p className="mt-4 text-base text-[#334155] leading-relaxed max-w-2xl">
                {t.heroSubtitle}
              </p>

              {/* Quick Tracking Number Lookup Bar */}
              <form
                onSubmit={handleTrackSubmit}
                className="mt-7 p-4 bg-white border border-[#CBD5E1] rounded-xl shadow-2xs"
                aria-label="Quick Tracking Number Lookup"
              >
                <label
                  htmlFor="hero-tracking-input"
                  className="block text-xs font-semibold text-[#0F172A] mb-2"
                >
                  {t.quickTrackLabel}
                </label>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-[#64748B] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="hero-tracking-input"
                      type="text"
                      value={trackingQuery}
                      onChange={(e) => setTrackingQuery(e.target.value)}
                      placeholder={t.quickTrackPlaceholder}
                      className="w-full pl-10 pr-4 py-2.5 text-sm font-mono-tabular bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg text-[#0F172A] placeholder:text-[#64748B] focus:outline-none focus:border-[#006A4E]"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-5 py-2.5 text-xs font-semibold text-white bg-[#006A4E] rounded-lg hover:bg-[#00523C] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    {t.quickTrackBtn}
                  </button>
                </div>
                <div className="mt-2.5 flex flex-wrap items-center gap-2 text-xs text-[#475569]">
                  <span>{t.instantDemoLookup}</span>
                  {['OBJ-2026-849201', 'OBJ-2026-310489', 'OBJ-2026-774120'].map((sampleId, idx) => (
                    <React.Fragment key={sampleId}>
                      {idx > 0 && <span aria-hidden="true">·</span>}
                      <button
                        type="button"
                        onClick={() => {
                          setTrackingQuery(sampleId);
                          onQuickTrack(sampleId);
                        }}
                        className="font-mono-tabular text-[#006A4E] font-semibold hover:underline whitespace-nowrap cursor-pointer"
                      >
                        {sampleId}
                      </button>
                    </React.Fragment>
                  ))}
                </div>
              </form>
            </div>

            {/* Secondary Action Row */}
            <div className="mt-6 pt-5 border-t border-[#E2E8F0] flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => onNavigateTab('submit')}
                  className="px-4 py-2.5 text-xs font-semibold text-[#0F172A] bg-[#E2E8F0] hover:bg-[#CBD5E1] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  {t.btnFileWithMedia}
                </button>
                <button
                  type="button"
                  onClick={() => onNavigateTab('authority')}
                  className="px-4 py-2.5 text-xs font-semibold text-[#006A4E] bg-white border border-[#006A4E]/35 hover:bg-[#ECFDF5] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  {t.btnOpenAuthority}
                </button>
              </div>
              <span className="text-xs text-[#475569]">{t.heroLedgerNote}</span>
            </div>
          </div>

          {/* Right Column: Documentary Visual Frame */}
          <div className="lg:col-span-5 flex flex-col">
            <div className="flex-1 flex flex-col rounded-xl overflow-hidden border border-[#CBD5E1] bg-white">
              <div className="relative flex-1 min-h-[240px] bg-[#F1F5F9]">
                {!heroImgError ? (
                  <img
                    src={HERO_ARCHIVE_IMAGE}
                    alt={
                      lang === 'bn'
                        ? 'জাতীয় মান নিয়ন্ত্রণ পরীক্ষাগারে ঔষধ ও খাদ্য নিরাপত্তা নথি যাচাইরত পরিদর্শকবৃন্দ'
                        : 'Bangla Obijog Kendro national regulatory standards laboratory inspectors reviewing pharmaceutical and food safety batch dossiers'
                    }
                    referrerPolicy="no-referrer"
                    onError={() => setHeroImgError(true)}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center bg-[#F8FAFC] text-[#0F172A]">
                    <Shield className="w-10 h-10 text-[#006A4E] mb-3" />
                    <p className="font-serif-display text-lg">{t.brandTitle}</p>
                  </div>
                )}
              </div>
              <div className="bg-[#F8FAFC] border-t-2 border-t-[#006A4E] p-4 text-[#0F172A]">
                <p className="text-xs font-mono-tabular font-semibold uppercase tracking-wider text-[#006A4E]">
                  {lang === 'bn'
                    ? 'জাতীয় ঔষধ ও নিরাপদ খাদ্য তদারকি সেল'
                    : 'NATIONAL PHARMACOVIGILANCE & FOOD SAFETY CELL'}
                </p>
                <p className="text-sm text-[#334155] font-medium mt-1">
                  {lang === 'bn'
                    ? 'প্রতিটি মেয়াদোত্তীর্ণ ঔষধ ও খাদ্যের ব্যাচ নম্বর এবং মেয়াদের তারিখ সরাসরি ভ্রাম্যমাণ আদালত ও ল্যাবরেটরি যাচাইয়ের জন্য সংরক্ষিত।'
                    : 'Every batch expiration report is cross-indexed by lot number, manufacturer, and district jurisdiction for rapid field seizure.'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Full-Width 4-Column Tabular KPI Strip Below Hero Split */}
        <div className="mt-10 pt-8 border-t border-[#E2E8F0] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-4 bg-white border border-[#CBD5E1] rounded-lg">
            <div className="flex items-center justify-between text-xs text-[#475569]">
              <span>{t.kpiTotalTitle}</span>
              <FileCheck2 className="w-4 h-4 text-[#006A4E]" />
            </div>
            <p className="mt-2 text-2xl font-bold font-mono-tabular text-[#0F172A]">
              {formatNum(totalCount)}
            </p>
            <p className="mt-1 text-xs text-[#475569]">{t.kpiTotalSub}</p>
          </div>

          <div className="p-4 bg-white border border-[#CBD5E1] rounded-lg">
            <div className="flex items-center justify-between text-xs text-[#475569]">
              <span>{t.kpiMedFoodTitle}</span>
              <Shield className="w-4 h-4 text-[#C8102E]" />
            </div>
            <p className="mt-2 text-2xl font-bold font-mono-tabular text-[#C8102E]">
              {formatNum(expiredMedFoodCount)}
            </p>
            <p className="mt-1 text-xs text-[#475569]">{t.kpiMedFoodSub}</p>
          </div>

          <div className="p-4 bg-white border border-[#CBD5E1] rounded-lg">
            <div className="flex items-center justify-between text-xs text-[#475569]">
              <span>{t.kpiVerifiedTitle}</span>
              <FileCheck2 className="w-4 h-4 text-[#006A4E]" />
            </div>
            <p className="mt-2 text-2xl font-bold font-mono-tabular text-[#006A4E]">
              {formatNum(verifiedOrActionCount)}
            </p>
            <p className="mt-1 text-xs text-[#475569]">{t.kpiVerifiedSub}</p>
          </div>

          <div className="p-4 bg-white border border-[#CBD5E1] rounded-lg">
            <div className="flex items-center justify-between text-xs text-[#475569]">
              <span>{t.kpiEncryptedTitle}</span>
              <Lock className="w-4 h-4 text-[#1E3A8A]" />
            </div>
            <p className="mt-2 text-2xl font-bold font-mono-tabular text-[#0F172A]">
              {formatNum(encryptedCount)}
            </p>
            <p className="mt-1 text-xs text-[#475569]">{t.kpiEncryptedSub}</p>
          </div>
        </div>
      </div>
    </section>
  );
};
