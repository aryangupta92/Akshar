import { Link } from "react-router-dom";
import { FiBookmark, FiUser } from 'react-icons/fi';

const LANG_LABELS: Record<string, string> = {
  hi: 'हिन्दी', en: 'English', ta: 'தமிழ்',
  te: 'తెలుగు', mr: 'मराठी', bn: 'বাংলা',
  gu: 'ગુજરાતી', pa: 'ਪੰਜਾਬੀ',
};

const GENRE_COLORS: Record<string, string> = {
  lyrics:     'badge-saffron',
  story:      'badge-gold',
  poem:       'badge-muted',
  screenplay: 'badge-ink',
};

interface Author {
  _id: string;
  name: string;
  avatar?: string;
}

interface ContentCardProps {
  id: string;
  title: string;
  genre: string;
  language: string;
  tags: string[];
  author: Author;
  bookmarkCount: number;
  avgRating: number;
  createdAt: string;
  index?: number;
}

export function ContentCard({
  id, title, genre, language, tags, author,
  bookmarkCount, avgRating, createdAt, index = 0,
}: ContentCardProps) {
  const stars = Math.round(avgRating);

  return (
    <Link
      to={`/content/${id}`}
      className="paper-card"
      style={{
        display: 'block',
        padding: '20px 22px',
        transition: 'transform 0.22s ease, box-shadow 0.22s ease',
        animationDelay: `${index * 0.06}s`,
        textDecoration: 'none',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)';
        (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 28px rgba(15,14,13,0.14)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
        (e.currentTarget as HTMLElement).style.boxShadow = '';
      }}
    >
      {/* Top row: genre badge + language */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <span className={`badge ${GENRE_COLORS[genre] || 'badge-muted'}`}>{genre}</span>
        <span
          style={{
            fontSize: '0.75rem',
            color: 'var(--muted)',
            fontWeight: 500,
            letterSpacing: '0.04em',
          }}
        >
          {LANG_LABELS[language] || language}
        </span>
      </div>

      {/* Title */}
      <h3
        style={{
          fontFamily: 'Playfair Display, serif',
          fontSize: '1.1rem',
          fontWeight: 700,
          color: 'var(--ink)',
          marginBottom: 6,
          lineHeight: 1.35,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        {title}
      </h3>

      {/* Tags */}
      {tags.length > 0 && (
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 12 }}>
          {tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              style={{
                fontSize: '0.7rem',
                padding: '2px 8px',
                background: 'rgba(15,14,13,0.06)',
                borderRadius: '4px',
                color: 'var(--muted)',
                fontWeight: 500,
              }}
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '10px 0' }} />

      {/* Bottom row: author + stats */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div
            style={{
              width: 26,
              height: 26,
              borderRadius: '50%',
              background: 'var(--saffron)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.72rem',
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            {author?.name?.charAt(0)?.toUpperCase() || <FiUser size={12} />}
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--muted)', fontWeight: 500 }}>
            {author?.name || 'Anonymous'}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Stars */}
          <span style={{ fontSize: '0.78rem', color: 'var(--gold)', fontWeight: 600 }}>
            {'★'.repeat(stars)}{'☆'.repeat(5 - stars)}
            {avgRating > 0 && (
              <span style={{ color: 'var(--muted)', marginLeft: 3 }}>{avgRating.toFixed(1)}</span>
            )}
          </span>

          {/* Bookmark count */}
          <span
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 3,
              fontSize: '0.78rem',
              color: 'var(--muted)',
            }}
          >
            <FiBookmark size={12} />
            {bookmarkCount}
          </span>
        </div>
      </div>
    </Link>
  );
}
