// Builds the web-ready truck models from the original Sketchfab GLB.
//   node scripts/build-model.mjs <path/to/volvo_vnl_2025.glb>
// Outputs public/assets/truck.glb (desktop), truck-mobile.glb (phones) and truck-lite.glb (low-end devices).
// Step 1 removes textures from materials that lib/world.ts repaints (body, trim, grille, aluminium),
// so they are never downloaded or uploaded to the GPU. Step 2 runs `gltf-transform optimize`.
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { prune } from '@gltf-transform/functions';
import { execFileSync } from 'node:child_process';
import { statSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const src = process.argv[2];
if (!src) { console.error('usage: node scripts/build-model.mjs <source.glb>'); process.exit(1); }

// keep in sync with the repaint rules in lib/world.ts
const REPAINTED = /^(techo_vnl|cbs_0[1-5]|CAPOP|AZUL|Material_139|metalic_purpura|0crema|WCLO|morado_ss|rojo_plats_estriado|7_vor|transmocion|FB\.|Material_28|rditore|aluminio)/i;

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const doc = await io.read(src);
let stripped = 0;
for (const m of doc.getRoot().listMaterials()) {
  if (!REPAINTED.test(m.getName())) continue;
  m.setBaseColorTexture(null).setMetallicRoughnessTexture(null).setNormalTexture(null).setOcclusionTexture(null).setEmissiveTexture(null);
  stripped++;
}
await doc.transform(prune());
const tmp = join(mkdtempSync(join(tmpdir(), 'wf-model-')), 'stripped.glb');
await io.write(tmp, doc);
console.log(`stripped textures from ${stripped} repainted materials`);

const VARIANTS = [
  { out: 'public/assets/truck.glb', args: ['--texture-size', '1024', '--simplify', 'true', '--simplify-error', '0.0002'] },
  { out: 'public/assets/truck-mobile.glb', args: ['--texture-size', '512', '--simplify', 'true', '--simplify-error', '0.0008'] },
  { out: 'public/assets/truck-lite.glb', args: ['--texture-size', '256', '--simplify', 'true', '--simplify-error', '0.003'] },
];
const cli = join('node_modules', '@gltf-transform', 'cli', 'bin', 'cli.js');
for (const v of VARIANTS) {
  execFileSync(process.execPath, [cli, 'optimize', tmp, v.out, '--compress', 'meshopt', '--texture-compress', 'webp', '--palette', 'false', '--flatten', 'false', ...v.args], { stdio: 'ignore' });
  console.log(`${v.out}: ${(statSync(v.out).size / 1024 / 1024).toFixed(2)} MB`);
}
