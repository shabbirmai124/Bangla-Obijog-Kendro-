import {
  ObjectionCategory,
  ObjectionRecord,
  ObjectionSeverity,
  ObjectionStatus,
} from '../types/objection';

export type LanguageMode = 'bn' | 'en';

const EN_TO_BN_DIGITS: Record<string, string> = {
  '0': '০',
  '1': '১',
  '2': '২',
  '3': '৩',
  '4': '৪',
  '5': '৫',
  '6': '৬',
  '7': '৭',
  '8': '৮',
  '9': '৯',
};

export function toBengaliDigits(val: string | number): string {
  return String(val).replace(/[0-9]/g, (d) => EN_TO_BN_DIGITS[d] || d);
}

export const DIRECTORATE_MAPPING: Record<
  ObjectionCategory,
  { code: string; bn: string; en: string }
> = {
  expired_medicine: {
    code: 'DGDA',
    bn: 'ঔষধ প্রশাসন অধিদপ্তর',
    en: 'Directorate General of Drug Administration (DGDA)',
  },
  expired_food: {
    code: 'BFSA / BSTI',
    bn: 'বাংলাদেশ নিরাপদ খাদ্য কর্তৃপক্ষ ও বিএসটিআই',
    en: 'Bangladesh Food Safety Authority & BSTI',
  },
  adulterated_goods: {
    code: 'DNCRP / MAGISTRACY',
    bn: 'জাতীয় ভোক্তা অধিকার সংরক্ষণ অধিদপ্তর ও ভ্রাম্যমাণ আদালত',
    en: 'Consumer Rights Directorate (DNCRP) & Mobile Court',
  },
  price_violation: {
    code: 'DNCRP',
    bn: 'জাতীয় ভোক্তা অধিকার সংরক্ষণ অধিদপ্তর',
    en: 'Directorate of National Consumer Rights Protection (DNCRP)',
  },
  civic_infrastructure: {
    code: 'LGD / CITY CORP',
    bn: 'স্থানীয় সরকার ও পৌর তদারকি অধিদপ্তর',
    en: 'Local Government & Municipal Oversight Division',
  },
  public_safety: {
    code: 'DGHS / DOE',
    bn: 'জনস্বাস্থ্য ও পরিবেশ অধিদপ্তর',
    en: 'Directorate of Public Health & Safety',
  },
};

export const CATEGORY_LABELS_I18N: Record<
  LanguageMode,
  Record<ObjectionCategory, string>
> = {
  bn: {
    expired_medicine: 'মেয়াদোত্তীর্ণ ঔষধ ও ফার্মাসিউটিক্যালস',
    expired_food: 'মেয়াদোত্তীর্ণ খাদ্য ও দুগ্ধজাত পণ্য',
    adulterated_goods: 'ভেজাল ও নকল পণ্য সামগ্রী',
    price_violation: 'অতিরিক্ত মূল্য আদায় ও কৃত্রিম সংকট',
    civic_infrastructure: 'নাগরিক সেবা ও অবকাঠামোগত ত্রুটি',
    public_safety: 'জনস্বাস্থ্য ও পরিবেশগত ঝুঁকি',
  },
  en: {
    expired_medicine: 'Expired Pharmaceuticals & Medicine',
    expired_food: 'Expired Food & Dairy Products',
    adulterated_goods: 'Counterfeit & Adulterated Goods',
    price_violation: 'Essential Goods Price Gouging',
    civic_infrastructure: 'Civic & Utility Infrastructure Hazard',
    public_safety: 'Public Health & Sanitation Hazard',
  },
};

export const STATUS_LABELS_I18N: Record<
  LanguageMode,
  Record<ObjectionStatus, string>
> = {
  bn: {
    submitted: 'দাখিলকৃত ও ক্রিপ্টোগ্রাফিক সিলযুক্ত',
    under_investigation: 'কর্তৃপক্ষের তদন্ত ও ল্যাব পরীক্ষায়',
    verified_violation: 'প্রমাণিত আইন লঙ্ঘন',
    enforcement_action: 'ভ্রাম্যমাণ আদালত ও শাস্তিমূলক ব্যবস্থা গৃহীত',
    resolved: 'নিষ্পত্তিকৃত ও প্রতিকার সম্পন্ন',
    dismissed: 'পর্যালোচিত — অভিযোগ প্রমাণিত হয়নি',
  },
  en: {
    submitted: 'Submitted & Cryptographically Sealed',
    under_investigation: 'Under Authority & Lab Investigation',
    verified_violation: 'Verified Regulatory Violation',
    enforcement_action: 'Enforcement / Mobile Court Action Issued',
    resolved: 'Resolved & Remediated',
    dismissed: 'Reviewed — No Violation Found',
  },
};

export const SEVERITY_LABELS_I18N: Record<
  LanguageMode,
  Record<ObjectionSeverity, string>
> = {
  bn: {
    routine: 'সাধারণ পর্যালোচনা',
    elevated: 'সতর্কতামূলক গুরুত্ব',
    high: 'উচ্চ অগ্রাধিকার',
    critical: 'জরুরি জনস্বাস্থ্য ঝুঁকি',
  },
  en: {
    routine: 'Routine Review',
    elevated: 'Elevated Notice',
    high: 'High Priority',
    critical: 'Critical Public Hazard',
  },
};

