/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header, ActiveTab } from './components/Header';
import { HeroArchiveSection } from './components/HeroArchiveSection';
import { PublicRegistrySection } from './components/PublicRegistrySection';
import { FileObjectionSection } from './components/FileObjectionSection';
import { TrackingPortalSection } from './components/TrackingPortalSection';
import { AuthorityDeskSection } from './components/AuthorityDeskSection';
import { DossierDetailModal } from './components/DossierDetailModal';
import { FeatureAndPermissionModal } from './components/FeatureAndPermissionModal';
import {
  ObjectionRecord,
  NewObjectionInput,
  AuthorityUpdateInput,
  STATUS_LABELS,
} from './types/objection';
import { LanguageMode, UI_TEXT } from './i18n/translations';
import { INITIAL_SEED_OBJECTIONS } from './data/seedObjections';
import {
  generateTrackingId,
  computeDossierSha256,
  encryptConfidentialPayload,
  calculateExpiryAnalysis,
  BLUEPRINT_CONSTRAINTS,
} from './utils/cryptoAndValidation';
import {
  auth,
  db,
  onAuthStateChanged,
  signInWithGoogle,
  signOutUser,
  collection,
  doc,
  setDoc,
  updateDoc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  handleFirestoreError,
  OperationType,
  User,
} from './lib/firebase';
import { Globe, BookOpen, ShieldCheck } from 'lucide-react';

