import React from 'react';
import { LanguageMode, UI_TEXT } from '../i18n/translations';

export type ActiveTab = 'registry' | 'submit' | 'track' | 'authority';

interface HeaderProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  lang: LanguageMode;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, onSelectTab, lang }) => {
  const t = UI_TEXT[lang];
  const navItems: { id: ActiveTab; label: string }[] = [
    { id: 'registry', label: t.navRegistry },
    { id: 'submit', label: t.navSubmit },
    { id: 'track', label: t.navTrack },
    { id: 'authority', label: t.navAuthority },
  ];

  return (
    <header className="sticky top-0 z-30 bg-[#FBF9F5]/95 backdrop-blur-xs border-b border-[#E2DCD3]">
      <div className="max-w-[1360px] mx-auto flex items-center justify-between gap-8 px-6 py-4">
        {/* Zone 1: Single text element Brand Wordmark */}
        <a
          href="#registry"
          onClick={(e) => {
            e.preventDefault();
            onSelectTab('registry');
          }}
          className="font-serif-display text-lg sm:text-xl font-bold tracking-tight text-[#14532D] whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#14532D]"
        >
          {t.brandTitle}
        </a>

        {/* Zone 2: 4 concise single-line navigation links */}
        <nav
          aria-label="Primary Navigation"
          className="flex items-center gap-6 overflow-x-auto text-sm font-medium text-[#57534E]"
        >
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <a
                key={item.id}
                href={`#${item.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  onSelectTab(item.id);
                }}
                aria-current={isActive ? 'page' : undefined}
                className={`py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
                  isActive
                    ? 'border-[#14532D] text-[#1C1917] font-semibold'
                    : 'border-transparent hover:text-[#1C1917] hover:border-[#D6CEBE]'
                }`}
              >
                {item.label}
              </a>
            );
          })}
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={() => onSelectTab('submit')}
            className="px-4 py-2 text-xs font-semibold text-white bg-[#14532D] rounded-lg hover:bg-[#0F3F22] transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#14532D]"
          >
            {t.ctaSubmit}
          </button>
        </div>
      </div>
    </header>
  );
};
