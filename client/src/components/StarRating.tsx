import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

interface StarRatingProps {
  contentId: string;
  avgRating: number;
  ratingCount: number;
  interactive?: boolean;
}

export function StarRating({ contentId, avgRating, ratingCount, interactive = true }: StarRatingProps) {
  const [hovered, setHovered] = useState(0);
  const [userRating, setUserRating] = useState(0);
  const queryClient = useQueryClient();

  const rateMutation = useMutation({
    mutationFn: async (value: number) => {
      const res = await fetch(`/api/content/${contentId}/rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value }),
      });
      if (res.status === 401) throw new Error('Login to rate');
      if (!res.ok) throw new Error('Rating failed');
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['content', contentId] });
      toast.success(`Rated ${userRating} ★`);
      // Update local display
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const displayRating = hovered || userRating || avgRating;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div className="stars">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={`star ${star <= displayRating ? 'filled' : ''}`}
            onMouseEnter={() => interactive && setHovered(star)}
            onMouseLeave={() => interactive && setHovered(0)}
            onClick={() => {
              if (!interactive) return;
              setUserRating(star);
              rateMutation.mutate(star);
            }}
            style={{ cursor: interactive ? 'pointer' : 'default' }}
          >
            ★
          </span>
        ))}
      </div>
      <span style={{ fontSize: '0.8rem', color: 'var(--muted)', fontWeight: 500 }}>
        {avgRating > 0 ? avgRating.toFixed(1) : '—'}
        {ratingCount > 0 && <span style={{ marginLeft: 4 }}>({ratingCount})</span>}
      </span>
    </div>
  );
}