export const UI_TEXT = {
  bn: {
    brandTitle: 'বাংলা অভিযোগ কেন্দ্র',
    navRegistry: 'জনসাধারণের নথি',
    navSubmit: 'অভিযোগ দাখিল',
    navTrack: 'অভিযোগ ট্র্যাকিং',
    navAuthority: 'কর্তৃপক্ষ ডেস্ক',
    ctaSubmit: 'নতুন অভিযোগ করুন',
    govHeaderBanner:
      'গণপ্রজাতন্ত্রী বাংলাদেশ সরকার অনুমোদিত জনস্বার্থ, মেয়াদোত্তীর্ণ ঔষধ ও নিরাপদ খাদ্য তদারকি বাতায়ন',
    securityStandardLabel:
      'নিরাপত্তা মানদণ্ড: এইএস-২৫৬-জিসিএম এনক্রিপশন ও এসএইচএ-২৫৬ ডিজিটাল প্রমাণ সিল',
    helplineLabel: 'জাতীয় হেল্পলাইন: ৩৩৩ · ভোক্তা অধিকার: ১৬১২১ · জরুরি সেবা: ৯৯৯',
    langSwitchLabel: 'ভাষা নির্বাচন:',
    heroKicker: 'জাতীয় জনঅভিযোগ ও নিয়ন্ত্রক কর্তৃপক্ষ যাচাই বাতায়ন',
    heroHeadline:
      'মেয়াদোত্তীর্ণ ঔষধ, অনিরাপদ খাদ্য ও নাগরিক ভোগান্তির বিরুদ্ধে ক্রিপ্টোগ্রাফিক প্রমাণসহ অভিযোগ করুন।',
    heroSubtitle:
      'বাংলা অভিযোগ কেন্দ্রে দাখিলকৃত প্রতিটি অভিযোগ ব্রাউজারেই ৬৪-ক্যারেক্টার ডিজিটাল হ্যাশ দ্বারা সিল করা হয়, তথ্যদাতার গোপনীয়তা রক্ষায় উচ্চতর এনক্রিপশন ব্যবহৃত হয় এবং সাথে সাথে একটি অনন্য ট্র্যাকিং নম্বর প্রদান করা হয়।',
    quickTrackLabel: 'অনন্য ট্র্যাকিং নম্বর দিয়ে আপনার অভিযোগের বর্তমান অবস্থা জানুন',
    quickTrackPlaceholder: 'ট্র্যাকিং নম্বর লিখুন (যেমন: OBJ-2026-849201)',
    quickTrackBtn: 'যাচাই ও ট্র্যাক করুন',
    instantDemoLookup: 'তাৎক্ষণিক নমুনা ট্র্যাকিং:',
    btnFileWithMedia: 'ছবি ও ভিডিওসহ নতুন অভিযোগ দাখিল করুন',
    btnOpenAuthority: 'সরকারি কর্তৃপক্ষ যাচাই ডেস্ক খুলুন',
    heroLedgerNote: 'ঔষধ প্রশাসন · নিরাপদ খাদ্য কর্তৃপক্ষ · বিএসটিআই · ভোক্তা অধিকার সমন্বিত ডিজিটাল লেজার',
    kpiTotalTitle: 'সিলযুক্ত মোট অভিযোগ নথি',
    kpiTotalSub: '১০০% ডিজিটাল ফিঙ্গারপ্রিন্ট সংরক্ষিত',
    kpiMedFoodTitle: 'মেয়াদোত্তীর্ণ ঔষধ ও খাদ্য মামলা',
    kpiMedFoodSub: 'সংশ্লিষ্ট অধিদপ্তর কর্তৃক অগ্রাধিকার ভিত্তিতে তদারকিকৃত',
    kpiVerifiedTitle: 'কর্তৃপক্ষ কর্তৃক যাচাইকৃত ও দণ্ডিত',
    kpiVerifiedSub: 'নির্বাহী ম্যাজিস্ট্রেট ও পরিদর্শক ব্যাজ দ্বারা স্বাক্ষরিত',
    kpiEncryptedTitle: 'এনক্রিপ্টেড গোপনীয় সাক্ষ্য নথি',
    kpiEncryptedSub: '১০০,০০০ ইটারেশন জিরো-নলেজ এনক্রিপশন সুরক্ষিত',
    registryKicker: '০১. জাতীয় জনঅভিযোগ ও ব্যাচ পরিদর্শন রেজিস্ট্রি',
    registryTitle: 'সর্বজনীন অভিযোগ তালিকা ও সরকারি পদক্ষেপের খতিয়ান',
    registrySubtitle:
      'মেয়াদোত্তীর্ণ ঔষধ, ভেজাল খাদ্য, অতিরিক্ত মূল্য আদায় এবং জনস্বাস্থ্য ঝুঁকি সংক্রান্ত দাখিলকৃত অভিযোগ ও কর্তৃপক্ষের গৃহীত ব্যবস্থা নিচে দেখুন।',
    searchPlaceholder: 'ট্র্যাকিং নম্বর, ব্যাচ নম্বর বা প্রতিষ্ঠানের নাম খুঁজুন...',
    allStatuses: 'সকল অবস্থা',
    filterAll: 'সকল অভিযোগ',
    filterMed: 'মেয়াদোত্তীর্ণ ঔষধ',
    filterFood: 'মেয়াদোত্তীর্ণ খাদ্য',
    filterPrice: 'অতিরিক্ত মূল্য',
    filterAdulterated: 'ভেজাল ও নকল পণ্য',
    filterSafety: 'জনস্বাস্থ্য ও নিরাপত্তা',
  },
  en: {
    brandTitle: 'Bangla Obijog Kendro',
    navRegistry: 'Public Registry',
    navSubmit: 'File Objection',
    navTrack: 'Track Dossier',
    navAuthority: 'Authority Desk',
    ctaSubmit: 'Submit Objection',
    govHeaderBanner:
      'National Public Grievance, Pharmacovigilance & Food Safety Verification Portal',
    securityStandardLabel:
      'Security Standard: AES-256-GCM Encryption + SHA-256 Chain of Custody',
    helplineLabel: 'National Helpline: 333 · Consumer Rights: 16121 · Emergency: 999',
    langSwitchLabel: 'Language:',
    heroKicker: 'NATIONAL PUBLIC OBJECTION & REGULATORY ARCHIVE',
    heroHeadline:
      'Report Expired Medicine, Unsafe Food, and Civic Violations with Cryptographic Proof.',
    heroSubtitle:
      'Every citizen submission on Bangla Obijog Kendro is sealed in-browser with a 64-character SHA-256 evidentiary digest, optional client-side AES-256-GCM whistleblower encryption, and a randomly generated unique Tracking Number for live authority verification.',
    quickTrackLabel: 'Track an Existing Objection by Unique Tracking Number',
    quickTrackPlaceholder: 'Enter Tracking ID (e.g. OBJ-2026-849201)',
    quickTrackBtn: 'Verify & Track',
    instantDemoLookup: 'Instant Demo Lookup:',
    btnFileWithMedia: 'File New Objection with Photo/Video',
    btnOpenAuthority: 'Open Govt Authority Verification Desk',
    heroLedgerNote: 'DGDA · BFSA · BSTI · DNCRP Integrated Cryptographic Ledger',
    kpiTotalTitle: 'Active Sealed Dossiers',
    kpiTotalSub: '100% anchored with 64-char SHA-256 digests',
    kpiMedFoodTitle: 'Medicine & Food Expiry Cases',
    kpiMedFoodSub: 'Routed to DGDA, BFSA & BSTI field inspectorates',
    kpiVerifiedTitle: 'Authority Verified & Enforced',
    kpiVerifiedSub: 'Signed by accredited regulatory inspector badges',
    kpiEncryptedTitle: 'AES-256-GCM Encrypted Notes',
    kpiEncryptedSub: 'Zero-knowledge PBKDF2 100k-iteration key derivation',
    registryKicker: '01. VERIFIED PUBLIC DOSSIER LEDGER',
    registryTitle: 'National Registry of Public Objections & Batch Inspections',
    registrySubtitle:
      'Browse cryptographically sealed citizen reports regarding expired pharmaceuticals, unsafe food batches, and regulatory violations across the country.',
    searchPlaceholder: 'Search Tracking ID, batch lot, pharmacy, district...',
    allStatuses: 'All Statuses',
    filterAll: 'All Dossiers',
    filterMed: 'Expired Medicine',
    filterFood: 'Expired Food & Dairy',
    filterPrice: 'Price Gouging',
    filterAdulterated: 'Adulterated Goods',
    filterSafety: 'Public Safety',
  },
} as const;

