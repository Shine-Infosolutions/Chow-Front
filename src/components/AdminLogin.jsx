import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, ShieldCheck, LogIn } from 'lucide-react';
import { useApi } from '../contexts/index.jsx';
import logo from '../assets/logo.png';

/**
 * Inline admin sign-in shown on /admin routes when the visitor isn't an
 * authenticated admin. On success it stores the session and calls onSuccess
 * so the protected route re-renders into the dashboard.
 */
const AdminLogin = ({ onSuccess }) => {
  const { login } = useApi();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await login(form);
      if (res?.token && res?.user) {
        if (res.user.role !== 'admin') {
          setError('This account does not have admin access.');
          return;
        }
        localStorage.setItem('token', res.token);
        localStorage.setItem('user', JSON.stringify(res.user));
        onSuccess?.();
      } else {
        setError('Invalid email or password.');
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-11 pr-4 text-sm text-gray-900 transition focus:border-[#d80a4e] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#d80a4e]/20';

  return (
    <div className="mithai-bg flex min-h-screen items-center justify-center p-4">
      <div className="animate-fade-up w-full max-w-sm">
        <div className="overflow-hidden rounded-3xl border border-amber-100 bg-white shadow-xl">
          {/* Brand header */}
          <div className="flex flex-col items-center gap-2 bg-gradient-to-br from-[#d80a4e] to-[#8b1a3a] px-6 py-7 text-center text-white">
            <img src={logo} alt="Chowdhry Sweet House" className="h-14 w-auto object-contain brightness-0 invert" />
            <div>
              <h1 className="font-display text-xl font-bold">Admin Panel</h1>
              <p className="text-xs text-pink-100">Chowdhry Sweet House</p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 p-6">
            <p className="text-sm text-gray-500">Sign in with your admin credentials to continue.</p>

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="relative">
              <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="Admin email"
                autoComplete="username"
                className={inputClass}
                required
              />
            </div>

            <div className="relative">
              <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Password"
                autoComplete="current-password"
                className={`${inputClass} pr-11`}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#d80a4e]"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="shine-on-hover flex w-full items-center justify-center gap-2 rounded-xl bg-[#d80a4e] py-3 text-sm font-semibold text-white transition hover:bg-[#b8083e] disabled:opacity-50"
            >
              {loading ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              ) : (
                <LogIn className="h-4 w-4" />
              )}
              {loading ? 'Signing in…' : 'Sign in'}
            </button>

            <p className="flex items-center justify-center gap-1.5 pt-1 text-xs text-gray-400">
              <ShieldCheck className="h-3.5 w-3.5" /> Authorized access only
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
