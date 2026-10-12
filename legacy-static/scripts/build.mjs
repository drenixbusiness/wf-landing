// Injects partials/header.html and partials/footer.html into every page between
// <!-- @header --> … <!-- /@header --> and <!-- @footer --> … <!-- /@footer --> markers,
// and marks the current nav item with aria-current. Idempotent: run after editing a partial.
// Run: node scripts/build.mjs
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';

const dir = new URL('../', import.meta.url);
const header = readFileSync(new URL('partials/header.html', dir), 'utf8').trim();
const footer = readFileSync(new URL('partials/footer.html', dir), 'utf8').trim();

for (const file of readdirSync(dir).filter((f) => f.endsWith('.html'))) {
  let html = readFileSync(new URL(file, dir), 'utf8');
  const h = header.replaceAll(`href="${file}"`, `href="${file}" aria-current="page"`)
    .replace(/(<a class="brand"[^>]*?) aria-current="page"/g, '$1');
  html = html
    .replace(/<!-- @header -->[\s\S]*?<!-- \/@header -->/, `<!-- @header -->\n${h}\n<!-- /@header -->`)
    .replace(/<!-- @footer -->[\s\S]*?<!-- \/@footer -->/, `<!-- @footer -->\n${footer}\n<!-- /@footer -->`);
  writeFileSync(new URL(file, dir), html);
  console.log('built', file);
}
