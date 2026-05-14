import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api, type User } from '../api';

export function useAuth() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery<{ user: User }>({
    queryKey: ['auth-user'],
    queryFn: api.getMe,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 min
  });

  const user = data?.user ?? null;
  const isAuthenticated = !!user;

  const logout = async () => {
    try {
      await api.logout();
    } catch {
      // ignore
    } finally {
      queryClient.clear();
      navigate('/login');
    }
  };

  return { user, isAuthenticated, isLoading, logout };
}
