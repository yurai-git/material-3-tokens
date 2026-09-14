import { ZipArchive } from 'archiver';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const outputPath = path.join(distDir, 'material-3-tokens.zip');

const targets = [
  { path: 'index.scss', type: 'file' },
  { path: 'components', type: 'directory' },
  { path: 'helpers', type: 'directory' },
  { path: 'references', type: 'directory' },
  { path: 'systems', type: 'directory' },
];

async function build() {
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
  }

  const output = fs.createWriteStream(outputPath);
  const archive = new ZipArchive({ zlib: { level: 9 } });

  const closePromise = new Promise<void>((resolve, reject) => {
    output.on('close', () => {
      console
        .log(`Successfully created ${outputPath} (${archive.pointer()} total bytes)`);
      resolve();
    });
    archive.on('error', (err) => {
      reject(err);
    });
  });

  archive.pipe(output);

  for (const target of targets) {
    const fullPath = path.join(rootDir, target.path);
    if (!fs.existsSync(fullPath)) {
      console.warn(`Warning: ${target.path} does not exist.`);
      continue;
    }

    if (target.type === 'file') {
      archive.file(fullPath, { name: target.path });
    } else if (target.type === 'directory') {
      archive.directory(fullPath, target.path);
    }
  }

  await archive.finalize();
  await closePromise;
}

build().catch((err) => {
  console.error('Build failed:', err);
  process.exit(1);
});