const STORAGE_KEY = 'aegis_civic_objections_v1';
const LANG_STORAGE_KEY = 'bangla_obijog_kendro_lang';
const PERMISSION_LOCK_KEY = 'bangla_obijog_owner_lock_v1';
const OWNER_PERMISSION_CODE = 'BOK-OWNER-2026';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('registry');
  const [lang, setLang] = useState<LanguageMode>(() => {
    try {
      const savedLang = localStorage.getItem(LANG_STORAGE_KEY);
      if (savedLang === 'bn' || savedLang === 'en') return savedLang;
    } catch {
      // default to Bangla ('bn')
    }
    return 'bn';
  });

  const [requireOwnerPermission, setRequireOwnerPermission] = useState<boolean>(() => {
    try {
      return localStorage.getItem(PERMISSION_LOCK_KEY) === 'true';
    } catch {
      return false;
    }
  });
  const [isFeatureGuideOpen, setIsFeatureGuideOpen] = useState<boolean>(false);

  const handleToggleRequireOwnerPermission = (val: boolean) => {
    setRequireOwnerPermission(val);
    try {
      localStorage.setItem(PERMISSION_LOCK_KEY, String(val));
    } catch {
      // ignore
    }
  };

  const [objections, setObjections] = useState<ObjectionRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // Fallback to deterministic seed dossiers
    }
    return INITIAL_SEED_OBJECTIONS;
  });

  const [trackedCode, setTrackedCode] = useState<string>('OBJ-2026-849201');
  const [selectedAuthorityDossierId, setSelectedAuthorityDossierId] = useState<string>(
    INITIAL_SEED_OBJECTIONS[0].id
  );
  const [inspectedModalDossier, setInspectedModalDossier] = useState<ObjectionRecord | null>(
    null
  );

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState<boolean>(false);

  const handleChangeLang = (nextLang: LanguageMode) => {
    setLang(nextLang);
    try {
      localStorage.setItem(LANG_STORAGE_KEY, nextLang);
    } catch {
      // ignore
    }
  };

  // Sync html lang attribute, font family class, document title, and Alt+L shortcut
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.classList.remove('lang-bn', 'lang-en');
    document.documentElement.classList.add(lang === 'bn' ? 'lang-bn' : 'lang-en');
    document.title =
      lang === 'bn'
        ? 'বাংলা অভিযোগ কেন্দ্র — জাতীয় জনঅভিযোগ ও নিয়ন্ত্রক যাচাই বাতায়ন'
        : 'Bangla Obijog Kendro — National Public Objection & Regulatory Verification Portal';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && (e.key === 'l' || e.key === 'L')) {
        e.preventDefault();
        handleChangeLang(lang === 'bn' ? 'en' : 'bn');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lang]);

  // Sync local state to localStorage for immediate cross-reload persistence
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(objections));
    } catch {
      // Ignore quota errors
    }
  }, [objections]);

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  // Attach Firestore listener for public objections when auth is ready and user is authenticated
  useEffect(() => {
    if (!isAuthReady || !currentUser) return;

    const objectionsPath = 'objections';
    const q = query(collection(db, objectionsPath), where('visibility', '==', 'public'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (snapshot.empty) return;
        const cloudDocs: ObjectionRecord[] = snapshot.docs.map((docSnap) => {
          const d = docSnap.data();
          const createdAtStr =
            d.createdAt && typeof d.createdAt.toDate === 'function'
              ? d.createdAt.toDate().toISOString()
              : typeof d.createdAt === 'string'
              ? d.createdAt
              : new Date().toISOString();
          const updatedAtStr =
            d.updatedAt && typeof d.updatedAt.toDate === 'function'
              ? d.updatedAt.toDate().toISOString()
              : typeof d.updatedAt === 'string'
              ? d.updatedAt
              : createdAtStr;

          return {
            id: docSnap.id,
            trackingId: String(d.trackingId || ''),
            title: String(d.title || ''),
            category: d.category || 'expired_medicine',
            severity: d.severity || 'elevated',
            status: d.status || 'submitted',
            visibility: d.visibility || 'public',
            establishmentName: String(d.establishmentName || ''),
            jurisdiction: String(d.jurisdiction || ''),
            batchNumber: String(d.batchNumber || ''),
            expiryDate: String(d.expiryDate || ''),
            manufacturedDate: String(d.manufacturedDate || ''),
            description: String(d.description || ''),
            sha256Hash: String(d.sha256Hash || ''),
            isEncrypted: Boolean(d.isEncrypted),
            encryptedPayload: String(d.encryptedPayload || ''),
            encryptionIv: String(d.encryptionIv || ''),
            mediaType: d.mediaType || 'none',
            mediaUrl: String(d.mediaUrl || ''),
            mediaCaption: String(d.mediaCaption || ''),
            authorId: String(d.authorId || ''),
            reporterAlias: String(d.reporterAlias || 'Citizen Observer'),
            authorityBadgeId: String(d.authorityBadgeId || ''),
            authorityNote: String(d.authorityNote || ''),
            enforcementAction: String(d.enforcementAction || ''),
            createdAt: createdAtStr,
            updatedAt: updatedAtStr,
          };
        });

        setObjections((prev) => {
          const byId = new Map<string, ObjectionRecord>();
          for (const item of prev) byId.set(item.id, item);
          for (const cloudItem of cloudDocs) {
            const existing = byId.get(cloudItem.id);
            byId.set(cloudItem.id, {
              ...cloudItem,
              auditTrail: existing?.auditTrail || [
                {
                  id: `aud_${cloudItem.id}`,
                  timestamp: cloudItem.createdAt,
                  actorRole: 'citizen',
                  actorLabel: cloudItem.reporterAlias,
                  actionTitle: 'Dossier Synchronized from Cloud Ledger',
                  detail: `Tracking ID ${cloudItem.trackingId} verified on Firestore.`,
                  statusAfter: cloudItem.status,
                },
              ],
            });
          }
          return Array.from(byId.values());
        });
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, objectionsPath);
      }
    );

    return () => unsubscribe();
  }, [isAuthReady, currentUser]);

  const handleSubmitObjection = async (input: NewObjectionInput): Promise<ObjectionRecord> => {
    const trackingId = generateTrackingId();
    const docId = `obj_${Date.now()}_${trackingId.slice(-6).toLowerCase()}`;
    const nowIso = new Date().toISOString();

    const sanitizedTitle = input.title
      .trim()
      .slice(0, BLUEPRINT_CONSTRAINTS.title.maxLength);
    const sanitizedEstablishment = input.establishmentName
      .trim()
      .slice(0, BLUEPRINT_CONSTRAINTS.establishmentName.maxLength);
    const sanitizedJurisdiction = input.jurisdiction
      .trim()
      .slice(0, BLUEPRINT_CONSTRAINTS.jurisdiction.maxLength);
    const sanitizedBatch = input.batchNumber
      .trim()
      .slice(0, BLUEPRINT_CONSTRAINTS.batchNumber.maxLength);
    const sanitizedExpiry = input.expiryDate
      .trim()
      .slice(0, BLUEPRINT_CONSTRAINTS.expiryDate.maxLength);
    const sanitizedMfg = input.manufacturedDate
      .trim()
      .slice(0, BLUEPRINT_CONSTRAINTS.manufacturedDate.maxLength);
    const sanitizedDescription = input.description
      .trim()
      .slice(0, BLUEPRINT_CONSTRAINTS.description.maxLength);
    const sanitizedAlias = input.reporterAlias
      .trim()
      .slice(0, BLUEPRINT_CONSTRAINTS.reporterAlias.maxLength);
    const sanitizedMediaUrl = input.mediaUrl.slice(
      0,
      BLUEPRINT_CONSTRAINTS.mediaUrl.maxLength
    );
    const sanitizedCaption = input.mediaCaption
      .trim()
      .slice(0, BLUEPRINT_CONSTRAINTS.mediaCaption.maxLength);

    const sha256Hash = await computeDossierSha256({
      trackingId,
      title: sanitizedTitle,
      category: input.category,
      establishmentName: sanitizedEstablishment,
      jurisdiction: sanitizedJurisdiction,
      batchNumber: sanitizedBatch,
      expiryDate: sanitizedExpiry,
      manufacturedDate: sanitizedMfg,
      description: sanitizedDescription,
    });

    const isEncrypted = Boolean(
      input.confidentialNote?.trim() && input.encryptionPassphrase?.trim()
    );
    let encryptedPayload = '';
    let encryptionIv = '';
    if (isEncrypted && input.confidentialNote && input.encryptionPassphrase) {
      const enc = await encryptConfidentialPayload(
        input.confidentialNote.trim(),
        input.encryptionPassphrase.trim()
      );
      encryptedPayload = enc.encryptedPayload.slice(
        0,
        BLUEPRINT_CONSTRAINTS.encryptedPayload.maxLength
      );
      encryptionIv = enc.encryptionIv.slice(
        0,
        BLUEPRINT_CONSTRAINTS.encryptionIv.maxLength
      );
    }

    const expiryAnalysis = calculateExpiryAnalysis(sanitizedExpiry, input.category);
    const authorId = currentUser?.uid
      ? currentUser.uid.replace(/[^a-zA-Z0-9_\-]/g, '_')
      : 'citizen_local_session';

    const sanitizedAge = input.reporterAge?.trim() || '28';

    const newRecord: ObjectionRecord = {
      id: docId,
      trackingId,
      title: sanitizedTitle,
      category: input.category,
      severity: expiryAnalysis.recommendedSeverity,
      status: 'submitted',
      visibility: input.visibility || 'public',
      establishmentName: sanitizedEstablishment,
      jurisdiction: sanitizedJurisdiction,
      batchNumber: sanitizedBatch,
      expiryDate: sanitizedExpiry,
      manufacturedDate: sanitizedMfg,
      description: sanitizedDescription,
      sha256Hash,
      isEncrypted,
      encryptedPayload,
      encryptionIv,
      mediaType: input.mediaType,
      mediaUrl: sanitizedMediaUrl,
      mediaCaption: sanitizedCaption,
      authorId,
      reporterAlias: sanitizedAlias,
      reporterAge: sanitizedAge,
      authorityBadgeId: '',
      authorityNote: '',
      enforcementAction: '',
      createdAt: nowIso,
      updatedAt: nowIso,
      auditTrail: [
        {
          id: `aud_${Date.now()}_1`,
          timestamp: nowIso,
          actorRole: 'citizen',
          actorLabel: sanitizedAlias,
          actionTitle:
            lang === 'bn'
              ? 'জনস্বার্থে অভিযোগ দাখিল ও প্রমাণ সংযুক্ত'
              : 'Public Objection Filed & Media Attached',
          detail:
            lang === 'bn'
              ? `${sanitizedEstablishment}-এ ব্যাচ ${sanitizedBatch} সংক্রান্ত অভিযোগ দাখিলকৃত।`
              : `Batch ${sanitizedBatch} reported at ${sanitizedEstablishment} (${expiryAnalysis.statusLabel}).`,
          statusAfter: 'submitted',
        },
        {
          id: `aud_${Date.now()}_2`,
          timestamp: nowIso,
          actorRole: 'system_crypto',
          actorLabel:
            lang === 'bn'
              ? 'বাংলা অভিযোগ কেন্দ্র ডিজিটাল লেজার'
              : 'Bangla Obijog Kendro SHA-256 Ledger',
          actionTitle:
            lang === 'bn'
              ? 'ক্রিপ্টোগ্রাফিক ইন্টিগ্রিটি হ্যাশ সিলযুক্ত'
              : 'Cryptographic Integrity Hash Sealed',
          detail:
            lang === 'bn'
              ? `অনন্য ট্র্যাকিং নম্বর ${trackingId} ও ডিজিটাল সিল ${sha256Hash.slice(0, 16)}… বরাদ্দকৃত।`
              : `Assigned Tracking ID ${trackingId} with SHA-256 digest ${sha256Hash.slice(
                  0,
                  16
                )}…`,
          statusAfter: 'submitted',
        },
      ],
    };

    setObjections((prev) => [newRecord, ...prev]);
    setTrackedCode(trackingId);
    setSelectedAuthorityDossierId(docId);

    if (currentUser && currentUser.emailVerified) {
      const firestorePath = `objections/${docId}`;
      try {
        await setDoc(doc(db, 'objections', docId), {
          trackingId: newRecord.trackingId,
          title: newRecord.title,
          category: newRecord.category,
          severity: newRecord.severity,
          status: newRecord.status,
          visibility: newRecord.visibility,
          establishmentName: newRecord.establishmentName,
          jurisdiction: newRecord.jurisdiction,
          batchNumber: newRecord.batchNumber,
          expiryDate: newRecord.expiryDate,
          manufacturedDate: newRecord.manufacturedDate,
          description: newRecord.description,
          sha256Hash: newRecord.sha256Hash,
          isEncrypted: newRecord.isEncrypted,
          encryptedPayload: newRecord.encryptedPayload,
          encryptionIv: newRecord.encryptionIv,
          mediaType: newRecord.mediaType,
          mediaUrl: newRecord.mediaUrl,
          mediaCaption: newRecord.mediaCaption,
          authorId: newRecord.authorId,
          reporterAlias: newRecord.reporterAlias,
          authorityBadgeId: '',
          authorityNote: '',
          enforcementAction: '',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, firestorePath);
      }
    }

    return newRecord;
  };

  const handleAuthorityUpdate = async (update: AuthorityUpdateInput): Promise<void> => {
    const nowIso = new Date().toISOString();
    const sanitizedBadge = update.authorityBadgeId
      .trim()
      .slice(0, BLUEPRINT_CONSTRAINTS.authorityBadgeId.maxLength);
    const sanitizedNote = update.authorityNote
      .trim()
      .slice(0, BLUEPRINT_CONSTRAINTS.authorityNote.maxLength);
    const sanitizedEnforcement = update.enforcementAction
      .trim()
      .slice(0, BLUEPRINT_CONSTRAINTS.enforcementAction.maxLength);

    setObjections((prev) =>
      prev.map((item) => {
        if (item.id !== update.objectionId) return item;
        const nextTrail = [
          ...(item.auditTrail || []),
          {
            id: `aud_${Date.now()}`,
            timestamp: nowIso,
            actorRole: 'regulatory_authority' as const,
            actorLabel:
              lang === 'bn'
                ? `নিয়ন্ত্রক কর্তৃপক্ষ (${sanitizedBadge})`
                : `Regulatory Authority (${sanitizedBadge})`,
            actionTitle:
              lang === 'bn'
                ? 'সরকারি যাচাই অবস্থা আপডেট করা হয়েছে'
                : `Status Updated to ${STATUS_LABELS[update.status]}`,
            detail: `${sanitizedNote}${
              sanitizedEnforcement
                ? lang === 'bn'
                  ? ` | আদেশ: ${sanitizedEnforcement}`
                  : ` | Directive: ${sanitizedEnforcement}`
                : ''
            }`,
            statusAfter: update.status,
          },
        ];
        return {
          ...item,
          status: update.status,
          severity: update.severity,
          authorityBadgeId: sanitizedBadge,
          authorityNote: sanitizedNote,
          enforcementAction: sanitizedEnforcement,
          updatedAt: nowIso,
          auditTrail: nextTrail,
        };
      })
    );

    if (
      currentUser &&
      currentUser.emailVerified &&
      currentUser.email === 'mdshabbirmia516@gmail.com' &&
      !update.objectionId.startsWith('obj_seed_')
    ) {
      const firestorePath = `objections/${update.objectionId}`;
      try {
        await updateDoc(doc(db, 'objections', update.objectionId), {
          status: update.status,
          severity: update.severity,
          authorityBadgeId: sanitizedBadge,
          authorityNote: sanitizedNote,
          enforcementAction: sanitizedEnforcement,
          updatedAt: serverTimestamp(),
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, firestorePath);
      }
    }
  };

  const handleCitizenAppendStatement = async (
    objectionId: string,
    additionalStatement: string
  ): Promise<void> => {
    const nowIso = new Date().toISOString();
    const target = objections.find((o) => o.id === objectionId);
    if (!target) return;

    const updatedDescription = `${target.description}\n[${
      lang === 'bn' ? 'নাগরিক সংযোজন' : 'Citizen Addendum'
    } ${nowIso.slice(0, 10)}]: ${additionalStatement}`.slice(
      0,
      BLUEPRINT_CONSTRAINTS.description.maxLength
    );

    const newHash = await computeDossierSha256({
      trackingId: target.trackingId,
      title: target.title,
      category: target.category,
      establishmentName: target.establishmentName,
      jurisdiction: target.jurisdiction,
      batchNumber: target.batchNumber,
      expiryDate: target.expiryDate,
      manufacturedDate: target.manufacturedDate,
      description: updatedDescription,
    });

    setObjections((prev) =>
      prev.map((item) => {
        if (item.id !== objectionId) return item;
        return {
          ...item,
          description: updatedDescription,
          sha256Hash: newHash,
          updatedAt: nowIso,
          auditTrail: [
            ...(item.auditTrail || []),
            {
              id: `aud_cit_${Date.now()}`,
              timestamp: nowIso,
              actorRole: 'citizen',
              actorLabel: item.reporterAlias,
              actionTitle:
                lang === 'bn'
                  ? 'অতিরিক্ত নাগরিক তথ্য সংযোজিত'
                  : 'Supplementary Citizen Addendum Appended',
              detail: additionalStatement,
              statusAfter: item.status,
            },
          ],
        };
      })
    );
  };

  const handleQuickTrack = (trackingId: string) => {
    setTrackedCode(trackingId);
    setActiveTab('track');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleVerifyInAuthorityDesk = (objectionId: string) => {
    setSelectedAuthorityDossierId(objectionId);
    setActiveTab('authority');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const t = UI_TEXT[lang];

  return (
    <div
      className={`min-h-screen flex flex-col bg-[#FBF9F5] text-[#1C1917] ${
        lang === 'bn' ? 'lang-bn' : 'lang-en'
      }`}
    >
      {/* Strict 3-Zone Top Bar Header */}
      <Header activeTab={activeTab} onSelectTab={setActiveTab} lang={lang} />

      {/* Always-Visible Global Government Utility, Permission & Language Switcher Bar */}
      <div
        data-testid="global-language-ribbon"
        className="sticky top-[61px] z-20 border-b border-[#E2DCD3] bg-[#F3EFE6]/95 backdrop-blur-xs px-6 py-2"
      >
        <div className="max-w-[1360px] mx-auto flex flex-wrap items-center justify-between gap-3 text-xs text-[#57534E]">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-[#14532D]">{t.govHeaderBanner}</span>
            <span aria-hidden="true" className="hidden md:inline">
              ·
            </span>
            <span className="hidden md:inline">{t.securityStandardLabel}</span>
            <span aria-hidden="true">·</span>
            <span className="font-medium text-[#1C1917]">{t.helplineLabel}</span>
          </div>

          {/* Persistent Feature/Permission Guide Button & One-Click Language Switcher */}
          <div className="flex items-center gap-2.5 shrink-0 ml-auto">
            <button
              type="button"
              data-testid="open-feature-guide-btn"
              onClick={() => setIsFeatureGuideOpen(true)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-[#14532D] bg-white border border-[#14532D]/30 rounded-md hover:bg-[#EBE6DF] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>
                {lang === 'bn'
                  ? 'বৈশিষ্ট্য ও অনুমতি নীতিমালা'
                  : 'Features & Owner Permission'}
              </span>
            </button>

            <span className="hidden sm:inline font-medium text-[#1C1917]">
              {t.langSwitchLabel}
            </span>
            <div
              role="group"
              aria-label="Global Language Switcher"
              className="inline-flex items-center gap-1 p-0.5 bg-[#E2DCD3] rounded-md border border-[#D6CEBE]"
            >
              <Globe className="w-3.5 h-3.5 text-[#14532D] ml-1.5 mr-0.5 shrink-0" />
              <button
                type="button"
                data-testid="lang-btn-bn"
                onClick={() => handleChangeLang('bn')}
                aria-pressed={lang === 'bn'}
                className={`px-3 py-1 text-xs font-semibold rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  lang === 'bn'
                    ? 'bg-[#14532D] text-white shadow-xs'
                    : 'text-[#1C1917] hover:bg-white/70'
                }`}
              >
                বাংলা
              </button>
              <button
                type="button"
                data-testid="lang-btn-en"
                onClick={() => handleChangeLang('en')}
                aria-pressed={lang === 'en'}
                className={`px-3 py-1 text-xs font-semibold rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  lang === 'en'
                    ? 'bg-[#14532D] text-white shadow-xs'
                    : 'text-[#1C1917] hover:bg-white/70'
                }`}
              >
                English
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Viewport */}
      <main className="flex-1">
        {activeTab === 'registry' && (
          <>
            <HeroArchiveSection
              objections={objections}
              onQuickTrack={handleQuickTrack}
              onNavigateTab={setActiveTab}
              lang={lang}
            />
            <PublicRegistrySection
              objections={objections}
              onInspectDossier={(dossier) => setInspectedModalDossier(dossier)}
              onTrackObjection={handleQuickTrack}
              onVerifyInAuthorityDesk={handleVerifyInAuthorityDesk}
              onFileNewClick={() => setActiveTab('submit')}
              lang={lang}
            />
          </>
        )}

        {activeTab === 'submit' && (
          <FileObjectionSection
            onSubmitObjection={handleSubmitObjection}
            onTrackNewlyCreated={handleQuickTrack}
            lang={lang}
            requireOwnerPermission={requireOwnerPermission}
            ownerPermissionCode={OWNER_PERMISSION_CODE}
            currentUserEmail={currentUser?.email}
            onOpenFeatureGuide={() => setIsFeatureGuideOpen(true)}
          />
        )}

        {activeTab === 'track' && (
          <TrackingPortalSection
            objections={objections}
            initialTrackingId={trackedCode}
            onSelectTrackingId={setTrackedCode}
            onCitizenAppendStatement={handleCitizenAppendStatement}
            onJumpToAuthorityDesk={handleVerifyInAuthorityDesk}
            lang={lang}
          />
        )}

        {activeTab === 'authority' && (
          <AuthorityDeskSection
            objections={objections}
            selectedObjectionId={selectedAuthorityDossierId}
            onSelectObjectionId={setSelectedAuthorityDossierId}
            onAuthorityUpdate={handleAuthorityUpdate}
            currentUser={currentUser}
            onSignInGoogle={async () => {
              try {
                await signInWithGoogle();
              } catch {
                // Popup closed by user
              }
            }}
            onSignOut={signOutUser}
            lang={lang}
          />
        )}
      </main>

      {/* Dossier Detail Inspection Modal */}
      <DossierDetailModal
        dossier={inspectedModalDossier}
        onClose={() => setInspectedModalDossier(null)}
        onOpenInTracker={handleQuickTrack}
        onOpenInAuthorityDesk={handleVerifyInAuthorityDesk}
        lang={lang}
        onChangeLang={handleChangeLang}
      />

      {/* Bilingual Feature Explanation & Owner Permission Modal */}
      <FeatureAndPermissionModal
        isOpen={isFeatureGuideOpen}
        onClose={() => setIsFeatureGuideOpen(false)}
        lang={lang}
        onChangeLang={handleChangeLang}
        requireOwnerPermission={requireOwnerPermission}
        onToggleRequireOwnerPermission={handleToggleRequireOwnerPermission}
        ownerPermissionCode={OWNER_PERMISSION_CODE}
        currentUserEmail={currentUser?.email}
        onNavigateToSubmit={() => setActiveTab('submit')}
      />

      {/* Official Government Portal Footer */}
      <footer className="border-t border-[#E2DCD3] bg-[#F3EFE6] py-8 px-6 mt-16">
        <div className="max-w-[1360px] mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-[#57534E]">
          <div>
            <p className="font-serif-display font-semibold text-[#14532D] text-sm">
              {lang === 'bn'
                ? 'বাংলা অভিযোগ কেন্দ্র — জাতীয় জনঅভিযোগ ও নিয়ন্ত্রক যাচাই বাতায়ন'
                : 'Bangla Obijog Kendro — National Public Grievance & Verification Portal'}
            </p>
            <p className="mt-1">
              {lang === 'bn'
                ? 'সর্বস্বত্ব সংরক্ষিত: mdshabbirmia516@gmail.com · ক্রিপ্টোগ্রাফিক চেইন-অব-কাস্টডি · ক্লায়েন্ট-সাইড এনক্রিপশন · ডিজিটাল প্রমাণ সিল'
                : 'All Rights Reserved by Owner: mdshabbirmia516@gmail.com · Cryptographic Chain-of-Custody · AES-256-GCM Encryption · SHA-256 Seal'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-5">
            <button
              type="button"
              onClick={() => setIsFeatureGuideOpen(true)}
              className="inline-flex items-center gap-1 font-semibold text-[#14532D] hover:underline cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>
                {lang === 'bn'
                  ? 'বৈশিষ্ট্য ও মালিকানা নীতিমালা'
                  : 'Features & Owner Permission'}
              </span>
            </button>
            <button
              type="button"
              onClick={() => handleChangeLang(lang === 'bn' ? 'en' : 'bn')}
              className="font-semibold text-[#14532D] hover:underline cursor-pointer"
            >
              {lang === 'bn' ? 'English' : 'বাংলা'}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('registry')}
              className="hover:text-[#1C1917] transition-colors cursor-pointer"
            >
              {lang === 'bn' ? 'জনসাধারণের নথি' : 'Public Registry'}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('submit')}
              className="hover:text-[#1C1917] transition-colors cursor-pointer"
            >
              {lang === 'bn' ? 'অভিযোগ দাখিল' : 'File Objection'}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('track')}
              className="hover:text-[#1C1917] transition-colors cursor-pointer"
            >
              {lang === 'bn' ? 'অভিযোগ ট্র্যাকিং' : 'Track Dossier'}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('authority')}
              className="hover:text-[#1C1917] transition-colors cursor-pointer"
            >
              {lang === 'bn' ? 'কর্তৃপক্ষ ডেস্ক' : 'Authority Desk'}
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