interface SeedObjectionTranslation {
  title: string;
  establishmentName: string;
  jurisdiction: string;
  description: string;
  mediaCaption: string;
  reporterAlias: string;
  authorityNote: string;
  enforcementAction: string;
  auditTrail?: {
    id: string;
    actorLabel: string;
    actionTitle: string;
    detail: string;
  }[];
}

export const SEED_OBJECTION_TRANSLATIONS_BN: Record<string, SeedObjectionTranslation> = {
  obj_seed_849201: {
    title: 'প্রেসক্রিপশন ছাড়া মেয়াদোত্তীর্ণ অ্যামোক্সিসিলিন ৫০০ মি.গ্রা. ও আইবুপ্রোফেন ব্লিস্টার প্যাক বিক্রয়',
    establishmentName: 'মেট্রোকেয়ার সেন্ট্রাল ফার্মেসি, শাখা ১৪',
    jurisdiction: 'ঢাকা মহানগরী — ধানমন্ডি জোন, সেক্টর ৪',
    description:
      'অ্যান্টিবায়োটিক ও ব্যথানাশক ঔষধের দুটি ব্লিস্টার প্যাক বিক্রয় করা হয়েছে যার মুদ্রিত মেয়াদোত্তীর্ণের তারিখ অক্টোবর ২০২৬ (৩৭ দিন পূর্বে মেয়াদ শেষ)। বাইরের কার্টনের মূল মেয়াদের ওপর কৌশলে দামের স্টিকার বসিয়ে মেয়াদ আড়াল করা হয়েছিল।',
    mediaCaption:
      'চিত্র ১: নাগরিকের দাখিলকৃত ব্লিস্টার ফয়েলের ম্যাক্রো আলোকচিত্র প্রমাণ।',
    reporterAlias: 'ফার্মাকোভিজিল্যান্স মনিটর ৪০১',
    authorityNote:
      'ঔষধ প্রশাসন অধিদপ্তরের পরিদর্শক দল শেলফ থেকে অবশিষ্ট ১৪২টি মেয়াদোত্তীর্ণ ব্লিস্টার ইউনিট জব্দ করেছে। ল্যাবরেটরি পরীক্ষায় সক্রিয় উপাদানের কার্যকারিতা ৭৮.৪ শতাংশে নেমে আসার প্রমাণ মিলেছে।',
    enforcementAction:
      'বাধ্যতামূলক ব্যাচ প্রত্যাহার আদেশ জারি এবং পূর্ণাঙ্গ অডিট না হওয়া পর্যন্ত ফার্মেসির খুচরা লাইসেন্স ৩০ দিনের জন্য স্থগিত।',
    auditTrail: [
      {
        id: 'aud_1',
        actorLabel: 'ফার্মাকোভিজিল্যান্স মনিটর ৪০১',
        actionTitle: 'অভিযোগ দাখিল ও আলোকচিত্র প্রমাণ সংযুক্ত',
        detail: 'ব্লিস্টার প্যাকের ম্যাক্রো ছবি এবং এনক্রিপ্টেড সরবরাহকারী তথ্য জমা দেওয়া হয়েছে।',
      },
      {
        id: 'aud_2',
        actorLabel: 'বাংলা অভিযোগ কেন্দ্র ডিজিটাল লেজার',
        actionTitle: 'ক্রিপ্টোগ্রাফিক ইন্টিগ্রিটি সিল নিশ্চিত',
        detail: 'ডিজিটাল হ্যাশ তৈরি ও অপরিবর্তনীয় ট্র্যাকিং নম্বর OBJ-2026-849201 প্রদান করা হয়েছে।',
      },
      {
        id: 'aud_3',
        actorLabel: 'ঔষধ প্রশাসন অধিদপ্তর (INSP-DRUG-8821)',
        actionTitle: 'আকস্মিক মাঠ পরিদর্শনের জন্য পরিদর্শক দল প্রেরণ',
        detail: 'মেট্রোকেয়ার সেন্ট্রাল ফার্মেসি শাখা ১৪-এ সরেজমিন তদন্ত শুরু।',
      },
      {
        id: 'aud_4',
        actorLabel: 'ঔষধ প্রশাসন অধিদপ্তর (INSP-DRUG-8821)',
        actionTitle: 'অভিযোগ প্রমাণিত ও অবৈধ ব্যাচ জব্দ',
        detail: '১৪২টি মেয়াদোত্তীর্ণ ব্লিস্টার প্যাক জব্দ এবং প্রত্যাহার আদেশ কার্যকর।',
      },
    ],
  },
  obj_seed_310489: {
    title: 'মেয়াদ উত্তীর্ণের ১২ দিন পরও পাস্তুরিত তরল দুধ ও দইয়ের কার্টন খোলা বাজারে বিক্রয়',
    establishmentName: 'গ্রিনভ্যালি হাইপারমার্কেট — কোল্ড চেইন আইল ৩',
    jurisdiction: 'ঢাকা উত্তর সিটি কর্পোরেশন — উত্তরা ওয়ার্ড ৭',
    description:
      'রেফ্রিজারেটেড আইল ৩-এ প্রদর্শিত একাধিক ১ লিটার পাস্তুরিত দুধের কার্টন ও দইয়ের কাপে মুদ্রিত মেয়াদ ২৬ অক্টোবর ২০২৬ থাকা সত্ত্বেও বিক্রয় চলছিল। চিলার ক্যাবিনেটের ডিজিটাল থার্মোমিটারে নির্ধারিত ৪ ডিগ্রি সেলসিয়াসের পরিবর্তে ১১.৪ ডিগ্রি সেলসিয়াস তাপমাত্রা রেকর্ড করা হয়।',
    mediaCaption:
      'চিত্র ২: দুধের কার্টনের কোল্ড-চেইন বারকোড ও মেয়াদের সিল যাচাই স্ক্যান।',
    reporterAlias: 'ভোক্তা নিরাপত্তা পর্যবেক্ষক ২০৮',
    authorityNote:
      'স্টোর ম্যানেজমেন্টের কাছ থেকে কোল্ড-চেইন টেলিমেট্রি লগ তলব করা হয়েছে। আঞ্চলিক নিরাপদ খাদ্য ল্যাবরেটরিতে ২৪ ঘণ্টার মাইক্রোবায়োলজিক্যাল কালচার পরীক্ষা চলমান।',
    enforcementAction:
      'আইল ৩-এর রেফ্রিজারেশন ইউনিটের ওপর সাময়িক কোল্ড-স্টোরেজ কোয়ারেন্টাইন আদেশ জারি।',
    auditTrail: [
      {
        id: 'aud_201',
        actorLabel: 'ভোক্তা নিরাপত্তা পর্যবেক্ষক ২০৮',
        actionTitle: 'জনস্বার্থে অভিযোগ দাখিল',
        detail: 'মেয়াদোত্তীর্ণ দুগ্ধজাত কার্টনের আলোকচিত্র প্রমাণ আপলোড করা হয়েছে।',
      },
      {
        id: 'aud_202',
        actorLabel: 'নিরাপদ খাদ্য কর্তৃপক্ষ ও বিএসটিআই (INSP-FOOD-4410)',
        actionTitle: 'মাঠ পর্যায়ের নমুনা সংগ্রহ ও কোয়ারেন্টাইন',
        detail: 'পরিদর্শক ঘটনাস্থলে বারকোড স্ক্যান করেছেন এবং ল্যাব রিপোর্টের অপেক্ষায় বিক্রয় স্থগিত করেছেন।',
      },
    ],
  },
  obj_seed_774120: {
    title: 'শিশুদের ওরস্যালাইন ও ইলেকট্রোলাইট প্যাকেটের মেয়াদের কালি মুছে নতুন তারিখ মুদ্রণ',
    establishmentName: 'সানরাইজ হোলসেল মেডিকেল ডিপো',
    jurisdiction: 'চট্টগ্রাম মহানগরী — আগ্রাবাদ বাণিজ্যিক এলাকা',
    description:
      'স্থানীয় ক্লিনিকে সরবরাহকৃত ওরস্যালাইন বক্সে রাসায়নিক দ্রাবক দিয়ে জুলাই ২০২৬ মেয়াদের তারিখ মুছে ২০২৭ ছাপানো হয়েছে। কিন্তু ভেতরের প্রতিটি স্যাশেটের খোদাই করা ক্রিম্পে স্পষ্টভাবে জুলাই ২০২৬ মেয়াদ লেখা রয়েছে।',
    mediaCaption:
      'ভিডিও প্রমাণ ক্লিপ (০০:১৮) — ইউভি লাইট ও ম্যাক্রো লেন্সে বাইরের কার্টনের কালি বনাম ভেতরের স্যাশেটের খোদাইকৃত তারিখের তুলনা।',
    reporterAlias: 'ক্লিনিক সাপ্লাই অডিটর ৮১৯',
    authorityNote: '',
    enforcementAction: '',
    auditTrail: [
      {
        id: 'aud_301',
        actorLabel: 'ক্লিনিক সাপ্লাই অডিটর ৮১৯',
        actionTitle: 'অভিযোগ ও ফরেনসিক ভিডিও প্রমাণ সিলযুক্ত',
        detail: 'ইউভি পরিদর্শন ভিডিও এবং এনক্রিপ্টেড ডিস্ট্রিবিউটর ইনভয়েস নম্বরসহ দাখিলকৃত।',
      },
    ],
  },
  obj_seed_509318: {
    title: 'সরকার নির্ধারিত মূল্যের চেয়ে ৬৫% অতিরিক্ত দামে ইনসুলিন গ্লারজিন পেন বিক্রয়',
    establishmentName: 'অ্যাপেক্স মেডপ্লাস ডিসপেনসারি ০৮',
    jurisdiction: 'খুলনা মহানগরী — সদর হাসপাতাল সড়ক',
    description:
      'জাতীয় অত্যাবশ্যকীয় ঔষধের মূল্য তালিকা অনুযায়ী ইনসুলিন কার্টিজ পেনের সর্বোচ্চ খুচরা মূল্য ১,০০০ টাকা নির্ধারিত থাকা সত্ত্বেও ১,৬৫০ টাকা আদায় করা হয়েছে। বিক্রয় রসিদ এবং প্যাকেটের গায়ের মূল্যমান প্রমাণ হিসেবে সংযুক্ত।',
    mediaCaption:
      'চিত্র ৩: কার্টিজ বক্সের গায়ে মুদ্রিত সর্বোচ্চ খুচরা মূল্যের সাথে বিক্রয় রসিদের তুলনা।',
    reporterAlias: 'রোগী অধিকার কর্মী ৫১২',
    authorityNote:
      'বিগত ৯০ দিনের বিলিং টার্মিনাল অডিট করে ৪৮টি লেনদেনে অতিরিক্ত মূল্য আদায়ের প্রমাণ পাওয়া গেছে, যা ভোক্তা অধিকার সংরক্ষণ আইনের সুস্পষ্ট লঙ্ঘন।',
    enforcementAction:
      'ভ্রাম্যমাণ আদালত কর্তৃক ২,৫০,০০০ টাকা জরিমানা আদায়, ক্ষতিগ্রস্ত ক্রেতাদের অর্থ ফেরত নির্দেশ এবং দৃশ্যমান মূল্য তালিকা স্থাপন।',
    auditTrail: [
      {
        id: 'aud_401',
        actorLabel: 'রোগী অধিকার কর্মী ৫১২',
        actionTitle: 'অতিরিক্ত মূল্য আদায়ের অভিযোগ দাখিল',
        detail: 'বিক্রয় রসিদ এবং সর্বোচ্চ খুচরা মূল্যের লেবেলের তুলনামূলক ছবি জমা দেওয়া হয়েছে।',
      },
      {
        id: 'aud_402',
        actorLabel: 'জাতীয় ভোক্তা অধিকার সংরক্ষণ অধিদপ্তর (INSP-PRICE-1094)',
        actionTitle: 'জরিমানা আদায় ও অর্থ ফেরত আদেশ জারি',
        detail: 'অতিরিক্ত মূল্যের অর্থ ফেরত ও প্রশাসনিক জরিমানা কার্যকর করা হয়েছে।',
      },
    ],
  },
  obj_seed_628904: {
    title: 'ডিসকাউন্ট বিনে মেয়াদোত্তীর্ণ ও ফুলে ওঠা শিশুদের সিরিয়াল এবং ক্যানজাত খাদ্য বিক্রয়',
    establishmentName: 'সিটিমার্ট ফ্যামিলি গ্রোসার্স — ওয়েস্টগেট',
    jurisdiction: 'রাজশাহী মহানগরী — বোয়ালিয়া জোন',
    description:
      'চেকআউট কাউন্টারের পাশে ক্লিয়ারেন্স বিনে ২৮টি শিশুদের মাল্টিগ্রেইন সিরিয়াল পাউচ ও ক্যান পাওয়া গেছে যেগুলোর মেয়াদ ৫৪ দিন পূর্বে (২০২৬-০৯-১৪) শেষ হয়েছে এবং কয়েকটি প্যাকেট গ্যাস জমে বিপজ্জনকভাবে ফুলে উঠেছে।',
    mediaCaption:
      'চিত্র ৪: ক্লিয়ারেন্স বিনে মেয়াদোত্তীর্ণ স্ট্যাম্পের আলোকচিত্র।',
    reporterAlias: 'অভিভাবক ঐক্য পরিষদ সদস্য ১০৪',
    authorityNote:
      'পরিদর্শকের উপস্থিতিতে মেয়াদোত্তীর্ণ ২৮টি ইউনিট তাৎক্ষণিক ধ্বংস করা হয়েছে। মেয়াদোত্তীর্ণ শিশুখাদ্য যাতে কাউন্টারে স্ক্যান না হয় সেজন্য স্বয়ংক্রিয় বারকোড লক চালু করা হয়েছে।',
    enforcementAction:
      'প্রতিকার সম্পন্ন ও যাচাইকৃত — বারকোড এক্সপায়ারি লক অডিট ও সনদ প্রদান।',
    auditTrail: [
      {
        id: 'aud_501',
        actorLabel: 'অভিভাবক ঐক্য পরিষদ সদস্য ১০৪',
        actionTitle: 'মেয়াদোত্তীর্ণ শিশুখাদ্যের অভিযোগ দাখিল',
        detail: '৫৪ দিন পূর্বে মেয়াদোত্তীর্ণ পাউচের ছবি জমা দেওয়া হয়েছে।',
      },
      {
        id: 'aud_502',
        actorLabel: 'নিরাপদ খাদ্য কর্তৃপক্ষ ও বিএসটিআই (INSP-FOOD-2209)',
        actionTitle: 'মেয়াদোত্তীর্ণ মজুদ ধ্বংস ও বারকোড লক যাচাই',
        detail: 'সরেজমিনে সম্পূর্ণ প্রতিকার সম্পন্ন এবং কমপ্লায়েন্স নিশ্চিত করা হয়েছে।',
      },
    ],
  },
};

