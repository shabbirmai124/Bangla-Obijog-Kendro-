import React, { useState, useEffect } from 'react';
import {
  NewObjectionInput,
  ObjectionCategory,
  ObjectionRecord,
  EvidenceMediaType,
} from '../types/objection';
import {
  LanguageMode,
  CATEGORY_LABELS_I18N,
  SEVERITY_LABELS_I18N,
  DIRECTORATE_MAPPING,
  formatLocalizedExpiryStatus,
  getLocalizedDossier,
  toBengaliDigits,
} from '../i18n/translations';
import {
  calculateExpiryAnalysis,
  computeDossierSha256,
  validateObjectionInput,
} from '../utils/cryptoAndValidation';
import { SAMPLE_MEDICINE_IMAGE, SAMPLE_FOOD_IMAGE } from '../data/seedObjections';
import { EvidenceMediaViewer } from './EvidenceMediaViewer';
import {
  Shield,
  Lock,
  Upload,
  CheckCircle2,
  Copy,
  Download,
  ArrowRight,
  FileVideo,
  Image as ImageIcon,
  Printer,
  KeyRound,
  UserCheck,
  BookOpen,
} from 'lucide-react';

interface FileObjectionSectionProps {
  onSubmitObjection: (input: NewObjectionInput) => Promise<ObjectionRecord>;
  onTrackNewlyCreated: (trackingId: string) => void;
  lang: LanguageMode;
  requireOwnerPermission?: boolean;
  ownerPermissionCode?: string;
  currentUserEmail?: string | null;
  onOpenFeatureGuide?: () => void;
}

