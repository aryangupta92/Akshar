import { useState } from 'react';
import { FiClock, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { formatDistanceToNow } from 'date-fns';

interface Version {
  versionId: string;
  delta: Record<string, unknown>;
  editedAt: string;
}

interface VersionHistoryProps {
  versions: Version[];
  onPreview: (delta: Record<string, unknown>) => void;
}

export function VersionHistory({ versions, onPreview }: VersionHistoryProps) {
  const [expanded, setExpanded] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sorted = [...versions].reverse(); // newest first

  return (
    <div
      style={{
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        background: 'var(--parchment)',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          borderBottom: expanded ? '1px solid var(--border)' : 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, fontSize: '0.9rem' }}>
          <FiClock size={15} color="var(--saffron)" />
          Version History
          <span
            style={{
              background: 'var(--saffron)',
              color: '#fff',
              borderRadius: '999px',
              fontSize: '0.72rem',
              padding: '1px 7px',
              fontWeight: 700,
            }}
          >
            {versions.length}/50
          </span>
        </div>
        {expanded ? <FiChevronUp size={16} /> : <FiChevronDown size={16} />}
      </button>

      {/* List */}
      {expanded && (
        <div style={{ maxHeight: 320, overflowY: 'auto' }}>
          {sorted.length === 0 && (
            <p style={{ padding: '16px', color: 'var(--muted)', fontSize: '0.85rem', textAlign: 'center' }}>
              No versions yet. Start writing to create snapshots.
            </p>
          )}
          {sorted.map((v, idx) => (
            <button
              key={v.versionId}
              onClick={() => {
                setActiveId(v.versionId);
                onPreview(v.delta);
              }}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 16px',
                background: activeId === v.versionId ? 'rgba(232,131,42,0.1)' : 'transparent',
                border: 'none',
                borderBottom: '1px solid var(--border)',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'background 0.15s',
              }}
            >
              <div>
                <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--ink)' }}>
                  v{sorted.length - idx}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                  {formatDistanceToNow(new Date(v.editedAt), { addSuffix: true })}
                </div>
              </div>
              {activeId === v.versionId && (
                <span style={{ fontSize: '0.72rem', color: 'var(--saffron)', fontWeight: 600 }}>
                  Previewing
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
