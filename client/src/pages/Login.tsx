import { useState } from 'react';
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { FiMail, FiLock, FiArrowRight, FiEye, FiEyeOff } from 'react-icons/fi';

export default function LoginPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ email: '', password: '' });

  const loginMutation = useMutation({
    mutationFn: async (data: typeof form) => {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Login failed');
      return json;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['auth-user'], data.user);
      toast.success(`Welcome back, ${data.user.name}!`);
      navigate('/browse');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.password) return toast.error('Fill all fields');
    loginMutation.mutate(form);
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
      <div
        className="paper-card"
        style={{
          width: '100%',
          maxWidth: 420,
          padding: '40px',
        }}
      >
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
          <p
            style={{
              fontSize: '0.82rem',
              color: 'var(--muted)',
              marginTop: 4,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
            }}
          >
            Akshar
          </p>
          <h1
            style={{
              fontFamily: 'Playfair Display, serif',
              fontSize: '1.5rem',
              marginTop: 20,
              fontWeight: 700,
            }}
          >
            Welcome back
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: '0.88rem', marginTop: 4 }}>
            Sign in to continue writing
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Email */}
          <div>
            <label
              htmlFor="login-email"
              style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--ink)', display: 'block', marginBottom: 6 }}
            >
              Email address
            </label>
            <div style={{ position: 'relative' }}>
              <FiMail
                size={15}
                style={{
                  position: 'absolute', left: 12, top: '50%',
                  transform: 'translateY(-50%)', color: 'var(--muted)',
                }}
              />
              <input
                id="login-email"
                type="email"
                className="input"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                style={{ paddingLeft: 36 }}
                required
                autoComplete="email"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="login-password"
              style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--ink)', display: 'block', marginBottom: 6 }}
            >
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <FiLock
                size={15}
                style={{
                  position: 'absolute', left: 12, top: '50%',
                  transform: 'translateY(-50%)', color: 'var(--muted)',
                }}
              />
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                className="input"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                style={{ paddingLeft: 36, paddingRight: 40 }}
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute', right: 12, top: '50%',
                  transform: 'translateY(-50%)', background: 'none',
                  border: 'none', cursor: 'pointer', color: 'var(--muted)',
                  display: 'flex', alignItems: 'center',
                }}
              >
                {showPassword ? <FiEyeOff size={15} /> : <FiEye size={15} />}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            id="login-submit"
            className="btn btn-primary"
            disabled={loginMutation.isPending}
            style={{
              width: '100%', justifyContent: 'center', marginTop: 4,
              opacity: loginMutation.isPending ? 0.7 : 1,
            }}
          >
            {loginMutation.isPending ? 'Signing in…' : (
              <>Sign In <FiArrowRight size={15} /></>
            )}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 24, fontSize: '0.88rem', color: 'var(--muted)' }}>
          New to Akshar?{' '}
          <Link to="/register" style={{ color: 'var(--saffron)', fontWeight: 600 }}>
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
