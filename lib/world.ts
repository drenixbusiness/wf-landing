// Wildfire Express — persistent 3D world.
// One fixed canvas behind every page (mounted once in the root layout); the camera is driven by
// [data-shot] sections and glides between pages on client-side navigation.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { LineSegments2 } from 'three/addons/lines/LineSegments2.js';
import { LineSegmentsGeometry } from 'three/addons/lines/LineSegmentsGeometry.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';

export type ShotName = 'hero' | 'applyHero' | 'mapClose' | 'sideContact' | 'side' | 'sideClose' | 'side2' | 'side2Close' | 'rear' | 'wheel' | 'top' | 'road' | 'map' | 'mapLow';

export interface WorldHandle {
  /** Re-read [data-shot] sections (call after a route change or layout shift). */
  refresh: () => void;
  dispose: () => void;
}

interface Shot { target: THREE.Vector3; dir: THREE.Vector3; dist: number; map: boolean; ox: number }
interface Key { key: number; shot: ShotName; drag: boolean }
interface MapTruck { path: THREE.Vector3[]; nodes: number[]; len: number[]; s: number; speed: number }
type FadeMat = (THREE.LineBasicMaterial | THREE.ShaderMaterial | THREE.SpriteMaterial | LineMaterial) & { userData: { max?: number } };

const GOLD = { 200: 0xffe3bf, 300: 0xfacb8d, 400: 0xe1ad66, 500: 0xb68235, 600: 0xa06f24, 800: 0x5a3b0a } as const;

const CITIES: [string, number, number][] = [
  ['Seattle', -122.33, 47.61], ['Portland', -122.68, 45.52], ['Boise', -116.2, 43.62], ['Sacramento', -121.49, 38.58],
  ['San Francisco', -122.42, 37.77], ['Los Angeles', -118.24, 34.05], ['San Diego', -117.16, 32.72], ['Las Vegas', -115.14, 36.17],
  ['Phoenix', -112.07, 33.45], ['Salt Lake City', -111.89, 40.76], ['Albuquerque', -106.65, 35.08], ['Denver', -104.99, 39.74],
  ['El Paso', -106.44, 31.76], ['Billings', -108.5, 45.78], ['Cheyenne', -104.82, 41.14], ['Omaha', -95.93, 41.26],
  ['Kansas City', -94.58, 39.1], ['Oklahoma City', -97.52, 35.47], ['Dallas', -96.8, 32.78], ['Houston', -95.37, 29.76],
  ['San Antonio', -98.49, 29.42], ['Minneapolis', -93.27, 44.98], ['Des Moines', -93.62, 41.59], ['St. Louis', -90.2, 38.63],
  ['Memphis', -90.05, 35.15], ['New Orleans', -90.07, 29.95], ['Chicago', -87.63, 41.88], ['Indianapolis', -86.16, 39.77],
  ['Nashville', -86.78, 36.16], ['Atlanta', -84.39, 33.75], ['Detroit', -83.05, 42.33], ['Cincinnati', -84.51, 39.1],
  ['Columbus', -82.99, 39.96], ['Charlotte', -80.84, 35.23], ['Jacksonville', -81.66, 30.33], ['Miami', -80.19, 25.76],
  ['Pittsburgh', -79.99, 40.44], ['Washington', -77.04, 38.91], ['Philadelphia', -75.17, 39.95], ['New York', -74.0, 40.71],
  ['Boston', -71.06, 42.36], ['Buffalo', -78.88, 42.89], ['Cleveland', -81.69, 41.5],
];

// Interstate corridors between neighbouring cities — straight ground segments, not airline arcs.
const INTERSTATES: [string, string][] = [
  // I-5 / I-84
  ['Seattle', 'Portland'], ['Portland', 'Sacramento'], ['Sacramento', 'Los Angeles'], ['Los Angeles', 'San Diego'],
  ['Portland', 'Boise'], ['Boise', 'Salt Lake City'],
  // I-90 / I-94
  ['Seattle', 'Billings'], ['Billings', 'Minneapolis'], ['Minneapolis', 'Chicago'], ['Chicago', 'Detroit'],
  ['Chicago', 'Cleveland'], ['Cleveland', 'Buffalo'], ['Buffalo', 'Boston'],
  // I-80
  ['San Francisco', 'Sacramento'], ['Sacramento', 'Salt Lake City'], ['Salt Lake City', 'Cheyenne'], ['Cheyenne', 'Omaha'],
  ['Omaha', 'Des Moines'], ['Des Moines', 'Chicago'], ['Cleveland', 'New York'],
  // I-15 / I-25
  ['San Diego', 'Las Vegas'], ['Los Angeles', 'Las Vegas'], ['Las Vegas', 'Salt Lake City'], ['Salt Lake City', 'Billings'],
  ['El Paso', 'Albuquerque'], ['Albuquerque', 'Denver'], ['Denver', 'Cheyenne'], ['Cheyenne', 'Billings'],
  // I-70
  ['Denver', 'Kansas City'], ['Kansas City', 'St. Louis'], ['St. Louis', 'Indianapolis'], ['Indianapolis', 'Columbus'],
  ['Columbus', 'Pittsburgh'], ['Pittsburgh', 'Washington'], ['Pittsburgh', 'Philadelphia'], ['Pittsburgh', 'Cleveland'],
  // I-40
  ['Los Angeles', 'Albuquerque'], ['Albuquerque', 'Oklahoma City'], ['Oklahoma City', 'Memphis'], ['Memphis', 'Nashville'],
  ['Nashville', 'Charlotte'],
  // I-10
  ['Los Angeles', 'Phoenix'], ['Phoenix', 'El Paso'], ['El Paso', 'San Antonio'], ['San Antonio', 'Houston'],
  ['Houston', 'New Orleans'], ['New Orleans', 'Jacksonville'],
  // I-35 / I-45 / I-20 / I-29 / I-44 / I-30
  ['San Antonio', 'Dallas'], ['Dallas', 'Oklahoma City'], ['Oklahoma City', 'Kansas City'], ['Kansas City', 'Des Moines'],
  ['Des Moines', 'Minneapolis'], ['Dallas', 'Houston'], ['Dallas', 'Atlanta'], ['Omaha', 'Kansas City'],
  ['Oklahoma City', 'St. Louis'], ['Dallas', 'Memphis'],
  // I-55 / I-65 / I-75 / I-71 / I-74 / I-85
  ['New Orleans', 'Memphis'], ['Memphis', 'St. Louis'], ['St. Louis', 'Chicago'], ['Nashville', 'Indianapolis'],
  ['Indianapolis', 'Chicago'], ['Nashville', 'Atlanta'], ['Atlanta', 'Cincinnati'], ['Cincinnati', 'Detroit'],
  ['Atlanta', 'Jacksonville'], ['Cincinnati', 'Columbus'], ['Columbus', 'Cleveland'], ['Cincinnati', 'Indianapolis'],
  ['Atlanta', 'Charlotte'],
  // I-95
  ['Miami', 'Jacksonville'], ['Jacksonville', 'Charlotte'], ['Charlotte', 'Washington'], ['Washington', 'Philadelphia'],
  ['Philadelphia', 'New York'], ['New York', 'Boston'],
];

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const smooth = (x: number) => x * x * (3 - 2 * x);
const sstep = (a: number, b: number, x: number) => smooth(clamp01((x - a) / (b - a)));

