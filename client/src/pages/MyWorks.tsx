import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth';
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { FiEdit3, FiPlus, FiTrash2, FiGlobe, FiEye, FiEyeOff } from 'react-icons/fi';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

const GENRES = ['lyrics', 'story', 'poem', 'screenplay'];
const LANGUAGES = [
  { code: 'hi', label: 'हिन्दी' }, { code: 'en', label: 'English' },
  { code: 'ta', label: 'தமிழ்' }, { code: 'te', label: 'తెలుగు' },
  { code: 'mr', label: 'मराठी' }, { code: 'bn', label: 'বাংলা' },
  { code: 'gu', label: 'ગુજરાતી' }, { code: 'pa', label: 'ਪੰਜਾਬੀ' },
];

const GENRE_EMOJI: Record<string, string> = {
  lyrics: '🎵', story: '📖', poem: '✍️', screenplay: '🎬',
};

async function fetchMyWorks() {
  const res = await fetch('/api/content/my');
  if (!res.ok) throw new Error('Failed to load');
  return res.json();
}

export default function MyWorksPage() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [newWork, setNewWork] = useState({ title: '', genre: 'lyrics', language: 'hi' });

  const { data, isLoading } = useQuery({
    queryKey: ['my-works'],
    queryFn: fetchMyWorks,
    enabled: isAuthenticated,
  });

  const createMutation = useMutation({
    mutationFn: async (work: typeof newWork) => {
      const res = await fetch('/api/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(work),
      });
      if (!res.ok) throw new Error('Failed to create');
      return res.json();
    },
    onSuccess: (data) => {
      toast.success('New work created!');
      queryClient.invalidateQueries({ queryKey: ['my-works'] });
      setShowCreate(false);
      navigate(`/dashboard/editor/${data.content._id}`);
    },
    onError: () => toast.error('Could not create work'),
  });

  const togglePublishMutation = useMutation({
    mutationFn: async ({ id, isPublished }: { id: string; isPublished: boolean }) => {
      const res = await fetch(`/api/content/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublished }),
      });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-works'] });
      toast.success('Updated!');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/content/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-works'] });
      toast.success('Deleted');
    },
  });

  if (!isAuthenticated) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 24px' }}>
        <p style={{ fontSize: '2rem' }}>🔒</p>
        <h1 style={{ fontFamily: 'Playfair Display, serif', marginTop: 12 }}>Sign in to write</h1>
        <Link to="/login" className="btn btn-primary" style={{ marginTop: 20, display: 'inline-flex' }}>Sign In</Link>
      </div>
    );
  }

  const works = data?.contents || [];

  return (
    <div style={{ background: 'var(--cream)', minHeight: '100vh' }}>
      {/* Header */}
      <div
        style={{
          background: 'var(--parchment)',
          borderBottom: '1px solid var(--border)',
          padding: '32px 24px',
        }}
      >
        <div className="container-xl">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <h1
                style={{
                  fontFamily: 'Playfair Display, serif',
                  fontSize: '1.8rem',
                  fontWeight: 800,
                }}
              >
                My Works
              </h1>
              <p style={{ color: 'var(--muted)', marginTop: 4, fontSize: '0.9rem' }}>
                Welcome, <strong>{user?.name}</strong> — {works.length} work{works.length !== 1 ? 's' : ''} total
              </p>
            </div>

            <button
              id="create-work-btn"
              onClick={() => setShowCreate(true)}
              className="btn btn-primary"
            >
              <FiPlus size={16} /> New Work
            </button>
          </div>
        </div>
      </div>

      <div className="container-xl" style={{ padding: '32px 24px' }}>
        {/* Create Work Modal */}
        {showCreate && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(15,14,13,0.6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 500,
              padding: 24,
            }}
            onClick={(e) => e.target === e.currentTarget && setShowCreate(false)}
          >
            <div className="paper-card" style={{ width: '100%', maxWidth: 440, padding: '32px' }}>
              <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.4rem', marginBottom: 24 }}>
                Create New Work
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, display: 'block', marginBottom: 6 }}>Title *</label>
                  <input
                    id="new-work-title"
                    className="input"
                    placeholder="Enter title…"
                    value={newWork.title}
                    onChange={(e) => setNewWork({ ...newWork, title: e.target.value })}
                    autoFocus
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, display: 'block', marginBottom: 6 }}>Genre *</label>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {GENRES.map((g) => (
                      <button
                        key={g}
                        onClick={() => setNewWork({ ...newWork, genre: g })}
                        style={{
                          padding: '6px 14px',
                          borderRadius: 999,
                          border: `1.5px solid ${newWork.genre === g ? 'var(--saffron)' : 'var(--border)'}`,
                          background: newWork.genre === g ? 'rgba(232,131,42,0.1)' : 'transparent',
                          color: newWork.genre === g ? 'var(--saffron)' : 'var(--muted)',
                          fontWeight: newWork.genre === g ? 700 : 400,
                          cursor: 'pointer',
                          fontSize: '0.85rem',
                          transition: 'all 0.2s',
                        }}
                      >
                        {GENRE_EMOJI[g]} {g}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, display: 'block', marginBottom: 6 }}>
                    <FiGlobe size={13} style={{ marginRight: 4 }} /> Language
                  </label>
                  <select
                    className="input"
                    value={newWork.language}
                    onChange={(e) => setNewWork({ ...newWork, language: e.target.value })}
                    style={{ cursor: 'pointer' }}
                  >
                    {LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
                  </select>
                </div>

                <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                  <button
                    onClick={() => setShowCreate(false)}
                    className="btn btn-ghost"
                    style={{ flex: 1, justifyContent: 'center' }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (!newWork.title.trim()) return toast.error('Enter a title');
                      createMutation.mutate(newWork);
                    }}
                    className="btn btn-primary"
                    disabled={createMutation.isPending}
                    style={{ flex: 1, justifyContent: 'center' }}
                  >
                    {createMutation.isPending ? 'Creating…' : 'Create & Write'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Works List */}
        {isLoading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 160 }} />
            ))}
          </div>
        ) : works.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <p style={{ fontSize: '3rem', marginBottom: 16 }}>✍️</p>
            <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.5rem', marginBottom: 8 }}>
              Your canvas is empty
            </h2>
            <p style={{ color: 'var(--muted)', marginBottom: 24 }}>Start by creating your first work</p>
            <button onClick={() => setShowCreate(true)} className="btn btn-primary">
              <FiPlus size={16} /> Create First Work
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
            {works.map((work: {
              _id: string; title: string; genre: string; language: string;
              isPublished: boolean; versions: unknown[]; updatedAt: string;
            }) => (
              <div key={work._id} className="paper-card" style={{ padding: '20px 22px' }}>
                {/* Top row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--saffron)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    {GENRE_EMOJI[work.genre]} {work.genre}
                  </span>
                  <span
                    style={{
                      fontSize: '0.7rem',
                      padding: '2px 8px',
                      borderRadius: 999,
                      background: work.isPublished ? 'rgba(74,180,74,0.12)' : 'rgba(122,112,104,0.1)',
                      color: work.isPublished ? '#2d7a2d' : 'var(--muted)',
                      fontWeight: 600,
                      border: `1px solid ${work.isPublished ? 'rgba(74,180,74,0.25)' : 'var(--border)'}`,
                    }}
                  >
                    {work.isPublished ? '● Published' : '○ Draft'}
                  </span>
                </div>

                {/* Title */}
                <h3
                  style={{
                    fontFamily: 'Playfair Display, serif',
                    fontSize: '1.05rem',
                    fontWeight: 700,
                    marginBottom: 6,
                    lineHeight: 1.3,
                  }}
                >
                  {work.title}
                </h3>

                <p style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: 14 }}>
                  {work.versions?.length || 0} versions ·{' '}
                  Updated {formatDistanceToNow(new Date(work.updatedAt), { addSuffix: true })}
                </p>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 8 }}>
                  <Link
                    to={`/dashboard/editor/${work._id}`}
                    className="btn btn-primary"
                    style={{ flex: 1, justifyContent: 'center', padding: '7px 12px', fontSize: '0.82rem' }}
                  >
                    <FiEdit3 size={13} /> Edit
                  </Link>

                  <button
                    onClick={() => togglePublishMutation.mutate({ id: work._id, isPublished: !work.isPublished })}
                    className="btn btn-ghost"
                    title={work.isPublished ? 'Unpublish' : 'Publish'}
                    style={{ padding: '7px 12px' }}
                  >
                    {work.isPublished ? <FiEyeOff size={14} /> : <FiEye size={14} />}
                  </button>

                  <button
                    onClick={() => {
                      if (confirm('Delete this work permanently?')) {
                        deleteMutation.mutate(work._id);
                      }
                    }}
                    style={{
                      padding: '7px 12px',
                      borderRadius: 8,
                      border: '1px solid rgba(200,50,50,0.25)',
                      background: 'rgba(200,50,50,0.06)',
                      color: '#c03020',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    <FiTrash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