const PRESET_BATCH_TRANSLATIONS: Record<
  string,
  Record<
    LanguageMode,
    {
      title: string;
      establishmentName: string;
      jurisdiction: string;
      description: string;
      mediaCaption: string;
      reporterAlias: string;
    }
  >
> = {
  'LOT-CEF-8841': {
    bn: {
      title: 'মেয়াদোত্তীর্ণ শিশুদের সেফিক্সিম সিরাপ খুচরা ফার্মেসিতে বিক্রয়',
      establishmentName: 'হেলথফার্স্ট ফার্মেসি অ্যান্ড সার্জিক্যাল মার্ট, শাখা ০৯',
      jurisdiction: 'ঢাকা মহানগরী — ধানমন্ডি জোন',
      description:
        'শিশুদের জন্য ৬০ মি.লি. সেফিক্সিম ওরাল সাসপেনশন ক্রয় করার পর দেখা যায় বোতলের গায়ে মেয়াদ উত্তীর্ণের তারিখ আগস্ট ২০২৬ মুদ্রিত রয়েছে, যা ৯০ দিনেরও বেশি সময় আগে মেয়াদোত্তীর্ণ হয়েছে।',
      mediaCaption: 'মেয়াদোত্তীর্ণ স্ট্যাম্প ও ক্রয় রসিদের ম্যাক্রো আলোকচিত্র প্রমাণ।',
      reporterAlias: 'সচেতন নাগরিক ৭০৪',
    },
    en: {
      title: 'Expired Pediatric Cefixime Oral Suspension Sold at Retail Counter',
      establishmentName: 'HealthFirst Pharmacy & Surgical Mart #09',
      jurisdiction: 'Dhaka Metropolitan — Dhanmondi Zone',
      description:
        'Purchased a 60ml bottle of Pediatric Cefixime Oral Suspension (LOT-CEF-8841). The embossed batch stamp on the bottle neck shows EXP 08/2026, more than 90 days expired at the time of sale.',
      mediaCaption:
        'Macro inspection photograph of LOT-CEF-8841 expiration stamp and purchase receipt.',
      reporterAlias: 'Citizen Observer #704',
    },
  },
  'BATCH-FD-4029': {
    bn: {
      title: 'মেয়াদোত্তীর্ণ পাস্তুরিত দুধ ও দুগ্ধজাত পণ্য নতুন স্টিকার লাগিয়ে বিক্রয়',
      establishmentName: 'প্রাইমমার্ট সুপারস্টোর — গুলশান শাখা',
      jurisdiction: 'ঢাকা উত্তর সিটি কর্পোরেশন — ওয়ার্ড ১৯',
      description:
        'সুপারশপের চিলার কেবিনে ১৯টি দুগ্ধজাত ও প্রক্রিয়াজাত খাদ্যের প্যাকেটে মেয়াদ উত্তীর্ণের তারিখ ১৮ অক্টোবর ২০২৬ পাওয়া গেছে। মূল মেয়াদের স্ট্যাম্পের ওপর ডিসকাউন্ট স্টিকার লাগিয়ে বিক্রি করা হচ্ছে।',
      mediaCaption: 'কোল্ড স্টোরেজ শেলফ পরিদর্শনে মেয়াদোত্তীর্ণ বারকোডের ছবি।',
      reporterAlias: 'সচেতন নাগরিক ৭০৪',
    },
    en: {
      title: 'Expired Vacuum-Packed Poultry & Chilled Dairy Sold Past Use-By Date',
      establishmentName: 'PrimeMart Superstore — Gulshan Branch',
      jurisdiction: 'Dhaka North City Corporation — Ward 19',
      description:
        'Found 19 chilled dairy and poultry packages on active retail sale with printed USE BY: 2026-10-18 (20 days past expiration). Secondary discount stickers were placed partially over the original date code.',
      mediaCaption: 'Cold storage shelf inspection showing expired BATCH-FD-4029 barcode.',
      reporterAlias: 'Citizen Observer #704',
    },
  },
  'LOT-IV-7720': {
    bn: {
      title: 'ইনজেকশন স্যালাইন ব্যাগে মেয়াদের তারিখ মুছে পুনরায় জাল তারিখ মুদ্রণ',
      establishmentName: 'মেডসাপ্লাই আঞ্চলিক লজিস্টিকস ডিপো',
      jurisdiction: 'চট্টগ্রাম বন্দর শিল্প এলাকা — সেক্টর ২',
      description:
        '১৮ সেকেন্ডের ইউভি ফরেনসিক ভিডিওতে স্পষ্ট দেখা যাচ্ছে স্যালাইন ব্যাগের মূল মেয়াদ জুন ২০২৬ রাসায়নিক দ্রাবক দিয়ে মুছে জাল তারিখ বসানো হয়েছে।',
      mediaCaption:
        'ফরেনসিক ইউভি ভিডিও রেকর্ডিংয়ে বাইরের কালির সাথে ভেতরের খোদাইকৃত সিলের তুলনা।',
      reporterAlias: 'সচেতন নাগরিক ৭০৪',
    },
    en: {
      title: 'Counterfeit Overprinted Expiry Dates on Intravenous Saline Bags',
      establishmentName: 'MedSupply Regional Logistics Depot',
      jurisdiction: 'Chattogram Port Industrial Zone — Sector 2',
      description:
        'Recorded 18-second UV inspection video showing solvent removal of original June 2026 expiration date on IV saline bags (LOT-IV-7720) and fraudulent re-stamping.',
      mediaCaption:
        'Forensic UV video recording comparing outer ink tampering with heat-embossed plastic seal.',
      reporterAlias: 'Citizen Observer #704',
    },
  },
  'GEN-CIVIC-9910': {
    bn: {
      title: 'হাসপাতালের জরুরি বিভাগে কৃত্রিম সংকট তৈরি ও অতিরিক্ত ফি আদায় এবং বর্জ্য অব্যবস্থাপনা',
      establishmentName: 'মহানগরী জেনারেল হাসপাতাল ও সংলগ্ন ডায়াগনস্টিক জোন',
      jurisdiction: 'সিলেট সিটি কর্পোরেশন — ওয়ার্ড ৮',
      description:
        'হাসপাতাল সংলগ্ন এলাকায় উন্মুক্ত মেডিকেল বর্জ্য ফেলা হচ্ছে এবং জরুরি পরীক্ষা-নিরীক্ষায় সরকার নির্ধারিত ফি-এর পরিবর্তে দ্বিগুণ অর্থ আদায় করা হচ্ছে। প্রমাণ হিসেবে ছবি ও রসিদ সংযুক্ত করা হলো।',
      mediaCaption: 'অব্যবস্থাপনা ও অতিরিক্ত ফি আদায়ের রসিদের আলোকচিত্র প্রমাণ।',
      reporterAlias: 'সচেতন নাগরিক ৭০৪',
    },
    en: {
      title: 'Illegal Medical Waste Dumping & Excessive Emergency Diagnostic Fee Charging',
      establishmentName: 'Metropolitan General Hospital & Diagnostic Zone',
      jurisdiction: 'Sylhet City Corporation — Ward 8',
      description:
        'Uncovered hazardous medical waste is being dumped along the public walkway and patients are being charged double the government-mandated rate for emergency diagnostic tests. Photo evidence attached.',
      mediaCaption: 'Photographic evidence of public hazard and overcharged receipt.',
      reporterAlias: 'Citizen Observer #704',
    },
  },
};

