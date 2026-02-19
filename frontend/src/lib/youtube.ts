// Extrai o ID tanto de shorts, watch?v=, quanto youtu.be
export function youtubeId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes('youtube.com')) {
      if (u.pathname.startsWith('/shorts/')) return u.pathname.split('/')[2] || null;
      if (u.pathname === '/watch') return u.searchParams.get('v');
    }
    if (u.hostname === 'youtu.be') return u.pathname.slice(1) || null;
  } catch {}
  return null;
}

export function getVideoEmbedUrl(url: string): string {
  const id = youtubeId(url);
  return id ? `https://www.youtube.com/embed/${id}` : url;
}

export function isVerticalVideo(url: string): boolean {
  // heurística simples: shorts tendem a ser 9:16
  return /youtube\.com\/shorts\//.test(url);
}

export function youtubeThumb(url: string): string | null {
  const id = youtubeId(url);
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null;
}
