import { useSearchParams, useNavigate } from 'react-router-dom';
import { useLanguageFont } from './hooks/useLanguageFont';

const LANGUAGES = [
  { code: 'all', label: 'All' },
  { code: 'hi',  label: 'हिन्दी' },
  { code: 'en',  label: 'English' },
  { code: 'ta',  label: 'தமிழ்' },
  { code: 'te',  label: 'తెలుగు' },
  { code: 'mr',  label: 'मराठी' },
  { code: 'bn',  label: 'বাংলা' },
  { code: 'gu',  label: 'ગુજરાતી' },
  { code: 'pa',  label: 'ਪੰਜਾਬੀ' },
];

const GENRES = [
  { value: 'all',        label: 'All Genres' },
  { value: 'lyrics',     label: '🎵 Lyrics' },
  { value: 'story',      label: '📖 Story' },
  { value: 'poem',       label: '✍️ Poem' },
  { value: 'screenplay', label: '🎬 Screenplay' },
];

interface LanguageFilterProps {
  selectedLanguage: string;
  selectedGenre:    string;
  onLanguageChange?: (lang: string) => void;
  onGenreChange?:    (genre: string) => void;
}

export function LanguageFilter({
  selectedLanguage,
  selectedGenre,
  onLanguageChange,
  onGenreChange,
}: LanguageFilterProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Lazy-load correct Indian language font (i18n spec requirement)
  useLanguageFont(selectedLanguage === 'all' ? 'hi' : selectedLanguage);

  const updateParam = (key: string, value: string) => {
    // If parent passed a callback, use it; otherwise update URL directly
    if (key === 'language' && onLanguageChange) {
      onLanguageChange(value);
      return;
    }
    if (key === 'genre' && onGenreChange) {
      onGenreChange(value);
      return;
    }
    const params = new URLSearchParams(searchParams.toString());
    if (value === 'all') {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    params.delete('page');
    navigate('/browse?' + params.toString());
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Language tabs */}
      <div
        style={{
          display: 'flex',
          gap: 6,
          flexWrap: 'wrap',
          padding: '4px',
          background: 'var(--parchment2)',
          borderRadius: '10px',
          border: '1px solid var(--border)',
        }}
      >
        {LANGUAGES.map((lang) => {
          const isActive = selectedLanguage === lang.code || (lang.code === 'all' && !selectedLanguage);
          return (
            <button
              key={lang.code}
              id={`lang-tab-${lang.code}`}
              onClick={() => updateParam('language', lang.code)}
              style={{
                padding: '6px 14px',
                borderRadius: '7px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: isActive ? 700 : 400,
                fontSize: '0.9rem',
                background: isActive ? '#fff' : 'transparent',
                color: isActive ? 'var(--saffron)' : 'var(--ink)',
                boxShadow: isActive ? '0 1px 4px var(--shadow)' : 'none',
                transition: 'all 0.2s',
              }}
            >
              {lang.label}
            </button>
          );
        })}
      </div>

      {/* Genre pills */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {GENRES.map((genre) => {
          const isActive = selectedGenre === genre.value || (genre.value === 'all' && !selectedGenre);
          return (
            <button
              key={genre.value}
              id={`genre-tab-${genre.value}`}
              onClick={() => updateParam('genre', genre.value)}
              style={{
                padding: '5px 14px',
                borderRadius: '999px',
                border: `1.5px solid ${isActive ? 'var(--saffron)' : 'var(--border)'}`,
                cursor: 'pointer',
                fontSize: '0.82rem',
                fontWeight: isActive ? 600 : 400,
                background: isActive ? 'rgba(232,131,42,0.1)' : 'transparent',
                color: isActive ? 'var(--saffron)' : 'var(--muted)',
                transition: 'all 0.2s',
              }}
            >
              {genre.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
