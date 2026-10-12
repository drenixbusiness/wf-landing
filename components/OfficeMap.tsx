'use client';

import { useEffect, useRef, useState } from 'react';
import type { Map as MlMap, StyleSpecification, LayerSpecification } from 'maplibre-gl';
import { COMPANY } from '@/lib/site';
import 'maplibre-gl/dist/maplibre-gl.css';

// CARTO "Dark Matter" vector basemap, recoloured to the site's ember palette.
const STYLE_URL = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';
const CARTO_KEY = process.env.NEXT_PUBLIC_CARTO_KEY ?? '';

const C = {
  bg: '#0d0b09', land: '#110f0c', park: '#13110d', water: '#070605', building: '#17140f',
  case: '#0d0b09', minor: '#2b241b', sec: '#4a3b25', pri: '#6e5530', major: '#b68235',
  rail: '#2a2219', border: '#5a3b0a', label: '#a8956f', place: '#e3cfae', halo: '#0d0b09',
};

function paint(l: LayerSpecification) {
  const id = l.id;
  const p = ((l as { paint?: Record<string, unknown> }).paint ??= {});
  if (l.type === 'background') p['background-color'] = C.bg;
  else if (l.type === 'fill') {
    if (/water/.test(id)) p['fill-color'] = C.water;
    else if (/building/.test(id)) { p['fill-color'] = C.building; p['fill-outline-color'] = C.case; }
    else if (/park/.test(id)) p['fill-color'] = C.park;
    else p['fill-color'] = C.land;
  } else if (l.type === 'line') {
    if (/_case/.test(id)) p['line-color'] = C.case;
    else if (/_(mot|trunk)_fill/.test(id)) { p['line-color'] = C.major; p['line-opacity'] = 0.85; }
    else if (/_pri_fill/.test(id)) p['line-color'] = C.pri;
    else if (/_sec_fill/.test(id)) p['line-color'] = C.sec;
    else if (/rail/.test(id)) p['line-color'] = C.rail;
    else if (/boundary/.test(id)) { p['line-color'] = C.border; p['line-opacity'] = 0.7; }
    else if (/waterway/.test(id)) p['line-color'] = C.water;
    else p['line-color'] = C.minor;
  } else if (l.type === 'symbol') {
    p['text-color'] = /^place_(city|town|state)/.test(id) ? C.place : C.label;
    p['text-halo-color'] = C.halo;
    if (/^place_city_dot|^place_capital_dot/.test(id)) p['icon-opacity'] = 0;
  }
}

export default function OfficeMap() {
  const box = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);
  const { lat, lng } = COMPANY.geo;
  const directions = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(COMPANY.address)}`;

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    let map: MlMap | null = null;
    let cancelled = false;

    async function init() {
      try {
        const [ml, style] = await Promise.all([
          import('maplibre-gl'),
          fetch(STYLE_URL).then((r) => r.json() as Promise<StyleSpecification>),
        ]);
        if (cancelled || !el) return;
        style.layers.forEach(paint);
        // stay inside the US, no POI clutter
        style.layers = style.layers.filter((l) => !/^poi_|housenumber|watername_ocean|place_continent|place_country/.test(l.id));

        const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
        map = new ml.Map({
          container: el,
          style,
          center: [lng, lat],
          zoom: reduced ? 13.2 : 9,
          pitch: 0,
          attributionControl: { compact: true },
          cooperativeGestures: true, // never hijack page scrolling
          transformRequest: (url) =>
            CARTO_KEY && /cartocdn\.com/.test(url)
              ? { url: url + (url.includes('?') ? '&' : '?') + 'api_key=' + encodeURIComponent(CARTO_KEY) }
              : { url },
        });
        map.addControl(new ml.NavigationControl({ showCompass: false }), 'bottom-right');
        // on wide screens the address card covers the left of the map: keep the pin in the free area
        const pad = () => map?.setPadding({ left: el.clientWidth >= 900 ? Math.min(420, el.clientWidth * 0.36) : 0, top: 0, right: 0, bottom: 0 });
        pad();
        map.on('resize', pad);

        const pin = document.createElement('div');
        pin.className = 'office-pin';
        pin.setAttribute('aria-hidden', 'true');
        pin.innerHTML = '<span class="office-pin__pulse"></span><span class="office-pin__dot"></span>';
        new ml.Marker({ element: pin, anchor: 'center' }).setLngLat([lng, lat]).addTo(map);

        map.once('load', () => {
          if (!reduced) map?.flyTo({ center: [lng, lat], zoom: 13.2, pitch: 40, bearing: -12, duration: 3200, essential: false });
        });
        map.on('error', (e) => { if (/style|Failed to fetch/i.test(String(e.error?.message))) setFailed(true); });
      } catch {
        if (!cancelled) setFailed(true);
      }
    }

    // only download the map engine when the section is about to be seen
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) { io.disconnect(); init(); }
    }, { rootMargin: '300px 0px' });
    io.observe(el);
    return () => { cancelled = true; io.disconnect(); map?.remove(); };
  }, [lat, lng]);

  return (
    <div className="office-map">
      <div ref={box} className="office-map__canvas" role="region" aria-label={`Map showing ${COMPANY.legalName}, ${COMPANY.address}`}>
        {failed && <p className="office-map__fallback">Map unavailable — {COMPANY.address}</p>}
      </div>
      <div className="office-card">
        <p className="kicker">Yard &amp; HQ</p>
        <b>{COMPANY.legalName}</b>
        <address>{COMPANY.street}<br />{COMPANY.city}</address>
        <div className="office-card__links">
          <a className="btn btn--solid" href={directions} target="_blank" rel="noopener noreferrer">Get directions <span className="arr" aria-hidden="true">→</span></a>
          <a className="text-link" href={`tel:${COMPANY.tel}`}>{COMPANY.phone}</a>
        </div>
      </div>
    </div>
  );
}
