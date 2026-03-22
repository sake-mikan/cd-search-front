import fs from 'node:fs';
import path from 'node:path';

const targets = process.argv.slice(2);

if (targets.length === 0) {
  console.error('No files specified.');
  process.exit(2);
}

const mojibakeNeedles = [
  '繧',
  '繝',
  '縺',
  '螟',
  '驛',
  '鬮',
  '蟷',
  '譎',
  '郢',
  '讌ｽ',
  '蜿冶',
  '譁ｰ隴',
  '螳溯｡',
];

const mojibakeSequencePattern = /(?:繧.|繝.|縺.|螟.|驛.|鬮.|蟷.|譎.|郢.|讌ｽ|蜿冶|譁ｰ隴|螳溯｡|縺ｮ|縺励|縺ｧ|繧ｭ|繝ｼ)/gu;

const detectMojibake = (text) => {
  const hits = [];
  let score = 0;

  for (const needle of mojibakeNeedles) {
    const count = text.split(needle).length - 1;
    if (count <= 0) {
      continue;
    }
    hits.push(needle);
    score += Math.min(count, 3);
  }

  const sequenceCount = [...text.matchAll(mojibakeSequencePattern)].length;
  if (score < 5 && hits.length < 3 && sequenceCount < 5) {
    return null;
  }

  return {
    hits: hits.slice(0, 6),
    sequenceCount,
  };
};

let failed = false;

for (const target of targets) {
  const absolute = path.resolve(process.cwd(), target);
  const buffer = fs.readFileSync(absolute);
  const text = buffer.toString('utf8');
  const hasReplacement = text.includes('\uFFFD');
  const hasBom = buffer.length >= 3 && buffer[0] === 0xef && buffer[1] === 0xbb && buffer[2] === 0xbf;
  const roundTripMatches = Buffer.from(text, 'utf8').equals(buffer);
  const normalizedTarget = target.replaceAll('/', path.sep).replaceAll('\\', path.sep);
  const skipMojibakeCheck = normalizedTarget.endsWith(path.join('scripts', 'verify_utf8.mjs'));
  const mojibake = skipMojibakeCheck ? null : detectMojibake(text);

  if (!roundTripMatches || hasReplacement || mojibake) {
    failed = true;
    const mojibakeInfo = mojibake ? ` mojibake=${mojibake.hits.join(',')}` : '';
    console.error(`NG ${target} replacement=${hasReplacement} bom=${hasBom} roundTrip=${roundTripMatches}${mojibakeInfo}`);
    continue;
  }

  console.log(`OK ${target} replacement=${hasReplacement} bom=${hasBom} roundTrip=${roundTripMatches}`);
}

process.exit(failed ? 1 : 0);