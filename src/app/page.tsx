'use client'
import React from 'react';
import { useRouter } from 'next/navigation';
import ProtectedAction from '../components/ProtectedAction';

export default function Page() {

  const router = useRouter();

  return (
    <div style={{minHeight: '100vh', display: 'flex', flexDirection: 'column'}}>
      <nav style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'12px 20px',borderBottom:'1px solid #e6edf3',background:'#fff'}}>
        <div style={{fontWeight:700}}>Mindmap App</div>
        <div style={{display:'flex',gap:8,alignItems:'center'}}>
          <span style={{color:'#64748b',fontSize:13}}>A simple tool to capture ideas</span>
          <button style={{padding:'6px 10px',borderRadius:6,border:'1px solid #cbd5e1',background:'#071033',cursor:'pointer'}} onClick={() => router.push('/login')}>Login</button>
        </div>
      </nav>

      <main className="container hero" style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',padding:40,background:'#f7fafc'}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:24,flexWrap:'wrap'}}>
          <div style={{flex:1, minWidth:280}}>
            <h1 style={{fontSize:44, margin:0}}>Mindmap — Visual thinking, reimagined</h1>
            <p style={{marginTop:12, color:'var(--muted)', maxWidth:640}}>
              Quickly capture ideas, link concepts and export beautiful maps. Sign in to create and manage your mindmaps.
            </p>

            <div style={{marginTop:18, display:'flex', gap:12}}>
              <ProtectedAction to="/dashboard" className="primary">
                Create Mindmap
              </ProtectedAction>
              <button className="ghost" onClick={() => window.location.href = '/register'}>Sign up</button>
            </div>
          </div>

          {/* illustrative panel */}
          <div style={{width:360, minWidth:220}}>
            <div className="card" style={{padding:18}}>
              <div style={{fontWeight:700}}>Welcome</div>
              <div style={{marginTop:8,color:'var(--muted)'}}>Your saved mindmaps and recent activity will appear on the Dashboard after you sign in.</div>
            </div>
          </div>
        </div>
      </main>

      <footer style={{padding:16,background:'#fff',borderTop:'1px solid #e6edf3',textAlign:'center',fontSize:13,color:'#64748b'}}>
        © {new Date().getFullYear()} Mindmap App — Built for thinking
      </footer>
    </div>
  );
}