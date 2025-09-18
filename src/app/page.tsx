'use client'
import React from 'react';
import Link from 'next/link';

export default function Page() {
  return (
    <div style={{minHeight: '100vh', display: 'flex', flexDirection: 'column'}}>
      <nav style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'12px 20px',borderBottom:'1px solid #e6edf3',background:'#fff'}}>
        <div style={{fontWeight:700}}>Mindmap App</div>
        <div style={{display:'flex',gap:8,alignItems:'center'}}>
          <span style={{color:'#64748b',fontSize:13}}>A simple tool to capture ideas</span>
          <button style={{padding:'6px 10px',borderRadius:6,border:'1px solid #cbd5e1',background:'#fff',cursor:'pointer'}}>Login</button>
        </div>
      </nav>

      <main style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',padding:40,background:'#f7fafc'}}>
        <section style={{maxWidth:980,width:'100%',display:'flex',gap:24,alignItems:'center'}}>
          <div style={{flex:1}}>
            <h1 style={{margin:0,fontSize:34}}>Create mindmaps that organize your thoughts</h1>
            <p style={{color:'#475569',marginTop:12,fontSize:16}}>
              Quickly add nodes, draw connections, and export your maps. Click the button to open the editor page.
            </p>
            <div style={{marginTop:20}}>
              <Link href="/mindmap">
                <p style={{padding:'12px 18px',background:'#2b6cb0',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',textDecoration:'none'}}>Create a mindmap</p>
              </Link>
            </div>
          </div>
          <div style={{width:360,background:'#fff',padding:16,borderRadius:8,boxShadow:'0 6px 18px rgba(11,22,40,0.06)'}}>
            <h3 style={{marginTop:0}}>Why use this</h3>
            <ul style={{paddingLeft:18,color:'#475569'}}>
              <li>Quick node creation</li>
              <li>Drag and connect nodes</li>
              <li>Save / load JSON and export PNG</li>
            </ul>
          </div>
        </section>
      </main>

      <footer style={{padding:16,background:'#fff',borderTop:'1px solid #e6edf3',textAlign:'center',fontSize:13,color:'#64748b'}}>
        © {new Date().getFullYear()} Mindmap App — Built for thinking
      </footer>
    </div>
  );
}