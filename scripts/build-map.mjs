// Builds public/assets/us-map.json from us-atlas (nation-10m) with topojson-client.
// Output is pre-projected to the 3D ground plane so the browser does no geo work.
// Run: node scripts/build-map.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import * as topojson from 'topojson-client';

const require = createRequire(import.meta.url);
const topo = JSON.parse(readFileSync(require.resolve('us-atlas/nation-10m.json'), 'utf8'));
const nation = topojson.feature(topo, topo.objects.nation);

// Lower-48 bounding box (drops Alaska, Hawaii, territories)
const inL48 = ([lon, lat]) => lon > -125.5 && lon < -66 && lat > 24 && lat < 49.6;

const polys = [];
for (const f of nation.features) {
  const g = f.geometry;
  const list = g.type === 'Polygon' ? [g.coordinates] : g.coordinates;
  for (const p of list) {
    const ring = p[0];
    const c = ring.reduce((a, q) => [a[0] + q[0] / ring.length, a[1] + q[1] / ring.length], [0, 0]);
    if (inL48(c)) polys.push(p);
  }
}

// Outline: simplified rings (drop points closer than 0.06°), skip tiny islands
const round = (v) => Math.round(v * 100) / 100;
const outline = [];
for (const p of polys) {
  for (const ring of p) {
    const out = [];
    let last = null;
    for (const q of ring) {
      if (!last || Math.hypot(q[0] - last[0], q[1] - last[1]) > 0.06) { out.push(round(q[0]), round(q[1])); last = q; }
    }
    if (out.length >= 16) outline.push(out);
  }
}

function inside(pt, poly) {
  // even-odd test against outer ring and holes
  let ins = false;
  for (const ring of poly) {
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const [xi, yi] = ring[i], [xj, yj] = ring[j];
      if ((yi > pt[1]) !== (yj > pt[1]) && pt[0] < ((xj - xi) * (pt[1] - yi)) / (yj - yi) + xi) ins = !ins;
    }
  }
  return ins;
}

function dots(step) {
  const out = [];
  for (let lat = 24.5; lat < 49.5; lat += step) {
    for (let lon = -125; lon < -66.5; lon += step) {
      if (polys.some((p) => inside([lon, lat], p))) out.push(round(lon), round(lat));
    }
  }
  return out;
}

const data = { outline, dots: dots(0.55), dotsLow: dots(0.825) };
writeFileSync(new URL('../public/assets/us-map.json', import.meta.url), JSON.stringify(data));
console.log('rings', outline.length, 'dots', data.dots.length / 2, 'dotsLow', data.dotsLow.length / 2);
