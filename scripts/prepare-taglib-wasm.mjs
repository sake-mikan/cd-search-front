import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const sourcePath = path.join(projectRoot, 'node_modules', 'taglib-wasm', 'dist', 'taglib-wrapper.js');
const wasmSourcePath = path.join(projectRoot, 'node_modules', 'taglib-wasm', 'dist', 'taglib.wasm');
const compatibilityDir = path.join(projectRoot, 'node_modules', 'taglib-wasm', 'dist', 'dist');
const compatibilityPath = path.join(compatibilityDir, 'taglib-wrapper.js');
const workerTsPath = path.join(
  projectRoot,
  'node_modules',
  'taglib-wasm',
  'dist',
  'src',
  'workers',
  'taglib-worker.ts'
);
const publicDir = path.join(projectRoot, 'public');
const publicWasmPath = path.join(publicDir, 'taglib.wasm');

if (!fs.existsSync(sourcePath)) {
  console.warn('[prepare-taglib-wasm] source not found:', sourcePath);
  process.exit(0);
}

fs.mkdirSync(compatibilityDir, { recursive: true });

if (!fs.existsSync(compatibilityPath)) {
  const content = "export { default } from '../taglib-wrapper.js';\n";
  fs.writeFileSync(compatibilityPath, content, 'utf8');
  console.log('[prepare-taglib-wasm] created compatibility file:', compatibilityPath);
} else {
  console.log('[prepare-taglib-wasm] compatibility file already exists.');
}

if (!fs.existsSync(workerTsPath)) {
  const content = "export * from './taglib-worker.js';\n";
  fs.writeFileSync(workerTsPath, content, 'utf8');
  console.log('[prepare-taglib-wasm] created worker ts shim:', workerTsPath);
}

if (fs.existsSync(wasmSourcePath)) {
  fs.mkdirSync(publicDir, { recursive: true });
  const shouldCopy =
    !fs.existsSync(publicWasmPath) ||
    fs.statSync(publicWasmPath).size !== fs.statSync(wasmSourcePath).size;

  if (shouldCopy) {
    fs.copyFileSync(wasmSourcePath, publicWasmPath);
    console.log('[prepare-taglib-wasm] copied wasm to public:', publicWasmPath);
  } else {
    console.log('[prepare-taglib-wasm] public wasm already up to date.');
  }
} else {
  console.warn('[prepare-taglib-wasm] wasm source not found:', wasmSourcePath);
}
