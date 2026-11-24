import fs from 'node:fs/promises';
import path from 'node:path';

const OUT_DIR = path.join(process.cwd(), 'public', 'data', 'gist');

const SOURCES = {
  'manna.json': 'https://gist.githubusercontent.com/ATtool/e3a8241e07503969cb06448a32eb4382/raw/manna.json',
  'updates.json': 'https://gist.githubusercontent.com/ATtool/d2282fc4e40cab92304a6a3615561a34/raw/updates.json',
  'magazines.json': 'https://gist.githubusercontent.com/ATtool/9148fb9b8a3238acc50c2c5fb80d80bc/raw/magazines.json',
  'sabbath.json': 'https://gist.githubusercontent.com/ATtool/515dee23d057c967636146fded6645f4/raw/SSl-Ta',
  'other-songs.json': 'https://gist.githubusercontent.com/ATtool/cf27796976a73404f254b4bc81240f5f/raw/other_songs.json',
};

const exists = async (file) => {
  try {
    await fs.access(file);
    return true;
  } catch {
    return false;
  }
};

await fs.mkdir(OUT_DIR, { recursive: true });

let failures = 0;

for (const [name, url] of Object.entries(SOURCES)) {
  const target = path.join(OUT_DIR, name);
  try {
    const response = await fetch(url, {
      headers: { 'cache-control': 'no-cache' },
      signal: AbortSignal.timeout(30000),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const text = await response.text();
    const parsed = JSON.parse(text);
    await fs.writeFile(target, JSON.stringify(parsed, null, 2), 'utf8');
    console.log(`[gist] updated ${name} (${(text.length / 1024).toFixed(0)} KB)`);
  } catch (error) {
    if (await exists(target)) {
      console.warn(`[gist] keeping cached ${name}: ${error.message}`);
    } else {
      failures += 1;
      console.error(`[gist] FAILED ${name}: ${error.message}`);
    }
  }
}

if (failures > 0) {
  console.error(`[gist] ${failures} source(s) missing and no cached copy available.`);
  process.exit(1);
}
