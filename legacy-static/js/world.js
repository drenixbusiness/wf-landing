// Wildfire Express — persistent 3D world.
// One fixed canvas behind every page; the camera is driven by [data-shot] sections.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const root = document.documentElement;
const mqPhone = matchMedia('(max-width: 767px)');
const isPhone = mqPhone.matches;
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
let lowEnd = isPhone || (navigator.hardwareConcurrency || 8) <= 4;

const GOLD = {
  200: 0xffe3bf, 300: 0xfacb8d, 400: 0xe1ad66, 500: 0xb68235, 600: 0xa06f24, 800: 0x5a3b0a,
};

/* ---------------------------------------------------------------- renderer */
let renderer;
const canvas = document.createElement('canvas');
canvas.className = 'world-canvas';
canvas.setAttribute('aria-hidden', 'true');
try {
  renderer = new THREE.WebGLRenderer({
    canvas, antialias: !isPhone, alpha: false, powerPreference: 'high-performance',
  });
} catch (e) {
  renderer = null;
}

if (!renderer) {
  root.classList.add('no-webgl');
} else {
  document.body.prepend(canvas);
  init();
}

function init() {
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, isPhone ? 1.5 : 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = !lowEnd;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.shadowMap.autoUpdate = false; // truck and light are static: render the shadow once

  let dirty = true;
  let keys = [];
  const scene = new THREE.Scene();
  const BG = new THREE.Color(0x0e0c0a);
  scene.background = BG;
  scene.fog = new THREE.Fog(0x0e0c0a, 25, 175);

  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 4000);

  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

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
  scene.add(fill);

  const rim = new THREE.DirectionalLight(0xe1ad66, 1.1);
  rim.position.set(-4, 5, -12);
  scene.add(rim);

  const fireA = new THREE.PointLight(GOLD[400], 38, 34, 2);
  fireA.position.set(-3.4, 1.1, -7.5);
  const fireB = new THREE.PointLight(GOLD[500], 30, 30, 2);
  fireB.position.set(3.6, 0.7, -6.2);
  scene.add(fireA, fireB);

  /* ------------------------------------------------------------ textures */
  function radialTexture(stops, size = 256) {
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const g = c.getContext('2d');
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
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(8000, 8000),
    new THREE.MeshStandardMaterial({ color: 0x16120f, roughness: 0.96, metalness: 0 }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  const road = new THREE.Group();
  scene.add(road);
  const asphalt = new THREE.Mesh(
    new THREE.PlaneGeometry(15.4, 900),
    new THREE.MeshStandardMaterial({ color: 0x1a1612, roughness: 0.9, transparent: true }),
  );
  asphalt.rotation.x = -Math.PI / 2;
  asphalt.position.y = 0.004;
  asphalt.receiveShadow = true;
  road.add(asphalt);

  const dashMat = new THREE.MeshBasicMaterial({ color: GOLD[500], transparent: true, opacity: 0.85 });
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
  road.add(dashes);

  const shoulderMat = new THREE.MeshBasicMaterial({ color: GOLD[800], transparent: true, opacity: 0.9 });
  [-7.4, 7.4].forEach((x) => {
    const s = new THREE.Mesh(new THREE.PlaneGeometry(0.08, 900), shoulderMat);
    s.rotation.x = -Math.PI / 2;
    s.position.set(x, 0.011, 0);
    road.add(s);
  });

  // soft contact shadow (always on; covers for disabled shadow maps on phones)
  const contactTex = radialTexture([[0, 'rgba(0,0,0,0.85)'], [0.55, 'rgba(0,0,0,0.45)'], [1, 'rgba(0,0,0,0)']]);
  const contact = new THREE.Mesh(
    new THREE.PlaneGeometry(4.6, 9.4),
    new THREE.MeshBasicMaterial({ map: contactTex, transparent: true, depthWrite: false }),
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
  scene.add(horizon);
  const nearGlow = new THREE.Sprite(glowMat.clone());
  nearGlow.material.opacity = 0.22;
  nearGlow.position.set(0, 1.5, -11);
  nearGlow.scale.set(26, 9, 1);
  scene.add(nearGlow);
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
  function makeEmbers(count, sMin, sMax, opacity) {
    const pos = new Float32Array(count * 3);
    const seed = new Float32Array(count);
    const size = new Float32Array(count);
    const col = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = 2.5 + Math.pow(Math.random(), 0.7) * 20;
      pos[i * 3] = Math.cos(a) * r;
      pos[i * 3 + 1] = Math.random() * 16;
      pos[i * 3 + 2] = Math.sin(a) * r * 1.2 - 2;
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
    p.userData.full = count;
    p.userData.base = opacity;
    return p;
  }
  const embersSmall = makeEmbers(1400, 0.6, 1.7, 1);
  const embersLarge = makeEmbers(220, 2.2, 4.8, 0.5);
  scene.add(embersSmall, embersLarge);

  /* ------------------------------------------------------------ US network map */
  const map = new THREE.Group();
  map.visible = false;
  scene.add(map);
  const mapMats = [];
  const S = 13, LON0 = -98.6, LAT0 = 39.0, K = Math.cos((LAT0 * Math.PI) / 180);
  const proj = (lon, lat, y = 0) => new THREE.Vector3((lon - LON0) * K * S, y, -(lat - LAT0) * S);

  const CITIES = [
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
    ['Boston', -71.06, 42.36], ['Buffalo', -78.88, 42.89],
  ];
  const cityPos = CITIES.map(([, lon, lat]) => proj(lon, lat, 0.3));

  // interstate-style graph: 3 nearest neighbours, then stitch any islands together
  const adj = CITIES.map(() => new Set());
  cityPos.forEach((p, i) => {
    cityPos.map((q, j) => [j, p.distanceTo(q)]).filter(([j]) => j !== i)
      .sort((a, b) => a[1] - b[1]).slice(0, 3)
      .forEach(([j, d]) => { if (d < 150) { adj[i].add(j); adj[j].add(i); } });
  });
  (function stitch() {
    const comp = new Array(CITIES.length).fill(-1);
    let n = 0;
    for (let i = 0; i < CITIES.length; i++) {
      if (comp[i] >= 0) continue;
      const q = [i]; comp[i] = n;
      while (q.length) { const c = q.shift(); adj[c].forEach((j) => { if (comp[j] < 0) { comp[j] = n; q.push(j); } }); }
      n++;
    }
    for (let c = 1; c < n; c++) {
      let best = [0, 0, Infinity];
      for (let i = 0; i < CITIES.length; i++) for (let j = 0; j < CITIES.length; j++) {
        if (comp[i] === c && comp[j] !== c) { const d = cityPos[i].distanceTo(cityPos[j]); if (d < best[2]) best = [i, j, d]; }
      }
      adj[best[0]].add(best[1]); adj[best[1]].add(best[0]);
      const old = comp[best[0]]; const to = comp[best[1]];
      comp.forEach((v, k) => { if (v === old) comp[k] = to; });
    }
  })();

  function bfs(a, b) {
    const prev = new Array(CITIES.length).fill(-1);
    const seen = new Set([a]);
    const q = [a];
    while (q.length) {
      const c = q.shift();
      if (c === b) break;
      [...adj[c]].sort(() => Math.random() - 0.5).forEach((j) => { if (!seen.has(j)) { seen.add(j); prev[j] = c; q.push(j); } });
    }
    const path = [b];
    while (path[0] !== a && prev[path[0]] >= 0) path.unshift(prev[path[0]]);
    return path;
  }

  const TRUCKS = 44, TRAIL = 10, SPACING = 2.4;
  const trucks = [];
  let truckPts;

  function pointShader(sizePx, pulse) {
    return new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false,
      uniforms: { uTime: { value: 0 }, uPR: { value: renderer.getPixelRatio() }, uOpacity: { value: 0 }, uColor: { value: new THREE.Color(GOLD[300]) } },
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
    });
  }

  async function buildMap() {
    const res = await fetch(new URL('../assets/us-map.json', import.meta.url));
    const data = await res.json();

    const lineMat = new THREE.LineBasicMaterial({ color: GOLD[400], transparent: true, opacity: 0, fog: false, depthWrite: false });
    lineMat.userData.max = 0.9;
    mapMats.push(lineMat);
    data.outline.forEach((r) => {
      const pts = [];
      for (let i = 0; i < r.length; i += 2) pts.push(proj(r[i], r[i + 1], 0.06));
      map.add(new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(pts), lineMat));
    });

    const dd = lowEnd ? data.dotsLow : data.dots;
    const dPos = new Float32Array((dd.length / 2) * 3);
    for (let i = 0; i < dd.length; i += 2) { const v = proj(dd[i], dd[i + 1], 0.04); dPos.set([v.x, v.y, v.z], (i / 2) * 3); }
    const dGeo = new THREE.BufferGeometry();
    dGeo.setAttribute('position', new THREE.BufferAttribute(dPos, 3));
    dGeo.setAttribute('aA', new THREE.BufferAttribute(new Float32Array(dd.length / 2).fill(1), 1));
    dGeo.setAttribute('aSeed', new THREE.BufferAttribute(new Float32Array(dd.length / 2), 1));
    const dMat = pointShader(lowEnd ? 3.2 : 2.6, false);
    dMat.uniforms.uColor.value.set(GOLD[600]);
    dMat.userData.max = 0.75;
    mapMats.push(dMat);
    map.add(new THREE.Points(dGeo, dMat));

    // road graph
    const segs = [];
    adj.forEach((set, i) => set.forEach((j) => { if (j > i) segs.push(cityPos[i].clone().setY(0.1), cityPos[j].clone().setY(0.1)); }));
    const roadMat = new THREE.LineBasicMaterial({ color: GOLD[500], transparent: true, opacity: 0, fog: false, depthWrite: false });
    roadMat.userData.max = 0.5;
    mapMats.push(roadMat);
    map.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(segs), roadMat));

    // cities
    const cGeo = new THREE.BufferGeometry().setFromPoints(cityPos);
    cGeo.setAttribute('aA', new THREE.BufferAttribute(new Float32Array(CITIES.length).fill(1), 1));
    cGeo.setAttribute('aSeed', new THREE.BufferAttribute(Float32Array.from(CITIES, () => Math.random()), 1));
    const cMat = pointShader(9, true);
    cMat.uniforms.uColor.value.set(GOLD[200]);
    cMat.userData.max = 1;
    mapMats.push(cMat);
    map.add(new THREE.Points(cGeo, cMat));

    // trucks on the graph
    const tPos = new Float32Array(TRUCKS * TRAIL * 3);
    const tA = new Float32Array(TRUCKS * TRAIL);
    for (let i = 0; i < TRUCKS; i++) for (let k = 0; k < TRAIL; k++) tA[i * TRAIL + k] = (1 - k / TRAIL) * (k === 0 ? 1.25 : 0.8);
    const tGeo = new THREE.BufferGeometry();
    tGeo.setAttribute('position', new THREE.BufferAttribute(tPos, 3));
    tGeo.setAttribute('aA', new THREE.BufferAttribute(tA, 1));
    tGeo.setAttribute('aSeed', new THREE.BufferAttribute(new Float32Array(TRUCKS * TRAIL), 1));
    const tMat = pointShader(7, false);
    tMat.uniforms.uColor.value.set(GOLD[300]);
    tMat.userData.max = 1;
    mapMats.push(tMat);
    truckPts = new THREE.Points(tGeo, tMat);
    truckPts.frustumCulled = false;
    map.add(truckPts);

    for (let i = 0; i < TRUCKS; i++) {
      const start = (Math.random() * CITIES.length) | 0;
      const t = { path: [], len: [], s: 0, speed: 16 + Math.random() * 12 };
      route(t, start, null);
      t.s = Math.random() * t.len[t.len.length - 1] * 0.9;
      trucks.push(t);
    }

    // truck beacon seen from above
    const beacon = new THREE.Sprite(new THREE.SpriteMaterial({
      map: glowTex, color: GOLD[300], blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0, fog: false,
    }));
    beacon.position.set(0, 2.5, 0);
    beacon.material.userData.max = 1;
    mapMats.push(beacon.material);
    map.add(beacon);
    map.userData.beacon = beacon;
  }

  function route(t, from, prevCity) {
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
  function sample(t, s, out) {
    s = Math.max(0, Math.min(s, t.len[t.len.length - 1]));
    let i = 1;
    while (i < t.len.length - 1 && t.len[i] < s) i++;
    const a = t.path[i - 1], b = t.path[i];
    const seg = t.len[i] - t.len[i - 1] || 1;
    return out.copy(a).lerp(b, (s - t.len[i - 1]) / seg);
  }
  function updateTrucks(dt) {
    if (!truckPts) return;
    const arr = truckPts.geometry.attributes.position.array;
    trucks.forEach((t, i) => {
      t.s += t.speed * dt;
      const total = t.len[t.len.length - 1];
      if (t.s >= total) {
        const n = t.nodes;
        route(t, n[n.length - 1], n.length > 1 ? n[n.length - 2] : null);
      }
      for (let k = 0; k < TRAIL; k++) {
        sample(t, t.s - k * SPACING, tmpV);
        arr.set([tmpV.x, 0.35, tmpV.z], (i * TRAIL + k) * 3);
      }
    });
    truckPts.geometry.attributes.position.needsUpdate = true;
  }

  /* ------------------------------------------------------------ truck */
  const truck = new THREE.Group();
  scene.add(truck);
  const box = new THREE.Box3(new THREE.Vector3(-1.3, 0, -3.5), new THREE.Vector3(1.3, 3.9, 3.5));
  let wheelPos = new THREE.Vector3(1.15, 0.55, 2.2);

  const paint = new THREE.MeshPhysicalMaterial({
    color: 0x060607, metalness: 0, roughness: 0.42, clearcoat: 0.5, clearcoatRoughness: 0.3,
    envMapIntensity: 0.25, side: THREE.DoubleSide, envMap: studioEnv,
  });
  // low intensity keeps the paint opaque and black, never mirror-like
  const matte = new THREE.MeshStandardMaterial({ color: 0x0b0b0c, roughness: 0.7, metalness: 0, side: THREE.DoubleSide });
  const grille = new THREE.MeshStandardMaterial({ color: 0x1a1a1c, metalness: 1, roughness: 0.32 });
  const chrome = new THREE.MeshStandardMaterial({ color: 0xd4d6d9, metalness: 1, roughness: 0.18 });
  const BODY = /^(techo_vnl|cbs_0[1-5]|CAPOP|AZUL|Material_139|metalic_purpura|0crema|WCLO)/i;
  const TRIM = /^(morado_ss|rojo_plats_estriado|7_vor|transmocion|FB\.|Material_28)/i;
  const GRILLE = /^rditore/i;
  const ALU = /^aluminio/i;
  const KEEP_UNDECALED = /^(glass|polarsd|spker|naranjita|rojo_ss|vdr_amarisho|REFLETOR|llantas|pantalla|tmn_control|sillw)/i;

  function repaint(m) {
    const name = m.name || '';
    if (BODY.test(name)) return paint;
    if (TRIM.test(name)) return matte;
    if (GRILLE.test(name)) return grille;
    if (ALU.test(name)) return chrome;
    if (/^llantas/i.test(name) && m.color && !m.userData.dimmed) { m.color.multiplyScalar(0.4); m.userData.dimmed = true; } // dusty tyre texture reads tan under the warm key
    if (!KEEP_UNDECALED.test(name) && m.color) {
      // any other coloured part: drop saturation so no purple/pink survives
      const hsl = {};
      m.color.getHSL(hsl);
      if (hsl.s > 0.25 && (hsl.h > 0.7 || hsl.h < 0.02)) { m.color.setHSL(hsl.h, 0.05, Math.min(hsl.l, 0.12)); }
    }
    return m;
  }

  function loadTruck() {
    const loader = new GLTFLoader();
    loader.setMeshoptDecoder(MeshoptDecoder);
    const bar = document.querySelector('[data-loader]');
    const url = new URL(isPhone ? '../assets/truck-mobile.glb' : '../assets/truck.glb', import.meta.url);
    loader.load(url.href, (gltf) => {
      const model = gltf.scene;
      const lights = [];
      model.traverse((o) => {
        if (!o.isMesh) return;
        o.material = Array.isArray(o.material) ? o.material.map(repaint) : repaint(o.material);
        const mat = Array.isArray(o.material) ? o.material[0] : o.material;
        const glassy = mat.transparent || /glass|polarsd|spker/i.test(mat.name || '');
        o.castShadow = !glassy;
        o.receiveShadow = !glassy;
        let n = o; let path = '';
        while (n) { path += ' ' + (n.name || ''); n = n.parent; }
        if (/faro|headlight/i.test(path)) lights.push(o);
      });

      const pivot = new THREE.Group();
      pivot.add(model);
      truck.add(pivot);

      let b = new THREE.Box3().setFromObject(pivot);
      let size = b.getSize(new THREE.Vector3());
      if (size.x > size.z) { pivot.rotation.y = Math.PI / 2; pivot.updateMatrixWorld(true); b = new THREE.Box3().setFromObject(pivot); size = b.getSize(new THREE.Vector3()); }
      const sc = 7 / size.z;
      pivot.scale.setScalar(sc);
      pivot.updateMatrixWorld(true);

      // front = side of the headlights
      if (lights.length) {
        const lb = new THREE.Box3();
        lights.forEach((l) => lb.expandByObject(l));
        const fb = new THREE.Box3().setFromObject(pivot);
        if (lb.getCenter(new THREE.Vector3()).z < fb.getCenter(new THREE.Vector3()).z) {
          pivot.rotation.y += Math.PI;
          pivot.updateMatrixWorld(true);
        }
      }
      b = new THREE.Box3().setFromObject(pivot);
      const c = b.getCenter(new THREE.Vector3());
      pivot.position.set(-c.x, -b.min.y, -c.z);
      pivot.updateMatrixWorld(true);
      box.setFromObject(pivot);

      // front wheel: tyre geometry closest to the front bumper
      const tyres = [];
      model.traverse((o) => { if (o.isMesh && /llantas/i.test(o.material.name || '')) tyres.push(o); });
      if (tyres.length) {
        const tb = new THREE.Box3();
        tyres.forEach((t) => tb.expandByObject(t));
        wheelPos = new THREE.Vector3(box.max.x * 0.92, (tb.max.y - tb.min.y) * 0.5 + tb.min.y, 0);
        // front axle sits roughly 18% of the length behind the bumper on a VNL
        wheelPos.z = box.max.z - (box.max.z - box.min.z) * 0.2;
      }
      contact.scale.set((box.max.x - box.min.x) / 2.6, (box.max.z - box.min.z) / 7, 1);
      buildShots();
      renderer.shadowMap.needsUpdate = true;
      if (bar) { bar.style.setProperty('--p', 1); bar.classList.add('is-done'); }
      root.classList.add('world-ready');
      dirty = true;
      startFpsProbe();
    }, (e) => {
      if (bar && e.total) {
        bar.style.setProperty('--p', (e.loaded / e.total).toFixed(3));
        const sp = bar.querySelector('span');
        if (sp) sp.textContent = 'Loading the rig ' + Math.round((e.loaded / e.total) * 100) + '%';
      }
    }, () => { if (bar) bar.classList.add('is-done'); root.classList.add('world-ready'); });
  }

  /* ------------------------------------------------------------ shots */
  const SHOTS = {};
  function orbit(th, r, y, ty, pivot = new THREE.Vector3(0, 0, 0)) {
    const target = new THREE.Vector3(pivot.x, ty, pivot.z);
    const pos = new THREE.Vector3(pivot.x + Math.sin(th) * r, y, pivot.z + Math.cos(th) * r);
    return { target, pos };
  }
  function buildShots() {
    const L = box.max.z - box.min.z;
    const def = {
      hero: orbit(0.62, 12.5, 2.5, 1.3),
      side: orbit(1.57, 9.6, 1.35, 1.2),
      side2: orbit(-1.5, 10.5, 2, 1.2),
      rear: orbit(2.6, 12, 4.6, 1.0),
      wheel: { target: wheelPos.clone(), pos: new THREE.Vector3(wheelPos.x + Math.sin(1.15) * 5, 0.9, wheelPos.z + Math.cos(1.15) * 5) },
      top: orbit(0.35, 9, 46, 0),
      road: { target: new THREE.Vector3(0, 0.2, 34), pos: new THREE.Vector3(0, 6.4, box.min.z - L * 1.75) },
      map: { target: new THREE.Vector3(0, 0, 0), pos: new THREE.Vector3(0, 470, 340), map: true },
      mapLow: { target: new THREE.Vector3(18, 0, -30), pos: new THREE.Vector3(-150, 62, 235), map: true },
    };
    for (const [k, s] of Object.entries(def)) {
      const d = s.pos.clone().sub(s.target);
      SHOTS[k] = { target: s.target, dir: d.clone().normalize(), dist: d.length(), map: !!s.map };
    }
    measure();
  }
  buildShots();

  /* ------------------------------------------------------------ scroll keys */
  function measure() {
    const els = [...document.querySelectorAll('[data-shot]')];
    const vh = innerHeight;
    keys = els.map((el) => {
      const r = el.getBoundingClientRect();
      return { el, key: r.top + scrollY + r.height / 2 - vh / 2, shot: el.dataset.shot, drag: el.hasAttribute('data-drag') };
    }).filter((k) => SHOTS[k.shot]).sort((a, b) => a.key - b.key);
    dirty = true;
  }

  const cur = { target: new THREE.Vector3(), dir: new THREE.Vector3(0, 0.2, 1).normalize(), dist: 12, drag: 0 };
  const want = { target: new THREE.Vector3(), dir: new THREE.Vector3(), dist: 12, drag: 0 };
  let first = true;

  const smooth = (x) => x * x * (3 - 2 * x);
  const clamp01 = (x) => Math.max(0, Math.min(1, x));
  function aspectMul(shot) {
    const a = innerWidth / innerHeight;
    return shot.map ? Math.max(1, 1.5 / a) : Math.max(1, 1.25 / a);
  }
  function evalScroll() {
    if (!keys.length) { const s = SHOTS.hero; want.target.copy(s.target); want.dir.copy(s.dir); want.dist = s.dist * aspectMul(s); want.drag = 0; return; }
    const y = scrollY;
    let a = keys[0], b = keys[0], e = 0;
    if (y >= keys[keys.length - 1].key) { a = b = keys[keys.length - 1]; } else if (y > keys[0].key) {
      let i = 0;
      while (i < keys.length - 1 && keys[i + 1].key <= y) i++;
      a = keys[i]; b = keys[i + 1];
      const t = (y - a.key) / Math.max(1, b.key - a.key);
      e = reduced ? (t < 0.5 ? 0 : 1) : smooth(clamp01((t - 0.12) / 0.76));
    }
    const A = SHOTS[a.shot], B = SHOTS[b.shot];
    want.target.lerpVectors(A.target, B.target, e);
    want.dir.lerpVectors(A.dir, B.dir, e).normalize();
    const da = Math.log(A.dist * aspectMul(A)), db = Math.log(B.dist * aspectMul(B));
    want.dist = Math.exp(da + (db - da) * e);
    want.drag = (a.drag ? 1 - e : 0) + (b.drag ? e : 0);
  }

  /* ------------------------------------------------------------ drag orbit (offer page hero) */
  let yaw = 0, yawVel = 0, dragging = false, lastX = 0;
  document.querySelectorAll('[data-drag]').forEach((el) => {
    el.addEventListener('pointerdown', (ev) => {
      if (ev.target.closest('a,button,input,select,textarea,label')) return;
      if (ev.pointerType === 'mouse' && ev.button !== 0) return;
      dragging = true; lastX = ev.clientX; yawVel = 0;
      el.classList.add('is-dragging');
    });
    addEventListener('pointermove', (ev) => {
      if (!dragging) return;
      const dx = ev.clientX - lastX; lastX = ev.clientX;
      const d = (dx / Math.max(320, innerWidth)) * Math.PI * 1.6;
      yaw -= d; yawVel = -d * 60; dirty = true;
    });
    const end = () => { dragging = false; el.classList.remove('is-dragging'); };
    addEventListener('pointerup', end);
    addEventListener('pointercancel', end);
  });

  /* ------------------------------------------------------------ layout */
  function resize() {
    const w = innerWidth, h = innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    const a = w / h;
    if (a > 1.15) camera.setViewOffset(w, h, -w * 0.16, 0, w, h);
    else if (a < 0.85) camera.setViewOffset(w, h, 0, h * 0.2, w, h);
    else camera.clearViewOffset();
    camera.updateProjectionMatrix();
    measure();
  }
  addEventListener('resize', resize);
  if ('ResizeObserver' in window) new ResizeObserver(() => measure()).observe(document.body);
  document.fonts && document.fonts.ready.then(measure);
  addEventListener('load', measure);
  addEventListener('scroll', () => { dirty = true; }, { passive: true });
  resize();

  /* ------------------------------------------------------------ quality */
  function degrade() {
    if (lowEnd === 'applied') return;
    lowEnd = 'applied';
    renderer.shadowMap.enabled = false;
    key.castShadow = false;
    scene.traverse((o) => { if (o.material) o.material.needsUpdate = true; });
    [embersSmall, embersLarge].forEach((p) => p.geometry.setDrawRange(0, Math.floor(p.userData.full / 3)));
    bigGlows.forEach((g) => { g.visible = false; });
  }
  if (lowEnd) degrade();
  let probe = null;
  function startFpsProbe() { if (!reduced) probe = { t: 0, f: 0 }; }

  /* ------------------------------------------------------------ loop */
  let last = performance.now();
  let time = 0;
  let running = true;
  document.addEventListener('visibilitychange', () => {
    running = !document.hidden;
    if (running) { last = performance.now(); requestAnimationFrame(frame); }
  });
  const sstep = (a, b, x) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };
  const up = new THREE.Vector3(0, 1, 0);
  const qYaw = new THREE.Quaternion();

  function frame(now) {
    if (!running) return;
    requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;

    if (probe) {
      probe.t += dt; probe.f++;
      if (probe.t > 2) { if (probe.f / probe.t < 40) degrade(); probe = null; }
    }

    evalScroll();
    if (!dragging) {
      yaw += yawVel * dt; yawVel *= Math.pow(0.04, dt);
      if (want.drag < 0.01) yaw *= Math.pow(0.02, dt);
    }

    const f = first || reduced ? 1 : 1 - Math.pow(1 - 0.075, dt * 60);
    first = false;
    cur.target.lerp(want.target, f);
    cur.dir.lerp(want.dir, f).normalize();
    cur.dist = Math.exp(Math.log(cur.dist) + (Math.log(want.dist) - Math.log(cur.dist)) * f);
    cur.drag += (want.drag - cur.drag) * f;

    const dir = cur.dir.clone();
    if (Math.abs(yaw) > 1e-4) { qYaw.setFromAxisAngle(up, yaw * cur.drag); dir.applyQuaternion(qYaw); }
    camera.position.copy(cur.target).addScaledVector(dir, cur.dist);
    camera.lookAt(cur.target);

    const dist = cur.dist;
    camera.near = Math.max(0.05, dist * 0.01);
    camera.far = Math.max(1500, dist * 8);
    camera.updateProjectionMatrix();
    scene.fog.near = 15 + dist * 1.0;
    scene.fog.far = 140 + dist * 3.5;

    const mapA = sstep(30, 110, dist);
    map.visible = mapA > 0.01;
    mapMats.forEach((m) => {
      const v = mapA * (m.userData.max ?? 1);
      if (m.uniforms) m.uniforms.uOpacity.value = v; else m.opacity = v;
    });
    if (map.userData.beacon) map.userData.beacon.scale.setScalar(dist * 0.07);
    road.visible = mapA < 0.98;
    dashMat.opacity = 0.85 * (1 - mapA);
    shoulderMat.opacity = 0.9 * (1 - mapA);
    asphalt.material.opacity = 1 - mapA * 0.6;

    const emberA = 1 - sstep(15, 60, dist);
    embersSmall.visible = embersLarge.visible = emberA > 0.01;
    embersSmall.material.uniforms.uOpacity.value = emberA * embersSmall.userData.base;
    embersLarge.material.uniforms.uOpacity.value = emberA * embersLarge.userData.base;

    if (!reduced) {
      time += dt;
      embersSmall.material.uniforms.uTime.value = time;
      embersLarge.material.uniforms.uTime.value = time;
      mapMats.forEach((m) => { if (m.uniforms) m.uniforms.uTime.value = time; });
      if (map.visible) updateTrucks(dt);
    } else if (!dirty && Math.abs(want.dist - cur.dist) < 1e-3) {
      return; // reduced motion: only redraw on change
    }
    dirty = false;
    renderer.render(scene, camera);
  }

  // dev helper: capture the current frame as the no-WebGL poster
  window.__wf = {
    snap: () => { first = true; dirty = true; },
    pick: (x, y) => { const rc = new THREE.Raycaster(); rc.setFromCamera(new THREE.Vector2(x, y), camera); return rc.intersectObject(truck, true).slice(0, 4).map((h) => [h.object.name, h.object.material.name, h.object.material.transparent, h.object.material.opacity, h.distance.toFixed(2)]); },
    state: () => ({ dist: cur.dist, want: want.dist, cam: camera.position.toArray(), target: cur.target.toArray(), box: [box.min.toArray(), box.max.toArray()], wheel: wheelPos.toArray(), keys: keys.map((k) => [k.shot, Math.round(k.key)]) }),
    capture: async (name) => {
      renderer.render(scene, camera);
      const blob = await new Promise((r) => canvas.toBlob(r, 'image/jpeg', 0.82));
      return fetch("/__poster?name=" + (name || "poster.jpg"), { method: "POST", body: blob }).then((r) => r.text());
    },
  };

  buildMap();
  requestAnimationFrame(frame);
  // load the heavy model after first paint
  const kick = () => setTimeout(loadTruck, 60);
  if (document.readyState === 'complete') kick(); else addEventListener('load', kick, { once: true });
}
