// simulate-docker.mjs
import { execSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { chdir } from 'node:process'; // ✅ import chdir

function run(cmd) {
  console.log(`\n▶️ Running: ${cmd}`);
  execSync(cmd, { stdio: 'inherit' });
}

const root = process.cwd();
const webAppDist = join(root, 'apps/web/dist');
const standaloneDist = join(webAppDist, 'standalone');

// 1️⃣ Run build command
run('pnpm run build');

// 2️⃣ Ensure dist/standalone exists
if (!existsSync(standaloneDist)) {
  console.log('📂 Creating standalone dist directory...');
  mkdirSync(standaloneDist, { recursive: true });
}

// 3️⃣ Copy static and public into standalone build
const staticSrc = join(webAppDist, 'static');
const staticDest = join(standaloneDist, 'apps/web/dist');

if (existsSync(staticSrc)) {
  console.log('📂 Copying static files...');
  cpSync(staticSrc, staticDest, { recursive: true });
}

const publicSrc = join(root, 'apps/web/public');
const publicDest = join(standaloneDist, 'apps/web/public');

if (existsSync(publicSrc)) {
  console.log('📂 Copying public files...');
  cpSync(publicSrc, publicDest, { recursive: true });
}

// 4️⃣ Start the server
console.log('Completed build');
console.log('\n🚀 Starting dev server...');
chdir(standaloneDist); // switch into dist/standalone
run('node apps/web/server.js');
// run('pnpm dev');
