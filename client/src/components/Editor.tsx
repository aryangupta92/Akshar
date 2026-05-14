import { useRef, useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';

interface EditorProps {
  contentId: string;
  initialDelta?: Record<string, unknown>;
  onSave?: () => void;
}

type SaveStatus = 'saved' | 'saving' | 'unsaved';

export default function Editor({ contentId, initialDelta, onSave }: EditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  // useRef for quill instance — avoids re-render
  const quillRef = useRef<unknown>(null);
  // useRef for timer — avoids re-render (preserves cursor position)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMounted = useRef(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');

  // useCallback memoizes save so it's not recreated on every render
  const debouncedSave = useCallback(
    (delta: Record<string, unknown>) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      setSaveStatus('unsaved');

      timerRef.current = setTimeout(async () => {
        setSaveStatus('saving');
        try {
          const res = await fetch(`/api/content/${contentId}/save`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ delta }),
          });

          if (!res.ok) throw new Error('Save failed');
          setSaveStatus('saved');
          onSave?.();
        } catch {
          setSaveStatus('unsaved');
          toast.error('Auto-save failed');
        }
      }, 800); // 800ms debounce
    },
    [contentId, onSave]
  );

  useEffect(() => {
    // Prevent double-initialization in React StrictMode
    if (isMounted.current) return;
    isMounted.current = true;

    // Dynamic import — Quill doesn't support SSR
    import('quill').then(({ default: Quill }) => {
      if (!editorRef.current) return;

      (quillRef as React.MutableRefObject<unknown>).current = new Quill(editorRef.current, {
        theme: 'snow',
        placeholder: 'Start writing your masterpiece…',
        modules: {
          toolbar: [
            ['bold', 'italic', 'underline', 'strike'],
            [{ header: [1, 2, 3, false] }],
            [{ list: 'ordered' }, { list: 'bullet' }],
            ['blockquote', 'code-block'],
            [{ align: [] }],
            ['clean'],
          ],
        },
      });

      // Load initial delta if provided
      if (initialDelta) {
        (quillRef.current as { setContents: (delta: unknown) => void }).setContents(initialDelta);
      }

      // onChange fires on every keystroke — debounce handles the actual save
      (quillRef.current as { on: (event: string, handler: () => void) => void }).on('text-change', () => {
        const delta = (quillRef.current as { getContents: () => Record<string, unknown> }).getContents();
        debouncedSave(delta);
      });
    });

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const statusConfig = {
    saved:   { label: '✓ Saved',    cls: 'saved' },
    saving:  { label: '⟳ Saving…', cls: 'saving' },
    unsaved: { label: '● Unsaved',  cls: 'unsaved' },
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Save status indicator */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '8px 16px', background: 'var(--parchment)', borderBottom: '1px solid var(--border)' }}>
        <span className={`save-indicator ${statusConfig[saveStatus].cls}`}>
          {statusConfig[saveStatus].label}
        </span>
      </div>

      {/* Quill editor mount point */}
      <div
        ref={editorRef}
        style={{
          flex: 1,
          background: '#fff',
          borderRadius: '0 0 var(--radius) var(--radius)',
        }}
      />
    </div>
  );
}
