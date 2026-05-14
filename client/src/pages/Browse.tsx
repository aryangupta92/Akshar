import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { SearchBar } from '../components/SearchBar';
import { LanguageFilter } from '../components/LanguageFilter';
import { ContentCard } from '../components/ContentCard';
import { api, type Content } from '../api';
import { FiEdit3, FiPenTool } from 'react-icons/fi';

export default function Browse() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const q        = searchParams.get('q') || '';
  const genre    = searchParams.get('genre') || 'all';
  const language = searchParams.get('language') || 'all';
  const page     = parseInt(searchParams.get('page') || '1', 10);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['browse', q, genre, language, page],
    queryFn: () =>
      q
        ? api.search({ q, genre: genre !== 'all' ? genre : undefined, language: language !== 'all' ? language : undefined })
        : api.getContents({ language: language !== 'all' ? language : undefined, genre: genre !== 'all' ? genre : undefined, page, limit: 12 }),
    staleTime: 30 * 1000,
  });

  const contents   = (data as any)?.contents || (data as any)?.results || [];
  const pagination = (data as any)?.pagination;

  const setParam = (key: string, val: string) => {
    const next = new URLSearchParams(searchParams);
    if (val && val !== 'all') next.set(key, val); else next.delete(key);
    next.delete('page');
    setSearchParams(next);
  };

  return (
    <div style={{ background: 'var(--cream)', minHeight: '100vh' }}>
      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg, var(--ink) 0%, #2a1f0a 100%)', padding: '56px 24px 48px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div aria-hidden style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Playfair Display, serif', fontSize: 'clamp(80px, 20vw, 200px)', fontWeight: 900, color: 'rgba(232,131,42,0.06)', userSelect: 'none', pointerEvents: 'none' }}>
          अक्षर
        </div>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 'clamp(2rem, 5vw, 3.2rem)', fontWeight: 900, color: '#fff', marginBottom: 12 }}>
            Discover Indian <span style={{ color: 'var(--saffron)' }}>Literary Voices</span>
          </h1>
          <p style={{ color: 'rgba(245,240,232,0.7)', fontSize: '1.05rem', maxWidth: 520, margin: '0 auto 28px' }}>
            Lyrics, poems, stories and screenplays — written in every Indian script
          </p>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <SearchBar defaultValue={q} onSearch={(v) => setParam('q', v)} />
          </div>
          <div style={{ marginTop: 20 }}>
            <Link to="/register" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--gold-light)', fontSize: '0.85rem', opacity: 0.85 }}>
              <FiPenTool size={14} /> Are you a writer? Start publishing free →
            </Link>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="container-xl" style={{ padding: '32px 24px' }}>
        <div style={{ marginBottom: 28 }}>
          <LanguageFilter
            selectedLanguage={language}
            selectedGenre={genre}
            onLanguageChange={(v) => setParam('language', v)}
            onGenreChange={(v) => setParam('genre', v)}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.25rem', fontWeight: 700 }}>
              {q ? `Results for "${q}"` : 'Latest Works'}
            </h2>
            {pagination && <p style={{ fontSize: '0.82rem', color: 'var(--muted)', marginTop: 2 }}>{pagination.total} works found</p>}
          </div>
          <Link to="/dashboard/my-works" className="btn btn-primary" style={{ fontSize: '0.85rem', padding: '8px 16px' }}>
            <FiEdit3 size={14} /> Write
          </Link>
        </div>

        {isLoading && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 210, borderRadius: 8 }} />
            ))}
          </div>
        )}

        {isError && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--muted)' }}>
            <p style={{ fontSize: '2rem', marginBottom: 8 }}>📡</p>
            <p>Could not load content. Check your connection.</p>
          </div>
        )}

        {!isLoading && !isError && contents.length === 0 && (
          <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--muted)' }}>
            <p style={{ fontSize: '3rem', marginBottom: 12 }}>📜</p>
            <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.4rem', marginBottom: 8 }}>No works found</h3>
            <p style={{ marginBottom: 20 }}>Be the first to write in this category!</p>
            <Link to="/register" className="btn btn-primary">Start Writing</Link>
          </div>
        )}

        {!isLoading && !isError && contents.length > 0 && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
              {contents.map((item: Content, idx: number) => (
                <ContentCard
                  key={item._id}
                  id={item._id}
                  title={item.title}
                  genre={item.genre}
                  language={item.language}
                  tags={item.tags}
                  author={item.authorId}
                  bookmarkCount={item.bookmarkCount}
                  avgRating={item.avgRating || 0}
                  createdAt={item.createdAt}
                  index={idx}
                />
              ))}
            </div>

            {pagination && pagination.pages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 40 }}>
                {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => { const n = new URLSearchParams(searchParams); n.set('page', String(p)); setSearchParams(n); }}
                    style={{ width: 36, height: 36, borderRadius: 8, border: `1.5px solid ${p === page ? 'var(--saffron)' : 'var(--border)'}`, background: p === page ? 'var(--saffron)' : 'transparent', color: p === page ? '#fff' : 'var(--ink)', fontWeight: p === page ? 700 : 400, cursor: 'pointer' }}
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
