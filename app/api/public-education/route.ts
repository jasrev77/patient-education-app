import { NextResponse } from 'next/server';
import { supabaseServerAdmin } from '@/lib/supabase-server';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get('slug');
  const gpi = searchParams.get('gpi');
  if (!slug || !gpi) return NextResponse.json({ error: 'Missing slug or gpi' }, { status: 400 });

  const supa = supabaseServerAdmin();

  const { data, error } = await supa
    .from('drug_education')
    .select('title, video_url, summary, pharmacies!inner(slug)')
    .eq('gpi', gpi)
    .eq('pharmacies.slug', slug)
    .limit(1)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { title, video_url, summary } = data as any;
  return NextResponse.json({ title, video_url, summary });
}