export function getLocalizedDossier(
  dossier: ObjectionRecord,
  lang: LanguageMode
): ObjectionRecord {
  const presetMatch = PRESET_BATCH_TRANSLATIONS[dossier.batchNumber];
  if (presetMatch) {
    const target = presetMatch[lang];
    return {
      ...dossier,
      title: target.title,
      establishmentName: target.establishmentName,
      jurisdiction: target.jurisdiction,
      description: target.description,
      mediaCaption: target.mediaCaption,
      reporterAlias: target.reporterAlias,
    };
  }

  if (lang === 'en') {
    return dossier;
  }
  const bnTrans = SEED_OBJECTION_TRANSLATIONS_BN[dossier.id];
  if (!bnTrans) {
    const localizedAudit = (dossier.auditTrail || []).map((entry) => {
      if (entry.actionTitle === 'Public Objection Filed & Media Attached') {
        return {
          ...entry,
          actionTitle: 'জনস্বার্থে অভিযোগ দাখিল ও প্রমাণ সংযুক্ত',
        };
      }
      if (entry.actionTitle === 'Cryptographic Integrity Hash Sealed') {
        return {
          ...entry,
          actorLabel: 'বাংলা অভিযোগ কেন্দ্র ডিজিটাল লেজার',
          actionTitle: 'ক্রিপ্টোগ্রাফিক ইন্টিগ্রিটি হ্যাশ সিলযুক্ত',
        };
      }
      return entry;
    });
    return {
      ...dossier,
      auditTrail: localizedAudit,
    };
  }

  const localizedAuditTrail = (dossier.auditTrail || []).map((entry) => {
    const matchedAudit = bnTrans.auditTrail?.find((a) => a.id === entry.id);
    if (!matchedAudit) return entry;
    return {
      ...entry,
      actorLabel: matchedAudit.actorLabel,
      actionTitle: matchedAudit.actionTitle,
      detail: matchedAudit.detail,
    };
  });

  const useTranslatedAuthorityNote =
    bnTrans.authorityNote &&
    (dossier.authorityNote.startsWith('Field inspection team seized') ||
      dossier.authorityNote.startsWith('Cold-chain telemetry logs') ||
      dossier.authorityNote.startsWith('Audited POS billing terminal') ||
      dossier.authorityNote.startsWith('All 28 units destroyed'));

  const useTranslatedEnforcement =
    bnTrans.enforcementAction &&
    (dossier.enforcementAction.startsWith('Mandatory Batch Recall Notice') ||
      dossier.enforcementAction.startsWith('Temporary Cold-Storage Quarantine') ||
      dossier.enforcementAction.startsWith('Statutory Restitution Order') ||
      dossier.enforcementAction.startsWith('Compliance Remediation Verified'));

  return {
    ...dossier,
    title: bnTrans.title,
    establishmentName: bnTrans.establishmentName,
    jurisdiction: bnTrans.jurisdiction,
    description: bnTrans.description,
    mediaCaption: bnTrans.mediaCaption,
    reporterAlias: bnTrans.reporterAlias,
    authorityNote: useTranslatedAuthorityNote ? bnTrans.authorityNote : dossier.authorityNote,
    enforcementAction: useTranslatedEnforcement
      ? bnTrans.enforcementAction
      : dossier.enforcementAction,
    auditTrail: localizedAuditTrail,
  };
}

