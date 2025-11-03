'use client';
import { FormEvent, useState } from 'react';
import { supabaseBrowser } from '@/lib/supabase-browser';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setPending(true);
    setStatus('Signing in…');
    const { data, error } = await supabaseBrowser.auth.signInWithPassword({ email, password });

    if (error) {
      setStatus(`Error: ${error.message}`);
      setPending(false);
      return;
    }

    // Extra verification of a real session
    const { data: sessionData } = await supabaseBrowser.auth.getSession();
    if (!sessionData?.session) {
      setStatus('Signed in, but no session found. Check NEXT_PUBLIC_SUPABASE_URL / ANON key.');
      setPending(false);
      return;
    }

    setStatus('Success! Redirecting to dashboard…');
    setTimeout(() => {
      window.location.assign('/dashboard');
    }, 400);
  }

  return (
    <main className="mx-auto max-w-md space-y-6 p-4">
      <h1 className="text-2xl font-semibold">Pharmacist Login</h1>
      <form onSubmit={onSubmit} className="space-y-4">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@pharmacy.com"
          className="w-full rounded border p-2"
          required
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="w-full rounded border p-2"
          required
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded bg-black px-4 py-2 text-white disabled:opacity-60"
        >
          {pending ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
      {status && <p className="text-sm">{status}</p>}
      <div className="text-xs text-gray-500">
        Tip: Make sure your user is <em>confirmed</em> in Supabase (Auth → Users) and Email/Password is enabled.
      </div>
    </main>
  );
}
