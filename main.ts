// Entry for make.fun's "Bring the humans with a TikTok ad" bounty
// (bring-the-humans-03). Node 22, standard library only.
//
// The entry is the video itself: an original short vertical ad for make.fun,
// made new for this bounty, posted publicly on TikTok from a public account.
// This program does the one thing the grader needs: it copies VIDEO.json
// from the repository root to /output/VIDEO.json, where the gate reads the
// video's address and the house reads the video's views from TikTok.
// Nothing this program writes about the video is scored; the views decide.
//
// The ad this entry hands in: 25 seconds, 1080x1920, rendered with ffmpeg
// from make.fun's press pack (manifest + llms.txt, fetched while making it).
// make.fun's brand badge sits top left from the very first frame until the
// referral end card comes in, and the video ends on that card with the
// account's own referral code typed into its field. The hook is
// "AI AGENTS ARE WINNING REAL MONEY", then what make.fun is, what the
// viewer gets from it, and the call to action "Enter your AI agent in a
// bounty on make.fun". make.fun is a site where AI agents compete in
// bounties for real money and people enter them with their agents.
//
// Run it the way the grader does:
//   mkdir -p out && MAKEFUN_BOT_DIR=. MAKEFUN_OUTPUT_DIR=out node main.ts
// Outside the grader's container, MAKEFUN_BOT_DIR and MAKEFUN_OUTPUT_DIR
// stand in for /bot and /output.

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

// Where the repository and the output live. The grader mounts them at
// /bot and /output; locally the two environment variables stand in.
const BOT_DIR = process.env.MAKEFUN_BOT_DIR ?? '/bot';
const OUTPUT_DIR = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// A video's address, as TikTok shows it in a browser:
// https://www.tiktok.com/@<handle>/video/<id>, the id digits only.
// A short link (vm.tiktok.com, vt.tiktok.com, tiktok.com/t) names no
// video until it is opened, so it is refused here on purpose.
const VIDEO_URL = /^https:\/\/(www\.|m\.)?tiktok\.com\/@[^/]+\/video\/\d+$/;

const sourcePath = join(BOT_DIR, 'VIDEO.json');
const targetPath = join(OUTPUT_DIR, 'VIDEO.json');

// Read the entry's VIDEO.json and make sure it is what the gate expects:
// one JSON object with a single url string shaped like a TikTok video.
let parsed: unknown;
try {
  parsed = JSON.parse(readFileSync(sourcePath, 'utf8'));
} catch (err) {
  console.error(`VIDEO.json could not be read from ${sourcePath}: ${(err as Error).message}`);
  process.exit(1);
}

if (
  typeof parsed !== 'object' ||
  parsed === null ||
  Array.isArray(parsed) ||
  typeof (parsed as { url?: unknown }).url !== 'string' ||
  !VIDEO_URL.test((parsed as { url: string }).url)
) {
  console.error(
    'VIDEO.json must be {"url": "https://www.tiktok.com/@<handle>/video/<id>"}',
  );
  process.exit(1);
}

// Hand the checked file to the gate, byte for byte, then read it back
// and confirm the copy landed whole: a partial write must fail loudly
// here, not silently hand a broken file to the gate.
mkdirSync(OUTPUT_DIR, { recursive: true });
const written = JSON.stringify(parsed);
writeFileSync(targetPath, written);

let roundTrip: unknown;
try {
  roundTrip = JSON.parse(readFileSync(targetPath, 'utf8'));
} catch (err) {
  console.error(`VIDEO.json could not be read back from ${targetPath}: ${(err as Error).message}`);
  process.exit(1);
}
if (JSON.stringify(roundTrip) !== written) {
  console.error(`VIDEO.json written to ${targetPath} does not match the repository's copy`);
  process.exit(1);
}
