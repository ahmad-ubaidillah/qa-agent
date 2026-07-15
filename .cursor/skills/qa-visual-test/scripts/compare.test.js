#!/usr/bin/env node
/**
 * Smoke test for compare.js (no browser).
 * Requires: npm install in this directory (pixelmatch + pngjs).
 *
 * Usage: node compare.test.js
 */
import { mkdirSync, writeFileSync, rmSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";
import { PNG } from "pngjs";
import { compareScreenshots } from "./compare.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIX = join(tmpdir(), `qa-visual-compare-test-${Date.now()}`);
mkdirSync(FIX, { recursive: true });

let failed = 0;
function assert(cond, msg) {
  if (!cond) {
    console.error("FAIL:", msg);
    failed++;
  } else {
    console.log("OK  :", msg);
  }
}

function writeSolidPng(file, w, h, rgba) {
  const png = new PNG({ width: w, height: h });
  for (let i = 0; i < w * h; i++) {
    const o = i * 4;
    png.data[o] = rgba[0];
    png.data[o + 1] = rgba[1];
    png.data[o + 2] = rgba[2];
    png.data[o + 3] = rgba[3];
  }
  writeFileSync(file, PNG.sync.write(png));
}

const baseline = join(FIX, "baseline.png");
const same = join(FIX, "same.png");
const different = join(FIX, "different.png");
const tiny = join(FIX, "tiny.png");

writeSolidPng(baseline, 16, 16, [40, 120, 200, 255]);
writeSolidPng(same, 16, 16, [40, 120, 200, 255]);
writeSolidPng(different, 16, 16, [255, 0, 0, 255]);
writeSolidPng(tiny, 8, 8, [40, 120, 200, 255]);

const pass = compareScreenshots(same, baseline, { generateDiff: false });
assert(pass.match === true && pass.diffPixels === 0 && !pass.error, "identical images match");

const fail = compareScreenshots(different, baseline, {
  generateDiff: true,
  diffDir: join(FIX, "diffs"),
});
assert(fail.match === false && fail.diffPixels > 0 && !fail.error, "different images fail");
assert(fail.diffPath && existsSync(fail.diffPath), "diff image written on failure");

const dim = compareScreenshots(tiny, baseline, { generateDiff: false });
assert(dim.error && /Dimension mismatch/i.test(dim.error), "dimension mismatch reported");

const missing = compareScreenshots(join(FIX, "nope.png"), baseline, { generateDiff: false });
assert(missing.error && /not found/i.test(missing.error), "missing screenshot reported");

rmSync(FIX, { recursive: true, force: true });

if (failed) {
  console.error(`\n${failed} assertion(s) failed`);
  process.exit(1);
}
console.log("\nAll compare.js smoke checks passed");