export const FileObjectionSection: React.FC<FileObjectionSectionProps> = ({
  onSubmitObjection,
  onTrackNewlyCreated,
  lang,
  requireOwnerPermission = false,
  ownerPermissionCode = 'BOK-OWNER-2026',
  currentUserEmail,
  onOpenFeatureGuide,
}) => {
  const [activePreset, setActivePreset] = useState<
    'medicine' | 'food' | 'video' | 'civic' | null
  >('medicine');
  const [title, setTitle] = useState(
    lang === 'bn'
      ? 'মেয়াদোত্তীর্ণ শিশুদের সেফিক্সিম সিরাপ খুচরা ফার্মেসিতে বিক্রয়'
      : 'Expired Pediatric Cefixime Oral Suspension Sold at Retail Counter'
  );
  const [category, setCategory] = useState<ObjectionCategory>('expired_medicine');
  const [establishmentName, setEstablishmentName] = useState(
    lang === 'bn'
      ? 'হেলথফার্স্ট ফার্মেসি অ্যান্ড সার্জিক্যাল মার্ট, শাখা ০৯'
      : 'HealthFirst Pharmacy & Surgical Mart #09'
  );
  const [jurisdiction, setJurisdiction] = useState(
    lang === 'bn'
      ? 'ঢাকা মহানগরী — ধানমন্ডি জোন'
      : 'Dhaka Metropolitan — Dhanmondi Zone'
  );
  const [batchNumber, setBatchNumber] = useState('LOT-CEF-8841');
  const [expiryDate, setExpiryDate] = useState('2026-08-01');
  const [manufacturedDate, setManufacturedDate] = useState('2024-08-01');
  const [description, setDescription] = useState(
    lang === 'bn'
      ? 'শিশুদের জন্য ৬০ মি.লি. সেফিক্সিম ওরাল সাসপেনশন ক্রয় করার পর দেখা যায় বোতলের গায়ে মেয়াদ উত্তীর্ণের তারিখ আগস্ট ২০২৬ মুদ্রিত রয়েছে, যা ৯০ দিনেরও বেশি সময় আগে মেয়াদোত্তীর্ণ হয়েছে।'
      : 'Purchased a 60ml bottle of Pediatric Cefixime Oral Suspension (LOT-CEF-8841). The embossed batch stamp on the bottle neck shows EXP 08/2026, more than 90 days expired at the time of sale.'
  );
  const [reporterAlias, setReporterAlias] = useState(
    lang === 'bn' ? 'সচেতন নাগরিক ৭০৪' : 'Citizen Observer #704'
  );
  const [reporterAge, setReporterAge] = useState('29');
  const [enteredPermissionCode, setEnteredPermissionCode] = useState('');
  const [enableEncryption, setEnableEncryption] = useState(true);
  const [confidentialNote, setConfidentialNote] = useState(
    lang === 'bn'
      ? 'ডিস্ট্রিবিউটর ডেলিভারি ভ্যান নম্বর ঢাকা-মেট্রো-৯০৪২ সকাল ৭:৩০ মিনিটে ১২টি আনসিলড কার্টন খালাস করেছে।'
      : 'Distributor delivery van license #DHAKA-METRO-9042 unloaded 12 unsealed cartons at 07:30 AM.'
  );
  const [encryptionPassphrase, setEncryptionPassphrase] = useState('AEGIS-INSPECT-2026');
  const [mediaType, setMediaType] = useState<EvidenceMediaType>('image');
  const [mediaUrl, setMediaUrl] = useState<string>(SAMPLE_MEDICINE_IMAGE);
  const [mediaCaption, setMediaCaption] = useState(
    lang === 'bn'
      ? 'মেয়াদোত্তীর্ণ স্ট্যাম্প ও ক্রয় রসিদের ম্যাক্রো আলোকচিত্র প্রমাণ।'
      : 'Macro inspection photograph of LOT-CEF-8841 expiration stamp and purchase receipt.'
  );

  const [liveHashPreview, setLiveHashPreview] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedRecord, setSubmittedRecord] = useState<ObjectionRecord | null>(null);
  const [copiedId, setCopiedId] = useState(false);

  const isBatchCategory =
    category === 'expired_medicine' ||
    category === 'expired_food' ||
    category === 'adulterated_goods';

  const applyPresetValues = (
    preset: 'medicine' | 'food' | 'video' | 'civic',
    targetLang: LanguageMode
  ) => {
    setErrors({});
    setActivePreset(preset);
    setReporterAge('29');
    if (preset === 'medicine') {
      setTitle(
        targetLang === 'bn'
          ? 'মেয়াদোত্তীর্ণ শিশুদের সেফিক্সিম সিরাপ খুচরা ফার্মেসিতে বিক্রয়'
          : 'Expired Pediatric Cefixime Oral Suspension Sold at Retail Counter'
      );
      setCategory('expired_medicine');
      setEstablishmentName(
        targetLang === 'bn'
          ? 'হেলথফার্স্ট ফার্মেসি অ্যান্ড সার্জিক্যাল মার্ট, শাখা ০৯'
          : 'HealthFirst Pharmacy & Surgical Mart #09'
      );
      setJurisdiction(
        targetLang === 'bn'
          ? 'ঢাকা মহানগরী — ধানমন্ডি জোন'
          : 'Dhaka Metropolitan — Dhanmondi Zone'
      );
      setBatchNumber('LOT-CEF-8841');
      setExpiryDate('2026-08-01');
      setManufacturedDate('2024-08-01');
      setDescription(
        targetLang === 'bn'
          ? 'শিশুদের জন্য ৬০ মি.লি. সেফিক্সিম ওরাল সাসপেনশন ক্রয় করার পর দেখা যায় বোতলের গায়ে মেয়াদ উত্তীর্ণের তারিখ আগস্ট ২০২৬ মুদ্রিত রয়েছে, যা ৯০ দিনেরও বেশি সময় আগে মেয়াদোত্তীর্ণ হয়েছে।'
          : 'Purchased a 60ml bottle of Pediatric Cefixime Oral Suspension (LOT-CEF-8841). The embossed batch stamp on the bottle neck shows EXP 08/2026, more than 90 days expired at the time of sale.'
      );
      setMediaType('image');
      setMediaUrl(SAMPLE_MEDICINE_IMAGE);
      setMediaCaption(
        targetLang === 'bn'
          ? 'মেয়াদোত্তীর্ণ স্ট্যাম্প ও ক্রয় রসিদের ম্যাক্রো আলোকচিত্র প্রমাণ।'
          : 'Macro inspection photograph of LOT-CEF-8841 expiration stamp and purchase receipt.'
      );
      setEnableEncryption(true);
      setConfidentialNote(
        targetLang === 'bn'
          ? 'ডিস্ট্রিবিউটর ডেলিভারি ভ্যান নম্বর ঢাকা-মেট্রো-৯০৪২ সকাল ৭:৩০ মিনিটে ১২টি আনসিলড কার্টন খালাস করেছে।'
          : 'Distributor delivery van license #DHAKA-METRO-9042 unloaded 12 unsealed cartons at 07:30 AM.'
      );
      setEncryptionPassphrase('AEGIS-INSPECT-2026');
    } else if (preset === 'food') {
      setTitle(
        targetLang === 'bn'
          ? 'মেয়াদোত্তীর্ণ পাস্তুরিত দুধ ও দুগ্ধজাত পণ্য নতুন স্টিকার লাগিয়ে বিক্রয়'
          : 'Expired Vacuum-Packed Poultry & Chilled Dairy Sold Past Use-By Date'
      );
      setCategory('expired_food');
      setEstablishmentName(
        targetLang === 'bn'
          ? 'প্রাইমমার্ট সুপারস্টোর — গুলশান শাখা'
          : 'PrimeMart Superstore — Gulshan Branch'
      );
      setJurisdiction(
        targetLang === 'bn'
          ? 'ঢাকা উত্তর সিটি কর্পোরেশন — ওয়ার্ড ১৯'
          : 'Dhaka North City Corporation — Ward 19'
      );
      setBatchNumber('BATCH-FD-4029');
      setExpiryDate('2026-10-18');
      setManufacturedDate('2026-09-18');
      setDescription(
        targetLang === 'bn'
          ? 'সুপারশপের চিলার কেবিনে ১৯টি দুগ্ধজাত ও প্রক্রিয়াজাত খাদ্যের প্যাকেটে মেয়াদ উত্তীর্ণের তারিখ ১৮ অক্টোবর ২০২৬ পাওয়া গেছে। মূল মেয়াদের স্ট্যাম্পের ওপর ডিসকাউন্ট স্টিকার লাগিয়ে বিক্রি করা হচ্ছে।'
          : 'Found 19 chilled dairy and poultry packages on active retail sale with printed USE BY: 2026-10-18 (20 days past expiration). Secondary discount stickers were placed partially over the original date code.'
      );
      setMediaType('image');
      setMediaUrl(SAMPLE_FOOD_IMAGE);
      setMediaCaption(
        targetLang === 'bn'
          ? 'কোল্ড স্টোরেজ শেলফ পরিদর্শনে মেয়াদোত্তীর্ণ বারকোডের ছবি।'
          : 'Cold storage shelf inspection showing expired BATCH-FD-4029 barcode.'
      );
      setEnableEncryption(false);
      setConfidentialNote('');
      setEncryptionPassphrase('');
    } else if (preset === 'video') {
      setTitle(
        targetLang === 'bn'
          ? 'ইনজেকশন স্যালাইন ব্যাগে মেয়াদের তারিখ মুছে পুনরায় জাল তারিখ মুদ্রণ'
          : 'Counterfeit Overprinted Expiry Dates on Intravenous Saline Bags'
      );
      setCategory('adulterated_goods');
      setEstablishmentName(
        targetLang === 'bn'
          ? 'মেডসাপ্লাই আঞ্চলিক লজিস্টিকস ডিপো'
          : 'MedSupply Regional Logistics Depot'
      );
      setJurisdiction(
        targetLang === 'bn'
          ? 'চট্টগ্রাম বন্দর শিল্প এলাকা — সেক্টর ২'
          : 'Chattogram Port Industrial Zone — Sector 2'
      );
      setBatchNumber('LOT-IV-7720');
      setExpiryDate('2026-06-30');
      setManufacturedDate('2023-06-30');
      setDescription(
        targetLang === 'bn'
          ? '১৮ সেকেন্ডের ইউভি ফরেনসিক ভিডিওতে স্পষ্ট দেখা যাচ্ছে স্যালাইন ব্যাগের মূল মেয়াদ জুন ২০২৬ রাসায়নিক দ্রাবক দিয়ে মুছে জাল তারিখ বসানো হয়েছে।'
          : 'Recorded 18-second UV inspection video showing solvent removal of original June 2026 expiration date on IV saline bags (LOT-IV-7720) and fraudulent re-stamping.'
      );
      setMediaType('video');
      setMediaUrl('synthetic-inspection-video:LOT-IV-7720');
      setMediaCaption(
        targetLang === 'bn'
          ? 'ফরেনসিক ইউভি ভিডিও রেকর্ডিংয়ে বাইরের কালির সাথে ভেতরের খোদাইকৃত সিলের তুলনা।'
          : 'Forensic UV video recording comparing outer ink tampering with heat-embossed plastic seal.'
      );
      setEnableEncryption(true);
      setConfidentialNote(
        targetLang === 'bn'
          ? 'গুদাম সুপারভাইজার ব্যাজ নম্বর ২১৯ পুনরায় লেবেল লাগানোর নির্দেশ দিয়েছিলেন।'
          : 'Warehouse bay supervisor badge #WH-219 authorized the relabeling batch.'
      );
      setEncryptionPassphrase('AEGIS-INSPECT-2026');
    } else {
      setTitle(
        targetLang === 'bn'
          ? 'হাসপাতালের জরুরি বিভাগে কৃত্রিম সংকট তৈরি ও অতিরিক্ত ফি আদায় এবং বর্জ্য অব্যবস্থাপনা'
          : 'Illegal Medical Waste Dumping & Excessive Emergency Diagnostic Fee Charging'
      );
      setCategory('public_safety');
      setEstablishmentName(
        targetLang === 'bn'
          ? 'মহানগরী জেনারেল হাসপাতাল ও সংলগ্ন ডায়াগনস্টিক জোন'
          : 'Metropolitan General Hospital & Diagnostic Zone'
      );
      setJurisdiction(
        targetLang === 'bn'
          ? 'সিলেট সিটি কর্পোরেশন — ওয়ার্ড ৮'
          : 'Sylhet City Corporation — Ward 8'
      );
      setBatchNumber('GEN-CIVIC-9910');
      setExpiryDate('');
      setManufacturedDate('');
      setDescription(
        targetLang === 'bn'
          ? 'হাসপাতাল সংলগ্ন এলাকায় উন্মুক্ত মেডিকেল বর্জ্য ফেলা হচ্ছে এবং জরুরি পরীক্ষা-নিরীক্ষায় সরকার নির্ধারিত ফি-এর পরিবর্তে দ্বিগুণ অর্থ আদায় করা হচ্ছে। প্রমাণ হিসেবে ছবি ও রসিদ সংযুক্ত করা হলো।'
          : 'Uncovered hazardous medical waste is being dumped along the public walkway and patients are being charged double the government-mandated rate for emergency diagnostic tests. Photo evidence attached.'
      );
      setMediaType('image');
      setMediaUrl(SAMPLE_FOOD_IMAGE);
      setMediaCaption(
        targetLang === 'bn'
          ? 'অব্যবস্থাপনা ও অতিরিক্ত ফি আদায়ের রসিদের আলোকচিত্র প্রমাণ।'
          : 'Photographic evidence of public hazard and overcharged receipt.'
      );
      setEnableEncryption(false);
      setConfidentialNote('');
      setEncryptionPassphrase('');
    }
  };

  // Sync default alias, caption, and active preset when language switches
  useEffect(() => {
    setReporterAlias((prev) => {
      if (
        prev === 'সচেতন নাগরিক ৭০৪' ||
        prev === 'সচেতন নাগরিক #৭০৪ (Citizen #704)' ||
        prev === 'Citizen Observer #704'
      ) {
        return lang === 'bn' ? 'সচেতন নাগরিক ৭০৪' : 'Citizen Observer #704';
      }
      return prev;
    });
    if (activePreset) {
      applyPresetValues(activePreset, lang);
      return;
    }
    setMediaCaption((prev) => {
      if (
        prev === 'খুচরা প্যাকেটের গায়ে মুদ্রিত মেয়াদ উত্তীর্ণের তারিখ ও ব্যাচ লট নম্বর।' ||
        prev === 'Stamped expiration date and batch lot number on retail packaging.'
      ) {
        return lang === 'bn'
          ? 'খুচরা প্যাকেটের গায়ে মুদ্রিত মেয়াদ উত্তীর্ণের তারিখ ও ব্যাচ লট নম্বর।'
          : 'Stamped expiration date and batch lot number on retail packaging.';
      }
      return prev;
    });
  }, [lang, activePreset]);

  const expiryAnalysis = calculateExpiryAnalysis(expiryDate, category);
  const expiryText = formatLocalizedExpiryStatus(expiryAnalysis.statusLabel, lang);
  const catLabels = CATEGORY_LABELS_I18N[lang];
  const severityLabels = SEVERITY_LABELS_I18N[lang];
  const assignedDirectorate = DIRECTORATE_MAPPING[category];
  const localizedSubmittedRecord = submittedRecord
    ? getLocalizedDossier(submittedRecord, lang)
    : null;

  useEffect(() => {
    let cancelled = false;
    computeDossierSha256({
      trackingId: 'OBJ-2026-PREVIEW',
      title: title || 'Draft Objection',
      category,
      establishmentName: establishmentName || 'Pending',
      jurisdiction: jurisdiction || 'Pending',
      batchNumber: batchNumber || 'GEN-REF-2026',
      expiryDate,
      manufacturedDate,
      description: description || 'Pending factual statement',
    }).then((hash) => {
      if (!cancelled) setLiveHashPreview(hash);
    });
    return () => {
      cancelled = true;
    };
  }, [
    title,
    category,
    establishmentName,
    jurisdiction,
    batchNumber,
    expiryDate,
    manufacturedDate,
    description,
  ]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVideo = file.type.startsWith('video/');
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      if (result.length <= 240000) {
        setMediaType(isVideo ? 'video' : 'image');
        setMediaUrl(result);
        setMediaCaption(
          lang === 'bn'
            ? `আপলোডকৃত প্রমাণ: ${file.name} (${Math.round(file.size / 1024)} কিলোবাইট)`
            : `Uploaded evidence: ${file.name} (${Math.round(file.size / 1024)} KB)`
        );
      } else {
        setMediaType(isVideo ? 'video' : 'image');
        setMediaUrl(isVideo ? 'synthetic-inspection-video:UPLOADED-CLIP' : SAMPLE_MEDICINE_IMAGE);
        setMediaCaption(
          lang === 'bn'
            ? `উচ্চ রেজোলিউশন মিডিয়া হ্যাশ সংরক্ষিত: ${file.name}`
            : `Verified high-resolution media hash anchored for ${file.name}`
        );
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFillSampleTemplate = (preset: 'medicine' | 'food' | 'video' | 'civic') => {
    applyPresetValues(preset, lang);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const isOwner = currentUserEmail === 'mdshabbirmia516@gmail.com';
    if (
      requireOwnerPermission &&
      !isOwner &&
      enteredPermissionCode.trim() !== ownerPermissionCode
    ) {
      setErrors({
        permissionCode:
          lang === 'bn'
            ? 'মালিকের (mdshabbirmia516@gmail.com) অনুমোদিত অ্যাক্সেস কোড প্রদান করা আবশ্যক।'
            : 'Valid Owner Authorization Passcode from mdshabbirmia516@gmail.com is required.',
      });
      return;
    }

    // Automatically supply a reference ID for general non-batch problems if left blank
    const effectiveBatchNumber =
      batchNumber.trim() || (!isBatchCategory ? 'GEN-REF-2026' : '');

    const inputPayload: NewObjectionInput = {
      title,
      category,
      establishmentName,
      jurisdiction,
      batchNumber: effectiveBatchNumber,
      expiryDate: isBatchCategory ? expiryDate : expiryDate || '',
      manufacturedDate: isBatchCategory ? manufacturedDate : manufacturedDate || '',
      description,
      confidentialNote: enableEncryption ? confidentialNote : '',
      encryptionPassphrase: enableEncryption ? encryptionPassphrase : '',
      mediaType,
      mediaUrl,
      mediaCaption,
      reporterAlias,
      reporterAge: reporterAge.trim(),
      visibility: 'public',
    };

    const validation = validateObjectionInput(inputPayload);
    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);
    try {
      const created = await onSubmitObjection(inputPayload);
      setSubmittedRecord(created);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadReceipt = () => {
    if (!submittedRecord) return;
    const receiptData = {
      portal:
        lang === 'bn'
          ? 'বাংলা অভিযোগ কেন্দ্র — জাতীয় জনঅভিযোগ ও নিয়ন্ত্রক যাচাই বাতায়ন'
          : 'Bangla Obijog Kendro — National Public Grievance & Verification Portal',
      ownerAuthority: 'mdshabbirmia516@gmail.com',
      governmentAuthorityRouting:
        lang === 'bn'
          ? DIRECTORATE_MAPPING[submittedRecord.category].bn
          : DIRECTORATE_MAPPING[submittedRecord.category].en,
      uniqueTrackingNumber: submittedRecord.trackingId,
      sha256IntegritySeal: submittedRecord.sha256Hash,
      encryptionStandard: submittedRecord.isEncrypted
        ? 'AES-256-GCM (PBKDF2-SHA256 100,000 iterations)'
        : 'Public Unencrypted Statement',
      filedAt: submittedRecord.createdAt,
      reporterAlias: submittedRecord.reporterAlias,
      reporterAge: submittedRecord.reporterAge || reporterAge || '28',
      category: submittedRecord.category,
      severity: submittedRecord.severity,
      establishmentName: submittedRecord.establishmentName,
      jurisdiction: submittedRecord.jurisdiction,
      batchNumber: submittedRecord.batchNumber,
      expiryDate: submittedRecord.expiryDate,
    };
    const blob = new Blob([JSON.stringify(receiptData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${submittedRecord.trackingId}-receipt.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section
      id="file-objection-section"
      aria-labelledby="file-objection-heading"
      className="max-w-[1360px] mx-auto px-6 py-12"
    >
      <div className="pb-6 border-b border-[#CBD5E1] flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-[#006A4E] font-semibold">
            {lang === 'bn'
              ? '০২. সর্বজনীন নাগরিক অভিযোগ ও প্রমাণ দাখিল ফর্ম'
              : '02. UNIVERSAL CITIZEN OBJECTION & EVIDENCE FILING FORM'}
          </p>
          <h2
            id="file-objection-heading"
            className="mt-1 text-2xl sm:text-3xl font-serif-display font-semibold text-[#0F172A]"
          >
            {lang === 'bn'
              ? 'মেয়াদোত্তীর্ণ ঔষধ, খাদ্য ও দেশের যেকোনো জনসমস্যার অভিযোগ দাখিল করুন'
              : 'Submit Any Public Objection with Image, Age & Full Details'}
          </h2>
          <p className="mt-2 text-sm text-[#475569] max-w-2xl">
            {lang === 'bn'
              ? 'মেয়াদোত্তীর্ণ ঔষধ, ভেজাল খাদ্য, অতিরিক্ত মূল্য, রাস্তাঘাট বা নাগরিক ভোগান্তি—যেকোনো সমস্যার ছবি, আপনার বয়স ও বিস্তারিত বিবরণ সহজেই জমা দিন এবং সাথে সাথে একটি র‍্যান্ডম অনন্য ট্র্যাকিং নম্বর পান।'
              : 'Submit any problem happening across the country—expired medicine, unsafe food, price gouging, infrastructure hazards, or public grievances—with photo/video evidence, reporter age, and full details.'}
          </p>
        </div>

        {/* Quick Pre-fill Presets for Fast User-Friendly Inspection */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-[#475569]">
            {lang === 'bn' ? 'এক-ক্লিকে নমুনা পূরণ:' : 'Quick-Fill Sample:'}
          </span>
          <button
            type="button"
            onClick={() => handleFillSampleTemplate('medicine')}
            className="px-3 py-1.5 text-xs font-medium bg-[#E2E8F0] hover:bg-[#CBD5E1] text-[#0F172A] rounded-md transition-colors whitespace-nowrap cursor-pointer"
          >
            {lang === 'bn' ? 'মেয়াদোত্তীর্ণ ঔষধ নমুনা' : 'Expired Medicine Preset'}
          </button>
          <button
            type="button"
            onClick={() => handleFillSampleTemplate('food')}
            className="px-3 py-1.5 text-xs font-medium bg-[#E2E8F0] hover:bg-[#CBD5E1] text-[#0F172A] rounded-md transition-colors whitespace-nowrap cursor-pointer"
          >
            {lang === 'bn' ? 'মেয়াদোত্তীর্ণ খাদ্য নমুনা' : 'Expired Food Preset'}
          </button>
          <button
            type="button"
            onClick={() => handleFillSampleTemplate('civic')}
            className="px-3 py-1.5 text-xs font-medium bg-[#E2E8F0] hover:bg-[#CBD5E1] text-[#0F172A] rounded-md transition-colors whitespace-nowrap cursor-pointer"
          >
            {lang === 'bn' ? 'নাগরিক ও জনদুর্ভোগ নমুনা' : 'General Public Problem Preset'}
          </button>
          <button
            type="button"
            onClick={() => handleFillSampleTemplate('video')}
            className="px-3 py-1.5 text-xs font-medium bg-[#E2E8F0] hover:bg-[#CBD5E1] text-[#0F172A] rounded-md transition-colors whitespace-nowrap cursor-pointer"
          >
            {lang === 'bn' ? 'ফরেনসিক ভিডিও নমুনা' : 'Forensic Video Preset'}
          </button>
        </div>
      </div>

      {/* User-Friendly Step-by-Step Filing Guide Bar */}
      <div className="mt-6 p-4 bg-[#F1F5F9] border border-[#CBD5E1] rounded-xl flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex flex-wrap items-center gap-4 text-[#0F172A]">
          <span className="font-semibold text-[#006A4E]">
            {lang === 'bn' ? 'সহজ ৩টি ধাপে অভিযোগ করুন:' : '3 Easy Steps to Submit:'}
          </span>
          <span>
            {lang === 'bn'
              ? '১. সমস্যার বিভাগ ও আপনার বয়স লিখুন'
              : '1. Choose Problem Category & Enter Age'}
          </span>
          <span aria-hidden="true">→</span>
          <span>
            {lang === 'bn'
              ? '২. অভিযোগের বিস্তারিত বিবরণ দিন'
              : '2. Describe the Objection Details'}
          </span>
          <span aria-hidden="true">→</span>
          <span>
            {lang === 'bn'
              ? '৩. ছবি বা ভিডিও যুক্ত করে জমা দিন'
              : '3. Attach Photo/Video & Submit'}
          </span>
        </div>

        {onOpenFeatureGuide && (
          <button
            type="button"
            onClick={onOpenFeatureGuide}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#006A4E] bg-white border border-[#006A4E]/30 rounded-lg hover:bg-[#ECFDF5] transition-colors cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>
              {lang === 'bn'
                ? 'বৈশিষ্ট্য ও অনুমতি নির্দেশিকা দেখুন'
                : 'View Feature & Permission Guide'}
            </span>
          </button>
        )}
      </div>

      {/* Official Government Cryptographic Receipt Banner when an objection has just been filed */}
      {submittedRecord && (
        <div
          role="region"
          aria-label="Official Cryptographic Filing Receipt"
          data-testid="filing-receipt-card"
          className="mt-8 p-6 sm:p-8 bg-[#ECFDF5] border-2 border-[#006A4E] rounded-xl shadow-xs"
        >
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-[#006A4E] uppercase tracking-wider">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>
                  {lang === 'bn'
                    ? 'সরকারি ডিজিটাল রসিদ · স্বয়ংক্রিয় অনন্য ট্র্যাকিং নম্বর তৈরি হয়েছে'
                    : 'Official Sealed Receipt · Random Unique Tracking Number Generated'}
                </span>
              </div>

              <div className="mt-3 flex flex-wrap items-baseline gap-3">
                <span className="text-xs font-semibold text-[#475569]">
                  {lang === 'bn' ? 'আপনার অনন্য ট্র্যাকিং নম্বর:' : 'Your Unique Tracking Number:'}
                </span>
                <h3
                  data-testid="generated-tracking-id"
                  className="text-2xl sm:text-3xl font-mono-tabular font-bold text-[#006A4E] tracking-tight bg-white px-3.5 py-1 rounded-lg border border-[#006A4E]/30"
                >
                  {submittedRecord.trackingId}
                </h3>
              </div>

              <p className="mt-3 text-sm text-[#0F172A]">
                <strong>{localizedSubmittedRecord?.title || submittedRecord.title}</strong> —{' '}
                {lang === 'bn' ? 'সংশ্লিষ্ট অধিদপ্তর:' : 'Routed to Directorate:'}{' '}
                <strong className="text-[#006A4E]">
                  {lang === 'bn'
                    ? DIRECTORATE_MAPPING[submittedRecord.category].bn
                    : DIRECTORATE_MAPPING[submittedRecord.category].en}
                </strong>
              </p>

              <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-[#334155]">
                <span>
                  {lang === 'bn' ? 'অভিযোগকারী:' : 'Reporter:'}{' '}
                  <strong>{localizedSubmittedRecord?.reporterAlias || submittedRecord.reporterAlias}</strong>
                </span>
                {(submittedRecord.reporterAge || reporterAge) && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span>
                      {lang === 'bn' ? 'বয়স:' : 'Age:'}{' '}
                      <strong>
                        {lang === 'bn'
                          ? `${toBengaliDigits(submittedRecord.reporterAge || reporterAge)} বছর`
                          : `${submittedRecord.reporterAge || reporterAge} Years`}
                      </strong>
                    </span>
                  </>
                )}
                <span aria-hidden="true">·</span>
                <span>
                  {lang === 'bn' ? 'সংযুক্ত প্রমাণ:' : 'Evidence Attached:'}{' '}
                  <strong>
                    {submittedRecord.mediaType === 'video'
                      ? lang === 'bn'
                        ? 'ভিডিও প্রমাণ'
                        : 'Video Evidence'
                      : lang === 'bn'
                      ? 'আলোকচিত্র (ছবি) প্রমাণ'
                      : 'Photographic Image'}
                  </strong>
                </span>
              </div>

              <div className="mt-2.5 flex flex-wrap items-center gap-3 text-xs font-mono-tabular text-[#475569]">
                <span className="inline-flex items-center gap-1">
                  <KeyRound className="w-3.5 h-3.5 text-[#006A4E]" />
                  <span>
                    {lang === 'bn' ? 'ডিজিটাল হ্যাশ সিল:' : 'SHA-256 Digest:'}{' '}
                    {submittedRecord.sha256Hash}
                  </span>
                </span>
                {submittedRecord.isEncrypted && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="text-[#1E3A8A]">
                      {lang === 'bn' ? 'এনক্রিপশন ভেক্টর:' : 'AES-256-GCM IV:'}{' '}
                      {submittedRecord.encryptionIv}
                    </span>
                  </>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText(submittedRecord.trackingId);
                  setCopiedId(true);
                  setTimeout(() => setCopiedId(false), 2000);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#0F172A] bg-white border border-[#CBD5E1] rounded-lg hover:bg-[#F1F5F9] transition-colors cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>
                  {copiedId
                    ? lang === 'bn'
                      ? 'কপি হয়েছে'
                      : 'Copied ID'
                    : lang === 'bn'
                    ? 'ট্র্যাকিং নম্বর কপি করুন'
                    : 'Copy Tracking ID'}
                </span>
              </button>

              <button
                type="button"
                onClick={handleDownloadReceipt}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#0F172A] bg-white border border-[#CBD5E1] rounded-lg hover:bg-[#F1F5F9] transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{lang === 'bn' ? 'ডিজিটাল রসিদ ডাউনলোড' : 'Download Signed Receipt'}</span>
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#0F172A] bg-white border border-[#CBD5E1] rounded-lg hover:bg-[#F1F5F9] transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>{lang === 'bn' ? 'রসিদ প্রিন্ট করুন' : 'Print Receipt'}</span>
              </button>

              <button
                type="button"
                onClick={() => onTrackNewlyCreated(submittedRecord.trackingId)}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#006A4E] rounded-lg hover:bg-[#00523C] transition-colors cursor-pointer"
              >
                <span>{lang === 'bn' ? 'এখনই ট্র্যাক করুন' : 'Track Live Status'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Filing Form Grid */}
      <form onSubmit={handleSubmit} noValidate className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left 7 Columns: Structured Evidentiary Fields */}
        <div className="lg:col-span-7 space-y-6 bg-white p-6 sm:p-8 border border-[#CBD5E1] rounded-xl">
          <div className="border-b border-[#E2E8F0] pb-3 flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-lg font-serif-display font-semibold text-[#0F172A]">
              {lang === 'bn'
                ? 'ক অংশ — সমস্যার ধরন, আপনার বয়স ও অভিযোগের বিস্তারিত বিবরণ'
                : 'Part A — Problem Category, Reporter Age & Objection Details'}
            </h3>
            <span className="text-xs font-semibold text-[#006A4E]">
              {lang === 'bn' ? assignedDirectorate.bn : assignedDirectorate.en}
            </span>
          </div>

          {/* Owner Permission Gate Notice when Strict Lock is Enabled */}
          {requireOwnerPermission && (
            <div className="p-4 bg-[#ECFDF5] border-2 border-[#006A4E] rounded-xl space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-semibold text-[#006A4E] flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5" />
                  <span>
                    {lang === 'bn'
                      ? 'মালিকের অনুমতি সুরক্ষা সক্রিয় (mdshabbirmia516@gmail.com)'
                      : 'Owner Permission Protection Active (mdshabbirmia516@gmail.com)'}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => setEnteredPermissionCode(ownerPermissionCode)}
                  className="px-2.5 py-1 text-xs font-semibold bg-white border border-[#006A4E]/40 text-[#006A4E] rounded hover:bg-[#F1F5F9] cursor-pointer"
                >
                  {lang === 'bn'
                    ? 'অনুমোদিত কোড স্বয়ংক্রিয়ভাবে পূরণ করুন'
                    : 'Auto-Fill Authorized Passcode'}
                </button>
              </div>
              <div>
                <label
                  htmlFor="owner-permission-code"
                  className="block text-xs font-semibold text-[#0F172A] mb-1"
                >
                  {lang === 'bn'
                    ? 'মালিক অনুমোদিত অ্যাক্সেস কোড *'
                    : 'Owner Authorization Passcode *'}
                </label>
                <input
                  id="owner-permission-code"
                  type="text"
                  value={enteredPermissionCode}
                  onChange={(e) => setEnteredPermissionCode(e.target.value)}
                  placeholder={
                    lang === 'bn'
                      ? `অনুমতি কোড লিখুন (যেমন: ${ownerPermissionCode})`
                      : `Enter Owner Passcode (e.g. ${ownerPermissionCode})`
                  }
                  className="w-full px-3.5 py-2 text-xs font-mono-tabular bg-white border border-[#CBD5E1] rounded-lg text-[#0F172A]"
                />
                {errors.permissionCode && (
                  <p className="mt-1 text-xs text-[#C8102E]">{errors.permissionCode}</p>
                )}
              </div>
            </div>
          )}

          {/* User-Friendly All-Problem Category Selection Grid */}
          <div>
            <label
              htmlFor="objection-category"
              className="block text-xs font-semibold text-[#0F172A] mb-2"
            >
              {lang === 'bn'
                ? '১. কোন ধরনের সমস্যা বা অভিযোগ দাখিল করতে চান নির্বাচন করুন *'
                : '1. Select the Type of Problem or Objection *'}
            </label>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
              {(Object.keys(catLabels) as ObjectionCategory[]).map((cat) => {
                const isSelected = category === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`p-2.5 text-left text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-[#006A4E] text-white border-[#006A4E] font-semibold'
                        : 'bg-[#F8FAFC] text-[#0F172A] border-[#CBD5E1] hover:bg-[#F1F5F9]'
                    }`}
                  >
                    {catLabels[cat]}
                  </button>
                );
              })}
            </div>

            <select
              id="objection-category"
              value={category}
              onChange={(e) => setCategory(e.target.value as ObjectionCategory)}
              className="w-full px-3.5 py-2.5 text-sm bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg text-[#0F172A] focus:outline-none focus:border-[#006A4E]"
            >
              {(Object.keys(catLabels) as ObjectionCategory[]).map((cat) => (
                <option key={cat} value={cat}>
                  {catLabels[cat]}
                </option>
              ))}
            </select>
          </div>

          {/* Reporter Name/Alias & Reporter Age (Years) */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
            <div className="sm:col-span-8">
              <label
                htmlFor="objection-alias"
                className="block text-xs font-semibold text-[#0F172A] mb-1.5"
              >
                {lang === 'bn'
                  ? 'অভিযোগকারীর নাম বা ছদ্মনাম (গোপনীয়তা সুরক্ষিত) *'
                  : 'Reporter Name or Public Alias (PII-Free) *'}
              </label>
              <input
                id="objection-alias"
                type="text"
                value={reporterAlias}
                onChange={(e) => setReporterAlias(e.target.value)}
                placeholder={lang === 'bn' ? 'যেমন: সচেতন নাগরিক ৭০৪' : 'e.g. Citizen Observer #704'}
                className="w-full px-3.5 py-2.5 text-sm bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg text-[#0F172A] focus:outline-none focus:border-[#006A4E]"
              />
              {errors.reporterAlias && (
                <p className="mt-1 text-xs text-[#C8102E]">{errors.reporterAlias}</p>
              )}
            </div>

            <div className="sm:col-span-4">
              <label
                htmlFor="objection-age"
                className="block text-xs font-semibold text-[#0F172A] mb-1.5"
              >
                {lang === 'bn' ? 'অভিযোগকারীর বয়স (বছর) *' : 'Reporter Age (Years) *'}
              </label>
              <input
                id="objection-age"
                type="number"
                min={10}
                max={120}
                value={reporterAge}
                onChange={(e) => setReporterAge(e.target.value)}
                placeholder={lang === 'bn' ? 'যেমন: ২৮' : 'e.g. 28'}
                className="w-full px-3.5 py-2.5 text-sm font-mono-tabular bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg text-[#0F172A] focus:outline-none focus:border-[#006A4E]"
              />
              {errors.reporterAge && (
                <p className="mt-1 text-xs text-[#C8102E]">{errors.reporterAge}</p>
              )}
            </div>
          </div>

          <div>
            <label
              htmlFor="objection-title"
              className="block text-xs font-semibold text-[#0F172A] mb-1.5"
            >
              {lang === 'bn' ? 'অভিযোগের সংক্ষিপ্ত শিরোনাম *' : 'Objection Headline *'}
            </label>
            <input
              id="objection-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={
                lang === 'bn'
                  ? 'যেমন: মেয়াদোত্তীর্ণ ঔষধ বিক্রয় অথবা এলাকায় দূষিত পানি সরবরাহ'
                  : 'e.g. Selling Expired Medicine or Unsafe Municipal Water Supply Hazard'
              }
              className="w-full px-3.5 py-2.5 text-sm bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg text-[#0F172A] focus:outline-none focus:border-[#006A4E]"
            />
            {errors.title && <p className="mt-1 text-xs text-[#C8102E]">{errors.title}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label
                htmlFor="objection-establishment"
                className="block text-xs font-semibold text-[#0F172A] mb-1.5"
              >
                {lang === 'bn'
                  ? 'অভিযুক্ত প্রতিষ্ঠান / দোকান / স্থানের নাম *'
                  : 'Establishment / Shop / Location Name *'}
              </label>
              <input
                id="objection-establishment"
                type="text"
                value={establishmentName}
                onChange={(e) => setEstablishmentName(e.target.value)}
                placeholder={
                  lang === 'bn'
                    ? 'ফার্মেসি, সুপারশপ, হাসপাতাল বা স্থানের নাম লিখুন'
                    : 'Pharmacy, Supermarket, Hospital, or Location Name'
                }
                className="w-full px-3.5 py-2.5 text-sm bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg text-[#0F172A] focus:outline-none focus:border-[#006A4E]"
              />
              {errors.establishmentName && (
                <p className="mt-1 text-xs text-[#C8102E]">{errors.establishmentName}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="objection-jurisdiction"
                className="block text-xs font-semibold text-[#0F172A] mb-1.5"
              >
                {lang === 'bn'
                  ? 'জেলা / থানা / সিটি কর্পোরেশন এলাকা *'
                  : 'District / Thana / City Jurisdiction *'}
              </label>
              <input
                id="objection-jurisdiction"
                type="text"
                value={jurisdiction}
                onChange={(e) => setJurisdiction(e.target.value)}
                placeholder={
                  lang === 'bn'
                    ? 'যেমন: ঢাকা মহানগরী — ধানমন্ডি ওয়ার্ড ১২'
                    : 'e.g. Dhaka Metropolitan — Ward 12'
                }
                className="w-full px-3.5 py-2.5 text-sm bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg text-[#0F172A] focus:outline-none focus:border-[#006A4E]"
              />
              {errors.jurisdiction && (
                <p className="mt-1 text-xs text-[#C8102E]">{errors.jurisdiction}</p>
              )}
            </div>
          </div>

          {/* Medicine / Food Batch & Date Stamps (Automatically optional for general civic problems) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div>
              <label
                htmlFor="objection-batch"
                className="block text-xs font-semibold text-[#0F172A] mb-1.5"
              >
                {isBatchCategory
                  ? lang === 'bn'
                    ? 'ব্যাচ বা লট নম্বর *'
                    : 'Batch / Lot Number *'
                  : lang === 'bn'
                  ? 'রেফারেন্স / রসিদ নম্বর (ঐচ্ছিক)'
                  : 'Reference / Receipt No. (Optional)'}
              </label>
              <input
                id="objection-batch"
                type="text"
                value={batchNumber}
                onChange={(e) => setBatchNumber(e.target.value)}
                placeholder={isBatchCategory ? 'e.g. LOT-AB23101' : 'GEN-REF-2026'}
                className="w-full px-3 py-2 text-sm font-mono-tabular bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg text-[#0F172A] focus:outline-none focus:border-[#006A4E]"
              />
              {errors.batchNumber && (
                <p className="mt-1 text-xs text-[#C8102E]">{errors.batchNumber}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="objection-mfg-date"
                className="block text-xs font-semibold text-[#0F172A] mb-1.5"
              >
                {lang === 'bn'
                  ? 'উৎপাদন বা ঘটনার শুরুর তারিখ'
                  : 'Manufactured / Incident Date'}
              </label>
              <input
                id="objection-mfg-date"
                type="date"
                value={manufacturedDate}
                onChange={(e) => setManufacturedDate(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono-tabular bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg text-[#0F172A] focus:outline-none focus:border-[#006A4E]"
              />
            </div>

            <div>
              <label
                htmlFor="objection-exp-date"
                className="block text-xs font-semibold text-[#0F172A] mb-1.5"
              >
                {category === 'expired_medicine' || category === 'expired_food'
                  ? lang === 'bn'
                    ? 'মেয়াদ উত্তীর্ণের তারিখ *'
                    : 'Printed Expiry Date *'
                  : lang === 'bn'
                  ? 'মেয়াদ উত্তীর্ণের তারিখ (যদি থাকে)'
                  : 'Expiry Date (If applicable)'}
              </label>
              <input
                id="objection-exp-date"
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono-tabular bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg text-[#0F172A] focus:outline-none focus:border-[#006A4E]"
              />
              {errors.expiryDate && (
                <p className="mt-1 text-xs text-[#C8102E]">{errors.expiryDate}</p>
              )}
            </div>
          </div>

          {/* Live Automated Expiry Delta & Risk Assessment Strip */}
          <div className="p-3.5 bg-[#F1F5F9] border border-[#CBD5E1] rounded-lg flex flex-wrap items-center justify-between gap-2 text-xs">
            <div>
              <span className="font-semibold text-[#0F172A]">
                {lang === 'bn' ? 'স্বয়ংক্রিয় মেয়াদ বিশ্লেষণ: ' : 'Automated Expiry Assessment: '}
              </span>
              <span
                className={
                  expiryAnalysis.isExpired
                    ? 'font-mono-tabular font-semibold text-[#C8102E]'
                    : 'font-mono-tabular text-[#475569]'
                }
              >
                {expiryText}
              </span>
            </div>
            <div>
              <span className="text-[#475569]">
                {lang === 'bn' ? 'নির্ধারিত ঝুঁকি মাত্রা: ' : 'Assigned Severity Tier: '}
              </span>
              <span className="font-semibold text-[#0F172A]">
                {severityLabels[expiryAnalysis.recommendedSeverity]}
              </span>
            </div>
          </div>

          <div>
            <label
              htmlFor="objection-description"
              className="block text-xs font-semibold text-[#0F172A] mb-1.5"
            >
              {lang === 'bn'
                ? 'অভিযোগের বিস্তারিত বিবরণ ও প্রমাণাদি *'
                : 'Full Details of Objection & Observed Hazard *'}
            </label>
            <textarea
              id="objection-description"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={
                lang === 'bn'
                  ? 'সমস্যার বিস্তারিত বিবরণ, ঔষধ বা খাদ্যের বর্তমান অবস্থা, দোকানের অবস্থান এবং জনস্বাস্থ্য ঝুঁকির পূর্ণাঙ্গ তথ্য লিখুন...'
                  : 'Write the complete details of your objection: product condition, exact location, printed dates, and public impact...'
              }
              className="w-full px-3.5 py-2.5 text-sm bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg text-[#0F172A] focus:outline-none focus:border-[#006A4E]"
            />
            {errors.description && (
              <p className="mt-1 text-xs text-[#C8102E]">{errors.description}</p>
            )}
          </div>

          {/* Client-Side AES-256-GCM Confidential Whistleblower Encryption */}
          <div className="pt-4 border-t border-[#E2E8F0]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-[#006A4E]" />
                <span className="text-sm font-semibold text-[#0F172A]">
                  {lang === 'bn'
                    ? 'গোপনীয় তথ্যদাতা সুরক্ষা (ব্রাউজার এনক্রিপশন)'
                    : 'Client-Side AES-256-GCM Confidential Whistleblower Note'}
                </span>
              </div>
              <label className="inline-flex items-center gap-2 text-xs text-[#475569] cursor-pointer">
                <input
                  type="checkbox"
                  checked={enableEncryption}
                  onChange={(e) => setEnableEncryption(e.target.checked)}
                  className="rounded border-[#CBD5E1] text-[#006A4E] focus:ring-[#006A4E]"
                />
                <span>
                  {lang === 'bn' ? 'এনক্রিপশন সক্রিয় করুন' : 'Enable AES-256-GCM Encryption'}
                </span>
              </label>
            </div>
            <p className="mt-1 text-xs text-[#475569]">
              {lang === 'bn'
                ? 'পাইকারি সরবরাহকারীর চালান বা গোপনীয় সাক্ষীর তথ্য আপনার ব্রাউজারেই ১০০,০০০ ইটারেশন দ্বারা এনক্রিপ্ট হয়ে সার্ভারে জমা হবে।'
                : 'Encrypts sensitive distributor invoices, witness names, or supply-chain leads locally in your browser using PBKDF2 (100,000 SHA-256 iterations) before transmission.'}
            </p>

            {enableEncryption && (
              <div className="mt-4 space-y-4 p-4 bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg">
                <div>
                  <label
                    htmlFor="confidential-note"
                    className="block text-xs font-semibold text-[#0F172A] mb-1"
                  >
                    {lang === 'bn'
                      ? 'গোপনীয় সরবরাহকারী বা গুদামের তথ্য (শুধুমাত্র পাসফ্রেজ দিয়ে পাঠযোগ্য)'
                      : 'Confidential Whistleblower / Supply-Chain Note (Encrypted before upload)'}
                  </label>
                  <textarea
                    id="confidential-note"
                    rows={2}
                    value={confidentialNote}
                    onChange={(e) => setConfidentialNote(e.target.value)}
                    placeholder={
                      lang === 'bn'
                        ? 'ঐচ্ছিক: পাইকারি ডিলারের ইনভয়েস নম্বর, গুদামের অবস্থান বা সাক্ষীর তথ্য লিখুন...'
                        : 'Optional: Enter distributor invoice numbers, warehouse bay details, or witness contact...'
                    }
                    className="w-full px-3 py-2 text-xs bg-white border border-[#CBD5E1] rounded-lg text-[#0F172A]"
                  />
                </div>
                <div>
                  <label
                    htmlFor="encryption-passphrase"
                    className="block text-xs font-semibold text-[#0F172A] mb-1"
                  >
                    {lang === 'bn'
                      ? 'গোপন ডিক্রিপশন পাসফ্রেজ'
                      : 'Encryption Passphrase (Share only with verifying Authority Inspector)'}
                  </label>
                  <input
                    id="encryption-passphrase"
                    type="text"
                    value={encryptionPassphrase}
                    onChange={(e) => setEncryptionPassphrase(e.target.value)}
                    placeholder={
                      lang === 'bn'
                        ? 'কমপক্ষে ৬ অক্ষরের গোপন পাসফ্রেজ লিখুন (যেমন: AEGIS-INSPECT-2026)'
                        : 'Enter at least 6 characters (e.g. AEGIS-INSPECT-2026)'
                    }
                    className="w-full px-3 py-2 text-xs font-mono-tabular bg-white border border-[#CBD5E1] rounded-lg text-[#0F172A]"
                  />
                  {errors.encryptionPassphrase && (
                    <p className="mt-1 text-xs text-[#C8102E]">{errors.encryptionPassphrase}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right 5 Columns: Photo/Video Evidence Uploader & Cryptographic Seal Preview */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white p-6 border border-[#CBD5E1] rounded-xl space-y-5">
            <h3 className="text-lg font-serif-display font-semibold text-[#0F172A] border-b border-[#E2E8F0] pb-3">
              {lang === 'bn'
                ? 'খ অংশ — অভিযোগের ছবি ও ভিডিও প্রমাণ সংযুক্তি'
                : 'Part B — Submit Objection Image & Video Evidence'}
            </h3>

            {/* Media Type Selection & File Input */}
            <div className="space-y-3">
              <label
                htmlFor="evidence-file-upload"
                className="flex flex-col items-center justify-center p-5 border-2 border-dashed border-[#006A4E]/50 rounded-xl bg-[#F8FAFC] hover:bg-[#ECFDF5] transition-colors cursor-pointer text-center"
              >
                <Upload className="w-6 h-6 text-[#006A4E] mb-2" />
                <span className="text-xs font-semibold text-[#0F172A]">
                  {lang === 'bn'
                    ? 'এখানে ক্লিক করে অভিযোগের ছবি বা ভিডিও আপলোড করুন'
                    : 'Click to Upload Objection Photo or Video Evidence'}
                </span>
                <span className="text-[11px] text-[#475569] mt-1">
                  {lang === 'bn'
                    ? 'মোবাইল ক্যামেরা বা গ্যালারি থেকে ছবি (JPG, PNG, WEBP) ও ভিডিও (MP4, WEBM) সমর্থন করে'
                    : 'Supports mobile camera & gallery images (JPG, PNG, WEBP) and video clips (MP4, WEBM)'}
                </span>
                <input
                  id="evidence-file-upload"
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleFileUpload}
                  className="sr-only"
                />
              </label>

              {/* Built-in Preset Evidence Switcher */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-[#475569]">
                  {lang === 'bn' ? 'প্রমাণ নমুনা:' : 'Sample Media:'}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setMediaType('image');
                    setMediaUrl(SAMPLE_MEDICINE_IMAGE);
                    setMediaCaption(
                      lang === 'bn'
                        ? 'ব্লিস্টার প্যাকের গায়ে লট ও মেয়াদ উত্তীর্ণের স্ট্যাম্পের ম্যাক্রো ছবি।'
                        : 'Macro photograph of blister pack lot & expiration stamp.'
                    );
                  }}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded border cursor-pointer ${
                    mediaType === 'image' && mediaUrl === SAMPLE_MEDICINE_IMAGE
                      ? 'bg-[#006A4E] text-white border-[#006A4E]'
                      : 'bg-[#F8FAFC] text-[#0F172A] border-[#CBD5E1]'
                  }`}
                >
                  <ImageIcon className="w-3 h-3" />
                  <span>{lang === 'bn' ? 'ঔষধের ছবি' : 'Medicine Photo'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMediaType('image');
                    setMediaUrl(SAMPLE_FOOD_IMAGE);
                    setMediaCaption(
                      lang === 'bn'
                        ? 'খাদ্য পণ্যের মেয়াদ উত্তীর্ণ বারকোড স্ক্যানের ছবি।'
                        : 'Cold-chain dairy aisle expiration date barcode scan.'
                    );
                  }}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded border cursor-pointer ${
                    mediaType === 'image' && mediaUrl === SAMPLE_FOOD_IMAGE
                      ? 'bg-[#006A4E] text-white border-[#006A4E]'
                      : 'bg-[#F8FAFC] text-[#0F172A] border-[#CBD5E1]'
                  }`}
                >
                  <ImageIcon className="w-3 h-3" />
                  <span>{lang === 'bn' ? 'খাদ্য ও প্রমাণের ছবি' : 'Food / Receipt Photo'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMediaType('video');
                    setMediaUrl(`synthetic-inspection-video:${batchNumber || 'LOT-2026'}`);
                    setMediaCaption(
                      lang === 'bn'
                        ? 'মেয়াদের কালি পরিবর্তনের ইউভি ফরেনসিক ভিডিও ক্লিপ।'
                        : 'Forensic UV macro inspection video clip of tampered expiration ink.'
                    );
                  }}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded border cursor-pointer ${
                    mediaType === 'video'
                      ? 'bg-[#006A4E] text-white border-[#006A4E]'
                      : 'bg-[#F8FAFC] text-[#0F172A] border-[#CBD5E1]'
                  }`}
                >
                  <FileVideo className="w-3 h-3" />
                  <span>{lang === 'bn' ? 'পরিদর্শন ভিডিও' : 'Inspection Video'}</span>
                </button>
              </div>
            </div>

            {/* Live Evidence Preview */}
            <EvidenceMediaViewer
              mediaType={mediaType}
              mediaUrl={mediaUrl}
              mediaCaption={mediaCaption}
              batchNumber={batchNumber || 'GEN-REF-2026'}
              expiryDate={expiryDate}
              compact
              lang={lang}
            />

            <div>
              <label
                htmlFor="evidence-caption"
                className="block text-xs font-semibold text-[#0F172A] mb-1"
              >
                {lang === 'bn' ? 'ছবির বর্ণনা বা ক্যাপশন' : 'Evidence Image / Video Caption'}
              </label>
              <input
                id="evidence-caption"
                type="text"
                value={mediaCaption}
                onChange={(e) => setMediaCaption(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg text-[#0F172A]"
              />
            </div>
          </div>

          {/* Live SHA-256 Cryptographic Seal Box & Submit Button */}
          <div className="bg-[#F8FAFC] border-2 border-[#006A4E] text-[#0F172A] p-6 rounded-xl space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono-tabular font-semibold uppercase tracking-wider text-[#006A4E]">
                {lang === 'bn'
                  ? 'লাইভ ডিজিটাল ক্রিপ্টোগ্রাফিক সিল'
                  : 'LIVE SHA-256 DOSSIER SEAL'}
              </span>
              <Shield className="w-4 h-4 text-[#006A4E]" />
            </div>
            <p className="text-xs font-mono-tabular break-all text-[#0F172A] bg-white p-3 rounded-lg border border-[#CBD5E1]">
              {liveHashPreview ||
                (lang === 'bn'
                  ? 'ডিজিটাল হ্যাশ হিসাব করা হচ্ছে...'
                  : 'Computing cryptographic SHA-256 digest...')}
            </p>
            <p className="text-xs text-[#334155] leading-relaxed">
              {lang === 'bn'
                ? 'অভিযোগ জমা দেওয়ার সাথে সাথে একটি স্বয়ংক্রিয় র‍্যান্ডম অনন্য ট্র্যাকিং নম্বর তৈরি হবে এবং এই হ্যাশটি আপনার নথির সাথে স্থায়ীভাবে যুক্ত হবে।'
                : 'Upon submission, a random unique Tracking Number is generated and permanently bound to this digest so any alteration is mathematically provable.'}
            </p>

            <button
              type="submit"
              disabled={isSubmitting}
              aria-label="Seal & Submit Public Objection"
              className="w-full py-3 px-5 text-sm font-semibold text-white bg-[#006A4E] hover:bg-[#00523C] disabled:opacity-50 rounded-lg transition-colors cursor-pointer"
            >
              {isSubmitting
                ? lang === 'bn'
                  ? 'ডিজিটাল সিল ও ট্র্যাকিং নম্বর তৈরি হচ্ছে...'
                  : 'Encrypting & Sealing Dossier...'
                : lang === 'bn'
                ? 'অভিযোগ সিল ও দাখিল করুন'
                : 'Seal & Submit Public Objection'}
            </button>

            <div className="pt-2 border-t border-[#CBD5E1] flex items-center justify-between text-[11px] text-[#475569]">
              <span className="inline-flex items-center gap-1">
                <UserCheck className="w-3.5 h-3.5 text-[#006A4E]" />
                <span>
                  {lang === 'bn'
                    ? 'মালিকানা ও তদারকি: mdshabbirmia516@gmail.com'
                    : 'Protected by Owner: mdshabbirmia516@gmail.com'}
                </span>
              </span>
            </div>
          </div>
        </div>
      </form>
    </section>
  );
};