export function formatLocalizedExpiryStatus(
  statusLabel: string,
  lang: LanguageMode
): string {
  if (lang === 'en') return statusLabel;
  if (statusLabel === 'No expiry date required') return 'মেয়াদের তারিখ প্রযোজ্য নয়';
  if (statusLabel === 'Unparseable date format') return 'অস্পষ্ট তারিখের ফরম্যাট';
  if (statusLabel === 'Expires today (0 days remaining)') {
    return 'আজই মেয়াদ শেষ (০ দিন বাকি)';
  }
  const expiredMatch = statusLabel.match(/^Expired (\d+) days? ago$/);
  if (expiredMatch) {
    return `${toBengaliDigits(expiredMatch[1])} দিন পূর্বে মেয়াদোত্তীর্ণ`;
  }
  const nearExpiryMatch = statusLabel.match(/^Near expiry \((\d+) days? left\)$/);
  if (nearExpiryMatch) {
    return `মেয়াদ শেষের পথে (${toBengaliDigits(nearExpiryMatch[1])} দিন বাকি)`;
  }
  const validMatch = statusLabel.match(/^Within shelf life \((\d+) days remaining\)$/);
  if (validMatch) {
    return `মেয়াদ বলবৎ আছে (${toBengaliDigits(validMatch[1])} দিন বাকি)`;
  }
  return statusLabel;
}
