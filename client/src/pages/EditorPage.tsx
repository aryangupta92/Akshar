import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams, Link } from "react-router-dom";
import { VersionHistory } from '../components/VersionHistory';
import { FiArrowLeft, FiEye, FiEyeOff, FiSave, FiTag } from 'react-icons/fi';
import toast from 'react-hot-toast';
import Editor from '../components/Editor';

const GENRES = ['lyrics', 'story', 'poem', 'screenplay'];
const LANGUAGES = [
  { code: 'hi', label: 'हिन्दी' }, { code: 'en', label: 'English' },
  { code: 'ta', label: 'தமிழ்' }, { code: 'te', label: 'తెలుగు' },
  { code: 'mr', label: 'मराठी' }, { code: 'bn', label: 'বাংলা' },
  { code: 'gu', label: 'ગુજરાતી' }, { code: 'pa', label: 'ਪੰਜਾਬੀ' },
];

async function fetchContent(id: string) {
  const res = await fetch(`/api/content/${id}`);
  if (!res.ok) throw new Error('Not found');
  return res.json();
}

async function fetchVersions(id: string) {
  const res = await fetch(`/api/content/${id}/versions`);
  if (!res.ok) return { embedded: [], archived: [] };
  return res.json();
}

export default function EditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [previewDelta, setPreviewDelta] = useState<Record<string, unknown> | null>(null);
  const [tagInput, setTagInput] = useState('');
  const [sidebarTab, setSidebarTab] = useState<'meta' | 'versions'>('meta');

  const { data, isLoading } = useQuery({
    queryKey: ['content', id],
    queryFn: () => fetchContent(id),
    staleTime: 60 * 1000,
  });

  const { data: versionsData } = useQuery({
    queryKey: ['versions', id],
    queryFn: () => fetchVersions(id),
    staleTime: 10 * 1000,
  });

  const updateMeta = useMutation({
    mutationFn: async (updates: Record<string, unknown>) => {
      const res = await fetch(`/api/content/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error('Update failed');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content', id] });
      queryClient.invalidateQueries({ queryKey: ['my-works'] });
      toast.success('Saved!');
    },
    onError: () => toast.error('Update failed'),
  });

  const handleSave = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['versions', id] });
  }, [queryClient, id]);

  const handlePreview = (delta: Record<string, unknown>) => {
    setPreviewDelta(delta);
    toast('Previewing version', { icon: '🕐' });
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div
            className="skeleton"
            style={{ width: 200, height: 20, margin: '0 auto 12px' }}
          />
          <p style={{ color: 'var(--muted)', fontSize: '0.88rem' }}>Loading editor…</p>
        </div>
      </div>
    );
  }

  const content = data?.content;
  if (!content) {
    return (
      <div style={{ textAlign: 'center', padding: 80 }}>
        <p>Content not found.</p>
        <Link to="/dashboard/my-works">← Back to My Works</Link>
      </div>
    );
  }

  const versions = versionsData?.embedded || [];

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        background: 'var(--cream)',
        overflow: 'hidden',
      }}
    >
      {/* Editor Topbar */}
      <div
        style={{
          background: 'var(--parchment)',
          borderBottom: '1px solid var(--border)',
          padding: '0 20px',
          height: 56,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          flexShrink: 0,
          zIndex: 10,
        }}
      >
        {/* Left */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link
            to="/dashboard/my-works"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              color: 'var(--muted)',
              fontSize: '0.85rem',
              padding: '4px 10px',
              borderRadius: 6,
              transition: 'all 0.2s',
            }}
          >
            <FiArrowLeft size={15} /> My Works
          </Link>
          <span style={{ color: 'var(--border)' }}>|</span>
          <span
            style={{
              fontFamily: 'Playfair Display, serif',
              fontWeight: 700,
              fontSize: '1rem',
              color: 'var(--ink)',
              maxWidth: 280,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {content.title}
          </span>
        </div>

        {/* Right actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Sidebar tab toggle */}
          <div
            style={{
              display: 'flex',
              background: 'var(--parchment2)',
              borderRadius: 6,
              border: '1px solid var(--border)',
              overflow: 'hidden',
            }}
          >
            {(['meta', 'versions'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setSidebarTab(tab)}
                style={{
                  padding: '5px 12px',
                  border: 'none',
                  background: sidebarTab === tab ? 'var(--saffron)' : 'transparent',
                  color: sidebarTab === tab ? '#fff' : 'var(--muted)',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                  transition: 'all 0.2s',
                }}
              >
                {tab === 'meta' ? 'Settings' : `History (${versions.length})`}
              </button>
            ))}
          </div>

          {/* Publish toggle */}
          <button
            id="publish-toggle"
            onClick={() => updateMeta.mutate({ isPublished: !content.isPublished })}
            className={content.isPublished ? 'btn btn-ghost' : 'btn btn-primary'}
            style={{ padding: '6px 14px', fontSize: '0.82rem' }}
          >
            {content.isPublished ? <><FiEyeOff size={13} /> Unpublish</> : <><FiEye size={13} /> Publish</>}
          </button>

          {/* Preview link */}
          <Link
            to={`/content/${id}`}
            target="_blank"
            className="btn btn-ghost"
            style={{ padding: '6px 12px', fontSize: '0.82rem' }}
          >
            Preview ↗
          </Link>
        </div>
      </div>

      {/* Main editor area */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Editor */}
        <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
          {previewDelta && (
            <div
              style={{
                background: 'rgba(232,131,42,0.1)',
                border: '1px solid rgba(232,131,42,0.3)',
                padding: '8px 16px',
                fontSize: '0.82rem',
                color: 'var(--saffron)',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span>🕐 Previewing an older version</span>
              <button
                onClick={() => setPreviewDelta(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--saffron)', fontWeight: 700 }}
              >
                ✕ Back to current
              </button>
            </div>
          )}

          <div style={{ flex: 1, margin: '20px', borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border)', background: '#fff' }}>
            <Editor
              contentId={id}
              initialDelta={previewDelta || content.currentDelta}
              onSave={handleSave}
            />
          </div>
        </div>

        {/* Sidebar */}
        <div
          style={{
            width: 280,
            flexShrink: 0,
            borderLeft: '1px solid var(--border)',
            background: 'var(--parchment)',
            overflow: 'auto',
            padding: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          {sidebarTab === 'versions' ? (
            <VersionHistory versions={versions} onPreview={handlePreview} />
          ) : (
            <>
              {/* Title */}
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--muted)', display: 'block', marginBottom: 6 }}>
                  Title
                </label>
                <input
                  className="input"
                  defaultValue={content.title}
                  style={{ fontSize: '0.9rem' }}
                  onBlur={(e) => {
                    if (e.target.value !== content.title) {
                      updateMeta.mutate({ title: e.target.value });
                    }
                  }}
                />
              </div>

              {/* Genre */}
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--muted)', display: 'block', marginBottom: 8 }}>
                  Genre
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {GENRES.map((g) => (
                    <button
                      key={g}
                      onClick={() => updateMeta.mutate({ genre: g })}
                      style={{
                        padding: '4px 12px',
                        borderRadius: 999,
                        border: `1.5px solid ${content.genre === g ? 'var(--saffron)' : 'var(--border)'}`,
                        background: content.genre === g ? 'rgba(232,131,42,0.1)' : 'transparent',
                        color: content.genre === g ? 'var(--saffron)' : 'var(--muted)',
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                        fontWeight: content.genre === g ? 700 : 400,
                        transition: 'all 0.2s',
                      }}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              {/* Language */}
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--muted)', display: 'block', marginBottom: 6 }}>
                  Language
                </label>
                <select
                  className="input"
                  defaultValue={content.language}
                  style={{ fontSize: '0.88rem' }}
                  onChange={(e) => updateMeta.mutate({ language: e.target.value })}
                >
                  {LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
                </select>
              </div>

              {/* Tags */}
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--muted)', display: 'block', marginBottom: 6 }}>
                  Tags
                </label>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                  {(content.tags || []).map((tag: string) => (
                    <span
                      key={tag}
                      style={{
                        fontSize: '0.75rem',
                        padding: '2px 8px',
                        background: 'rgba(15,14,13,0.07)',
                        borderRadius: 4,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        color: 'var(--muted)',
                      }}
                    >
                      #{tag}
                      <button
                        onClick={() => updateMeta.mutate({ tags: content.tags.filter((t: string) => t !== tag) })}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', lineHeight: 1, padding: 0 }}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <input
                    className="input"
                    placeholder="Add tag…"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && tagInput.trim()) {
                        const newTags = [...(content.tags || []), tagInput.trim()];
                        updateMeta.mutate({ tags: newTags });
                        setTagInput('');
                      }
                    }}
                    style={{ fontSize: '0.85rem' }}
                  />
                  <button
                    className="btn btn-ghost"
                    style={{ padding: '8px 10px', flexShrink: 0 }}
                    onClick={() => {
                      if (tagInput.trim()) {
                        const newTags = [...(content.tags || []), tagInput.trim()];
                        updateMeta.mutate({ tags: newTags });
                        setTagInput('');
                      }
                    }}
                  >
                    <FiTag size={14} />
                  </button>
                </div>
              </div>

              {/* Stats */}
              <div
                style={{
                  background: 'var(--parchment2)',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  padding: 14,
                }}
              >
                <p style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--muted)', marginBottom: 10 }}>
                  Stats
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                    <span style={{ color: 'var(--muted)' }}>Versions</span>
                    <span style={{ fontWeight: 700 }}>{versions.length}/50</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                    <span style={{ color: 'var(--muted)' }}>Bookmarks</span>
                    <span style={{ fontWeight: 700 }}>{content.bookmarkCount || 0}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                    <span style={{ color: 'var(--muted)' }}>Status</span>
                    <span
                      style={{
                        fontWeight: 700,
                        color: content.isPublished ? '#2d7a2d' : 'var(--muted)',
                      }}
                    >
                      {content.isPublished ? '● Published' : '○ Draft'}
                    </span>
                  </div>
                </div>

                {/* Version progress bar */}
                <div style={{ marginTop: 12 }}>
                  <div style={{ height: 4, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${(versions.length / 50) * 100}%`,
                        background: versions.length >= 45 ? '#c03020' : 'var(--saffron)',
                        borderRadius: 2,
                        transition: 'width 0.5s ease',
                      }}
                    />
                  </div>
                  {versions.length >= 45 && (
                    <p style={{ fontSize: '0.7rem', color: '#c03020', marginTop: 4, fontWeight: 600 }}>
                      ⚠ Approaching version limit — older versions will be archived
                    </p>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
