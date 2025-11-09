'use client';

import { useEffect, useState, FormEvent } from 'react';
import { supabaseBrowser } from '@/lib/supabase-browser';

type Row = {
  id: string;
  pharmacy_id: string;
  gpi: string;
  title: string;
  video_url: string | null;
  summary: string | null;
  last_checked: string | null;
};

function toEmbedUrl(url?: string | null) {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (u.hostname.includes('youtube.com') && u.pathname === '/watch' && u.searchParams.get('v')) {
      return `https://www.youtube.com/embed/${u.searchParams.get('v')!}`;
    }
    if (u.hostname === 'youtu.be') {
      return `https://www.youtube.com/embed/${u.pathname.slice(1)}`;
    }
    if (u.hostname.includes('vimeo.com') && /^\d+$/.test(u.pathname.slice(1))) {
      return `https://player.vimeo.com/video/${u.pathname.slice(1)}`;
    }
    return url;
  } catch { return url ?? null; }
}

export default function Dashboard() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);

  // create form
  const [gpi, setGpi] = useState('');
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [videoUrl, setVideoUrl] = useState('');

  // edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [eGpi, setEGpi] = useState('');
  const [eTitle, setETitle] = useState('');
  const [eSummary, setESummary] = useState('');
  const [eVideoUrl, setEVideoUrl] = useState('');

  async function loadRows() {
    setLoading(true);
    setMsg(null);

    const { data: sessionData, error: sessionErr } = await supabaseBrowser.auth.getSession();
    if (sessionErr || !sessionData?.session) {
      setMsg('Not signed in. Please log in again.');
      setLoading(false);
      return;
    }

    const { data, error } = await supabaseBrowser
      .from('drug_education')
      .select('id, pharmacy_id, gpi, title, video_url, summary, last_checked')
      .order('title');

    if (error) setMsg(`Error: ${error.message}`);
    setRows(data || []);
    setLoading(false);
  }

  useEffect(() => { loadRows(); }, []);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setMsg(null);

    const { data: pidData, error: pidErr } = await supabaseBrowser.rpc('current_pharmacy_id');
    if (pidErr || !pidData) { setMsg('Could not resolve your pharmacy_id.'); return; }

    const payload = {
      pharmacy_id: pidData as string,
      gpi: gpi.trim(),
      title: title.trim(),
      summary: summary.trim() || null,
      video_url: toEmbedUrl(videoUrl.trim()) || null,
      last_checked: new Date().toISOString(),
    };

    const { error } = await supabaseBrowser.from('drug_education').insert(payload);
    if (error) { setMsg(`Create failed: ${error.message}`); return; }

    setGpi(''); setTitle(''); setSummary(''); setVideoUrl('');
    await loadRows();
    setMsg('Saved!');
  }

  function startEdit(r: Row) {
    setEditingId(r.id);
    setEGpi(r.gpi);
    setETitle(r.title);
    setESummary(r.summary ?? '');
    setEVideoUrl(r.video_url ?? '');
  }

  function cancelEdit() {
    setEditingId(null);
    setEGpi(''); setETitle(''); setESummary(''); setEVideoUrl('');
  }

  async function saveEdit(id: string) {
    setMsg(null);
    const updates = {
      gpi: eGpi.trim(),
      title: eTitle.trim(),
      summary: eSummary.trim() || null,
      video_url: toEmbedUrl(eVideoUrl.trim()) || null,
      last_checked: new Date().toISOString(),
    };
    const { error } = await supabaseBrowser.from('drug_education').update(updates).eq('id', id);
    if (error) { setMsg(`Update failed: ${error.message}`); return; }
    cancelEdit();
    await loadRows();
    setMsg('Updated!');
  }

  async function deleteRow(id: string, title: string) {
    setMsg(null);
    const ok = confirm(`Delete "${title}"? This cannot be undone.`);
    if (!ok) return;
    const { error } = await supabaseBrowser.from('drug_education').delete().eq('id', id);
    if (error) { setMsg(`Delete failed: ${error.message}`); return; }
    await loadRows();
    setMsg('Deleted.');
  }

  async function logout() {
    // clear cookie used by middleware guard (if present)
    document.cookie = 'pe_logged_in=; Max-Age=0; Path=/; SameSite=Lax';
    await supabaseBrowser.auth.signOut();
    window.location.assign('/login');
  }

  return (
    <main className="space-y-8 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <button onClick={logout} className="rounded bg-gray-900 px-3 py-1.5 text-white">Log out</button>
      </div>

      <section className="rounded border bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-lg font-medium">Add education</h2>
        <form onSubmit={onCreate} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="col-span-1">
            <label className="block text-sm font-medium">GPI</label>
            <input value={gpi} onChange={(e)=>setGpi(e.target.value)} required className="mt-1 w-full rounded border p-2" placeholder="e.g., 67404000100000" />
          </div>
          <div className="col-span-1">
            <label className="block text-sm font-medium">Title</label>
            <input value={title} onChange={(e)=>setTitle(e.target.value)} required className="mt-1 w-full rounded border p-2" placeholder="Atorvastatin Tablets" />
          </div>
          <div className="col-span-1 sm:col-span-2">
            <label className="block text-sm font-medium">Summary</label>
            <input value={summary} onChange={(e)=>setSummary(e.target.value)} className="mt-1 w-full rounded border p-2" placeholder="Short patient-friendly description" />
          </div>
          <div className="col-span-1 sm:col-span-2">
            <label className="block text-sm font-medium">Video URL</label>
            <input value={videoUrl} onChange={(e)=>setVideoUrl(e.target.value)} className="mt-1 w-full rounded border p-2" placeholder="Paste YouTube/Vimeo/MP4 URL" />
          </div>
          <div className="col-span-1 sm:col-span-2">
            <button type="submit" className="mt-2 rounded bg-blue-600 px-4 py-2 text-white">Save</button>
          </div>
        </form>
        {msg && <p className="mt-3 text-sm">{msg}</p>}
      </section>

      <section className="space-y-4">
        <p className="text-sm text-gray-600">
          These rows come from <code>drug_education</code>. RLS limits you to your pharmacy.
        </p>

        {loading && <p>Loading…</p>}
        {!loading && rows.length === 0 && (
          <div className="rounded border bg-white p-4 text-sm text-gray-700">
            No rows yet. Add one above using your GPI.
          </div>
        )}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {rows.map((r) => {
            const isEditing = editingId === r.id;
            return (
              <div key={r.id} className="rounded border bg-white p-4 shadow-sm">
                {!isEditing ? (
                  <>
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium">{r.title}</h3>
                      <span className="rounded bg-gray-100 px-2 py-1 text-xs font-mono">{r.gpi}</span>
                    </div>
                    <p className="mt-2 text-sm text-gray-700">{r.summary ?? 'No summary yet.'}</p>
                    {r.video_url && (
                      <a className="mt-3 inline-block text-sm text-blue-600 underline" href={r.video_url} target="_blank">
                        Preview video
                      </a>
                    )}
                    <div className="mt-3 flex gap-2">
                      <button onClick={() => startEdit(r)} className="rounded bg-amber-500 px-3 py-1.5 text-white">Edit</button>
                      <button onClick={() => deleteRow(r.id, r.title)} className="rounded bg-red-600 px-3 py-1.5 text-white">Delete</button>
                    </div>
                    <div className="mt-2 text-xs text-gray-500">
                      Updated: {r.last_checked ? new Date(r.last_checked).toLocaleString() : '—'}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="grid grid-cols-1 gap-3">
                      <div>
                        <label className="block text-sm font-medium">GPI</label>
                        <input value={eGpi} onChange={(e)=>setEGpi(e.target.value)} className="mt-1 w-full rounded border p-2" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium">Title</label>
                        <input value={eTitle} onChange={(e)=>setETitle(e.target.value)} className="mt-1 w-full rounded border p-2" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium">Summary</label>
                        <input value={eSummary} onChange={(e)=>setESummary(e.target.value)} className="mt-1 w-full rounded border p-2" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium">Video URL</label>
                        <input value={eVideoUrl} onChange={(e)=>setEVideoUrl(e.target.value)} className="mt-1 w-full rounded border p-2" placeholder="Paste YouTube/Vimeo/MP4 URL" />
                      </div>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <button onClick={() => saveEdit(r.id)} className="rounded bg-blue-600 px-3 py-1.5 text-white">Save</button>
                      <button onClick={cancelEdit} className="rounded bg-gray-300 px-3 py-1.5">Cancel</button>
                      <button onClick={() => deleteRow(r.id, r.title)} className="rounded bg-red-600 px-3 py-1.5 text-white">Delete</button>
                    </div>
                    <div className="mt-2 text-xs text-gray-500">
                      Updated will refresh after save.
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}
