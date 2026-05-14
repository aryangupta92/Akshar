// Central API helper — all fetch calls go through here
// Uses cookies (credentials: 'include') for JWT auth

const BASE = '/api';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data as T;
}

export const api = {
  // Auth
  login:    (body: { email: string; password: string }) =>
    request<{ user: User }>('/auth/login', { method: 'POST', body: JSON.stringify(body) }),

  register: (body: { name: string; email: string; password: string; preferredLanguage?: string }) =>
    request<{ user: User }>('/auth/register', { method: 'POST', body: JSON.stringify(body) }),

  logout: () =>
    request<{ success: boolean }>('/auth/logout', { method: 'POST' }),

  getMe: () =>
    request<{ user: User }>('/auth/me'),

  refresh: () =>
    request<{ success: boolean }>('/auth/refresh', { method: 'POST' }),

  // Content
  getContents: (params: { language?: string; genre?: string; sort?: string; page?: number; limit?: number }) => {
    const q = new URLSearchParams(params as any).toString();
    return request<{ contents: Content[]; pagination: Pagination }>(`/content?${q}`);
  },

  getMyContents: () =>
    request<{ contents: Content[] }>('/content/my'),

  getContentById: (id: string) =>
    request<{ content: Content }>(`/content/${id}`),

  createContent: (body: { title: string; genre: string; language: string; tags: string[] }) =>
    request<{ content: Content }>('/content', { method: 'POST', body: JSON.stringify(body) }),

  updateContent: (id: string, body: Partial<{ title: string; genre: string; language: string; tags: string[]; isPublished: boolean }>) =>
    request<{ content: Content }>(`/content/${id}`, { method: 'PUT', body: JSON.stringify(body) }),

  deleteContent: (id: string) =>
    request<{ success: boolean }>(`/content/${id}`, { method: 'DELETE' }),

  saveContentDelta: (id: string, delta: unknown) =>
    request<{ success: boolean; versionCount: number }>(`/content/${id}/save`, {
      method: 'PATCH',
      body: JSON.stringify({ delta }),
    }),

  getVersions: (id: string) =>
    request<{ versions: Version[] }>(`/content/${id}/versions`),

  toggleBookmark: (id: string) =>
    request<{ bookmarked: boolean; count: number }>(`/content/${id}/bookmark`, { method: 'POST' }),

  rateContent: (id: string, value: number) =>
    request<{ avgRating: number; count: number }>(`/content/${id}/rate`, {
      method: 'POST',
      body: JSON.stringify({ value }),
    }),

  // Search
  search: (params: { q?: string; genre?: string; language?: string }) => {
    const q = new URLSearchParams(params as any).toString();
    return request<{ results: Content[] }>(`/search?${q}`);
  },
};

// ── Types ────────────────────────────────────────────────────
export interface User {
  id: string;
  name: string;
  email: string;
  preferredLanguage: string;
  avatar?: string;
  bio?: string;
}

export interface Content {
  _id: string;
  title: string;
  genre: 'lyrics' | 'story' | 'poem' | 'screenplay';
  tags: string[];
  language: string;
  authorId: { _id: string; name: string; avatar?: string };
  currentDelta?: QuillDelta;
  versions: Version[];
  bookmarkCount: number;
  avgRating: number;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Version {
  versionId: string;
  delta: QuillDelta;
  editedAt: string;
}

export interface QuillDelta {
  ops: Array<{ insert: string | object; attributes?: object }>;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}
