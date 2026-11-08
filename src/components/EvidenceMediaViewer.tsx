import React, { useState } from 'react';
import { EvidenceMediaType } from '../types/objection';
import { LanguageMode } from '../i18n/translations';
import { Image as ImageIcon, Play, Pause } from 'lucide-react';

interface EvidenceMediaViewerProps {
  mediaType: EvidenceMediaType;
  mediaUrl: string;
  mediaCaption: string;
  batchNumber: string;
  expiryDate: string;
  compact?: boolean;
  lang?: LanguageMode;
}

export const EvidenceMediaViewer: React.FC<EvidenceMediaViewerProps> = ({
  mediaType,
  mediaUrl,
  mediaCaption,
  batchNumber,
  expiryDate,
  compact = false,
  lang = 'bn',
}) => {
  const [imgError, setImgError] = useState(false);
  const [isPlayingSyntheticVideo, setIsPlayingSyntheticVideo] = useState(false);
  const [videoFrameProgress, setVideoFrameProgress] = useState(35);

  if (mediaType === 'none' || !mediaUrl) {
    return (
      <div className="bg-[#F1F5F9] border border-[#CBD5E1] rounded-lg p-4 text-xs text-[#475569]">
        {lang === 'bn'
          ? 'এই নথিতে কোনো দৃশ্যমান ছবি বা ভিডিও সংযুক্ত করা হয়নি। শুধুমাত্র ক্রিপ্টোগ্রাফিক লিখিত বিবৃতি রয়েছে।'
          : 'No visual media attached to this dossier. Cryptographic text statement only.'}
      </div>
    );
  }

  // Handle synthetic forensic inspection video clip or real uploaded video data/blob URL
  if (mediaType === 'video') {
    const isSynthetic = mediaUrl.startsWith('synthetic-inspection-video:');
    return (
      <figure className="w-full">
        <div className="w-full overflow-hidden rounded-lg bg-white border border-[#CBD5E1]">
          {isSynthetic ? (
            <div className="flex flex-col">
              {/* Top Header Bar — Clean Bangladesh Government Institutional Slate */}
              <div className="px-4 py-2.5 bg-[#F1F5F9] border-b border-[#CBD5E1] flex items-center justify-between text-xs font-mono-tabular text-[#0F172A]">
                <span className="font-semibold text-[#006A4E]">
                  {lang === 'bn'
                    ? 'ভিডিও প্রমাণ নথি · ল্যাবরেটরি ম্যাক্রো যাচাই'
                    : 'VIDEO EVIDENCE RECORD · LAB MACRO INSPECTION'}
                </span>
                <span className="text-[#334155] font-medium">
                  {lang === 'bn' ? 'ব্যাচ:' : 'BATCH:'} {batchNumber || 'UNSPECIFIED'}
                </span>
              </div>

              {/* Visual Video Frame with Real Macro Photograph & Clean Light Inspection Overlay */}
              <div className={`relative w-full overflow-hidden bg-[#F8FAFC] ${compact ? 'h-36' : 'h-44 sm:h-48'}`}>
                <img
                  src="/src/assets/images/evidence_medicine_blister_batch_1794048839663.jpg"
                  alt={mediaCaption || `Video frame for batch ${batchNumber}`}
                  className={`w-full h-full object-cover transition-transform duration-500 ${
                    isPlayingSyntheticVideo ? 'scale-105' : 'scale-100'
                  }`}
                />
                <div className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded bg-white/95 border border-[#CBD5E1] text-[11px] font-mono-tabular font-semibold text-[#0F172A] shadow-2xs">
                  {isPlayingSyntheticVideo
                    ? lang === 'bn'
                      ? 'চলমান দৃশ্য · ০০:০৯ / ০০:১৮'
                      : 'PLAYING CLIP · 00:09 / 00:18'
                    : lang === 'bn'
                    ? 'স্থির ফ্রেম · ০০:০৬ / ০০:১৮'
                    : 'KEYFRAME · 00:06 / 00:18'}
                </div>
              </div>

              {/* Clean Institutional Findings Row (No Dark/Neon AI Colors) */}
              <div className="p-3.5 bg-[#F8FAFC] border-t border-[#CBD5E1] grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="bg-white p-2.5 rounded border border-[#CBD5E1]">
                  <span className="text-[#475569] block text-[11px]">
                    {lang === 'bn' ? 'বাইরের মোড়কের ছাপ যাচাই' : 'Outer Packaging Stamp Check'}
                  </span>
                  <span className="text-[#0F172A] font-semibold font-mono-tabular">
                    {lang === 'bn'
                      ? 'কালি মুছে পুনরায় মুদ্রণ শনাক্ত'
                      : 'Overprinted Expiry Ink Detected'}
                  </span>
                </div>
                <div className="bg-white p-2.5 rounded border border-[#CBD5E1]">
                  <span className="text-[#475569] block text-[11px]">
                    {lang === 'bn' ? 'ভেতরের খোদাইকৃত প্রকৃত মেয়াদ' : 'Inner Embossed Original Expiry'}
                  </span>
                  <span className="text-[#C8102E] font-semibold font-mono-tabular">
                    {lang === 'bn' ? 'মেয়াদ:' : 'EXP:'} {expiryDate || '2026-07-30'}
                  </span>
                </div>
              </div>

              {/* Clean Bangladesh Government Bottle Green Playback Controls */}
              <div className="px-4 py-2.5 bg-white border-t border-[#CBD5E1] flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsPlayingSyntheticVideo((prev) => !prev);
                    setVideoFrameProgress((prev) => (prev >= 95 ? 25 : prev + 25));
                  }}
                  aria-label={
                    isPlayingSyntheticVideo ? 'Pause forensic video' : 'Play forensic video'
                  }
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#006A4E] text-white text-xs font-semibold hover:bg-[#00523C] transition-colors shrink-0 cursor-pointer"
                >
                  {isPlayingSyntheticVideo ? (
                    <>
                      <Pause className="w-3.5 h-3.5" />
                      <span>{lang === 'bn' ? 'বিরতি দিন' : 'Pause Video'}</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5" />
                      <span>{lang === 'bn' ? 'ভিডিও দেখুন' : 'Inspect Video'}</span>
                    </>
                  )}
                </button>
                <div className="flex-1 h-2 bg-[#E2E8F0] rounded-full overflow-hidden border border-[#CBD5E1]">
                  <div
                    className="h-full bg-[#006A4E] transition-all duration-200"
                    style={{ width: `${videoFrameProgress}%` }}
                  />
                </div>
                <span className="text-xs font-mono-tabular font-medium text-[#334155]">
                  {lang === 'bn' ? '০০:১৮' : '00:18'}
                </span>
              </div>
            </div>
          ) : (
            <video
              src={mediaUrl}
              controls
              preload="metadata"
              className={`w-full object-contain bg-[#F8FAFC] ${compact ? 'h-48' : 'h-64 sm:h-72'}`}
            >
              {lang === 'bn'
                ? 'আপনার ব্রাউজার ভিডিও প্লেব্যাক সমর্থন করে না।'
                : 'Your browser does not support embedded evidentiary video playback.'}
            </video>
          )}
        </div>
        {mediaCaption && (
          <figcaption className="text-xs font-serif-display italic text-[#475569] mt-2">
            {mediaCaption}
          </figcaption>
        )}
      </figure>
    );
  }

  // Image evidence with mandatory resilient fallback
  return (
    <figure className="w-full">
      <div className="w-full overflow-hidden rounded-lg bg-white border border-[#CBD5E1]">
        <div
          className={`relative w-full overflow-hidden bg-[#F1F5F9] ${
            compact ? 'h-44' : 'h-60 sm:h-72'
          }`}
        >
          {!imgError ? (
            <img
              src={mediaUrl}
              alt={mediaCaption || `Inspection evidence for batch ${batchNumber}`}
              referrerPolicy="no-referrer"
              onError={() => setImgError(true)}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-[#F8FAFC]">
              <ImageIcon className="w-8 h-8 text-[#475569] mb-2" />
              <p className="text-sm font-semibold text-[#0F172A]">
                {lang === 'bn'
                  ? 'প্রমাণ আলোকচিত্র আর্কাইভে সিলযুক্ত'
                  : 'Evidentiary Photograph Sealed in Archive'}
              </p>
              <p className="text-xs font-mono-tabular text-[#475569] mt-1">
                {lang === 'bn' ? 'ব্যাচ:' : 'Batch:'} {batchNumber} ·{' '}
                {lang === 'bn' ? 'মেয়াদ:' : 'Expiry:'} {expiryDate || 'Recorded'}
              </p>
            </div>
          )}
        </div>
        <div className="bg-[#F8FAFC] border-t border-[#CBD5E1] px-3.5 py-2 flex items-center justify-between text-xs text-[#0F172A] font-mono-tabular">
          <span className="font-semibold text-[#006A4E]">
            {lang === 'bn' ? 'ব্যাচ:' : 'BATCH:'} {batchNumber}
          </span>
          {expiryDate && (
            <span className="font-semibold text-[#C8102E]">
              {lang === 'bn' ? 'মুদ্রিত মেয়াদ:' : 'STAMPED EXP:'} {expiryDate}
            </span>
          )}
        </div>
      </div>
      {mediaCaption && (
        <figcaption className="text-xs font-serif-display italic text-[#475569] mt-2">
          {mediaCaption}
        </figcaption>
      )}
    </figure>
  );
};
