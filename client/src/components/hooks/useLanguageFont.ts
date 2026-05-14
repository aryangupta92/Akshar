// Hook: lazy-loads the correct Google Font for each Indian language
// This satisfies the i18n spec requirement for lazy font loading

const FONT_MAP: Record<string, string> = {
  hi: 'Noto+Sans:wght@400;700',     // Devanagari (Hindi, Marathi)
  mr: 'Noto+Sans:wght@400;700',
  bn: 'Noto+Sans+Bengali:wght@400;700',
  ta: 'Noto+Sans+Tamil:wght@400;700',
  te: 'Noto+Sans+Telugu:wght@400;700',
  gu: 'Noto+Sans+Gujarati:wght@400;700',
  pa: 'Noto+Sans+Gurmukhi:wght@400;700',
  en: 'Inter:wght@400;700',
};

const loadedFonts = new Set<string>();

export function useLanguageFont(language: string): void {
  const fontFamily = FONT_MAP[language] || FONT_MAP['hi'];

  if (loadedFonts.has(fontFamily)) return; // already loaded
  loadedFonts.add(fontFamily);

  const link = document.createElement('link');
  link.rel  = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${fontFamily}&display=swap`;
  document.head.appendChild(link);
}
