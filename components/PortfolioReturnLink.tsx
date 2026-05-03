import { useLayoutEffect, useState } from 'react';

function isAllowedPortfolioReturn(u: URL): boolean {
  if (u.protocol !== 'http:' && u.protocol !== 'https:') return false;
  if (u.username || u.password) return false;
  if (u.protocol === 'http:') {
    return u.hostname === 'localhost' || u.hostname === '127.0.0.1';
  }
  return true;
}

function parsePortfolioReturn(search: string): string | null {
  let raw: string | null;
  try {
    raw = new URLSearchParams(search).get('portfolioReturn');
  } catch {
    return null;
  }
  if (!raw) return null;
  try {
    raw = decodeURIComponent(raw.trim());
  } catch {
    return null;
  }
  try {
    const u = new URL(raw);
    if (!isAllowedPortfolioReturn(u)) return null;
    return u.href;
  } catch {
    return null;
  }
}

/** Fixed top-center link when opened from design portfolio (?portfolioReturn=…). */
export function PortfolioReturnLink() {
  const [href, setHref] = useState<string | null>(null);
  useLayoutEffect(() => {
    setHref(parsePortfolioReturn(window.location.search));
  }, []);
  if (!href) return null;
  return (
    <a
      href={href}
      className="fixed left-1/2 top-4 z-[10000] max-w-[calc(100vw-2rem)] -translate-x-1/2 rounded-lg border border-gray-200/90 bg-white/95 px-3 py-2 text-center text-sm font-medium text-gray-900 shadow-md backdrop-blur-sm transition-colors hover:bg-white hover:border-gray-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7A005D] focus-visible:ring-offset-2"
    >
      Back to portfolio home page
    </a>
  );
}
