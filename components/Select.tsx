'use client';

import { useEffect, useId, useRef, useState } from 'react';

// Styled replacement for <select>: the native option list can't be themed (OS highlight colours),
// so this follows the ARIA "select-only combobox" pattern — arrows, Home/End, type-ahead, Enter, Esc.
interface Props {
  id: string;
  value: string;
  options: string[];
  placeholder: string;
  invalid?: boolean;
  onChange: (v: string) => void;
}

export default function Select({ id, value, options, placeholder, invalid, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [up, setUp] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const typed = useRef({ s: '', t: 0 });
  const listId = useId();

  function show() {
    const r = root.current?.getBoundingClientRect();
    if (r) setUp(innerHeight - r.bottom < 300 && r.top > innerHeight - r.bottom);
    setActive(Math.max(0, options.indexOf(value)));
    setOpen(true);
  }
  function pick(i: number) {
    onChange(options[i]);
    setOpen(false);
    root.current?.querySelector<HTMLButtonElement>('button')?.focus();
  }

  useEffect(() => {
    if (!open) return;
    const off = (e: PointerEvent) => { if (!root.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('pointerdown', off);
    return () => document.removeEventListener('pointerdown', off);
  }, [open]);

  useEffect(() => {
    if (open) list.current?.children[active]?.scrollIntoView({ block: 'nearest' });
  }, [open, active]);

  function onKey(e: React.KeyboardEvent) {
    const last = options.length - 1;
    const move = (i: number) => { e.preventDefault(); if (!open) show(); setActive(Math.min(last, Math.max(0, i))); };
    switch (e.key) {
      case 'ArrowDown': return open ? move(active + 1) : move(Math.max(0, options.indexOf(value)));
      case 'ArrowUp': return move(open ? active - 1 : Math.max(0, options.indexOf(value)));
      case 'Home': return move(0);
      case 'End': return move(last);
      case 'PageDown': return move(active + 8);
      case 'PageUp': return move(active - 8);
      case 'Enter': case ' ':
        e.preventDefault();
        if (open) pick(active); else show();
        return;
      case 'Escape': if (open) { e.preventDefault(); setOpen(false); } return;
      case 'Tab': if (open) pick(active); return;
    }
    if (e.key.length === 1 && /\S/.test(e.key)) {
      const now = Date.now();
      typed.current = { s: (now - typed.current.t < 700 ? typed.current.s : '') + e.key.toLowerCase(), t: now };
      const i = options.findIndex((o) => o.toLowerCase().startsWith(typed.current.s));
      if (i >= 0) { if (!open) show(); setActive(i); }
    }
  }

  return (
    <div ref={root} className={`select${open ? ' is-open' : ''}${up ? ' is-up' : ''}`}>
      <button
        id={id}
        type="button"
        role="combobox"
        className="apply-input select__btn"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-activedescendant={open ? `${listId}-${active}` : undefined}
        aria-invalid={invalid || undefined}
        onClick={() => (open ? setOpen(false) : show())}
        onKeyDown={onKey}
      >
        <span className={value ? undefined : 'select__ph'}>{value || placeholder}</span>
      </button>
      {open && (
        <ul ref={list} id={listId} role="listbox" className="select__list" aria-labelledby={id} tabIndex={-1}>
          {options.map((o, i) => (
            <li
              key={o}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={o === value}
              className={i === active ? 'is-active' : undefined}
              onPointerEnter={() => setActive(i)}
              onPointerDown={(e) => e.preventDefault()}
              onClick={() => pick(i)}
            >
              {o}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
