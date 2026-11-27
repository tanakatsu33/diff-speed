import { readFileSync, mkdirSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';
import { run } from './solve.js';

const kit = process.env.DIFF_KIT;
if (!kit) throw new Error('Set DIFF_KIT to the contest kit directory');
const { diffPatch } = await import(pathToFileURL(`${kit}/baselines/makefun-diff/vendor/makefun-diff/index.js`));
const out = new URL('./out/', import.meta.url);
mkdirSync(out, { recursive: true });
try {
  for (let repeat = 0; repeat < 2; repeat++) {
    const child = spawnSync(process.execPath, ['main.ts'], {
      env: { ...process.env, MAKEFUN_INPUT_DIR: `${kit}/practice/input`, MAKEFUN_OUTPUT_DIR: out.pathname },
      encoding: 'utf8',
    });
    assert.equal(child.status, 0, child.stderr || `signal=${child.signal}; error=${child.error}`);
    const actual = JSON.parse(readFileSync(new URL('answers.json', out)));
    const expected = JSON.parse(readFileSync(`${kit}/practice/reference/expected.json`)).cases.map(c => c.output);
    assert.equal(actual.length, expected.length);
    for (let i = 0; i < expected.length; i++) {
      assert.ok(actual[i] === expected[i], `practice case ${i + 1}: got ${actual[i].slice(0,80)}, expected ${expected[i].slice(0,80)}`);
    }
  }
  console.log('Practice: 4/4 exact; two driver runs identical');
} finally { rmSync(out, { recursive: true, force: true }); }

let seed = 0x672abcde;
function random(n) {
  seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5;
  return (seed >>> 0) % n;
}
const vocabulary = ['', 'a', 'b', 'a', '\r', 'a\r', '雪', '😀', '\u0000', 'long repeated line'];
function text() {
  const count = random(35), parts = [];
  for (let i = 0; i < count; i++) parts.push(vocabulary[random(vocabulary.length)] + '\n');
  let value = parts.join('');
  if (random(2) && value.length) value = value.slice(0, -1);
  return value;
}
const fixed = ['', '\n', '\r', '\r\n', 'a', 'a\n', 'a\r\n', 'a\na\na', '\n\n', 'b\na\nb\n'];
let tested = 0;
function check(old, newer) {
  const input = { old, new: newer };
  assert.equal(run(input), diffPatch(input), JSON.stringify(input));
  tested++;
}
for (const a of fixed) for (const b of fixed) check(a, b);
for (let i = 0; i < 10000; i++) {
  const a = text();
  const b = i % 11 === 0 ? a : i % 7 === 0 ? a + text() : text();
  check(a, b);
}
console.log(`Fuzz: ${tested} pairs, 0 mismatches`);
