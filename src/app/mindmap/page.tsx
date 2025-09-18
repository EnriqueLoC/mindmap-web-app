'use client'
import React from 'react';
import Link from 'next/link';
import MindmapClient from '../../components/MindmapClient';

export default function MindmapPage() {
  return (
    <div style={{height:'100vh', display:'flex', flexDirection:'column'}}>
      <header style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 16px',borderBottom:'1px solid #e6edf3',background:'#fff'}}>
        <div style={{fontWeight:700}}>Mindmap Editor</div>
        <div style={{display:'flex',gap:8,alignItems:'center'}}>
          <Link href="/"><p style={{padding:'6px 10px',borderRadius:6,border:'1px solid #cbd5e1',background:'#fff',textDecoration:'none'}}>Back</p></Link>
        </div>
      </header>

      <div style={{flex:1, minHeight:0}}>
        {/* Render editor full-screen */}
        <MindmapClient />
      </div>

      <footer style={{padding:12,background:'#fff',borderTop:'1px solid #e6edf3',textAlign:'center',fontSize:13,color:'#64748b'}}>
        © {new Date().getFullYear()} Mindmap App
      </footer>
    </div>
  );
}
