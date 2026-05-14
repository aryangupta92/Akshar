import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { Toaster } from 'react-hot-toast';

// Named AND default export — App.tsx uses default
export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#0F0E0D',
            color: '#F5F0E8',
            fontFamily: "'Noto Sans', sans-serif",
            borderRadius: '8px',
            border: '1px solid #333',
          },
          success: {
            iconTheme: { primary: '#E8832A', secondary: '#F5F0E8' },
          },
        }}
      />
    </QueryClientProvider>
  );
}

export default Providers;
