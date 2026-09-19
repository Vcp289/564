(function (g) {
  "use strict";
  const W = n => ((n % 10) + 10) % 10;
  const canon = v => [...String(v)].sort().join("");
  const CLASSIC = [
    [{s:0,o:0},{s:0,o:-1},{s:0,o:1},{s:3,o:0},{s:3,o:1}],
    [{s:1,o:0},{s:1,o:-1},{s:1,o:1},{s:4,o:0},{s:4,o:-1}],
    [{s:2,o:0},{s:2,o:-1},{s:2,o:1},{s:3,o:-1},{s:4,o:1}]
  ];
  const PATTERNS = [
    ["ลงแล้วขวา",[[0,0],[1,0],[1,1]]], ["ลงแล้วซ้าย",[[0,0],[1,0],[1,-1]]],
    ["ขึ้นแล้วขวา",[[0,0],[-1,0],[-1,1]]], ["ขึ้นแล้วซ้าย",[[0,0],[-1,0],[-1,-1]]],
    ["ขวาแล้วลง",[[0,0],[0,1],[1,1]]], ["ขวาแล้วขึ้น",[[0,0],[0,1],[-1,1]]],
    ["ซ้ายแล้วลง",[[0,0],[0,-1],[1,-1]]], ["ซ้ายแล้วขึ้น",[[0,0],[0,-1],[-1,-1]]]
  ];
  const TRIPLES = [];
  PATTERNS.forEach(([, offs], pi) => {
    for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) {
      const cells = offs.map(([a, b]) => [r + a, c + b]);
      if (cells.every(([x, y]) => x >= 0 && x < 3 && y >= 0 && y < 4)) TRIPLES.push({ pi, cells });
    }
  });
  const ENG = [
    { id: "classic", label: "Classic L" },
    { id: "ai", label: "AI L" },
    { id: "knn", label: "KNN" },
    { id: "cover", label: "Coverage" }
  ];
  const K = 80, WINDOW = 600, TOP = 21;

  const grid = (inp, f) => inp && inp.length === 5 ? f.map(row => row.map(c => W(inp[c.s] + c.o))) : null;
  function lResults(gr) {
    if (!gr) return [];
    const m = new Map();
    for (const t of TRIPLES) {
      const key = canon(t.cells.map(([r, c]) => gr[r][c]).join(""));
      const o = { name: PATTERNS[t.pi][0], cells: t.cells };
      const e = m.get(key);
      if (e) e.occ.push(o); else m.set(key, { number: key, occ: [o] });
    }
    return [...m.values()];
  }

  const TIDX = TRIPLES.map(t => t.cells.map(([r, c]) => r * 5 + c));
  const cell = new Int8Array(15);
  function hitNum(f, inp, target) {
    for (let r = 0, i = 0; r < 3; r++) for (let c = 0; c < 5; c++, i++) cell[i] = (inp[f[r][c].s] + f[r][c].o + 10) % 10;
    for (let k = 0; k < TIDX.length; k++) {
      const ix = TIDX[k]; let a = cell[ix[0]], b = cell[ix[1]], c = cell[ix[2]], t;
      if (a > b) { t = a; a = b; b = t; } if (b > c) { t = b; b = c; c = t; } if (a > b) { t = a; a = b; b = t; }
      if (a * 100 + b * 10 + c === target) return 1;
    }
    return 0;
  }
  const inputOf = d => d && /^\d{3}$/.test(d.n) && /^\d{2}$/.test(d.t) ? [...d.n, ...d.t].map(Number) : null;
  function transitions(D) {
    const out = [];
    for (let j = 1; j < D.length; j++) {
      const inp = inputOf(D[j - 1]);
      if (inp && /^\d{3}$/.test(D[j].n)) { const t = canon(D[j].n); out.push({ j, input: inp.join(""), inp, actual: D[j].n, t, tn: +t }); }
    }
    return out;
  }

  const fnv = s => { let h = 0x811c9dc5; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193); } return (h >>> 0).toString(36); };
  function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  const clone = f => f.map(r => r.map(c => ({ ...c })));
  const fixed = (r, c) => c === 0;
  const randomFormula = rand => CLASSIC.map((row, r) => row.map((cell, c) => fixed(r, c) ? { ...cell } : { s: Math.floor(rand() * 5), o: Math.floor(rand() * 5) - 2 }));
  const mutate = (f, rand, p) => f.map((row, r) => row.map((cell, c) => {
    if (fixed(r, c)) return { ...cell };
    const x = { ...cell };
    if (rand() < p) x.s = Math.floor(rand() * 5);
    if (rand() < p) x.o = Math.floor(rand() * 5) - 2;
    return x;
  }));
  const cross = (a, b, rand) => a.map((row, r) => row.map((cell, c) => fixed(r, c) ? { ...cell } : { ...(rand() < .5 ? a[r][c] : b[r][c]) }));
  const fkey = f => f.flat().map(x => x.s + ":" + x.o).join("|");

  function score(f, S) {
    const n = S.length; if (!n) return 0;
    let h10 = 0, h30 = 0, all = 0;
    for (let i = 0; i < n; i++) {
      const h = hitNum(f, S[i].inp, S[i].tn);
      all += h; if (i >= n - 30) h30 += h; if (i >= n - 10) h10 += h;
    }
    return .4 * h10 / Math.min(10, n) + .3 * h30 / Math.min(30, n) + .3 * all / n;
  }
  function evolve(S, seed) {
    if (S.length < 8) return { formula: CLASSIC, used: false };
    const work = S.slice(-100), split = Math.max(5, Math.floor(work.length * .7));
    const train = work.slice(0, split), test = work.slice(split);
    const fit = f => .4 * score(f, train) + .6 * score(f, test);
    const base = fit(CLASSIC), rand = rng(seed), memo = new Map();
    const rank = f => { const k = fkey(f); if (!memo.has(k)) memo.set(k, { f, v: fit(f) }); return memo.get(k); };
    let pop = [clone(CLASSIC)];
    while (pop.length < 12) pop.push(randomFormula(rand));
    let best = null;
    for (let gen = 0; gen < 2; gen++) {
      const ranked = [...new Map(pop.map(f => [fkey(f), f])).values()].map(rank).sort((a, b) => b.v - a.v);
      if (!best || ranked[0].v > best.v) best = ranked[0];
      const elite = ranked.slice(0, 4);
      pop = elite.map(x => clone(x.f));
      while (pop.length < 12) pop.push(mutate(cross(elite[Math.floor(rand() * 4) % elite.length].f, elite[Math.floor(rand() * 4) % elite.length].f, rand), rand, .14));
    }
    return best && best.v > base ? { formula: best.f, used: true } : { formula: CLASSIC, used: false };
  }

  function knn(S, input) {
    const rows = S.slice(-WINDOW).map((r, i) => {
      let d = 0; for (let k = 0; k < 5; k++) if (input[k] !== r.input[k]) d++;
      return { d, i, t: r.t };
    }).sort((a, b) => a.d - b.d || b.i - a.i).slice(0, K);
    const votes = new Map();
    rows.forEach((r, i) => { const w = 1 / (1 + r.d) + ((K - i) / K) * .001; votes.set(r.t, (votes.get(r.t) || 0) + w); });
    return [...votes].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, TOP).map(([number, score]) => ({ number, score }));
  }
  function coverage(classic, ai, nn, usedAI) {
    const m = new Map();
    const add = (list, src, base) => list.forEach((x, i) => {
      const e = m.get(x.number) || { number: x.number, score: 0, src: [] };
      if (!e.src.includes(src)) e.src.push(src);
      e.score += base - (i + 1);
      m.set(x.number, e);
    });
    add(classic, "Classic", 200); if (usedAI) add(ai, "AI L", 300); add(nn, "KNN", 100);
    return [...m.values()].sort((a, b) => b.src.length - a.src.length || b.score - a.score || a.number.localeCompare(b.number));
  }
  function predict(S, inp, seed) {
    const g0 = grid(inp, CLASSIC), classic = lResults(g0), ev = evolve(S, seed);
    const g1 = ev.used ? grid(inp, ev.formula) : g0, ai = ev.used ? lResults(g1) : classic;
    const nn = S.length ? knn(S, inp.join("")) : [];
    return {
      classic: { grid: g0, items: classic },
      ai: { grid: g1, items: ai, used: ev.used },
      knn: { items: nn },
      cover: { items: coverage(classic, ai, nn, ev.used) }
    };
  }
  const status = (items, actual) => !items.length || !/^\d{3}$/.test(actual) ? "p"
    : items.some(x => x.number === actual) ? "e"
    : items.some(x => canon(x.number) === canon(actual)) ? "r" : "m";

  function prepare(draws) {
    const D = draws.slice().sort((a, b) => a.date.localeCompare(b.date));
    let h = "", H = D.map(d => (h = fnv(h + "|" + d.date + d.n + d.t)));
    return { D, T: transitions(D), H };
  }
  function evaluate(p, i) {
    const inp = i > 0 ? inputOf(p.D[i - 1]) : null;
    if (!inp || !/^\d{3}$/.test(p.D[i].n)) return "pppp";
    const S = p.T.filter(x => x.j < i);
    const P = predict(S, inp, parseInt(fnv(p.H[i - 1] + S.length), 36));
    return ENG.map(e => status(P[e.id].items, p.D[i].n)).join("");
  }
  const perms = numbers => {
    const set = new Set();
    for (const n of numbers) {
      const rec = (a, k) => {
        if (k === a.length) return void set.add(a.join(""));
        for (let i = k; i < a.length; i++) { [a[k], a[i]] = [a[i], a[k]]; rec(a, k + 1); [a[k], a[i]] = [a[i], a[k]]; }
      };
      rec(String(n).split(""), 0);
    }
    return set.size;
  };
  const summarize = list => {
    const rows = list.filter(s => s !== "p"), total = rows.length;
    const exact = rows.filter(s => s === "e").length, hit = exact + rows.filter(s => s === "r").length;
    return { total, exact, hit, rate: total ? Math.round(hit * 1000 / total) / 10 : 0 };
  };

  const E = { CLASSIC, PATTERNS, ENG, canon, grid, lResults, inputOf, transitions, predict, status, evolve, prepare, evaluate, perms, summarize, fnv, knn, coverage };
  if (typeof module !== "undefined") module.exports = E; else g.LN = E;
})(globalThis);
