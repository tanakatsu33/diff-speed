import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { setFlagsFromString } from 'node:v8';
setFlagsFromString('--no-incremental-marking');
const kit = process.env.DIFF_KIT;
if (!kit) throw new Error('Set DIFF_KIT to the contest kit directory');
const mode = process.argv[2];
if (mode) {
  const cases = JSON.parse(readFileSync(`${kit}/practice/input/cases.json`));
  const fn = mode === 'reference'
    ? (await import(pathToFileURL(`${kit}/baselines/makefun-diff/vendor/makefun-diff/index.js`))).diffPatch
    : (await import('./solve.js')).run;
  const start = process.cpuUsage();
  let bytes = 0;
  for (const c of cases) bytes += fn(c.input).length;
  const cpu = process.cpuUsage(start);
  console.log(JSON.stringify({ ms: (cpu.user + cpu.system) / 1000, bytes }));
} else {
  const results = { reference: [], solve: [] };
  for (let i = 0; i < 8; i++) {
    for (const name of i % 2 ? ['solve', 'reference'] : ['reference', 'solve']) {
      const child = spawnSync(process.execPath, [new URL(import.meta.url).pathname, name], { encoding: 'utf8' });
      if (child.status !== 0) throw new Error(child.stderr || `exit ${child.status}`);
      const result = JSON.parse(child.stdout);
      if (i) results[name].push(result.ms);
      console.log(`${i ? 'timed' : 'warmup'} ${name}: ${result.ms.toFixed(3)} ms CPU; ${result.bytes} output code units`);
    }
  }
  for (const values of Object.values(results)) values.sort((a, b) => a - b);
  const reference = results.reference[3], solve = results.solve[3];
  console.log(JSON.stringify({ rounds: 7, referenceMedianMs: reference, solveMedianMs: solve, speedup: reference / solve }));
}
