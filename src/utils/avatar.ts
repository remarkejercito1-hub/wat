// Robust TikTok and streamer avatar helper with multi-tier fallback
// Guarantees profile pictures NEVER show as an empty black profile box.

const GRADIENTS = [
  ['#4f46e5', '#7c3aed'],
  ['#059669', '#10b981'],
  ['#d97706', '#f59e0b'],
  ['#dc2626', '#f43f5e'],
  ['#0284c7', '#06b6d4'],
  ['#7c2d12', '#ea580c'],
  ['#4c1d95', '#9333ea'],
];

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/**
 * Inline SVG avatar data URI fallback that works 100% offline without any network requests.
 */
export function getInlineFallbackSvg(username: string): string {
  const clean = (username || 'user').replace(/^@/, '').trim();
  const hash = hashString(clean || 'user');
  const [c1, c2] = GRADIENTS[hash % GRADIENTS.length];
  const initial = (clean[0] || 'U').toUpperCase();

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
    <defs>
      <linearGradient id="g_${hash}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${c1}" />
        <stop offset="100%" stop-color="${c2}" />
      </linearGradient>
    </defs>
    <rect width="100" height="100" rx="24" fill="url(#g_${hash})" />
    <circle cx="50" cy="40" r="18" fill="rgba(255,255,255,0.25)" />
    <circle cx="50" cy="85" r="30" fill="rgba(255,255,255,0.25)" />
    <text x="50" y="58" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="34" font-weight="900" fill="#ffffff" text-anchor="middle" dominant-baseline="middle">${initial}</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * Returns authentic TikTok profile picture avatar URL.
 * Never defaults to bot/robot avatars. Uses live unavatar.io TikTok provider
 * or custom verified profile picture.
 */
export function getAvatarUrl(username: string, customAvatar?: string): string {
  const clean = (username || 'user').replace(/^@/, '').trim().toLowerCase();

  // If a valid custom non-bot avatar URL is provided, use it
  if (
    customAvatar &&
    customAvatar.trim().length > 5 &&
    !customAvatar.includes('/bottts/') &&
    !customAvatar.includes('/pixel-art/') &&
    !customAvatar.includes('seed=streamer') &&
    !customAvatar.includes('seed=player')
  ) {
    return customAvatar.trim();
  }

  if (!clean || clean === 'user' || clean === 'streamer') {
    return 'https://unavatar.io/tiktok/mrbeast';
  }

  // Authentic TikTok profile picture
  return `https://unavatar.io/tiktok/${encodeURIComponent(clean)}`;
}

/**
 * Handle img onError event safely without infinite loops, falling back gracefully
 * to proxy, cross-platform profile, or clean human initials SVG (NEVER robot avatars).
 */
export function handleAvatarImgError(e: React.SyntheticEvent<HTMLImageElement, Event>, username: string) {
  const target = e.currentTarget;
  const clean = (username || 'user').replace(/^@/, '').trim().toLowerCase();
  const currentSrc = target.src || '';

  // 1st fallback: Try our server-side avatar proxy with multi-platform resolver
  if (currentSrc.includes('unavatar.io/tiktok/')) {
    target.src = `/api/tiktok/avatar/${encodeURIComponent(clean)}`;
    return;
  }

  // 2nd fallback: Universal social profile avatar (YouTube, Twitter, GitHub)
  if (!currentSrc.includes('/api/tiktok/avatar/') && !currentSrc.includes('unavatar.io/' + encodeURIComponent(clean))) {
    target.src = `https://unavatar.io/${encodeURIComponent(clean)}`;
    return;
  }

  // Final fallback: Elegant offline SVG initials badge with vibrant gradient (no bots)
  target.src = getInlineFallbackSvg(clean);
}
