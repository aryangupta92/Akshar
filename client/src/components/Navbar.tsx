import { Link } from "react-router-dom";
import { useNavigate, useLocation } from "react-router-dom";
import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { FiEdit3, FiBookmark, FiSearch, FiMenu, FiX, FiLogOut, FiUser } from 'react-icons/fi';
import toast from 'react-hot-toast';

export function Navbar() {
  const pathname = useLocation().pathname;
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    toast.success('Logged out');
  };

  const navLinks = [
    { to: '/browse', label: 'Browse' },
    { to: '/dashboard/my-works', label: 'My Works', auth: true },
  ];

  return (
    <nav
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        background: 'rgba(245,240,232,0.95)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border)',
        height: '64px',
        display: 'flex',
        alignItems: 'center',
        padding: '0 24px',
      }}
    >
      <div
        style={{
          maxWidth: '1280px',
          margin: '0 auto',
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Logo */}
        <Link to="/browse" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.6rem', fontWeight: 700, color: 'var(--saffron)', letterSpacing: '-0.02em' }}>
            अक्षर
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.1em', paddingTop: '4px' }}>
            Akshar
          </span>
        </Link>

        {/* Desktop Nav */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {navLinks.map((link) => {
            if (link.auth && !isAuthenticated) return null;
            const isActive = pathname === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                style={{
                  padding: '6px 16px',
                  borderRadius: '6px',
                  fontSize: '0.9rem',
                  fontWeight: 500,
                  color: isActive ? 'var(--saffron)' : 'var(--ink)',
                  background: isActive ? 'rgba(232,131,42,0.1)' : 'transparent',
                  transition: 'all 0.2s',
                }}
              >
                {link.label}
              </Link>
            );
          })}

          <Link to="/browse" style={{ padding: '8px', color: 'var(--muted)' }}>
            <FiSearch size={18} />
          </Link>

          {isAuthenticated ? (
            <>
              <Link to="/dashboard/my-works" className="btn btn-primary" style={{ padding: '8px 16px' }}>
                <FiEdit3 size={15} /> Write
              </Link>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--parchment)', cursor: 'pointer', color: 'var(--ink)', fontSize: '0.85rem', fontWeight: 500 }}
                >
                  <span style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--saffron)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700 }}>
                    {user?.name?.charAt(0).toUpperCase()}
                  </span>
                  <span style={{ maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</span>
                  {menuOpen ? <FiX size={14} /> : <FiMenu size={14} />}
                </button>

                {menuOpen && (
                  <div style={{ position: 'absolute', top: '110%', right: 0, background: '#fff', border: '1px solid var(--border)', borderRadius: '10px', boxShadow: '0 8px 32px rgba(0,0,0,0.12)', minWidth: 180, padding: '8px', zIndex: 200 }}>
                    <Link to="/dashboard/my-works" onClick={() => setMenuOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 6, fontSize: '0.88rem', color: 'var(--ink)' }}>
                      <FiUser size={14} /> My Works
                    </Link>
                    <button onClick={() => { handleLogout(); setMenuOpen(false); }} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 6, fontSize: '0.88rem', color: '#c03020', width: '100%', cursor: 'pointer', border: 'none', background: 'transparent' }}>
                      <FiLogOut size={14} /> Logout
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', gap: '8px' }}>
              <Link to="/login" className="btn btn-ghost" style={{ padding: '8px 16px' }}>Login</Link>
              <Link to="/register" className="btn btn-primary" style={{ padding: '8px 16px' }}>Join Free</Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
