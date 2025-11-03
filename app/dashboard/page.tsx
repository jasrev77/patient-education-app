'use client';

import { useEffect, useState } from 'react';
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

export default function Dashboard() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setMsg(null);

      // Verify session so we can give helpful errors
      const { data: sessionData, error: sessionError } = await supabaseBrowser.auth.getSession();
      if (sessionError || !sessionData?.session) {
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
    })();
  }, []);

  async function logout() {
    await supabaseBrowser.auth.signOut();
    window.location.assign('/login');
  }

  return (
    <main className="space-y-6 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <button onClick={logout} className="rounded bg-gray-900 px-3 py-1.5 text-white">Log out</button>
      </div>

      <p className="text-sm text-gray-600">These rows come from <code>drug_education</code>. RLS limits you to your pharmacy.</p>

      {loading && <p>Loading…</p>}
      {msg && <p className="text-red-600">{msg}</p>}

      {!loading && !msg && rows.length === 0 && (
        <div className="rounded border bg-white p-4 text-sm text-gray-700">
          No rows yet. In Supabase → <em>drug_education</em>, insert one with your <em>pharmacy_id</em>.<br />
          Example: GPI <code>36100010XXXX10</code>, title <em>Atorvastatin (Lipitor)</em>.
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {rows.map((r) => (
          <div key={r.id} className="rounded border bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium">{r.title}</h2>
              <span className="rounded bg-gray-100 px-2 py-1 text-xs font-mono">{r.gpi}</span>
            </div>
            <p className="mt-2 text-sm text-gray-700">{r.summary ?? 'No summary yet.'}</p>
            {r.video_url && (
              <a className="mt-3 inline-block text-sm text-blue-600 underline" href={r.video_url} target="_blank">
                Preview video
              </a>
            )}
            <div className="mt-3 text-xs text-gray-500">
              Updated: {r.last_checked ? new Date(r.last_checked).toLocaleString() : '—'}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
