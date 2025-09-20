'use client'
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabase/supabaseClient';

export default function LoginPage() {
	const router = useRouter();
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [error, setError] = useState('');
	const [loading, setLoading] = useState(false);

	async function onSubmit(e: React.FormEvent) {
		e.preventDefault();
		setError('');
		if (!email.trim()) { setError('Please enter your email'); return; }
		if (!password) { setError('Please enter your password'); return; }

		setLoading(true);
		try {
			const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });
			if (authError) {
				if (authError.message.includes('Email not confirmed')) {
					setError('Please confirm your email before signing in.');
				} else {
					setError(authError.message || 'Sign in failed');
				}
				return;
			}

			// authData.user should exist on successful sign-in
			const userId = authData.user?.id;
			if (!userId) {
				setError('Sign in did not return a user. Please try again.');
				return;
			}

			// fetch profile from your users table
			const { data: profile, error: profileError } = await supabase
				.from('users')
				.select('id, email, username, display_name, avatar_url, is_active')
				.eq('id', userId)
				.single();

			if (profileError) {
				// If profile row missing, fall back to minimal user info from auth
				const fallback = { id: userId, email };
				localStorage.setItem('mindmap_user', JSON.stringify(fallback));
			} else {
				localStorage.setItem('mindmap_user', JSON.stringify(profile));
			}

			// redirect to intended destination
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

					<h2>Build ideas faster</h2>
					<p style={{ maxWidth: 420, marginTop: 10, lineHeight: 1.5 }}>
						Create, connect and iterate on your thoughts with a fluid, colorful canvas — collaborate in real time and export beautifully.
					</p>

					<div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
						<button className="ghost" onClick={() => { window.open('https://github.com', '_blank') }}>Explore templates</button>
						<button onClick={() => router.push('/login')}>Get started</button>
					</div>

					<div className="login-decor" />

				</div>

				<div className="login-right">
					<div className="login-card card">
						<h3>Sign in to your account</h3>

						<form onSubmit={onSubmit}>
							<label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Email</label>
							<input
								type="email"
								value={email}
								onChange={(ev) => setEmail(ev.target.value)}
								placeholder="you@company.com"
								style={{ marginBottom: 12 }}
							/>

							<label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Password</label>
							<input
								type="password"
								value={password}
								onChange={(ev) => setPassword(ev.target.value)}
								placeholder="••••••••"
								style={{ marginBottom: 12 }}
							/>

							{error && <div style={{ color: '#ff8b8b', marginBottom: 12 }}>{error}</div>}

							<div style={{ display: 'flex', gap: 8 }}>
								<button type="submit" style={{ flex: 1 }} disabled={loading}>
									{loading ? 'Signing in…' : 'Sign in'}
								</button>
								<button type="button" className="ghost" onClick={() => { setEmail(''); setPassword(''); setError(''); }}>
									Clear
								</button>
							</div>
						</form>

						<div className="login-footer">
							New here? <button className="ghost" onClick={() => router.push('/register')}>Create an account</button>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
