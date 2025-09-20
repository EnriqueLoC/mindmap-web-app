'use client'
import React from 'react';
import { useRouter } from 'next/navigation';

type Props = {
	// destination when authenticated (default /dashboard)
	to?: string;
	className?: string;
	children: React.ReactNode;
};

export default function ProtectedAction({ to = '/dashboard', className, children }: Props) {
	const router = useRouter();

	function handleClick() {
		try {
			const raw = typeof window !== 'undefined' ? localStorage.getItem('mindmap_user') : null;
			if (raw) {
				router.push(to);
			} else {
				// preserve where user wanted to go by storing a small flag (optional)
				localStorage.setItem('mindmap_after_login', to);
				router.push('/login');
			}
		} catch {
			router.push('/login');
		}
	}

	return (
		<button onClick={handleClick} className={className}>
			{children}
		</button>
	);
}
