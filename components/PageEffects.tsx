'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const sstep = (a: number, b: number, x: number) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };

function fmt(el: HTMLElement, v: number) {
  const dec = Number(el.dataset.decimals || 0);
  el.textContent = (el.dataset.prefix || '') + v.toFixed(dec) + (el.dataset.suffix || '');
}

/**
 * Page-level DOM behaviour that the static markup opts into with classes / data attributes:
 * `.reveal` fade-ups (staggered inside `[data-stagger]`), `[data-count]` counters,
 * row-aware borders in `.cols`, and the sticky home hero chapters. Re-runs on every route.
 */
export default function PageEffects() {
  const pathname = usePathname();

  useEffect(() => {
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const $$ = <T extends Element = HTMLElement>(s: string, c: ParentNode = document) => [...c.querySelectorAll<T & Element>(s)] as T[];
    const cleanups: (() => void)[] = [];
    const listen = <K extends keyof WindowEventMap>(t: K, fn: (e: WindowEventMap[K]) => void, o?: AddEventListenerOptions) => {
      addEventListener(t, fn, o);
      cleanups.push(() => removeEventListener(t, fn, o));
    };

    /* row-aware borders */
    const rows = () => $$<HTMLElement>('.cols').forEach((g) => {
      const kids = [...g.children] as HTMLElement[];
      kids.forEach((k, i) => {
        k.classList.toggle('is-row-end', !kids[i + 1] || kids[i + 1].offsetTop !== k.offsetTop);
        k.classList.toggle('is-row-start', !kids[i - 1] || kids[i - 1].offsetTop !== k.offsetTop);
      });
    });
    rows();
    listen('resize', rows);
    document.fonts?.ready.then(rows);

    /* counters */
    const count = (el: HTMLElement, instant = false) => {
      const to = parseFloat(el.dataset.count || '0');
      if (instant || reduced) { fmt(el, to); return; }
      const t0 = performance.now();
      const tick = (now: number) => {
        const p = clamp01((now - t0) / 1500);
        fmt(el, to * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };

    /* reveals — anything already in view is shown without animating */
    $$<HTMLElement>('[data-stagger]').forEach((g) => $$<HTMLElement>('.reveal', g).forEach((el, i) => el.style.setProperty('--d', `${(i % 4) * 80}ms`)));
    const vh = innerHeight;
    const inView = (el: Element) => { const r = el.getBoundingClientRect(); return r.top < vh && r.bottom > 0; };
    const reveals = $$<HTMLElement>('.reveal');
    const counters = $$<HTMLElement>('[data-count]');
    reveals.forEach((el) => { if (reduced || inView(el)) el.classList.add('no-anim'); });
    counters.forEach((el) => { if (reduced || inView(el)) { count(el, true); el.dataset.done = '1'; } else fmt(el, 0); });
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        const el = e.target as HTMLElement;
        if (el.classList.contains('reveal')) el.classList.add('is-in');
        if (el.dataset.count && !el.dataset.done) { el.dataset.done = '1'; count(el); }
        io.unobserve(el);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    reveals.forEach((el) => { if (!el.classList.contains('no-anim')) io.observe(el); });
    counters.forEach((el) => { if (!el.dataset.done) io.observe(el); });
    cleanups.push(() => io.disconnect());

    /* sticky hero chapters: cross-fade in step with the camera keys */
    const hero = document.querySelector<HTMLElement>('.hero-scroll');
    if (hero) {
      const markers = $$<HTMLElement>('[data-shot]', hero);
      const chapters = $$<HTMLElement>('.chapter', hero);
      const dots = $$<HTMLElement>('.hero-dots span', hero);
      const bar = hero.querySelector<HTMLElement>('.hero-progress');
      let keys: number[] = [];
      const measure = () => {
        keys = markers.map((m) => { const r = m.getBoundingClientRect(); return r.top + scrollY + r.height / 2 - innerHeight / 2; });
      };
      const update = () => {
        const y = scrollY;
        let k = 0;
        if (y >= keys[keys.length - 1]) k = keys.length - 1;
        else if (y > keys[0]) {
          let i = 0;
          while (i < keys.length - 1 && keys[i + 1] <= y) i++;
          k = i + (y - keys[i]) / Math.max(1, keys[i + 1] - keys[i]);
        }
        chapters.forEach((c, i) => {
          const d = k - i;
          const o = 1 - sstep(0.22, 0.48, Math.abs(d));
          c.style.opacity = o.toFixed(3);
          c.style.transform = reduced ? 'none' : `translateY(${(-d * 56).toFixed(1)}px)`;
          c.classList.toggle('is-on', o > 0.02);
          c.setAttribute('aria-hidden', String(o < 0.5));
        });
        const active = Math.round(k);
        dots.forEach((d, i) => d.classList.toggle('is-on', i === active));
        if (bar) {
          const r = hero.getBoundingClientRect();
          bar.style.setProperty('--hp', clamp01(-r.top / Math.max(1, r.height - innerHeight)).toFixed(3));
        }
      };
      let ticking = false;
      const onScroll = () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => { ticking = false; update(); });
      };
      measure(); update();
      listen('resize', () => { measure(); update(); });
      listen('scroll', onScroll, { passive: true });
    }

    return () => cleanups.forEach((fn) => fn());
  }, [pathname]);

  return null;
}