export function createWorld(canvas: HTMLCanvasElement): WorldHandle | null {
  const root = document.documentElement;
  const isPhone = matchMedia('(max-width: 767px)').matches;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  // weak = few cores, little RAM, or the user asked to save data → lite model, 30 fps, lower resolution
  const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean; effectiveType?: string } };
  const forced = new URLSearchParams(location.search).get('quality'); // ?quality=lite to preview the low-end path
  const weak = forced === 'lite' || (navigator.hardwareConcurrency || 8) <= 4 || (nav.deviceMemory ?? 8) <= 4
    || !!nav.connection?.saveData || /(^|-)2g$/.test(nav.connection?.effectiveType ?? '');
  let lowEnd = isPhone || weak;
  const maxPR = isPhone ? (weak ? 1 : 1.25) : (weak ? 1.25 : 1.75);
  const minPR = isPhone ? 0.75 : 1;
  let pr = Math.min(devicePixelRatio || 1, maxPR);
  let degraded = false;

  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: !isPhone && !weak, alpha: false, powerPreference: isPhone ? 'default' : 'high-performance' });
  } catch {
    root.classList.add('no-webgl');
    return null;
  }

  const ac = new AbortController();
  const on = { signal: ac.signal } as const;

  renderer.setPixelRatio(pr);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = !lowEnd;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.shadowMap.autoUpdate = false; // truck and light are static: render the shadow once

  let dirty = true;
  let keys: Key[] = [];
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0e0c0a);
  const fog = new THREE.Fog(0x0e0c0a, 25, 175);
  scene.fog = fog;
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 4000);

  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(renderer), 0.04).texture;

  // Smooth "night studio" environment for the black paint: a warm horizon band and a soft
  // overhead strip, so flat panels reflect clean gradients instead of the room's boxes.
  const studio = new THREE.Scene();
  studio.add(new THREE.Mesh(new THREE.SphereGeometry(10, 48, 24), new THREE.ShaderMaterial({
    side: THREE.BackSide,
    vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `varying vec3 vP; void main(){
      float y = vP.y;
      vec3 c = mix(vec3(0.015, 0.012, 0.01), vec3(0.03, 0.026, 0.022), smoothstep(-0.2, 0.6, y));
      c += vec3(0.95, 0.62, 0.28) * exp(-pow((y - 0.02) / 0.05, 2.0)) * 0.7;
      c += vec3(1.0, 0.95, 0.88) * smoothstep(0.82, 0.97, y) * 1.4;
      gl_FragColor = vec4(c, 1.0); }`,
  })));
  const studioEnv = pmrem.fromScene(studio, 0.02).texture;

  /* ------------------------------------------------------------ lighting */
  scene.add(new THREE.HemisphereLight(0xffe3bf, 0x1a120a, 0.55));
  const key = new THREE.DirectionalLight(0xfff1de, 2.4);
  key.position.set(9, 15, 11);
  key.castShadow = !lowEnd;
  key.shadow.mapSize.set(2048, 2048);
  Object.assign(key.shadow.camera, { left: -9, right: 9, top: 9, bottom: -9, near: 1, far: 50 });
  key.shadow.bias = -0.0004;
  key.shadow.normalBias = 0.02;
  key.shadow.radius = 4;
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xffd8a8, 0.55);
  fill.position.set(-10, 6, 4);
  const rim = new THREE.DirectionalLight(0xe1ad66, 1.1);
  rim.position.set(-4, 5, -12);
  const fireA = new THREE.PointLight(GOLD[400], 38, 34, 2);
  fireA.position.set(-3.4, 1.1, -7.5);
  const fireB = new THREE.PointLight(GOLD[500], 30, 30, 2);
  fireB.position.set(3.6, 0.7, -6.2);
  scene.add(fill, rim, fireA, fireB);

  /* ------------------------------------------------------------ textures */
  function radialTexture(stops: [number, string][], size = 256) {
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const g = c.getContext('2d')!;
    const grd = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    stops.forEach(([o, col]) => grd.addColorStop(o, col));
    g.fillStyle = grd;
    g.fillRect(0, 0, size, size);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }
  const glowTex = radialTexture([
    [0, 'rgba(255,227,191,1)'], [0.18, 'rgba(250,203,141,0.75)'],
    [0.45, 'rgba(182,130,53,0.28)'], [1, 'rgba(90,59,10,0)'],
  ]);

  /* ------------------------------------------------------------ ground + road */
  const GROUND = new THREE.Color(0x120f0c), GROUND_MAP = new THREE.Color(0x070605);
  const groundMat = new THREE.MeshStandardMaterial({ color: GROUND.clone(), roughness: 0.96, metalness: 0 });
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(8000, 8000),
    groundMat,
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  // ground, asphalt, markings and the contact shadow are coplanar: instead of tiny height offsets (which z-fight
  // and make the road flicker as the camera moves) they skip depth writes and are layered by renderOrder.
  groundMat.depthWrite = false;
  ground.renderOrder = -3;
  scene.add(ground);

  const road = new THREE.Group();
  scene.add(road);
  const asphaltMat = new THREE.MeshStandardMaterial({ color: 0x1a1612, roughness: 0.9, transparent: true, depthWrite: false });
  const asphalt = new THREE.Mesh(new THREE.PlaneGeometry(15.4, 900), asphaltMat);
  asphalt.rotation.x = -Math.PI / 2;
  asphalt.position.y = 0.004;
  asphalt.receiveShadow = true;
  asphalt.renderOrder = -2;
  road.add(asphalt);

  const dashMat = new THREE.MeshBasicMaterial({ color: GOLD[500], transparent: true, opacity: 0.85, depthWrite: false });
  const dashGeo = new THREE.PlaneGeometry(0.14, 3.2);
  dashGeo.rotateX(-Math.PI / 2);
  const DASHES = 100;
  const dashes = new THREE.InstancedMesh(dashGeo, dashMat, DASHES * 2);
  const m4 = new THREE.Matrix4();
  for (let i = 0; i < DASHES; i++) {
    const z = -450 + i * 9;
    m4.makeTranslation(-3.1, 0.012, z); dashes.setMatrixAt(i * 2, m4);
    m4.makeTranslation(3.1, 0.012, z); dashes.setMatrixAt(i * 2 + 1, m4);
  }
  dashes.renderOrder = -1;
  road.add(dashes);

  const shoulderMat = new THREE.MeshBasicMaterial({ color: GOLD[800], transparent: true, opacity: 0.9, depthWrite: false });
  [-7.4, 7.4].forEach((x) => {
    const s = new THREE.Mesh(new THREE.PlaneGeometry(0.08, 900), shoulderMat);
    s.rotation.x = -Math.PI / 2;
    s.position.set(x, 0.011, 0);
    s.renderOrder = -1;
    road.add(s);
  });

  // soft contact shadow (always on; covers for disabled shadow maps on phones)
  const contact = new THREE.Mesh(
    new THREE.PlaneGeometry(4.6, 9.4),
    new THREE.MeshBasicMaterial({
      map: radialTexture([[0, 'rgba(0,0,0,0.85)'], [0.55, 'rgba(0,0,0,0.45)'], [1, 'rgba(0,0,0,0)']]),
      transparent: true, depthWrite: false,
    }),
  );
  contact.rotation.x = -Math.PI / 2;
  contact.position.y = 0.015;
  scene.add(contact);

  /* ------------------------------------------------------------ horizon glow */
  const glowMat = new THREE.SpriteMaterial({
    map: glowTex, color: GOLD[400], blending: THREE.AdditiveBlending, depthWrite: false,
    transparent: true, opacity: 0.55, fog: false,
  });
  const horizon = new THREE.Sprite(glowMat);
  horizon.position.set(0, 4, -330);
  horizon.scale.set(620, 190, 1);
  const nearGlowMat = glowMat.clone();
  nearGlowMat.opacity = 0.22;
  const nearGlow = new THREE.Sprite(nearGlowMat);
  nearGlow.position.set(0, 1.5, -11);
  nearGlow.scale.set(26, 9, 1);
  scene.add(horizon, nearGlow);
  const bigGlows = [horizon, nearGlow];

  /* ------------------------------------------------------------ embers */
  const emberVert = /* glsl */`
    uniform float uTime; uniform float uPR; uniform float uH;
    attribute float aSeed; attribute float aSize; attribute vec3 aColor;
    varying vec3 vColor; varying float vA;
    void main(){
      vec3 p = position;
      float sp = 0.25 + fract(aSeed * 7.13) * 0.55;
      p.y = mod(p.y + uTime * sp, uH);
      p.x += sin(uTime * 0.31 + aSeed * 6.283) * 0.7;
      p.z += cos(uTime * 0.23 + aSeed * 4.1) * 0.7;
      vec4 mv = modelViewMatrix * vec4(p, 1.0);
      gl_Position = projectionMatrix * mv;
      gl_PointSize = aSize * uPR * (42.0 / max(-mv.z, 0.5));
      float h = p.y / uH;
      vA = smoothstep(0.0, 0.08, h) * (1.0 - smoothstep(0.55, 1.0, h)) * (0.55 + 0.45 * sin(uTime * 2.3 + aSeed * 30.0));
      vColor = aColor;
    }`;
  const emberFrag = /* glsl */`
    uniform float uOpacity; varying vec3 vColor; varying float vA;
    void main(){
      float d = length(gl_PointCoord - 0.5);
      float a = smoothstep(0.5, 0.0, d);
      gl_FragColor = vec4(vColor, a * a * vA * uOpacity);
    }`;
  const ramp = [GOLD[200], GOLD[300], GOLD[400], GOLD[500], 0xff7a3d].map((c) => new THREE.Color(c));
  function makeEmbers(count: number, sMin: number, sMax: number, opacity: number) {
    const pos = new Float32Array(count * 3);
    const seed = new Float32Array(count);
    const size = new Float32Array(count);
    const col = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = 2.5 + Math.pow(Math.random(), 0.7) * 20;
      pos.set([Math.cos(a) * r, Math.random() * 16, Math.sin(a) * r * 1.2 - 2], i * 3);
      seed[i] = Math.random();
      size[i] = sMin + Math.random() * (sMax - sMin);
      const c = ramp[(Math.random() * ramp.length) | 0];
      col.set([c.r, c.g, c.b], i * 3);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
    g.setAttribute('aSize', new THREE.BufferAttribute(size, 1));
    g.setAttribute('aColor', new THREE.BufferAttribute(col, 3));
    const m = new THREE.ShaderMaterial({
      vertexShader: emberVert, fragmentShader: emberFrag, transparent: true, depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: { uTime: { value: 0 }, uPR: { value: renderer.getPixelRatio() }, uH: { value: 16 }, uOpacity: { value: opacity } },
    });
    const p = new THREE.Points(g, m);
    p.frustumCulled = false;
    p.userData = { full: count, base: opacity };
    return p;
  }
  const embersSmall = makeEmbers(1400, 0.6, 1.7, 1);
  const embersLarge = makeEmbers(220, 2.2, 4.8, 0.5);
  scene.add(embersSmall, embersLarge);

  /* ------------------------------------------------------------ US network map */
  const map = new THREE.Group();
  map.visible = false;
  scene.add(map);
  const mapMats: FadeMat[] = [];
  let beacon: THREE.Sprite | null = null;
  const S = 13, LON0 = -98.6, LAT0 = 39.0, K = Math.cos((LAT0 * Math.PI) / 180);
  const proj = (lon: number, lat: number, y = 0) => new THREE.Vector3((lon - LON0) * K * S, y, -(lat - LAT0) * S);
  const cityPos = CITIES.map(([, lon, lat]) => proj(lon, lat, 0.3));

  const cityIndex = new Map(CITIES.map(([n], i) => [n, i]));
  const adj = CITIES.map(() => new Set<number>());
  INTERSTATES.forEach(([a, b]) => {
    const i = cityIndex.get(a)!, j = cityIndex.get(b)!;
    adj[i].add(j); adj[j].add(i);
  });

  // Shift the network so the 3D truck (at the origin) sits exactly on the nearest highway (I-70 in Kansas).
  const onRoad = new THREE.Vector3();
  (function snapTruckToRoad() {
    let best = Infinity;
    const seg = new THREE.Line3(), p = new THREE.Vector3(), o = new THREE.Vector3(0, 0.3, 0);
    adj.forEach((set, i) => set.forEach((j) => {
      seg.set(cityPos[i], cityPos[j]);
      seg.closestPointToPoint(o, true, p);
      const d = p.distanceToSquared(o);
      if (d < best) { best = d; onRoad.copy(p); }
    }));
    map.position.set(-onRoad.x, 0, -onRoad.z);
  })();

  function bfs(a: number, b: number) {
    const prev = new Array<number>(CITIES.length).fill(-1);
    const seen = new Set([a]);
    const q = [a];
    while (q.length) {
      const c = q.shift()!;
      if (c === b) break;
      [...adj[c]].sort(() => Math.random() - 0.5).forEach((j) => { if (!seen.has(j)) { seen.add(j); prev[j] = c; q.push(j); } });
    }
    const path = [b];
    while (path[0] !== a && prev[path[0]] >= 0) path.unshift(prev[path[0]]);
    return path;
  }

  const TRUCKS = lowEnd ? 24 : 44, TRAIL = 10, SPACING = 2.4;
  const trucks: MapTruck[] = [];
  let truckPts: THREE.Points | null = null;
  let roadMat: LineMaterial | null = null;

  function pointShader(sizePx: number, pulse: boolean, color: number, max: number) {
    const m = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false,
      uniforms: { uTime: { value: 0 }, uPR: { value: renderer.getPixelRatio() }, uOpacity: { value: 0 }, uColor: { value: new THREE.Color(color) } },
      vertexShader: /* glsl */`
        uniform float uTime; uniform float uPR; attribute float aA; attribute float aSeed; varying float vA;
        void main(){
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * mv;
          float pz = ${pulse ? '1.0 + 0.6 * sin(uTime * 2.4 + aSeed * 6.283)' : '1.0'};
          gl_PointSize = ${sizePx.toFixed(1)} * uPR * pz * aA;
          vA = aA;
        }`,
      fragmentShader: /* glsl */`
        uniform float uOpacity; uniform vec3 uColor; varying float vA;
        void main(){
          float d = length(gl_PointCoord - 0.5);
          float a = smoothstep(0.5, 0.05, d);
          gl_FragColor = vec4(uColor, a * uOpacity * clamp(vA, 0.0, 1.0));
        }`,
    }) as FadeMat;
    m.userData.max = max;
    mapMats.push(m);
    return m;
  }
  function attrs(g: THREE.BufferGeometry, n: number, alpha: Float32Array | null, seeds: Float32Array | null) {
    g.setAttribute('aA', new THREE.BufferAttribute(alpha ?? new Float32Array(n).fill(1), 1));
    g.setAttribute('aSeed', new THREE.BufferAttribute(seeds ?? new Float32Array(n), 1));
    return g;
  }

  async function buildMap() {
    const res = await fetch('/assets/us-map.json');
    const data: { outline: number[][]; dots: number[]; dotsLow: number[] } = await res.json();
    if (ac.signal.aborted) return;

    const lineMat = new THREE.LineBasicMaterial({ color: GOLD[500], transparent: true, opacity: 0, fog: false, depthWrite: false }) as FadeMat;
    lineMat.userData.max = 0.5;
    mapMats.push(lineMat);
    data.outline.forEach((r) => {
      const pts: THREE.Vector3[] = [];
      for (let i = 0; i < r.length; i += 2) pts.push(proj(r[i], r[i + 1], 0.06));
      map.add(new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(pts), lineMat));
    });

    const dd = lowEnd ? data.dotsLow : data.dots;
    const n = dd.length / 2;
    const dPos = new Float32Array(n * 3);
    for (let i = 0; i < dd.length; i += 2) { const v = proj(dd[i], dd[i + 1], 0.04); dPos.set([v.x, v.y, v.z], (i / 2) * 3); }
    const dGeo = new THREE.BufferGeometry();
    dGeo.setAttribute('position', new THREE.BufferAttribute(dPos, 3));
    map.add(new THREE.Points(attrs(dGeo, n, null, null), pointShader(lowEnd ? 3.2 : 2.6, false, GOLD[600], 0.35)));

    // road graph — straight interstate-style segments between neighbouring cities
    const segs: THREE.Vector3[] = [];
    adj.forEach((set, i) => set.forEach((j) => { if (j > i) segs.push(cityPos[i].clone().setY(0.1), cityPos[j].clone().setY(0.1)); }));
    const roadGeo = new LineSegmentsGeometry().setPositions(segs.flatMap((v) => [v.x, v.y, v.z]));
    roadMat = new LineMaterial({ color: GOLD[500], linewidth: lowEnd ? 2 : 2.8, transparent: true, opacity: 0, depthWrite: false });
    roadMat.resolution.set(innerWidth, innerHeight);
    roadMat.userData.max = 0.8;
    mapMats.push(roadMat as FadeMat);
    const roads = new LineSegments2(roadGeo, roadMat);
    roads.computeLineDistances();
    map.add(roads);

    // cities
    const cGeo = attrs(new THREE.BufferGeometry().setFromPoints(cityPos), CITIES.length, null, Float32Array.from(CITIES, () => Math.random()));
    map.add(new THREE.Points(cGeo, pointShader(9, true, GOLD[200], 1)));

    // trucks travelling the graph (comet trails)
    const tA = new Float32Array(TRUCKS * TRAIL);
    for (let i = 0; i < TRUCKS; i++) for (let k = 0; k < TRAIL; k++) tA[i * TRAIL + k] = (1 - k / TRAIL) * (k === 0 ? 1.25 : 0.8);
    const tGeo = new THREE.BufferGeometry();
    tGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(TRUCKS * TRAIL * 3), 3));
    truckPts = new THREE.Points(attrs(tGeo, TRUCKS * TRAIL, tA, null), pointShader(lowEnd ? 7 : 9, false, GOLD[200], 1));
    truckPts.frustumCulled = false;
    map.add(truckPts);
    for (let i = 0; i < TRUCKS; i++) {
      const t: MapTruck = { path: [], nodes: [], len: [], s: 0, speed: 16 + Math.random() * 12 };
      route(t, (Math.random() * CITIES.length) | 0, null);
      t.s = Math.random() * t.len[t.len.length - 1] * 0.9;
      trucks.push(t);
    }

    // truck beacon seen from above
    const bMat = new THREE.SpriteMaterial({
      map: glowTex, color: GOLD[300], blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0, fog: false,
    }) as FadeMat;
    bMat.userData.max = 1;
    mapMats.push(bMat);
    beacon = new THREE.Sprite(bMat as THREE.SpriteMaterial);
    beacon.position.set(0, 2.5, 0);
    scene.add(beacon);
  }

  function route(t: MapTruck, from: number, prevCity: number | null) {
    let dest = from;
    while (dest === from) dest = (Math.random() * CITIES.length) | 0;
    const nodes = bfs(from, dest);
    const pts = (prevCity != null ? [prevCity, ...nodes] : nodes).map((i) => cityPos[i]);
    t.path = pts;
    t.nodes = nodes;
    t.len = [0];
    for (let i = 1; i < pts.length; i++) t.len.push(t.len[i - 1] + pts[i].distanceTo(pts[i - 1]));
    t.s = prevCity != null ? t.len[1] : 0;
  }
  const tmpV = new THREE.Vector3();
  function sample(t: MapTruck, s: number, out: THREE.Vector3) {
    s = Math.max(0, Math.min(s, t.len[t.len.length - 1]));
    let i = 1;
    while (i < t.len.length - 1 && t.len[i] < s) i++;
    const seg = t.len[i] - t.len[i - 1] || 1;
    return out.copy(t.path[i - 1]).lerp(t.path[i], (s - t.len[i - 1]) / seg);
  }
  function updateTrucks(dt: number) {
    if (!truckPts) return;
    const attr = truckPts.geometry.attributes.position as THREE.BufferAttribute;
    const arr = attr.array as Float32Array;
    trucks.forEach((t, i) => {
      t.s += t.speed * dt;
      if (t.s >= t.len[t.len.length - 1]) {
        const n = t.nodes;
        route(t, n[n.length - 1], n.length > 1 ? n[n.length - 2] : null);
      }
      for (let k = 0; k < TRAIL; k++) {
        sample(t, t.s - k * SPACING, tmpV);
        arr.set([tmpV.x, 0.35, tmpV.z], (i * TRAIL + k) * 3);
      }
    });
    attr.needsUpdate = true;
  }

  /* ------------------------------------------------------------ truck */
  const truck = new THREE.Group();
  scene.add(truck);
  const box = new THREE.Box3(new THREE.Vector3(-1.3, 0, -3.5), new THREE.Vector3(1.3, 3.9, 3.5));
  let wheelPos = new THREE.Vector3(1.15, 0.55, 2.2);

  // low env intensity keeps the paint opaque and black, never mirror-like
  const paint = new THREE.MeshPhysicalMaterial({
    color: 0x060607, metalness: 0, roughness: 0.42, clearcoat: 0.5, clearcoatRoughness: 0.3,
    envMapIntensity: 0.25, side: THREE.DoubleSide, envMap: studioEnv,
  });
  const matte = new THREE.MeshStandardMaterial({ color: 0x0b0b0c, roughness: 0.7, metalness: 0, side: THREE.DoubleSide });
  const grille = new THREE.MeshStandardMaterial({ color: 0x1a1a1c, metalness: 1, roughness: 0.32 });
  const chrome = new THREE.MeshStandardMaterial({ color: 0xd4d6d9, metalness: 1, roughness: 0.18 });
  const BODY = /^(techo_vnl|cbs_0[1-5]|CAPOP|AZUL|Material_139|metalic_purpura|0crema|WCLO)/i;
  const TRIM = /^(morado_ss|rojo_plats_estriado|7_vor|transmocion|FB\.|Material_28)/i;
  const KEEP = /^(glass|polarsd|spker|naranjita|rojo_ss|vdr_amarisho|REFLETOR|llantas|pantalla|tmn_control|sillw)/i;

  function repaint(m: THREE.Material): THREE.Material {
    const name = m.name || '';
    if (BODY.test(name)) return paint;
    if (TRIM.test(name)) return matte;
    if (/^rditore/i.test(name)) return grille;
    if (/^aluminio/i.test(name)) return chrome;
    const c = (m as THREE.MeshStandardMaterial).color;
    // dusty tyre texture reads tan under the warm key light
    if (/^llantas/i.test(name) && c && !m.userData.dimmed) { c.multiplyScalar(0.4); m.userData.dimmed = true; }
    if (!KEEP.test(name) && c) {
      // any other coloured part: drop saturation so no purple/pink survives
      const hsl = { h: 0, s: 0, l: 0 };
      c.getHSL(hsl);
      if (hsl.s > 0.25 && (hsl.h > 0.7 || hsl.h < 0.02)) c.setHSL(hsl.h, 0.05, Math.min(hsl.l, 0.12));
    }
    return m;
  }

  function loadTruck() {
    const loader = new GLTFLoader();
    loader.setMeshoptDecoder(MeshoptDecoder);
    const bar = document.querySelector<HTMLElement>('[data-loader]');
    const done = () => { bar?.classList.add('is-done'); root.classList.add('world-ready'); };
    loader.load(weak ? '/assets/truck-lite.glb' : isPhone ? '/assets/truck-mobile.glb' : '/assets/truck.glb', (gltf) => {
      if (ac.signal.aborted) return;
      const model = gltf.scene;
      const lights: THREE.Object3D[] = [];
      const tyres: THREE.Object3D[] = [];
      model.traverse((o) => {
        const mesh = o as THREE.Mesh;
        if (!mesh.isMesh) return;
        mesh.material = Array.isArray(mesh.material) ? mesh.material.map(repaint) : repaint(mesh.material);
        const mat = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
        const glassy = mat.transparent || /glass|polarsd|spker/i.test(mat.name || '');
        mesh.castShadow = mesh.receiveShadow = !glassy;
        if (/llantas/i.test(mat.name || '')) tyres.push(mesh);
        let n: THREE.Object3D | null = mesh; let path = '';
        while (n) { path += ' ' + (n.name || ''); n = n.parent; }
        if (/faro|headlight/i.test(path)) lights.push(mesh);
      });

      // normalise: length on Z, ≈7 units long, centred, on the ground, headlights toward +Z
      const pivot = new THREE.Group();
      pivot.add(model);
      truck.add(pivot);
      let b = new THREE.Box3().setFromObject(pivot);
      let size = b.getSize(new THREE.Vector3());
      if (size.x > size.z) { pivot.rotation.y = Math.PI / 2; pivot.updateMatrixWorld(true); b.setFromObject(pivot); size = b.getSize(new THREE.Vector3()); }
      pivot.scale.setScalar(7 / size.z);
      pivot.updateMatrixWorld(true);
      if (lights.length) {
        const lb = new THREE.Box3();
        lights.forEach((l) => lb.expandByObject(l));
        if (lb.getCenter(new THREE.Vector3()).z < new THREE.Box3().setFromObject(pivot).getCenter(new THREE.Vector3()).z) {
          pivot.rotation.y += Math.PI;
          pivot.updateMatrixWorld(true);
        }
      }
      b = new THREE.Box3().setFromObject(pivot);
      const c = b.getCenter(new THREE.Vector3());
      pivot.position.set(-c.x, -b.min.y, -c.z);
      pivot.updateMatrixWorld(true);
      box.setFromObject(pivot);

      if (tyres.length) {
        const tb = new THREE.Box3();
        tyres.forEach((t) => tb.expandByObject(t));
        // front axle sits roughly 20% of the length behind the bumper on a VNL
        wheelPos = new THREE.Vector3(box.max.x * 0.92, (tb.max.y + tb.min.y) / 2, box.max.z - (box.max.z - box.min.z) * 0.2);
      }
      contact.scale.set((box.max.x - box.min.x) / 2.6, (box.max.z - box.min.z) / 7, 1);
      buildShots();
      renderer.shadowMap.needsUpdate = true;
      bar?.style.setProperty('--p', '1');
      done();
      dirty = true;
      perf.t = 0; perf.f = 0;
    }, (e) => {
      if (!bar || !e.total) return;
      bar.style.setProperty('--p', (e.loaded / e.total).toFixed(3));
      const sp = bar.querySelector('span');
      if (sp) sp.textContent = `Loading the rig ${Math.round((e.loaded / e.total) * 100)}%`;
    }, done);
  }

  /* ------------------------------------------------------------ shots */
  const SHOTS = {} as Record<ShotName, Shot>;
  function orbit(th: number, r: number, y: number, ty: number) {
    return { target: new THREE.Vector3(0, ty, 0), pos: new THREE.Vector3(Math.sin(th) * r, y, Math.cos(th) * r) };
  }
  function buildShots() {
    const L = box.max.z - box.min.z;
    const def: Record<ShotName, { target: THREE.Vector3; pos: THREE.Vector3; map?: boolean; ox?: number }> = {
      hero: orbit(0.62, 10.6, 2.3, 1.45),
      applyHero: { ...orbit(0.62, 12.6, 2.7, 0.85), ox: -1.25 },
      side: orbit(1.57, 9.6, 1.35, 1.2),
      sideClose: orbit(1.57, 7.3, 1.45, 1.2),
      sideContact: { ...orbit(1.57, 8.1, 1.45, 1.05), ox: 1.3 },
      side2: orbit(-1.52, 9.4, 1.5, 1.7),
      side2Close: orbit(-1.57, 7.3, 1.45, 1.2),
      rear: orbit(2.6, 12, 4.6, 1.0),
      wheel: { target: wheelPos.clone(), pos: new THREE.Vector3(wheelPos.x + Math.sin(1.15) * 5, 0.9, wheelPos.z + Math.cos(1.15) * 5) },
      top: orbit(0.35, 9, 46, 0),
      road: { target: new THREE.Vector3(0, -2.2, box.max.z + 70), pos: new THREE.Vector3(0, 4.6, box.max.z + 3), ox: 0 },
      map: { target: new THREE.Vector3(24, 0, 12), pos: new THREE.Vector3(24, 415, 250), map: true },
      mapClose: { target: new THREE.Vector3(46, 0, 38), pos: new THREE.Vector3(46, 355, 238), map: true },
      mapLow: { target: new THREE.Vector3(40, 0, -45), pos: new THREE.Vector3(-38, 42, 92), map: true },
    };
    (Object.keys(def) as ShotName[]).forEach((k) => {
      const s = def[k];
      const d = s.pos.clone().sub(s.target);
      SHOTS[k] = { target: s.target, dir: d.clone().normalize(), dist: d.length(), map: !!s.map, ox: s.ox ?? 1 };
    });
    measure();
  }

  /* ------------------------------------------------------------ scroll keys */
  function measure() {
    const vh = innerHeight;
    keys = [...document.querySelectorAll<HTMLElement>('[data-shot]')]
      .map((el) => {
        const r = el.getBoundingClientRect();
        return { key: r.top + scrollY + r.height / 2 - vh / 2, shot: el.dataset.shot as ShotName, drag: el.hasAttribute('data-drag') };
      })
      .filter((k) => SHOTS[k.shot])
      .sort((a, b) => a.key - b.key);
    dirty = true;
  }
  buildShots();

  const cur = { target: new THREE.Vector3(), dir: new THREE.Vector3(0, 0.2, 1).normalize(), dist: 12, drag: 0, ox: 1, map: 0 };
  const want = { target: new THREE.Vector3(), dir: new THREE.Vector3(), dist: 12, drag: 0, ox: 1, map: 0 };
  let first = true;

  const aspectMul = (shot: Shot) => {
    const a = innerWidth / innerHeight;
    if (shot.ox === 0) return 1; // road/scenery shots: keep the camera on the road ahead, never pull back behind the truck
    return shot.map ? Math.max(1, 1.85 / a) : Math.max(1, 1.25 / a);
  };
  function evalScroll() {
    if (!keys.length) {
      const s = SHOTS.hero;
      want.target.copy(s.target); want.dir.copy(s.dir); want.dist = s.dist * aspectMul(s); want.drag = 0; want.map = 0;
      return;
    }
    const y = scrollY;
    let a = keys[0], b = keys[0], e = 0;
    if (y >= keys[keys.length - 1].key) a = b = keys[keys.length - 1];
    else if (y > keys[0].key) {
      let i = 0;
      while (i < keys.length - 1 && keys[i + 1].key <= y) i++;
      a = keys[i]; b = keys[i + 1];
      const t = (y - a.key) / Math.max(1, b.key - a.key);
      e = reduced ? (t < 0.5 ? 0 : 1) : smooth(clamp01((t - 0.12) / 0.76)); // hold 12% at each end
    }
    const A = SHOTS[a.shot], B = SHOTS[b.shot];
    want.target.lerpVectors(A.target, B.target, e);
    want.dir.lerpVectors(A.dir, B.dir, e).normalize();
    const da = Math.log(A.dist * aspectMul(A)), db = Math.log(B.dist * aspectMul(B));
    want.dist = Math.exp(da + (db - da) * e);
    want.drag = (a.drag ? 1 - e : 0) + (b.drag ? e : 0);
    want.ox = A.ox + (B.ox - A.ox) * e;
    want.map = (A.map ? 1 : 0) * (1 - e) + (B.map ? 1 : 0) * e; // the network only exists on map shots
  }

  /* ------------------------------------------------------------ drag orbit (offer page hero) */
  // Delegated on the document so it keeps working across client-side route changes.
  let yaw = 0, yawVel = 0, lastX = 0;
  let dragEl: HTMLElement | null = null;
  document.addEventListener('pointerdown', (ev) => {
    const target = ev.target as HTMLElement;
    const el = target.closest<HTMLElement>('[data-drag]');
    if (!el || target.closest('a,button,input,select,textarea,label')) return;
    if (ev.pointerType === 'mouse' && ev.button !== 0) return;
    dragEl = el; lastX = ev.clientX; yawVel = 0;
    el.classList.add('is-dragging');
  }, on);
  addEventListener('pointermove', (ev) => {
    if (!dragEl) return;
    const dx = ev.clientX - lastX; lastX = ev.clientX;
    const d = (dx / Math.max(320, innerWidth)) * Math.PI * 1.6;
    yaw -= d; yawVel = -d * 60; dirty = true;
  }, on);
  const endDrag = () => { dragEl?.classList.remove('is-dragging'); dragEl = null; };
  addEventListener('pointerup', endDrag, on);
  addEventListener('pointercancel', endDrag, on);

  /* ------------------------------------------------------------ layout */
  let appliedOx = -1;
  function applyOffset() {
    const w = innerWidth, h = innerHeight, a = w / h;
    appliedOx = cur.ox;
    if (a > 1.15) camera.setViewOffset(w, h, -w * 0.16 * cur.ox, 0, w, h); // truck in the right ~60%
    else if (a < 0.85) camera.setViewOffset(w, h, 0, h * 0.2 * Math.abs(cur.ox), w, h); // truck in the upper 55%
    else camera.clearViewOffset();
    camera.updateProjectionMatrix();
  }
  function resize() {
    const w = innerWidth, h = innerHeight, a = w / h;
    renderer.setSize(w, h, false);
    camera.aspect = a;
    applyOffset();
    roadMat?.resolution.set(w, h);
    measure();
  }
  addEventListener('resize', resize, on);
  const ro = new ResizeObserver(() => measure());
  ro.observe(document.body);
  document.fonts?.ready.then(measure);
  addEventListener('scroll', () => { dirty = true; }, { passive: true, signal: ac.signal });
  resize();

  /* ------------------------------------------------------------ quality */
  function degrade() {
    if (degraded) return;
    degraded = true;
    lowEnd = true;
    renderer.shadowMap.enabled = false;
    key.castShadow = false;
    scene.traverse((o) => { const m = (o as THREE.Mesh).material as THREE.Material | undefined; if (m) m.needsUpdate = true; });
    [embersSmall, embersLarge].forEach((p) => p.geometry.setDrawRange(0, Math.floor(p.userData.full / 3)));
    bigGlows.forEach((g) => { g.visible = false; });
  }
  if (lowEnd) degrade();
  // Adaptive quality: every 2 s compare the achieved frame rate with the target; when it falls short,
  // step the pixel ratio down, and when that is exhausted, switch to the low-end scene.
  const perf = { t: 0, f: 0 };
  function setPR(next: number) {
    pr = next;
    renderer.setPixelRatio(pr);
    renderer.setSize(innerWidth, innerHeight, false);
    scene.traverse((o) => {
      const m = (o as THREE.Points).material as THREE.ShaderMaterial | undefined;
      if (m && m.uniforms?.uPR) m.uniforms.uPR.value = pr;
    });
  }
  function checkPerf(dt: number, targetFps: number) {
    if (reduced) return;
    perf.t += dt; perf.f++;
    if (perf.t < 2) return;
    const fps = perf.f / perf.t;
    perf.t = 0; perf.f = 0;
    if (fps >= targetFps * 0.72) return;
    if (pr > minPR + 0.01) setPR(Math.max(minPR, pr - 0.25));
    else degrade();
  }
  // Idle throttling: when nothing is scrolling/dragging and the camera has settled, 30 fps is plenty.
  let lastActive = performance.now();
  const wake = () => { lastActive = performance.now(); };
  addEventListener('scroll', wake, { passive: true, signal: ac.signal });
  addEventListener('pointermove', wake, { passive: true, signal: ac.signal });
  addEventListener('touchmove', wake, { passive: true, signal: ac.signal });
  let lastRender = 0;

  /* ------------------------------------------------------------ loop */
  let last = performance.now();
  let time = 0;
  let raf = 0;
  document.addEventListener('visibilitychange', () => {
    cancelAnimationFrame(raf);
    if (!document.hidden) { last = performance.now(); raf = requestAnimationFrame(frame); }
  }, on);
  const up = new THREE.Vector3(0, 1, 0);
  const qYaw = new THREE.Quaternion();
  const tmpDir = new THREE.Vector3();
  const emberU = [embersSmall, embersLarge].map((p) => (p.material as THREE.ShaderMaterial).uniforms);

  function frame(now: number) {
    raf = requestAnimationFrame(frame);
    const settled = Math.abs(want.dist - cur.dist) < 0.02 * cur.dist && !dragEl;
    const idle = settled && now - lastActive > 2500;
    const targetFps = lowEnd || idle ? 30 : 60;
    if (now - lastRender < 1000 / targetFps - 2) return;
    lastRender = now;
    const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
    last = now;
    if (!idle) checkPerf(dt, targetFps);

    evalScroll();
    if (!dragEl) {
      yaw += yawVel * dt; yawVel *= Math.pow(0.04, dt);
      if (want.drag < 0.01) yaw *= Math.pow(0.02, dt);
    }

    const f = first || reduced ? 1 : 1 - Math.pow(1 - 0.075, dt * 60);
    first = false;
    cur.target.lerp(want.target, f);
    cur.dir.lerp(want.dir, f).normalize();
    cur.dist = Math.exp(Math.log(cur.dist) + (Math.log(want.dist) - Math.log(cur.dist)) * f);
    cur.drag += (want.drag - cur.drag) * f;
    cur.ox += (want.ox - cur.ox) * f;
    cur.map += (want.map - cur.map) * f;
    if (Math.abs(cur.ox - appliedOx) > 1e-3) applyOffset();

    tmpDir.copy(cur.dir);
    if (Math.abs(yaw) > 1e-4) { qYaw.setFromAxisAngle(up, yaw * cur.drag); tmpDir.applyQuaternion(qYaw); }
    camera.position.copy(cur.target).addScaledVector(tmpDir, cur.dist);
    camera.lookAt(cur.target);

    const dist = cur.dist;
    camera.near = Math.max(0.05, dist * 0.01);
    camera.far = Math.max(1500, dist * 8);
    camera.updateProjectionMatrix();
    fog.near = 15 + dist;
    fog.far = 140 + dist * 3.5;

    const mapA = sstep(0.02, 0.98, cur.map);
    map.visible = mapA > 0.01;
    mapMats.forEach((m) => {
      const v = mapA * (m.userData.max ?? 1);
      if (m instanceof THREE.ShaderMaterial && m.uniforms.uOpacity) m.uniforms.uOpacity.value = v; else m.opacity = v;
    });
    beacon?.scale.setScalar(dist * 0.07);
    road.visible = mapA < 0.98;
    dashMat.opacity = 0.85 * (1 - mapA);
    shoulderMat.opacity = 0.9 * (1 - mapA);
    asphaltMat.opacity = 1 - mapA * 0.6;
    groundMat.color.lerpColors(GROUND, GROUND_MAP, mapA);

    const emberA = 1 - sstep(15, 60, dist);
    embersSmall.visible = embersLarge.visible = emberA > 0.01;
    emberU[0].uOpacity.value = emberA * embersSmall.userData.base;
    emberU[1].uOpacity.value = emberA * embersLarge.userData.base;

    if (!reduced) {
      time += dt;
      emberU.forEach((u) => { u.uTime.value = time; });
      mapMats.forEach((m) => { if (m instanceof THREE.ShaderMaterial && m.uniforms.uTime) m.uniforms.uTime.value = time; });
      if (map.visible) updateTrucks(dt);
    } else if (!dirty && Math.abs(want.dist - cur.dist) < 1e-3) {
      return; // reduced motion: only redraw on change
    }
    dirty = false;
    renderer.render(scene, camera);
  }

  if (process.env.NODE_ENV !== 'production') {
    // dev helpers for checking shots from the console
    (window as unknown as { __wf: unknown }).__wf = {
      snap: () => { first = true; dirty = true; },
      state: () => ({ dist: cur.dist, want: want.dist, wantMap: want.map, ox: cur.ox, map: cur.map, tgt: cur.target.toArray(), pr, keys: keys.map((k) => [k.shot, Math.round(k.key)]) }),
    };
  }

  buildMap();
  raf = requestAnimationFrame(frame);
  // load the heavy model after first paint
  const kick = setTimeout(loadTruck, document.readyState === 'complete' ? 60 : 400);

  return {
    refresh: () => { measure(); },
    dispose: () => {
      ac.abort();
      ro.disconnect();
      clearTimeout(kick);
      cancelAnimationFrame(raf);
      scene.traverse((o) => {
        const mesh = o as THREE.Mesh;
        mesh.geometry?.dispose();
        const m = mesh.material;
        (Array.isArray(m) ? m : m ? [m] : []).forEach((x) => x.dispose());
      });
      pmrem.dispose();
      renderer.dispose();
    },
  };
}
