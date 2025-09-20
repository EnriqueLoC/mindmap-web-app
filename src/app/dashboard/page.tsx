'use client'
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabase/supabaseClient';

type Mindmap = {
  id: string;
  title: string;
  owner: string;
  createdAt: string;
  description?: string;
  tags?: string[];
  mindmap_data?: any;
};

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [maps, setMaps] = useState<Mindmap[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const raw = typeof window !== 'undefined' ? localStorage.getItem('mindmap_user') : null;
    if (!raw) {
      localStorage.setItem('mindmap_after_login', '/dashboard');
      router.push('/login');
      return;
    }
    const u = JSON.parse(raw);
    setUser({ id: u.id, email: u.email });

    // cargar mindmaps desde Supabase
    loadMindmaps(u.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadMindmaps(userId: string) {
    const { data, error } = await supabase
      .from('mindmaps')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading mindmaps:', error);
      setMaps([]);
    } else {
      const mapped = data.map((m: any) => ({
        id: m.id,
        title: m.title,
        owner: user?.email ?? '',
        createdAt: m.created_at,
        description: m.description,
        tags: m.tags,
        mindmap_data: m.mindmap_data
      }));
      setMaps(mapped);
    }
  }

  async function handleCreateMindmap() {
    if (!user) return;
    if (!title.trim()) return alert('Title is required');

    setLoading(true);

    const { data, error } = await supabase
      .from('mindmaps')
      .insert([{
        user_id: user.id,
        title,
        description,
        tags: tags.split(',').map(t => t.trim()).filter(t => t),
        mindmap_data: {}
      }])
      .select()
      .single();

    setLoading(false);

    if (error) {
      console.error('Error creating mindmap:', error);
      alert('Failed to create mindmap');
    } else {
      const newMap: Mindmap = {
        id: data.id,
        title: data.title,
        owner: user.email,
        createdAt: data.created_at,
        description: data.description,
        tags: data.tags,
        mindmap_data: data.mindmap_data
      };
      setMaps(prev => [newMap, ...prev]);
      setModalOpen(false);
      setTitle('');
      setDescription('');
      setTags('');
      router.push(`/mindmap/${data.id}`);
    }
  }

  return (
    <main className="container" style={{ paddingTop: 28, paddingBottom: 40 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <h2 style={{ margin: 0 }}>Dashboard</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setModalOpen(true)}>New Mindmap</button>
          <button className="ghost" onClick={() => { localStorage.removeItem('mindmap_user'); router.push('/'); }}>Sign out</button>
        </div>
      </div>

      <section style={{ marginTop: 20 }}>
        {maps.length === 0 ? (
          <div className="card" style={{ padding: 24 }}>
            <div style={{ fontWeight: 700 }}>You have no mindmaps yet</div>
            <div style={{ marginTop: 8, color: 'var(--muted)' }}>Create your first mindmap to get started.</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 12, marginTop: 12 }}>
            {maps.map(m => (
              <div key={m.id} className="card" style={{ padding: 12 }}>
                <div style={{ fontWeight: 700 }}>{m.title}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6 }}>Created: {new Date(m.createdAt).toLocaleString()}</div>
                <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
                  <button onClick={() => router.push(`/mindmap/${m.id}`)}>Open</button>
                  <button className="ghost" onClick={async () => {
                    const { error } = await supabase.from('mindmaps').delete().eq('id', m.id);
                    if (!error) setMaps(prev => prev.filter(x => x.id !== m.id));
                  }}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {modalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div className="card" style={{ padding: 24, width: 360, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <h3>Create Mindmap</h3>
            <input placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} />
            <textarea placeholder="Description" value={description} onChange={e => setDescription(e.target.value)} />
            <input placeholder="Tags (comma separated)" value={tags} onChange={e => setTags(e.target.value)} />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button onClick={() => setModalOpen(false)}>Cancel</button>
              <button onClick={handleCreateMindmap} disabled={loading}>{loading ? 'Creating…' : 'Create'}</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
