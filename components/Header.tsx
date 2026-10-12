'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { COMPANY, NAV } from '@/lib/site';

function Brand() {
  return (
    <Link className="brand" href="/" aria-label="Wildfire Express home">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/assets/mark.png" alt="" width={46} height={26} />
      <span><b>Wildfire Express</b><small>OTR · DRY VAN · 48 STATES</small></span>
    </Link>
  );
}

export default function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const burger = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setOpen(false), []);

  // close on navigation
  useEffect(() => { setOpen(false); }, [pathname]);

  useEffect(() => {
    document.body.classList.toggle('lock', open);
    if (open) menu.current?.querySelector<HTMLElement>('a, button')?.focus();
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setOpen(false); burger.current?.focus(); return; }
      if (e.key !== 'Tab' || !menu.current || !burger.current) return;
      const items = [burger.current, ...menu.current.querySelectorAll<HTMLElement>('a, button')];
      const first = items[0], last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    const mq = matchMedia('(min-width: 1180px)');
    const onMq = (e: MediaQueryListEvent) => { if (e.matches) setOpen(false); };
    document.addEventListener('keydown', onKey);
    mq.addEventListener('change', onMq);
    return () => {
      document.removeEventListener('keydown', onKey);
      mq.removeEventListener('change', onMq);
      document.body.classList.remove('lock');
    };
  }, [open]);

  const current = (href: string) => (pathname === href ? 'page' : undefined);

  return (
    <>
      <header className="site-header">
        <div className="bar">
          <Brand />
          <nav className="nav" aria-label="Primary">
            {NAV.map((n) => <Link key={n.href} href={n.href} aria-current={current(n.href)}>{n.label}</Link>)}
          </nav>
          <a className="head-phone" href={`tel:${COMPANY.tel}`}>{COMPANY.phone}</a>
          <Link className="btn" href="/apply" aria-current={current('/apply')}>Apply in 90 sec <span className="arr" aria-hidden="true">→</span></Link>
          <button
            ref={burger}
            className="burger"
            type="button"
            aria-expanded={open}
            aria-controls="menu"
            aria-label={open ? 'Close menu' : 'Open menu'}
            onClick={() => setOpen((v) => !v)}
          ><span /></button>
        </div>
      </header>
      <div ref={menu} className={`menu${open ? ' is-open' : ''}`} id="menu" aria-hidden={!open} inert={!open}>
        <nav aria-label="Mobile">
          {NAV.map((n, i) => (
            <Link key={n.href} href={n.href} aria-current={current(n.href)} onClick={close}>
              {n.label} <small>{String(i + 1).padStart(2, '0')}</small>
            </Link>
          ))}
        </nav>
        <div className="menu-foot">
          <Link className="btn btn-block" href="/apply" onClick={close}>Apply in 90 sec <span className="arr" aria-hidden="true">→</span></Link>
          <a className="head-phone" href={`tel:${COMPANY.tel}`}>Dispatch 24/7 · {COMPANY.phone}</a>
        </div>
      </div>
    </>
  );
}

export { Brand };
