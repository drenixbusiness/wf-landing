'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import type { WorldHandle } from '@/lib/world';

// One canvas for the whole site. It lives in the root layout, so it survives client-side
// navigation and the camera glides from the last shot of one page to the first of the next.
let world: WorldHandle | null = null;
let starting: Promise<void> | null = null;

export default function World() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || world || starting) return;
    // three.js (~600 KB) is fetched only in the browser, once the page has painted and gone idle,
    // so text and the poster render first (LCP) and input stays responsive on weak phones.
    const start = () => import('@/lib/world').then(({ createWorld }) => { world = createWorld(canvas); });
    starting = new Promise<void>((resolve) => {
      const go = () => start().then(resolve);
      if ('requestIdleCallback' in window) requestIdleCallback(go, { timeout: 1500 });
      else setTimeout(go, 300);
    });
  }, []);

  useEffect(() => {
    // new page content → re-read its [data-shot] sections once layout settles
    const id = requestAnimationFrame(() => world?.refresh());
    const t = setTimeout(() => world?.refresh(), 400);
    return () => { cancelAnimationFrame(id); clearTimeout(t); };
  }, [pathname]);

  return <canvas ref={canvasRef} className="world-canvas" aria-hidden="true" />;
}
