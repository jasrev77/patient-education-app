export const revalidate = 0;               // disable ISR
export const dynamic = 'force-dynamic';    // opt out of static rendering

import type { DrugEducation } from '@/lib/types';

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
    if (/\.(mp4|webm|ogg)$/i.test(u.pathname)) return u.toString();
    return u.toString();
  } catch {
    return url ?? null;
  }
}

async function fetchEducation(
  slug: string,
  gpi: string
): Promise<Pick<DrugEducation, 'title' | 'video_url' | 'summary'> | null> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL ?? ''}/api/public-education?slug=${encodeURIComponent(slug)}&gpi=${encodeURIComponent(gpi)}`,
    { cache: 'no-store' } // force fresh fetch
  );
  if (!res.ok) return null;
  return res.json();
}

// Next 16: params is a Promise
export default async function PatientPage(props: { params: Promise<{ slug: string; gpi: string }> }) {
  const { slug, gpi } = await props.params;
  const edu = await fetchEducation(slug, gpi);

  if (!edu) {
    return (
      <main className="prose mx-auto max-w-2xl p-4">
        <h1>Patient Education</h1>
        <p>We couldn't find education for this code. Please contact your pharmacy.</p>
      </main>
    );
  }

  const embedUrl = toEmbedUrl(edu.video_url);

  return (
    <main className="prose mx-auto max-w-2xl p-4">
      <h1>{edu.title}</h1>

      {embedUrl && embedUrl.includes('youtube.com/embed') && (
        <div className="my-4 aspect-video w-full">
          <iframe
            src={embedUrl}
            className="h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
            title="Patient Education Video"
          />
        </div>
      )}

      {embedUrl && embedUrl.includes('player.vimeo.com') && (
        <div className="my-4 aspect-video w-full">
          <iframe
            src={embedUrl}
            className="h-full w-full"
            allow="autoplay; fullscreen; picture-in-picture"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
            title="Patient Education Video"
          />
        </div>
      )}

      {embedUrl && /\.(mp4|webm|ogg)$/i.test(embedUrl) && (
        <div className="my-4 w-full">
          <video src={embedUrl} className="w-full" controls playsInline />
        </div>
      )}

      {!embedUrl && edu.video_url && (
        <p className="text-sm text-red-600">
          This video URL can’t be embedded. Try a YouTube/Vimeo embed URL or a direct MP4.
        </p>
      )}

      {edu.summary && <p>{edu.summary}</p>}
      <hr />
      <p className="text-sm">
        This page is provided by your pharmacy for general education only. Not a substitute for professional medical advice.
      </p>
    </main>
  );
}

