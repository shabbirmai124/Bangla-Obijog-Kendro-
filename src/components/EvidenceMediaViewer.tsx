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
      <div className="bg-[#F3EFE6] border border-[#E2DCD3] rounded-lg p-4 text-xs text-[#57534E]">
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
        <div
          className={`relative w-full overflow-hidden rounded-lg bg-[#141413] text-[#FBF9F5] border border-[#292524] ${
            compact ? 'h-48' : 'h-64 sm:h-72'
          }`}
        >
          {isSynthetic ? (
            <div className="w-full h-full flex flex-col justify-between p-5 bg-gradient-to-br from-[#1C1917] via-[#1E293B] to-[#0F172A]">
              <div className="flex items-center justify-between text-xs font-mono-tabular text-[#D6CEBE]">
                <span>
                  {lang === 'bn'
                    ? 'ফরেনসিক ভিডিও আর্কাইভ · ইউভি ম্যাক্রো ফিড'
                    : 'FORENSIC VIDEO ARCHIVE · UV MACRO FEED'}
                </span>
                <span>
                  {lang === 'bn' ? 'ব্যাচ:' : 'BATCH:'} {batchNumber || 'UNSPECIFIED'}
                </span>
              </div>

              <div className="my-auto border border-white/15 rounded-md p-4 bg-black/40 backdrop-blur-xs">
                <p className="text-xs uppercase tracking-widest text-[#93C5FD] font-mono-tabular">
                  {isPlayingSyntheticVideo
                    ? lang === 'bn'
                      ? 'ভিডিও ফ্রেম স্ট্রিম চলছে · ৬০ এফপিএস ম্যাক্রো স্ক্যান'
                      : 'PLAYING FRAME STREAM · 60 FPS MACRO SCAN'
                    : lang === 'bn'
                    ? 'স্থির ফ্রেম ০০:০৬.১৪ · ইউভি ফ্লুরোসেন্স বিশ্লেষণ'
                    : 'PAUSED AT KEYFRAME 00:06.14 · UV FLUORESCENCE MATCH'}
                </p>
                <div className="mt-2 grid grid-cols-2 gap-4 text-xs font-mono-tabular">
                  <div>
                    <span className="text-stone-400 block">
                      {lang === 'bn' ? 'বাইরের কালির ছাপ' : 'OUTER INK STAMP'}
                    </span>
                    <span className="text-amber-300 font-semibold">
                      {lang === 'bn'
                        ? 'রাসায়নিক ওভারপ্রিন্ট শনাক্ত'
                        : 'SOLVENT OVERPRINT DETECTED'}
                    </span>
                  </div>
                  <div>
                    <span className="text-stone-400 block">
                      {lang === 'bn' ? 'ভেতরের খোদাইকৃত মেয়াদ' : 'INNER CRIMP EMBOSS'}
                    </span>
                    <span className="text-rose-400 font-semibold">
                      {lang === 'bn' ? 'মেয়াদ:' : 'EXP:'} {expiryDate || '2026-07-30'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsPlayingSyntheticVideo((prev) => !prev);
                    setVideoFrameProgress((prev) => (prev >= 95 ? 20 : prev + 25));
                  }}
                  aria-label={
                    isPlayingSyntheticVideo ? 'Pause forensic video' : 'Play forensic video'
                  }
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white text-[#1C1917] text-xs font-semibold hover:bg-stone-200 transition-colors shrink-0"
                >
                  {isPlayingSyntheticVideo ? (
                    <>
                      <Pause className="w-3.5 h-3.5" />
                      <span>{lang === 'bn' ? 'বিরতি' : 'Pause Clip'}</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5" />
                      <span>{lang === 'bn' ? 'ভিডিও দেখুন' : 'Inspect Video'}</span>
                    </>
                  )}
                </button>
                <div className="flex-1 h-1.5 bg-white/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#60A5FA] transition-transform duration-150"
                    style={{ width: `${videoFrameProgress}%` }}
                  />
                </div>
                <span className="text-xs font-mono-tabular text-stone-300">
                  {lang === 'bn' ? '০০:১৮' : '00:18'}
                </span>
              </div>
            </div>
          ) : (
            <video
              src={mediaUrl}
              controls
              preload="metadata"
              className="w-full h-full object-contain bg-black"
            >
              {lang === 'bn'
                ? 'আপনার ব্রাউজার ভিডিও প্লেব্যাক সমর্থন করে না।'
                : 'Your browser does not support embedded evidentiary video playback.'}
            </video>
          )}
        </div>
        {mediaCaption && (
          <figcaption className="text-xs font-serif-display italic text-[#57534E] mt-2">
            {mediaCaption}
          </figcaption>
        )}
      </figure>
    );
  }

  // Image evidence with mandatory resilient fallback
  return (
    <figure className="w-full">
      <div
        className={`relative w-full overflow-hidden rounded-lg bg-[#EBE6DF] border border-[#E2DCD3] ${
          compact ? 'h-48' : 'h-64 sm:h-80'
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
          <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-gradient-to-br from-[#F3EFE6] to-[#E5DEC9]">
            <ImageIcon className="w-8 h-8 text-[#57534E] mb-2" />
            <p className="text-sm font-semibold text-[#1C1917]">
              {lang === 'bn'
                ? 'প্রমাণ আলোকচিত্র আর্কাইভে সিলযুক্ত'
                : 'Evidentiary Photograph Sealed in Archive'}
            </p>
            <p className="text-xs font-mono-tabular text-[#57534E] mt-1">
              {lang === 'bn' ? 'ব্যাচ:' : 'Batch:'} {batchNumber} ·{' '}
              {lang === 'bn' ? 'মেয়াদ:' : 'Expiry:'} {expiryDate || 'Recorded'}
            </p>
          </div>
        )}
        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-4 py-2.5 flex items-center justify-between text-xs text-white font-mono-tabular">
          <span>
            {lang === 'bn' ? 'ব্যাচ:' : 'BATCH:'} {batchNumber}
          </span>
          {expiryDate && (
            <span>
              {lang === 'bn' ? 'মুদ্রিত মেয়াদ:' : 'STAMPED EXP:'} {expiryDate}
            </span>
          )}
        </div>
      </div>
      {mediaCaption && (
        <figcaption className="text-xs font-serif-display italic text-[#57534E] mt-2">
          {mediaCaption}
        </figcaption>
      )}
    </figure>
  );
};
