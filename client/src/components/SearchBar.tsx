import { useState, useCallback } from 'react';
import { useNavigate } from "react-router-dom";
import { FiSearch, FiX } from 'react-icons/fi';

interface SearchBarProps {
  defaultValue?: string;
}

export function SearchBar({ defaultValue = '' }: SearchBarProps) {
  const [value, setValue] = useState(defaultValue);
  const navigate = useNavigate();

  const handleSearch = useCallback(
    (q: string) => {
      const url = new URL(window.location.href);
      if (q.trim()) {
        url.searchParams.set('q', q.trim());
      } else {
        url.searchParams.delete('q');
      }
      url.searchParams.delete('page');
      navigate(url.pathname + url.search);
    },
    [navigate]
  );

  return (
    <div style={{ position: 'relative', maxWidth: 560, width: '100%' }}>
      <FiSearch
        size={17}
        style={{
          position: 'absolute',
          left: 14,
          top: '50%',
          transform: 'translateY(-50%)',
          color: 'var(--muted)',
          pointerEvents: 'none',
        }}
      />
      <input
        id="search-input"
        type="text"
        className="input"
        placeholder="Search lyrics, stories, poems… (Hindi, English, Tamil…)"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleSearch(value)}
        style={{ paddingLeft: 42, paddingRight: value ? 40 : 14 }}
      />
      {value && (
        <button
          onClick={() => { setValue(''); handleSearch(''); }}
          style={{
            position: 'absolute',
            right: 12,
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--muted)',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <FiX size={16} />
        </button>
      )}
    </div>
  );
}
