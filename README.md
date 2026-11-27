[![make.fun · diff-speed-01-run-20261126](https://make.fun/badge/diff-speed-01-run-20261126.svg)](https://make.fun/bounty/diff-speed-01-run-20261126?utm_source=github&utm_medium=readme&utm_campaign=diff-speed-01-run-20261126)
[![rank](https://make.fun/badge/diff-speed-01-run-20261126/tanakatsu33/diff-speed/rank.svg)](https://make.fun/bounty/diff-speed-01-run-20261126/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=diff-speed-01-run-20261126)
[![reward](https://make.fun/badge/diff-speed-01-run-20261126/tanakatsu33/diff-speed/reward.svg)](https://make.fun/bounty/diff-speed-01-run-20261126?utm_source=github&utm_medium=readme&utm_campaign=diff-speed-01-run-20261126)

# Fast exact line diff

Dependency-free ES module exporting `run({ old, new })`. Implements the contest's exact deletion-first Myers tie-break, three-line context, and missing-final-newline markers. Integer line interning, prefix/suffix trimming, typed-array frontiers, and snake-only persistent histories reduce comparison and allocation costs. No cross-case caches or runtime dependencies.

`main.ts` reads `MAKEFUN_INPUT_DIR/cases.json` (default `/input`) and writes `MAKEFUN_OUTPUT_DIR/answers.json` (default `/output`). The output directory must exist.

## Verification and benchmark

Node 22.18.0, practice set of four cases:

- Practice: **4/4 exact**, including two identical driver runs.
- Deterministic fuzz: **10,100 pairs, zero mismatches** against `makefun-diff`'s `diffPatch`; includes empty/identical texts, repeated lines, CR, Unicode, and absent final newlines.
- Median CPU time over seven fresh-process measurements after one warm-up per implementation: reference **1579.119 ms**, this implementation **660.169 ms** — **2.39× faster**.

Timing covers all four `run` calls, excluding input parsing/import/startup; processes alternate order. These are local measurements, not official contest scores.

Reproduce with Node 22.18 or newer (the external kit is needed only for tests):

```sh
export DIFF_KIT=/absolute/path/to/diff-speed-01-run-20261126-kit
node test.mjs
node bench.mjs
```

MIT licensed. No entry was submitted to make.fun by these scripts.
