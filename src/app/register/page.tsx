'use client'
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabase/supabaseClient';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function validate() {
    if (!name.trim()) return 'Please enter your name';
    if (!email.trim()) return 'Please enter your email';
    if (!/^\S+@\S+\.\S+$/.test(email)) return 'Please enter a valid email';
    if (password.length < 6) return 'Password must be at least 6 characters';
    if (password !== confirm) return 'Passwords do not match';
    return '';
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    const v = validate();
    if (v) { setError(v); return; }

    setLoading(true);
    try {
      // 1. Registrar usuario en Auth
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password
      });

      if (signUpError) {
        setError(signUpError.message || 'Registration failed');
        return;
      }

      if (!signUpData.user) {
        setError('Registration successful — please check your email to confirm your account.');
        router.push('/login');
        return;
      }

      // 2. Crear perfil en tabla "users"
      const userId = signUpData.user.id;
      const username = email.split('@')[0].toLowerCase().replace(/[^a-z0-9._-]/g, '').slice(0, 32);

      const profileRow = {
        id: userId,
        email,
        username,
        display_name: name,
        avatar_url: null,
        is_active: true
      };

      const { error: upsertError } = await supabase.from('users').upsert([profileRow]);
      if (upsertError) {
        console.error('Failed to upsert profile:', upsertError);
        setError('Account created but profile save failed.');
        return;
      }

      // 3. Guardar local y redirigir
      localStorage.setItem('mindmap_user', JSON.stringify(profileRow));
      const dest = localStorage.getItem('mindmap_after_login') || '/dashboard';
      localStorage.removeItem('mindmap_after_login');
      router.push(dest);

    } catch (err: any) {
      setError(err?.message || 'Unexpected error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-wrap">
        <div className="login-left">
          <div className="brand" style={{ alignItems: 'center', marginBottom: 14 }}>
            <span className="logo" />
            <div>
              <div style={{ fontSize: 18, cursor: 'pointer' }} onClick={() => router.push('/')}>Mindmap</div>
              <div style={{ fontSize: 12, opacity: 0.9 }}>Visual thinking, reimagined</div>
            </div>
          </div>

          <h2>Create your account</h2>
          <p style={{ maxWidth: 420, marginTop: 10, lineHeight: 1.5 }}>
            Join Mindmap to start organizing your ideas. Create nodes, connect them, and export beautiful maps.
          </p>

          <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
            <button className="ghost" onClick={() => router.push('/')}>Explore</button>
            <button onClick={() => router.push('/login')}>Already have an account</button>
          </div>

          <div className="login-decor" />
        </div>

        <div className="login-right">
          <div className="login-card card">
            <h3>Create account</h3>

            <form onSubmit={onSubmit}>
              <div className="login-field">
                <label style={{ color: 'var(--muted)', fontSize: 13 }}>Full name</label>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
              </div>

              <div className="login-field">
                <label style={{ color: 'var(--muted)', fontSize: 13 }}>Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" />
              </div>

              <div className="login-field">
                <label style={{ color: 'var(--muted)', fontSize: 13 }}>Password</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
              </div>

              <div className="login-field">
                <label style={{ color: 'var(--muted)', fontSize: 13 }}>Confirm password</label>
                <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="••••••••" />
              </div>

              {error && <div style={{ color: '#ff8b8b', marginBottom: 8 }}>{error}</div>}

              <div style={{ marginTop: 14, display: 'flex', gap: 10 }}>
                <button type="submit" style={{ flex: 1 }} disabled={loading}>{loading ? 'Creating…' : 'Create account'}</button>
                <button type="button" className="ghost" onClick={() => { setName(''); setEmail(''); setPassword(''); setConfirm(''); setError(''); }}>Clear</button>
              </div>
            </form>

            <div className="login-footer">
              Already registered? <button className="ghost" onClick={() => router.push('/login')}>Sign in</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}