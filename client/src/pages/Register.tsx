import { useState } from 'react';
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { FiUser, FiMail, FiLock, FiArrowRight, FiGlobe } from 'react-icons/fi';

const LANGUAGES = [
  { code: 'hi', label: 'हिन्दी (Hindi)' },
  { code: 'en', label: 'English' },
  { code: 'ta', label: 'தமிழ் (Tamil)' },
  { code: 'te', label: 'తెలుగు (Telugu)' },
  { code: 'mr', label: 'मराठी (Marathi)' },
  { code: 'bn', label: 'বাংলা (Bengali)' },
  { code: 'gu', label: 'ગુજરાતી (Gujarati)' },
  { code: 'pa', label: 'ਪੰਜਾਬੀ (Punjabi)' },
];

export default function RegisterPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    preferredLanguage: 'hi',
  });

  const registerMutation = useMutation({
    mutationFn: async (data: typeof form) => {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Registration failed');
      return json;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['auth-user'], data.user);
      toast.success(`Welcome to Akshar, ${data.user.name}!`);
      navigate('/dashboard/my-works');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) return toast.error('Fill all fields');
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters');
    registerMutation.mutate(form);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, var(--ink) 0%, #1a1208 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 24px',
      }}
    >
      <div className="paper-card" style={{ width: '100%', maxWidth: 460, padding: '40px' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Link to="/browse">
            <span
              style={{
                fontFamily: 'Playfair Display, serif',
                fontSize: '2.2rem',
                fontWeight: 900,
                color: 'var(--saffron)',
              }}
            >
              अक्षर
            </span>
          </Link>
          <h1
            style={{
              fontFamily: 'Playfair Display, serif',
              fontSize: '1.5rem',
              marginTop: 16,
              fontWeight: 700,
            }}
          >
            Join Akshar
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: '0.88rem', marginTop: 4 }}>
            Share your voice with the world
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Name */}
          <div>
            <label htmlFor="reg-name" style={{ fontSize: '0.82rem', fontWeight: 600, display: 'block', marginBottom: 6 }}>
              Full Name
            </label>
            <div style={{ position: 'relative' }}>
              <FiUser size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
              <input
                id="reg-name"
                type="text"
                className="input"
                placeholder="Your name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                style={{ paddingLeft: 36 }}
                required
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label htmlFor="reg-email" style={{ fontSize: '0.82rem', fontWeight: 600, display: 'block', marginBottom: 6 }}>
              Email address
            </label>
            <div style={{ position: 'relative' }}>
              <FiMail size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
              <input
                id="reg-email"
                type="email"
                className="input"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                style={{ paddingLeft: 36 }}
                required
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label htmlFor="reg-password" style={{ fontSize: '0.82rem', fontWeight: 600, display: 'block', marginBottom: 6 }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <FiLock size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
              <input
                id="reg-password"
                type="password"
                className="input"
                placeholder="Min. 6 characters"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                style={{ paddingLeft: 36 }}
                required
              />
            </div>
          </div>

          {/* Preferred Language */}
          <div>
            <label htmlFor="reg-language" style={{ fontSize: '0.82rem', fontWeight: 600, display: 'block', marginBottom: 6 }}>
              <FiGlobe size={13} style={{ marginRight: 4, verticalAlign: 'middle' }} />
              Preferred Language
            </label>
            <select
              id="reg-language"
              className="input"
              value={form.preferredLanguage}
              onChange={(e) => setForm({ ...form, preferredLanguage: e.target.value })}
              style={{ cursor: 'pointer', appearance: 'none', background: '#fff' }}
            >
              {LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>{lang.label}</option>
              ))}
            </select>
          </div>

          {/* Submit */}
          <button
            type="submit"
            id="register-submit"
            className="btn btn-primary"
            disabled={registerMutation.isPending}
            style={{ width: '100%', justifyContent: 'center', marginTop: 4, opacity: registerMutation.isPending ? 0.7 : 1 }}
          >
            {registerMutation.isPending ? 'Creating account…' : (
              <>Create Account <FiArrowRight size={15} /></>
            )}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 24, fontSize: '0.88rem', color: 'var(--muted)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--saffron)', fontWeight: 600 }}>Sign in</Link>
        </p>

        <p style={{ textAlign: 'center', marginTop: 12, fontSize: '0.75rem', color: 'var(--muted)' }}>
          By joining, you agree to share your literary work with the Akshar community.
        </p>
      </div>
    </div>
  );
}
