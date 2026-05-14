import { useQuery } from '@tanstack/react-query';
import { useParams } from "react-router-dom";
import { BookmarkButton } from '../components/BookmarkButton';
import { StarRating } from '../components/StarRating';
import { FiShare2, FiUser, FiCalendar, FiTag } from 'react-icons/fi';
import { formatDistanceToNow } from 'date-fns';
import { Link } from "react-router-dom";
import toast from 'react-hot-toast';

const LANG_LABELS: Record<string, string> = {
  hi: 'हिन्दी', en: 'English', ta: 'தமிழ்',
  te: 'తెలుగు', mr: 'मराठी', bn: 'বাংলা',
  gu: 'ગુજરાતી', pa: 'ਪੰਜਾਬੀ',
};

const GENRE_EMOJI: Record<string, string> = {
  lyrics: '🎵', story: '📖', poem: '✍️', screenplay: '🎬',
};

async function fetchContent(id: string) {
  const res = await fetch(`/api/content/${id}`);
  if (!res.ok) throw new Error('Not found');
  return res.json();
}

function renderDelta(delta: { ops: Array<{ insert: string | Record<string, unknown>; attributes?: Record<string, unknown> }> }) {
  if (!delta?.ops) return '';
  return delta.ops
    .map((op) => {
      if (typeof op.insert !== 'string') return '';
      let text = op.insert;
      const attrs = op.attributes || {};
      if (attrs.bold) text = `<strong>${text}</strong>`;
      if (attrs.italic) text = `<em>${text}</em>`;
      if (attrs.underline) text = `<u>${text}</u>`;
      if (attrs.header === 1) return `<h1>${text}</h1>`;
      if (attrs.header === 2) return `<h2>${text}</h2>`;
      if (attrs.header === 3) return `<h3>${text}</h3>`;
      if (attrs.blockquote) return `<blockquote>${text}</blockquote>`;
      // Wrap plain text in paragraph if it ends with newline
      if (op.insert === '\n') return '</p><p>';
      return text;
    })
    .join('');
}

export default function ContentReaderPage() {
  const { id } = useParams<{ id: string }>();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['content', id],
    queryFn: () => fetchContent(id),
    staleTime: 60 * 1000,
  });

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Link copied!');
  };

  if (isLoading) {
    return (
      <div className="container-md" style={{ paddingTop: 48, paddingBottom: 80 }}>
        <div className="skeleton" style={{ height: 40, width: '60%', marginBottom: 16 }} />
        <div className="skeleton" style={{ height: 20, width: '30%', marginBottom: 32 }} />
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="skeleton" style={{ height: 18, marginBottom: 10, width: `${85 + Math.random() * 15}%` }} />
        ))}
      </div>
    );
  }

  if (isError || !data?.content) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 24px' }}>
        <p style={{ fontSize: '3rem' }}>📜</p>
        <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.5rem', marginTop: 16 }}>
          Content not found
        </h1>
        <Link to="/browse" className="btn btn-primary" style={{ marginTop: 20, display: 'inline-flex' }}>
          Browse Works
        </Link>
      </div>
    );
  }

  const { content } = data;
  const author = content.authorId;
  const htmlContent = content.currentDelta ? renderDelta(content.currentDelta) : '<p>No content yet.</p>';
  const avgRating = content.avgRating || 0;
  const ratingCount = content.ratings?.length || 0;

  return (
    <div style={{ background: 'var(--cream)', minHeight: '100vh', paddingBottom: 80 }}>
      {/* Masthead */}
      <div
        style={{
          background: 'var(--ink)',
          padding: '48px 24px 40px',
          borderBottom: '3px solid var(--saffron)',
        }}
      >
        <div className="container-md">
          {/* Genre + Language */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <span style={{ fontSize: '1.1rem' }}>{GENRE_EMOJI[content.genre] || '📄'}</span>
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: 'var(--saffron)',
              }}
            >
              {content.genre}
            </span>
            <span style={{ color: 'rgba(245,240,232,0.3)', fontSize: '0.75rem' }}>·</span>
            <span style={{ fontSize: '0.78rem', color: 'rgba(245,240,232,0.6)' }}>
              {LANG_LABELS[content.language] || content.language}
            </span>
          </div>

          {/* Title */}
          <h1
            style={{
              fontFamily: 'Playfair Display, serif',
              fontSize: 'clamp(1.6rem, 4vw, 2.8rem)',
              fontWeight: 900,
              color: '#fff',
              lineHeight: 1.2,
              marginBottom: 20,
            }}
          >
            {content.title}
          </h1>

          {/* Author pill */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background: 'var(--saffron)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  flexShrink: 0,
                }}
              >
                {author?.name?.charAt(0)?.toUpperCase() || <FiUser size={16} />}
              </div>
              <div>
                <div style={{ fontWeight: 600, color: '#fff', fontSize: '0.9rem' }}>{author?.name}</div>
                <div style={{ fontSize: '0.75rem', color: 'rgba(245,240,232,0.5)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <FiCalendar size={11} />
                  {formatDistanceToNow(new Date(content.createdAt), { addSuffix: true })}
                </div>
              </div>
            </div>

            {/* Tags */}
            {content.tags?.length > 0 && (
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {content.tags.map((tag: string) => (
                  <span
                    key={tag}
                    style={{
                      fontSize: '0.72rem',
                      padding: '2px 8px',
                      background: 'rgba(245,240,232,0.08)',
                      border: '1px solid rgba(245,240,232,0.15)',
                      borderRadius: 4,
                      color: 'rgba(245,240,232,0.6)',
                    }}
                  >
                    <FiTag size={10} style={{ marginRight: 3 }} />
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content Body */}
      <div className="container-md" style={{ paddingTop: 40 }}>
        <div style={{ display: 'flex', gap: 40, alignItems: 'flex-start' }}>
          {/* Main content */}
          <article style={{ flex: 1, minWidth: 0 }}>
            <div
              className="paper-card"
              style={{ padding: '40px 48px' }}
            >
              <div
                id="content-body"
                dangerouslySetInnerHTML={{ __html: `<p>${htmlContent}</p>` }}
                style={{
                  fontFamily: 'Noto Sans, sans-serif',
                  fontSize: '1.05rem',
                  lineHeight: 2,
                  color: 'var(--ink)',
                }}
              />
            </div>
          </article>

          {/* Sidebar */}
          <aside
            style={{
              width: 220,
              flexShrink: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
              position: 'sticky',
              top: 80,
            }}
          >
            {/* Bookmark */}
            <div className="paper-card" style={{ padding: '16px', textAlign: 'center' }}>
              <p style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Save
              </p>
              <BookmarkButton contentId={id} initialCount={content.bookmarkCount || 0} />
            </div>

            {/* Rating */}
            <div className="paper-card" style={{ padding: '16px', textAlign: 'center' }}>
              <p style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Rate this
              </p>
              <StarRating
                contentId={id}
                avgRating={avgRating}
                ratingCount={ratingCount}
                interactive
              />
            </div>

            {/* Share */}
            <button
              id="share-btn"
              onClick={handleShare}
              className="btn btn-ghost"
              style={{ width: '100%', justifyContent: 'center' }}
            >
              <FiShare2 size={15} /> Share
            </button>

            {/* Author info */}
            {author?.bio && (
              <div className="paper-card" style={{ padding: '16px' }}>
                <p style={{ fontSize: '0.72rem', color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                  About the Author
                </p>
                <p style={{ fontSize: '0.82rem', lineHeight: 1.6, color: 'var(--ink)' }}>{author.bio}</p>
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
