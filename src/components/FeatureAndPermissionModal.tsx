import React, { useState } from 'react';
import { LanguageMode, toBengaliDigits } from '../i18n/translations';
import {
  ShieldCheck,
  Lock,
  Unlock,
  X,
  BookOpen,
  KeyRound,
  FileText,
  Camera,
  CheckCircle2,
  Copy,
  Globe,
  UserCheck,
} from 'lucide-react';

interface FeatureAndPermissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: LanguageMode;
  onChangeLang: (lang: LanguageMode) => void;
  requireOwnerPermission: boolean;
  onToggleRequireOwnerPermission: (val: boolean) => void;
  ownerPermissionCode: string;
  currentUserEmail?: string | null;
  onNavigateToSubmit: () => void;
}

export const FeatureAndPermissionModal: React.FC<FeatureAndPermissionModalProps> = ({
  isOpen,
  onClose,
  lang,
  onChangeLang,
  requireOwnerPermission,
  onToggleRequireOwnerPermission,
  ownerPermissionCode,
  currentUserEmail,
  onNavigateToSubmit,
}) => {
  const [showBilingualDualView, setShowBilingualDualView] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  if (!isOpen) return null;

  const isOwnerAuthenticated = currentUserEmail === 'mdshabbirmia516@gmail.com';

  const features = [
    {
      numBn: '০১',
      numEn: '01',
      titleBn: 'সকল প্রকার জনসমস্যা ও অভিযোগ দাখিল ব্যবস্থা',
      titleEn: 'All-Problem Public Objection & Grievance Submission',
      descBn:
        'মেয়াদোত্তীর্ণ ঔষধ, মেয়াদোত্তীর্ণ ও ভেজাল খাদ্য, নকল পণ্য, অতিরিক্ত মূল্য আদায়, রাস্তাঘাট-পানি-বিদ্যুৎ অবকাঠামোগত সমস্যা এবং যেকোনো জনদুর্ভোগের বিরুদ্ধে নাগরিকরা সহজেই অভিযোগ দাখিল করতে পারেন।',
      descEn:
        'Citizens can submit objections regarding any issue in the country: expired medicine, unsafe/expired food, counterfeit goods, price gouging, civic/utility infrastructure hazards, and general public safety problems.',
    },
    {
      numBn: '০২',
      numEn: '02',
      titleBn: 'ছবি, ভিডিও, অভিযোগকারীর বয়স ও বিস্তারিত বিবরণ ফর্ম',
      titleEn: 'User-Friendly Form with Image, Video, Reporter Age & Details',
      descBn:
        'ব্যবহারকারী-বান্ধব ফর্মে অভিযোগকারীর নাম/ছদ্মনাম, বয়স (বছর), ঘটনার বিস্তারিত বিবরণ, প্রতিষ্ঠানের নাম, জেলা/থানা এবং সরাসরি ক্যামেরা বা গ্যালারি থেকে ছবি ও ভিডিও প্রমাণ সংযুক্ত করার সুবিধা রয়েছে।',
      descEn:
        'Includes dedicated fields for Reporter Alias, Reporter Age (Years), Establishment, Jurisdiction, Batch/Reference Number, Detailed Statement, and instant Photo/Video evidence upload with live preview.',
    },
    {
      numBn: '০৩',
      numEn: '03',
      titleBn: 'স্বয়ংক্রিয় র‍্যান্ডম অনন্য ট্র্যাকিং নম্বর ও সরকারি রসিদ',
      titleEn: 'Cryptographic Random Unique Tracking Number & Official Receipt',
      descBn:
        'প্রতিটি অভিযোগ দাখিলের সাথে সাথে ব্রাউজারের ক্রিপ্টোগ্রাফিক র‍্যান্ডম জেনারেটরের মাধ্যমে একটি অনন্য ট্র্যাকিং নম্বর (OBJ-2026-XXXXXX) তৈরি হয় এবং প্রিন্টযোগ্য সরকারি ডিজিটাল রসিদ প্রদান করা হয়।',
      descEn:
        'Immediately upon submission, a cryptographically random unique Tracking ID (OBJ-2026-XXXXXX) is generated alongside a printable official acknowledgment receipt and downloadable JSON certificate.',
    },
    {
      numBn: '০৪',
      numEn: '04',
      titleBn: 'এসএইচএ-২৫৬ ডিজিটাল সিল ও এইএস-২৫৬-জিসিএম এনক্রিপশন',
      titleEn: 'SHA-256 Evidentiary Seal & Client-Side AES-256-GCM Encryption',
      descBn:
        'দাখিলকৃত তথ্য যাতে কেউ পরিবর্তন করতে না পারে সেজন্য ৬৪-ক্যারেক্টার এসএইচএ-২৫৬ হ্যাশ সিল তৈরি হয় এবং গোপনীয় সাক্ষ্য ১০০,০০০ ইটারেশন পিবিকেডিএফ২ ও এইএস-২৫৬-জিসিএম প্রযুক্তিতে ব্রাউজারেই এনক্রিপ্ট হয়।',
      descEn:
        'Every dossier is anchored with a 64-character SHA-256 integrity hash. Confidential whistleblower leads are encrypted in-browser using Web Crypto PBKDF2 (100,000 iterations) + AES-256-GCM.',
    },
    {
      numBn: '০৫',
      numEn: '05',
      titleBn: 'বিশুদ্ধ একক ভাষা মোড (বাংলা অথবা ইংরেজি) ও নিজস্ব ফন্ট',
      titleEn: 'Pure Single-Language Mode (Bangla or English) & Typography',
      descBn:
        'বাংলা নির্বাচন করলে সম্পূর্ণ ওয়েবসাইট শতভাগ বিশুদ্ধ বাংলায় (নোটো সেরিফ বেঙ্গলি ও হিন্দ শিলিগুড়ি ফন্টে) এবং ইংরেজি নির্বাচন করলে শতভাগ বিশুদ্ধ ইংরেজিতে প্রদর্শিত হয়।',
      descEn:
        'Selecting Bangla renders 100% pure Bengali with Noto Serif Bengali & Hind Siliguri typography; selecting English renders 100% pure English with Fraunces & Plus Jakarta Sans typography.',
    },
    {
      numBn: '০৬',
      numEn: '06',
      titleBn: 'মালিকের অনুমতি ও সর্বস্বত্ব সংরক্ষণ নিরাপত্তা গেট',
      titleEn: 'Strict Owner Permission Lock & Zero-Trust Access Control',
      descBn:
        'এই পোর্টালের প্রধান মালিক ও নিয়ন্ত্রক হলেন mdshabbirmia516@gmail.com। মালিকের অনুমতি ছাড়া কেউ যাতে অননুমোদিত পরিবর্তন বা ব্যবহার করতে না পারে সেজন্য ফায়ারস্টোর সিকিউরিটি রুলস এবং অনুমতি কোড লক যুক্ত রয়েছে।',
      descEn:
        'Exclusively owned and administered by mdshabbirmia516@gmail.com. Protected by Zero-Trust Firestore Security Rules and an interactive Owner Permission Access Gate preventing unauthorized usage.',
    },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="feature-permission-modal-title"
      data-testid="feature-permission-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-xs overflow-y-auto"
    >
      <div className="bg-[#FBF9F5] border-2 border-[#14532D] rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-xl text-[#1C1917]">
        {/* Top Modal Header */}
        <div className="sticky top-0 z-10 bg-[#F3EFE6] border-b border-[#E2DCD3] px-6 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <BookOpen className="w-5 h-5 text-[#14532D] shrink-0" />
            <div>
              <h2
                id="feature-permission-modal-title"
                className="text-lg sm:text-xl font-serif-display font-bold text-[#14532D]"
              >
                {lang === 'bn'
                  ? 'বৈশিষ্ট্য নির্দেশিকা, গিটহাব ডকুমেন্টেশন ও মালিকের অনুমতি নীতিমালা'
                  : 'Complete Feature Guide, GitHub Documentation & Owner Permission Policy'}
              </h2>
              <p className="text-xs text-[#57534E]">
                {lang === 'bn'
                  ? 'বাংলা অভিযোগ কেন্দ্র — সর্বস্বত্ব সংরক্ষিত ও অনুমোদিত নিয়ন্ত্রণ কেন্দ্র'
                  : 'Bangla Obijog Kendro — All Rights Reserved & Authorized Access Control'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Toggle Dual Bilingual View for GitHub Documentation inspection */}
            <button
              type="button"
              onClick={() => setShowBilingualDualView((v) => !v)}
              className="px-3 py-1.5 text-xs font-semibold bg-white border border-[#D6CEBE] rounded-lg hover:bg-[#EBE6DF] transition-colors cursor-pointer"
            >
              {showBilingualDualView
                ? lang === 'bn'
                  ? 'একক ভাষা ভিউ'
                  : 'Single Language View'
                : lang === 'bn'
                ? 'বাংলা ও ইংরেজি একসাথে দেখুন'
                : 'Show Bangla + English Together'}
            </button>

            <div className="inline-flex items-center gap-1 p-0.5 bg-[#E2DCD3] rounded-md border border-[#D6CEBE]">
              <Globe className="w-3.5 h-3.5 text-[#14532D] ml-1.5" />
              <button
                type="button"
                onClick={() => onChangeLang('bn')}
                className={`px-2.5 py-1 text-xs font-semibold rounded cursor-pointer ${
                  lang === 'bn' ? 'bg-[#14532D] text-white' : 'text-[#1C1917]'
                }`}
              >
                বাংলা
              </button>
              <button
                type="button"
                onClick={() => onChangeLang('en')}
                className={`px-2.5 py-1 text-xs font-semibold rounded cursor-pointer ${
                  lang === 'en' ? 'bg-[#14532D] text-white' : 'text-[#1C1917]'
                }`}
              >
                English
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close Feature & Permission Guide"
              className="p-1.5 text-[#57534E] hover:text-[#1C1917] rounded-lg hover:bg-[#E2DCD3] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Section 1: Owner Permission & Access Control Gate */}
          <div
            data-testid="owner-permission-card"
            className="p-5 bg-white border-2 border-[#14532D] rounded-xl space-y-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#EBE6DF] pb-4">
              <div>
                <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#14532D] uppercase tracking-wider">
                  <ShieldCheck className="w-4 h-4" />
                  <span>
                    {lang === 'bn'
                      ? 'মালিকানা সনদ ও অনুমতি নিয়ন্ত্রণ (অননুমোদিত ব্যবহার নিষিদ্ধ)'
                      : 'Owner License & Permission Gate (Unauthorized Use Prohibited)'}
                  </span>
                </div>
                <h3 className="mt-1 text-base sm:text-lg font-serif-display font-bold text-[#1C1917]">
                  {lang === 'bn'
                    ? 'প্রধান মালিক ও প্রশাসক: mdshabbirmia516@gmail.com'
                    : 'Sole Owner & Master Administrator: mdshabbirmia516@gmail.com'}
                </h3>
                <p className="mt-1 text-xs text-[#57534E] leading-relaxed">
                  {lang === 'bn'
                    ? 'মালিকের (mdshabbirmia516@gmail.com) পূর্বানুমতি ব্যতীত এই ওয়েবসাইট, সোর্স কোড বা ডাটাবেস বাণিজ্যিক বা অননুমোদিত কাজে ব্যবহার, কপি বা পরিবর্তন করা সম্পূর্ণ নিষিদ্ধ।'
                    : 'No person or entity may deploy, modify, redistribute, or execute administrative actions on this portal without explicit permission from the owner (mdshabbirmia516@gmail.com).'}
                </p>
              </div>

              <div className="flex flex-col items-start sm:items-end gap-2 shrink-0">
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold ${
                    requireOwnerPermission
                      ? 'bg-[#9A3412] text-white'
                      : 'bg-[#14532D] text-white'
                  }`}
                >
                  {requireOwnerPermission ? (
                    <>
                      <Lock className="w-3.5 h-3.5" />
                      <span>
                        {lang === 'bn'
                          ? 'কঠোর অনুমতি লক সক্রিয়'
                          : 'Strict Permission Lock Active'}
                      </span>
                    </>
                  ) : (
                    <>
                      <Unlock className="w-3.5 h-3.5" />
                      <span>
                        {lang === 'bn'
                          ? 'অনুমোদিত নাগরিক দাখিল উন্মুক্ত'
                          : 'Authorized Public Filing Active'}
                      </span>
                    </>
                  )}
                </span>

                {isOwnerAuthenticated && (
                  <span className="inline-flex items-center gap-1 text-xs text-[#14532D] font-semibold">
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>
                      {lang === 'bn' ? 'মালিক সেশন যাচাইকৃত' : 'Owner Session Verified'}
                    </span>
                  </span>
                )}
              </div>
            </div>

            {/* Interactive Owner Permission Controls */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center bg-[#F3EFE6] p-4 rounded-lg border border-[#D6CEBE]">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-[#1C1917] flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-[#14532D]" />
                  <span>
                    {lang === 'bn'
                      ? 'মালিক অনুমোদিত অ্যাক্সেস কোড:'
                      : 'Owner Authorization Passcode:'}
                  </span>
                  <code className="font-mono-tabular font-bold text-[#14532D] bg-white px-2 py-0.5 rounded border border-[#D6CEBE]">
                    {ownerPermissionCode}
                  </code>
                </p>
                <p className="text-xs text-[#57534E]">
                  {lang === 'bn'
                    ? 'কঠোর অনুমতি লক চালু থাকলে শুধুমাত্র এই কোড অথবা মালিকের ইমেইল দ্বারা ফর্ম দাখিল করা যাবে।'
                    : 'When Strict Permission Lock is enabled, users must enter this owner passcode to submit or modify records.'}
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText(ownerPermissionCode);
                    setCopiedCode(true);
                    setTimeout(() => setCopiedCode(false), 2000);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white border border-[#D6CEBE] rounded-lg hover:bg-[#EBE6DF] transition-colors cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>
                    {copiedCode
                      ? lang === 'bn'
                        ? 'কোড কপি হয়েছে'
                        : 'Passcode Copied'
                      : lang === 'bn'
                      ? 'অনুমতি কোড কপি করুন'
                      : 'Copy Passcode'}
                  </span>
                </button>

                <button
                  type="button"
                  data-testid="toggle-owner-permission-lock"
                  onClick={() => onToggleRequireOwnerPermission(!requireOwnerPermission)}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                    requireOwnerPermission
                      ? 'bg-[#14532D] text-white hover:bg-[#0F3F22]'
                      : 'bg-[#9A3412] text-white hover:bg-[#7C2D12]'
                  }`}
                >
                  {requireOwnerPermission ? (
                    <>
                      <Unlock className="w-3.5 h-3.5" />
                      <span>
                        {lang === 'bn'
                          ? 'সর্বসাধারণের জন্য উন্মুক্ত করুন'
                          : 'Unlock for Public Citizens'}
                      </span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-3.5 h-3.5" />
                      <span>
                        {lang === 'bn'
                          ? 'মালিকের অনুমতি লক চালু করুন'
                          : 'Enable Strict Owner Lock'}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Section 2: Detailed Feature Explanation (Single-Language or Bilingual Side-by-Side) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base sm:text-lg font-serif-display font-bold text-[#1C1917]">
                {showBilingualDualView
                  ? 'বিস্তারিত বৈশিষ্ট্যসমূহ (বাংলা ও English Feature Explanation)'
                  : lang === 'bn'
                  ? 'বাংলা অভিযোগ কেন্দ্রের সম্পূর্ণ বৈশিষ্ট্য ও সুবিধাসমূহ'
                  : 'Complete Features & Security Capabilities of Bangla Obijog Kendro'}
              </h3>
              <span className="text-xs font-mono-tabular text-[#14532D] font-semibold">
                {lang === 'bn'
                  ? `মোট ${toBengaliDigits(features.length)}টি প্রধান বৈশিষ্ট্য`
                  : `${features.length} Core Modules`}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {features.map((feat) => (
                <div
                  key={feat.numEn}
                  className="p-4 bg-white border border-[#E2DCD3] rounded-xl space-y-2"
                >
                  <div className="flex items-center justify-between text-xs font-mono-tabular font-bold text-[#14532D]">
                    <span>{lang === 'bn' ? `বৈশিষ্ট্য ${feat.numBn}` : `MODULE ${feat.numEn}`}</span>
                    <CheckCircle2 className="w-4 h-4 text-[#14532D]" />
                  </div>

                  {showBilingualDualView ? (
                    <div className="space-y-2">
                      <div>
                        <h4 className="text-sm font-serif-display font-bold text-[#1C1917]">
                          {feat.titleBn}
                        </h4>
                        <p className="text-xs text-[#44403C] leading-relaxed mt-0.5">
                          {feat.descBn}
                        </p>
                      </div>
                      <div className="pt-2 border-t border-[#EBE6DF]">
                        <h4 className="text-sm font-serif-display font-bold text-[#14532D]">
                          {feat.titleEn}
                        </h4>
                        <p className="text-xs text-[#57534E] leading-relaxed mt-0.5">
                          {feat.descEn}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <h4 className="text-sm font-serif-display font-bold text-[#1C1917]">
                        {lang === 'bn' ? feat.titleBn : feat.titleEn}
                      </h4>
                      <p className="text-xs text-[#44403C] leading-relaxed mt-1">
                        {lang === 'bn' ? feat.descBn : feat.descEn}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Ready-to-Copy Name & Description Text (GitHub & Test Submission) */}
          <div className="p-5 bg-white border border-[#E2DCD3] rounded-xl space-y-3">
            <h3 className="text-sm font-serif-display font-bold text-[#14532D]">
              {lang === 'bn'
                ? 'কপি করার জন্য প্রস্তুত নাম ও বিবরণ (গিটহাব ও টেস্ট টেক্সট)'
                : 'Ready-to-Copy Project Name & Description Text (GitHub & Test)'}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-[#FBF9F5] border border-[#D6CEBE] rounded-lg space-y-1.5">
                <span className="font-semibold text-[#57534E] block">
                  {lang === 'bn'
                    ? 'প্রকল্প ও রিপোজিটরির নাম (Name):'
                    : 'Project & Repository Name:'}
                </span>
                <p className="font-mono-tabular font-bold text-[#1C1917] select-all">
                  {lang === 'bn'
                    ? 'বাংলা অভিযোগ কেন্দ্র (bangla-obijog-kendro)'
                    : 'Bangla Obijog Kendro (bangla-obijog-kendro)'}
                </p>
              </div>

              <div className="p-3 bg-[#FBF9F5] border border-[#D6CEBE] rounded-lg space-y-1.5">
                <span className="font-semibold text-[#57534E] block">
                  {lang === 'bn'
                    ? 'টেস্ট অভিযোগকারীর নাম ও বয়স:'
                    : 'Test Complainant Name & Age:'}
                </span>
                <p className="font-semibold text-[#1C1917] select-all">
                  {lang === 'bn'
                    ? 'নাম: সচেতন নাগরিক ৭০৪ · বয়স: ২৯ বছর'
                    : 'Name: Citizen Observer #704 · Age: 29 Years'}
                </p>
              </div>
            </div>

            <div className="p-3 bg-[#FBF9F5] border border-[#D6CEBE] rounded-lg space-y-1.5 text-xs">
              <span className="font-semibold text-[#57534E] block">
                {lang === 'bn' ? 'সংক্ষিপ্ত বিবরণ (Description):' : 'Short Description:'}
              </span>
              <p className="text-[#1C1917] leading-relaxed select-all">
                {lang === 'bn'
                  ? 'বাংলা অভিযোগ কেন্দ্র হলো একটি ক্রিপ্টোগ্রাফিক জাতীয় জনঅভিযোগ ও নিয়ন্ত্রক যাচাই বাতায়ন, যেখানে নাগরিকরা মেয়াদোত্তীর্ণ ঔষধ, ভেজাল খাদ্য, অতিরিক্ত মূল্য ও দেশের যেকোনো জনসমস্যার বিরুদ্ধে ছবি, ভিডিও, বয়স ও বিস্তারিত বিবরণসহ অভিযোগ দাখিল করতে পারেন এবং র‍্যান্ডম অনন্য ট্র্যাকিং নম্বরের মাধ্যমে অগ্রগতি ট্র্যাক করতে পারেন। (মালিকানা সংরক্ষিত: mdshabbirmia516@gmail.com)'
                  : 'Bangla Obijog Kendro is a cryptographic national public objection and regulatory verification portal where citizens can submit any problem—expired medicine, unsafe food, price gouging, or public hazards—with photo/video evidence, reporter age, and full details, and track authority verification via a random unique Tracking Number. (Owned by: mdshabbirmia516@gmail.com)'}
              </p>
            </div>
          </div>

          {/* Section 4: Quick Action Footer */}
          <div className="p-4 bg-[#F3EFE6] border border-[#D6CEBE] rounded-xl flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2.5 text-xs text-[#1C1917]">
              <FileText className="w-4 h-4 text-[#14532D] shrink-0" />
              <span>
                {lang === 'bn'
                  ? 'গিটহাব রিপোজিটরির জন্য সম্পূর্ণ দ্বিভাষিক (বাংলা ও ইংরেজি) README.md ফাইল যুক্ত করা হয়েছে।'
                  : 'Complete bilingual (Bangla & English) README.md documentation is included in the project root for GitHub.'}
              </span>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onNavigateToSubmit();
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#14532D] rounded-lg hover:bg-[#0F3F22] transition-colors cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>
                  {lang === 'bn'
                    ? 'ছবি, বয়স ও বিবরণসহ অভিযোগ ফর্ম খুলুন'
                    : 'Open Objection Form (Image, Age & Details)'}
                </span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 text-xs font-semibold text-[#1C1917] bg-white border border-[#D6CEBE] rounded-lg hover:bg-[#EBE6DF] transition-colors cursor-pointer"
              >
                {lang === 'bn' ? 'বন্ধ করুন' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
