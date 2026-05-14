import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FiBookmark } from 'react-icons/fi';
import toast from 'react-hot-toast';

interface BookmarkButtonProps {
  contentId: string;
  initialCount?: number;
}

async function fetchBookmarkCount(contentId: string): Promise<number> {
  const res = await fetch(`/api/content/${contentId}/bookmark`);
  if (!res.ok) return 0;
  const data = await res.json();
  return data.bookmarkCount;
}

export function BookmarkButton({ contentId, initialCount = 0 }: BookmarkButtonProps) {
  const queryClient = useQueryClient();
  const [isBookmarked, setIsBookmarked] = useState(false);

  const { data: count = initialCount } = useQuery({
    queryKey: ['bookmark-count', contentId],
    queryFn: () => fetchBookmarkCount(contentId),
    initialData: initialCount,
    staleTime: 30 * 1000,
  });

  const bookmarkMutation = useMutation({
    mutationFn: async () => {
      const method = isBookmarked ? 'DELETE' : 'POST';
      const res = await fetch(`/api/content/${contentId}/bookmark`, { method });
      if (res.status === 401) throw new Error('Login to bookmark');
      if (!res.ok) throw new Error('Action failed');
      return res.json();
    },
    onSuccess: (data) => {
      setIsBookmarked((prev) => !prev);
      queryClient.setQueryData(['bookmark-count', contentId], data.bookmarkCount);
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  return (
    <button
      id={`bookmark-btn-${contentId}`}
      onClick={() => bookmarkMutation.mutate()}
      disabled={bookmarkMutation.isPending}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '8px 16px',
        borderRadius: '999px',
        border: `2px solid ${isBookmarked ? 'var(--gold)' : 'var(--border)'}`,
        background: isBookmarked ? 'rgba(196,148,58,0.12)' : 'transparent',
        color: isBookmarked ? 'var(--gold)' : 'var(--muted)',
        cursor: 'pointer',
        fontWeight: 600,
        fontSize: '0.88rem',
        transition: 'all 0.2s',
        transform: bookmarkMutation.isPending ? 'scale(0.95)' : 'scale(1)',
      }}
    >
      <FiBookmark
        size={16}
        style={{ fill: isBookmarked ? 'var(--gold)' : 'none', transition: 'fill 0.2s' }}
      />
      {count}
    </button>
  );
}
