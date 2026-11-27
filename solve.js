// Exact greedy Myers line diff. All scratch storage belongs to a single call.
function lines(text) {
  const out = [];
  let start = 0, end;
  while ((end = text.indexOf('\n', start)) !== -1) {
    out.push(text.slice(start, end + 1));
    start = end + 1;
  }
  if (start < text.length) out.push(text.slice(start));
  return out;
}

function changesFor(a, b, prefix, suffix) {
  const n = a.length - prefix - suffix;
  const m = b.length - prefix - suffix;
  if (!n || !m) return n || m ? [{ o: prefix, p: prefix, dels: n, ins: m }] : [];
  const ids = new Map();
  let next = 1;
  const aa = new Int32Array(n), bb = new Int32Array(m);
  for (let i = 0; i < n; i++) {
    const line = a[prefix + i];
    let id = ids.get(line);
    if (id === undefined) ids.set(line, id = next++);
    aa[i] = id;
  }
  for (let i = 0; i < m; i++) {
    // New-only lines cannot match any old line; zero is never an old ID.
    bb[i] = ids.get(b[prefix + i]) ?? 0;
  }
  const offset = n + m + 1;
  const v = new Int32Array(2 * offset + 1);
  v.fill(-1);
  const heads = new Int32Array(v.length);
  v[offset] = 0;
  // Only matching snakes need history: gaps determine normalized change runs.
  let previous = new Int32Array(65536);
  let xs = new Int32Array(65536), ys = new Int32Array(65536);
  let lengths = new Int32Array(65536);
  let used = 0, winner = 0;
  search: for (let d = 1; d <= n + m; d++) {
    for (let k = -d; k <= d; k += 2) {
      const at = offset + k;
      const left = v[at - 1], right = v[at + 1];
      const canDelete = left >= 0 && left < n;
      // Coordinates count consumed lines: landing exactly on m is valid.
      const canInsert = right >= 0 && right - k <= m;
      const del = canDelete ? left + 1 : -1;
      const ins = canInsert ? right : -1;
      const deleting = del >= ins;
      const parent = heads[deleting ? at - 1 : at + 1];
      v[at - 1] = -1;
      if (!canDelete && !canInsert) {
        v[at] = -1;
        continue;
      }
      let x = deleting ? del : ins;
      let y = x - k;
      const start = x;
      while (x < n && y < m && aa[x] === bb[y]) { x++; y++; }
      let head = parent;
      if (x > start) {
        if (++used === previous.length) {
          const grow = array => {
            const larger = new Int32Array(array.length * 2);
            larger.set(array);
            return larger;
          };
          previous = grow(previous); xs = grow(xs);
          ys = grow(ys); lengths = grow(lengths);
        }
        previous[used] = parent;
        xs[used] = start; ys[used] = start - k;
        lengths[used] = x - start;
        head = used;
      }
      if (x === n && y === m) { winner = head; break search; }
      v[at] = x;
      heads[at] = head;
    }
  }
  const path = [];
  for (let h = winner; h; h = previous[h]) path.push(h);
  const changes = [];
  let o = 0, p = 0;
  for (let i = path.length - 1; i >= 0; i--) {
    const h = path[i];
    if (xs[h] > o || ys[h] > p) {
      changes.push({ o: o + prefix, p: p + prefix, dels: xs[h] - o, ins: ys[h] - p });
    }
    o = xs[h] + lengths[h]; p = ys[h] + lengths[h];
  }
  if (o < n || p < m) changes.push({ o: o + prefix, p: p + prefix, dels: n - o, ins: m - p });
  return changes;
}

function written(op, line) {
  return line.charCodeAt(line.length - 1) === 10 ? op + line : op + line + '\n%\n';
}

export function run(input) {
  if (input === null || typeof input !== 'object' || typeof input.old !== 'string' || typeof input.new !== 'string') {
    throw new TypeError('makefun-diff: the input is { old, new }, two strings');
  }
  const a = lines(input.old), b = lines(input.new);
  const n = a.length, m = b.length;
  let prefix = 0, suffix = 0;
  while (prefix < n && prefix < m && a[prefix] === b[prefix]) prefix++;
  while (suffix < n - prefix && suffix < m - prefix && a[n - 1 - suffix] === b[m - 1 - suffix]) suffix++;
  const changes = changesFor(a, b, prefix, suffix);
  let deleted = 0, inserted = 0, count = 0;
  for (let i = 0; i < changes.length; i++) {
    const c = changes[i];
    deleted += c.dels; inserted += c.ins;
    if (!i || c.o - changes[i - 1].o - changes[i - 1].dels > 6) count++;
  }
  const out = [`makefun-diff/1 old=${n} new=${m} hunks=${count} deleted=${deleted} inserted=${inserted}\n`];
  for (let i = 0; i < changes.length;) {
    let end = i + 1;
    while (end < changes.length && changes[end].o - changes[end - 1].o - changes[end - 1].dels <= 6) end++;
    const first = changes[i], last = changes[end - 1];
    const os = Math.max(0, first.o - 3);
    const ns = first.p - (first.o - os);
    const after = Math.min(3, n - last.o - last.dels);
    const oe = last.o + last.dels + after;
    const ne = last.p + last.ins + after;
    out.push(`@ ${os + 1} ${oe - os} ${ns + 1} ${ne - ns}\n`);
    let at = os;
    for (; i < end; i++) {
      const c = changes[i];
      for (; at < c.o; at++) out.push(written('=', a[at]));
      for (let j = 0; j < c.dels; j++) out.push(written('-', a[c.o + j]));
      for (let j = 0; j < c.ins; j++) out.push(written('+', b[c.p + j]));
      at = c.o + c.dels;
    }
    for (; at < oe; at++) out.push(written('=', a[at]));
  }
  return out.join('');
}
