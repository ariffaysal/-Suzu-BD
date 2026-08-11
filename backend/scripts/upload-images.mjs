// One-off migration helper: uploads every file under backend/uploads/ to the
// linked Vercel Blob store, keeping the "uploads/..." path so existing DB URLs
// (which store "/uploads/...") map onto the Blob URLs with a prefix change.
// Run from backend/:  node scripts/upload-images.mjs
import { put } from '@vercel/blob';
import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

if (!process.env.BLOB_READ_WRITE_TOKEN) {
  console.error('BLOB_READ_WRITE_TOKEN is not set — export it first (e.g. from `vercel env pull`).');
  process.exit(1);
}

const root = 'uploads';
const files = [];
(function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) walk(p);
    else files.push(p);
  }
})(root);

let base = null;
for (const file of files) {
  const pathname = file.split('\\').join('/'); // e.g. "uploads/products/watches-men/x.png"
  const buffer = readFileSync(file);
  const { url } = await put(pathname, buffer, {
    access: 'public',
    addRandomSuffix: false,
    allowOverwrite: true,
  });
  if (!base) base = url.slice(0, url.lastIndexOf('/'));
  console.log(`✔ ${pathname} -> ${url}`);
}
console.log(`\nUploaded ${files.length} files.`);
console.log(`BASE_URL=${base}`);
