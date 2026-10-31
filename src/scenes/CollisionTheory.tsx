import React from 'react';
import {AbsoluteFill} from 'remotion';
import {EASE_IN_OUT, mix, ramp, rand, smoothPath, win} from '../anim';
import {Arrow, Card, Formula, Glow, Label, Motes, Ripple, Spark, Stage, Sub, Tint, TSub, Twinkles, V} from '../components/primitives';
import {useScene} from '../SceneContext';
import {C, FONT} from '../theme';

// Teori tumbukan.
// Kiri: ruang reaksi berisi gas cakram keras (A–B dan C) — simulasi deterministik dihitung SEKALI saat modul dimuat
// (langkah 1/240 s, tumbukan lenting dua benda: momentum & energi kekal per tumbukan). Suhu naik = waktu simulasi
// dipercepat (setara laju semua molekul dikali faktor yang sama) → tumbukan lebih sering & lebih keras.
// Kilatan emas = tumbukan A–B + C dengan laju normal relatif di atas ambang (energi ≥ Eₐ) DAN orientasi tepat.
// Kanan atas: cuplikan tumbukan besar (pelan / arah salah / berhasil) + panah momentum (Σp sama sebelum & sesudah).
// Contoh momentum (satuan sebarang): m_AB = 3, v = +1,5 → 4,5; m_C = 1,5, v = −2 → −3; Σp = 1,5.
// Sesudah: A (2) v = −0,75 → −1,5; B–C (2,5) v = +1,2 → +3; Σp = 1,5 ✓.

const ATOMS = {A: {fill: '#5fdc7a', r: 15}, B: {fill: '#4d7dff', r: 12}, C: {fill: '#ff5a6e', r: 15}};

// ---------- simulasi gas (sekali) ----------
const SX0 = 150;
const SX1 = 850;
const SY0 = 250;
const SY1 = 830;
const NM = 22;
const NAB = 11;
const RAD = Array.from({length: NM}, (_, i) => (i < NAB ? 27 : 17));
const MASS = Array.from({length: NM}, (_, i) => (i < NAB ? 3 : 1.5));
const SIM_DT = 1 / 240;
const SIM_T = 90;
const REC = 4; // simpan tiap 4 langkah (1/60 s)
const SIGMA0 = 10; // pemanasan awal agar sebaran laju sudah acak
const VTH = 215; // ambang laju normal relatif (px/s) ~ energi aktivasi

type Ev = {s: number; x: number; y: number; vn: number; react: boolean};
type Sim = {pos: Float32Array; ev: Ev[]; ns: number};
let SIM: Sim | null = null;
const getSim = (): Sim => {
  if (SIM) return SIM;
  const x = new Float64Array(NM);
  const y = new Float64Array(NM);
  const vx = new Float64Array(NM);
  const vy = new Float64Array(NM);
  for (let i = 0; i < NM; i++) {
    const col = i % 6;
    const row = Math.floor(i / 6);
    x[i] = SX0 + 60 + col * 116 + (rand(i * 3.3) - 0.5) * 30;
    y[i] = SY0 + 70 + row * 145 + (rand(i * 5.1) - 0.5) * 30;
    const sp = (i < NAB ? 90 : 127) * (0.7 + 0.6 * rand(i * 7.9));
    const a = rand(i * 2.2 + 1) * Math.PI * 2;
    vx[i] = sp * Math.cos(a);
    vy[i] = sp * Math.sin(a);
  }
  const steps = Math.round(SIM_T / SIM_DT);
  const ns = Math.floor(steps / REC) + 1;
  const pos = new Float32Array(ns * NM * 2);
  const ev: Ev[] = [];
  let k = 0;
  for (let st = 0; st <= steps; st++) {
    if (st % REC === 0) {
      for (let i = 0; i < NM; i++) {
        pos[(k * NM + i) * 2] = x[i];
        pos[(k * NM + i) * 2 + 1] = y[i];
      }
      k++;
    }
    for (let i = 0; i < NM; i++) {
      x[i] += vx[i] * SIM_DT;
      y[i] += vy[i] * SIM_DT;
      if (x[i] < SX0 + RAD[i] && vx[i] < 0) vx[i] = -vx[i];
      if (x[i] > SX1 - RAD[i] && vx[i] > 0) vx[i] = -vx[i];
      if (y[i] < SY0 + RAD[i] && vy[i] < 0) vy[i] = -vy[i];
      if (y[i] > SY1 - RAD[i] && vy[i] > 0) vy[i] = -vy[i];
    }
    for (let i = 0; i < NM; i++) {
      for (let j = i + 1; j < NM; j++) {
        const dx = x[j] - x[i];
        const dy = y[j] - y[i];
        const rr = RAD[i] + RAD[j];
        const d2 = dx * dx + dy * dy;
        if (d2 >= rr * rr || d2 < 1e-6) continue;
        const d = Math.sqrt(d2);
        const nx = dx / d;
        const ny = dy / d;
        const vn = (vx[i] - vx[j]) * nx + (vy[i] - vy[j]) * ny;
        if (vn <= 0) continue;
        const J = (2 * MASS[i] * MASS[j] * vn) / (MASS[i] + MASS[j]);
        vx[i] -= (J / MASS[i]) * nx;
        vy[i] -= (J / MASS[i]) * ny;
        vx[j] += (J / MASS[j]) * nx;
        vy[j] += (J / MASS[j]) * ny;
        const pair = (i < NAB) !== (j < NAB);
        ev.push({s: st * SIM_DT, x: x[i] + nx * RAD[i], y: y[i] + ny * RAD[i], vn, react: pair && rand(ev.length * 1.7 + 0.3) < 0.55});
      }
    }
  }
  SIM = {pos, ev, ns};
  return SIM;
};

const simPos = (sim: Sim, s: number, i: number): [number, number] => {
  const f = Math.max(0, Math.min(sim.ns - 1.001, s * (1 / (SIM_DT * REC))));
  const a = Math.floor(f);
  const u = f - a;
  const ia = (a * NM + i) * 2;
  const ib = ((a + 1) * NM + i) * 2;
  return [mix(sim.pos[ia], sim.pos[ib], u), mix(sim.pos[ia + 1], sim.pos[ib + 1], u)];
};

// ---------- cuplikan tumbukan besar ----------
const VC = 1395; // titik sentuh
const VY = 380;
const VS = 100; // px per satuan kecepatan
const BL = 26; // setengah panjang ikatan A–B
const VR = {A: 30, B: 24, C: 26};
const TC = 1.2;
const VDUR = 3.15;
const PS = 50; // px per satuan momentum
type VKind = 'bounce' | 'slow' | 'wrong' | 'hit' | 'hitp';
const VSPEC: Record<VKind, {u1: number; u2: number; f: number}> = {
  bounce: {u1: 1.0, u2: 1.4, f: 0.55},
  slow: {u1: 0.6, u2: 0.8, f: 0.28},
  wrong: {u1: 1.5, u2: 2.0, f: 0.9},
  hit: {u1: 1.5, u2: 2.0, f: 1.2},
  hitp: {u1: 1.5, u2: 2.0, f: 1.2},
};
const M_AB = 3;
const M_C = 1.5;

type VState = {A: number; B: number; C: number; bondAB: number; bondBC: number; pre: number; pAB: number; pC: number; pA: number; pBC: number; s: number};

const vstate = (kind: VKind, tau: number, sf: number): VState => {
  const {u1, u2, f} = VSPEC[kind];
  const U1 = u1 * sf;
  const U2 = -u2 * sf;
  const wrong = kind === 'wrong';
  const react = kind === 'hit' || kind === 'hitp';
  const dt = tau - TC;
  const vib = 2.5 * Math.sin(tau * 21);
  const xmC = wrong ? VC - VR.A - BL : VC - VR.B - BL;
  const xcC = VC + VR.C;
  const pre = 1 - ramp(tau, TC - 0.1, TC + 0.15, EASE_IN_OUT);
  // energi pada kurva (koordinat reaksi s)
  let s: number;
  if (tau < TC) s = mix(0.06, 0.3, Math.max(0, tau) / TC);
  else if (react) s = mix(0.3, 0.94, ramp(tau, TC, TC + 1.3, EASE_IN_OUT));
  else {
    const sT = 0.5 - 0.12 * Math.sqrt(-Math.log(Math.min(0.98, f)));
    const q = Math.min(1, (tau - TC) / 1.3);
    s = 0.3 + (sT - 0.3) * Math.sin(Math.PI * q) - 0.24 * ramp(tau, TC + 1.3, VDUR);
  }
  if (dt < 0 || !react) {
    let xm: number;
    let xc: number;
    if (dt < 0) {
      xm = xmC + U1 * VS * dt;
      xc = xcC + U2 * VS * dt;
    } else {
      const v1 = ((M_AB - M_C) * U1 + 2 * M_C * U2) / (M_AB + M_C);
      const v2 = ((M_C - M_AB) * U2 + 2 * M_AB * U1) / (M_AB + M_C);
      xm = xmC + v1 * VS * dt;
      xc = xcC + v2 * VS * dt;
    }
    const sgn = wrong ? 1 : -1;
    return {A: xm + sgn * (BL + vib), B: xm - sgn * BL, C: xc, bondAB: 1, bondBC: 0, pre, pAB: M_AB * U1, pC: M_C * U2, pA: 0, pBC: 0, s};
  }
  // bereaksi: A–B putus, B–C terbentuk; A: v = −0,75; B–C: v = +1,2 (Σp tetap)
  const vA = -0.75 * sf;
  const vBC = 1.2 * sf;
  return {
    A: xmC - BL + vA * VS * dt,
    B: VC - VR.B + vBC * VS * dt,
    C: xcC + vBC * VS * dt,
    bondAB: 1 - ramp(tau, TC - 0.02, TC + 0.25),
    bondBC: ramp(tau, TC, TC + 0.3),
    pre,
    pAB: M_AB * U1,
    pC: M_C * U2,
    pA: 2 * vA,
    pBC: 2.5 * vBC,
    s,
  };
};

const Atom: React.FC<{x: number; y: number; k: 'A' | 'B' | 'C'; r: number; label?: boolean}> = ({x, y, k, r, label}) => (
  <g>
    <circle cx={x} cy={y} r={r} fill={ATOMS[k].fill} stroke="#eef3ff" strokeOpacity={0.5} strokeWidth={1.5} />
    <circle cx={x - r * 0.32} cy={y - r * 0.36} r={r * 0.3} fill="#fff" opacity={0.5} />
    {label ? (
      <text x={x} y={y + 2} textAnchor="middle" dominantBaseline="central" fontFamily={FONT.head} fontWeight={700} fontSize={r * 0.8} fill="#0b1022">
        {k}
      </text>
    ) : null}
  </g>
);

// ---------- kurva energi ----------
const EX0 = 1010;
const EX1 = 1780;
const EBASE = 760;
const ESC = 150;
const eOf = (s: number) => Math.exp(-(((s - 0.5) / 0.12) ** 2)) - 0.45 / (1 + Math.exp(-(s - 0.5) / 0.06));
const ePt = (s: number): [number, number] => [EX0 + s * (EX1 - EX0), EBASE - eOf(s) * ESC];
const E_PATH = smoothPath(Array.from({length: 61}, (_, i) => ePt(i / 60)));

// ---------- sebaran Maxwell–Boltzmann (energi) ----------
const MX0 = 1020;
const MX1 = 1780;
const MBASE = 845;
const MEMAX = 6;
const MSC = 400; // px per satuan f
const EA = 3.2;
const mb = (E: number, kT: number) => (2 / Math.sqrt(Math.PI)) * Math.pow(1 / kT, 1.5) * Math.sqrt(Math.max(0, E)) * Math.exp(-E / kT);
const mPt = (E: number, kT: number): [number, number] => [MX0 + (E / MEMAX) * (MX1 - MX0), MBASE - mb(E, kT) * MSC];

const slot = (t: number, a: number, b: number, fi = 0.5, fo = 0.45) => Math.min(ramp(t, a, a + fi), 1 - ramp(t, b - fo, b, EASE_IN_OUT));

export const CollisionTheory: React.FC = () => {
  const {t, cue, cueEnd, wordOf} = useScene();
  const sim = getSim();

  // ---------- suhu: laju waktu simulasi ----------
  const hotA = cue(4) + 0.2;
  const hotB = cue(4) + 2.6;
  const heat = ramp(t, hotA, hotB, EASE_IN_OUT);
  const rateAt = (u: number) => 1 + 0.55 * ramp(u, hotA, hotB, EASE_IN_OUT);
  let sig = SIGMA0;
  for (let u = -1; u < t; u += 1 / 30) sig += rateAt(Math.min(u + 1 / 60, t)) * Math.min(1 / 30, t - u);
  const rateNow = rateAt(t);

  // ---------- jadwal cuplikan ----------
  const want: [number, VKind][] = [
    [cue(0) + 0.4, 'bounce'],
    [cue(0) + 3.4, 'bounce'],
    [cue(1) - 0.2, 'slow'],
    [cue(1) + 2.9, 'wrong'],
    [cue(1) + 5.9, 'hit'],
    [cue(2) + 2.2, 'slow'],
    [cue(2) + 5.0, 'hit'],
    [cue(3) + 0.2, 'hitp'],
    [cue(3) + 3.2, 'hitp'],
    [cue(4) + 0.2, 'hit'],
    [cue(4) + 2.6, 'bounce'],
    [cue(4) + 5.0, 'hit'],
  ];
  const sched: [number, VKind, number][] = [];
  let prev = -99;
  for (const [s0, k] of want) {
    const st = Math.max(s0, prev + VDUR);
    const sf = st > hotA ? 1.35 : 1;
    sched.push([st, k, sf]);
    prev = st;
  }
  const vigEnd = cue(5) - 0.2;

  // ---------- fase narasi ----------
  const vesselIn = ramp(t, -0.4, 0.6);
  const panelIn = ramp(t, cue(0) + 0.1, cue(0) + 0.8);
  const eProf = Math.min(ramp(t, wordOf(1, 'keras') - 0.4, wordOf(1, 'keras') + 0.5), 1 - ramp(t, cue(3) - 0.3, cue(3) + 0.3, EASE_IN_OUT));
  const eaLbl = ramp(t, wordOf(2, 'aktivasi') - 0.4, wordOf(2, 'aktivasi') + 0.4);
  const bondLbl = win(t, wordOf(2, 'ikatan') - 0.3, cueEnd(2) + 0.6, 0.4, 0.5);
  const pShow = win(t, cue(3) - 0.1, cueEnd(3) + 0.5, 0.5, 0.6);
  const mbIn = ramp(t, cue(4) - 0.2, cue(4) + 0.6);
  const tailLbl = ramp(t, wordOf(4, 'keras') - 0.3, wordOf(4, 'keras') + 0.5);
  const rule = ramp(t, cue(5) + 0.2, cue(5) + 0.9);
  const bars2 = ramp(t, wordOf(5, 'dua') - 0.3, wordOf(5, 'dua') + 0.8);
  const kT = mix(1, 1.45, heat);

  // ---------- molekul di ruang reaksi ----------
  const mols = Array.from({length: NM}, (_, i) => {
    const [x, y] = simPos(sim, sig, i);
    const rot = rand(i * 4.4) * 360 + (rand(i * 6.6) - 0.5) * 140 * sig;
    return {x, y, rot, i};
  });
  // tumbukan baru-baru ini (cari biner)
  const ev = sim.ev;
  let lo = 0;
  let hi = ev.length;
  while (lo < hi) {
    const m = (lo + hi) >> 1;
    if (ev[m].s < sig - 0.45 * rateNow) lo = m + 1;
    else hi = m;
  }
  const recent: (Ev & {age: number; eff: boolean})[] = [];
  for (let k = lo; k < ev.length && ev[k].s <= sig; k++) {
    const e = ev[k];
    recent.push({...e, age: (sig - e.s) / (0.45 * rateNow), eff: e.react && e.vn * rateNow >= VTH});
  }

  // ---------- cuplikan aktif ----------
  const vigs = sched
    .map(([st, k, sf]) => ({st, k, sf, tau: t - st}))
    .filter((v) => v.tau > -0.35 && v.tau < VDUR + 0.05 && v.st < vigEnd);
  const active = sched.filter(([st]) => st <= t + 0.3 && st < vigEnd).slice(-1)[0];
  const ball = active ? vstate(active[1], t - active[0], active[2]).s : 0.06;
  const [bx, by] = ePt(ball);

  // ---------- kurva MB ----------
  const mbPath = (k: number) => smoothPath(Array.from({length: 73}, (_, i) => mPt((i / 72) * MEMAX, k)));
  const tailPts: [number, number][] = Array.from({length: 31}, (_, i) => mPt(EA + (i / 30) * (MEMAX - EA), kT));
  const tailD = `M${mPt(EA, kT)[0]},${MBASE} ` + tailPts.map((p) => `L${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ') + ` L${MX1},${MBASE} Z`;
  const eaX = MX0 + (EA / MEMAX) * (MX1 - MX0);

  return (
    <AbsoluteFill>
      <Stage>
        {/* ===================== ruang reaksi ===================== */}
        <g opacity={vesselIn}>
          <rect x={120} y={218} width={760} height={644} rx={30} fill="#0c1634" fillOpacity={0.85} stroke="#9fb0d8" strokeWidth={10} />
          <rect x={120} y={218} width={760} height={644} rx={30} fill="none" stroke="#fff" strokeOpacity={0.15} strokeWidth={2} />
          <Glow x={500} y={540} r={420} color="kin" opacity={0.45 * heat} still />
          <path d="M150,250 Q150,232 168,232 L320,232" fill="none" stroke="#fff" strokeOpacity={0.25} strokeWidth={4} strokeLinecap="round" />
          {mols.map((m) =>
            m.i < NAB ? (
              <g key={m.i}>
                {(() => {
                  const a = (m.rot * Math.PI) / 180;
                  const dx = Math.cos(a) * 12;
                  const dy = Math.sin(a) * 12;
                  return (
                    <>
                      <line x1={m.x - dx} y1={m.y - dy} x2={m.x + dx} y2={m.y + dy} stroke="#dfe7ff" strokeWidth={5} />
                      <Atom x={m.x - dx} y={m.y - dy} k="A" r={ATOMS.A.r} />
                      <Atom x={m.x + dx} y={m.y + dy} k="B" r={ATOMS.B.r} />
                    </>
                  );
                })()}
              </g>
            ) : (
              <Atom key={m.i} x={m.x} y={m.y} k="C" r={ATOMS.C.r} />
            ),
          )}
          {recent.map((e, k) =>
            e.eff ? (
              <g key={k}>
                <Ripple x={e.x} y={e.y} p={Math.min(0.999, e.age * 0.9 + 0.001)} r={90} color="gold" rings={2} />
                <Label x={e.x} y={e.y - 46} size={24} color={C.gold} weight={700} opacity={Math.sin(Math.PI * Math.min(1, e.age))}>
                  ✓
                </Label>
              </g>
            ) : (
              <circle key={k} cx={e.x} cy={e.y} r={6 + 22 * e.age} fill="none" stroke="#dfe7ff" strokeWidth={2.5} opacity={0.6 * (1 - e.age)} />
            ),
          )}
          {/* legenda */}
          <rect x={150} y={796} width={300} height={44} rx={22} fill="rgba(7,11,24,0.75)" />
          <line x1={176} y1={818} x2={200} y2={818} stroke="#dfe7ff" strokeWidth={4} />
          <Atom x={176} y={818} k="A" r={11} />
          <Atom x={200} y={818} k="B" r={9} />
          <Label x={218} y={818} size={20} color={C.ink} anchor="start">
            A–B
          </Label>
          <Atom x={290} y={818} k="C" r={11} />
          <Label x={308} y={818} size={20} color={C.ink} anchor="start">
            C
          </Label>
          <circle cx={360} cy={818} r={9} fill="none" stroke={C.gold} strokeWidth={3} />
          <Label x={376} y={818} size={20} color={C.gold} anchor="start">
            efektif
          </Label>
        </g>

        {/* ===================== panel cuplikan (kanan atas) ===================== */}
        <g opacity={panelIn}>
          <rect x={950} y={196} width={890} height={340} rx={22} fill="rgba(10,16,36,0.72)" stroke={C.line} strokeWidth={2} />
          <defs>
            <clipPath id="ct-vig">
              <rect x={952} y={198} width={886} height={336} rx={21} />
            </clipPath>
          </defs>
          <g clipPath="url(#ct-vig)">
          {vigs.map((v) => {
            const s = vstate(v.k, v.tau, v.sf);
            const op = Math.min(ramp(v.tau, -0.3, 0.15), 1 - ramp(v.tau, VDUR - 0.5, VDUR, EASE_IN_OUT), 1 - ramp(t, vigEnd - 0.4, vigEnd, EASE_IN_OUT));
            if (op <= 0.001) return null;
            const react = v.k === 'hit' || v.k === 'hitp';
            const post = ramp(v.tau, TC + 0.05, TC + 0.5);
            const verdict =
              v.k === 'slow'
                ? {txt: 'terlalu pelan ✗', c: C.heat}
                : v.k === 'wrong'
                  ? {txt: 'arah salah ✗', c: C.heat}
                  : react
                    ? {txt: 'cukup keras + arah tepat → bereaksi ✓', c: C.work}
                    : {txt: 'memantul', c: C.muted};
            const hitP = ramp(v.tau, TC - 0.03, TC + 1.0, (q) => q);
            const showP = v.k === 'hitp' ? pShow : 0;
            const midBC = (s.B + s.C) / 2;
            return (
              <g key={v.st} opacity={op}>
                <Ripple x={VC} y={VY} p={hitP} r={react ? 150 : 90} color={react ? 'gold' : 'ink'} />
                {/* ikatan */}
                <line x1={s.A} y1={VY} x2={s.B} y2={VY} stroke="#dfe7ff" strokeWidth={9} opacity={s.bondAB} strokeDasharray={s.bondAB < 0.99 ? '8 6' : undefined} />
                <line x1={s.B} y1={VY} x2={s.C} y2={VY} stroke={C.gold} strokeWidth={9} opacity={s.bondBC} />
                <Atom x={s.A} y={VY} k="A" r={VR.A} label />
                <Atom x={s.B} y={VY} k="B" r={VR.B} label />
                <Atom x={s.C} y={VY} k="C" r={VR.C} label />
                {/* garis gerak */}
                {v.tau < TC
                  ? [0, 1, 2].map((k) => (
                      <g key={k} opacity={0.35 - k * 0.1}>
                        <line x1={Math.min(s.A, s.B) - 40 - k * 16} y1={VY - 14 + k * 14} x2={Math.min(s.A, s.B) - 70 - k * 16} y2={VY - 14 + k * 14} stroke={C.ink} strokeWidth={2.5} strokeLinecap="round" />
                        <line x1={s.C + 34 + k * 16} y1={VY - 14 + k * 14} x2={s.C + 64 + k * 16} y2={VY - 14 + k * 14} stroke={C.ink} strokeWidth={2.5} strokeLinecap="round" />
                      </g>
                    ))
                  : null}
                {/* vonis */}
                <g opacity={post}>
                  <Label x={VC} y={236} size={26} color={verdict.c} weight={700}>
                    {verdict.txt}
                  </Label>
                </g>
                {/* label ikatan (baris 2) */}
                {react ? (
                  <g opacity={bondLbl * post}>
                    <Label x={s.A + 10} y={VY + 62} size={20} color={C.muted}>
                      ikatan lama putus
                    </Label>
                    <Label x={midBC} y={VY + 62} size={20} color={C.gold}>
                      ikatan baru
                    </Label>
                  </g>
                ) : null}
                {/* momentum (baris 3) */}
                {showP > 0.001 ? (
                  <g opacity={showP}>
                    <g opacity={s.pre}>
                      <Arrow x1={(s.A + s.B) / 2 - (s.pAB * PS) / 2} y1={300} x2={(s.A + s.B) / 2 + (s.pAB * PS) / 2} y2={300} color="spr" width={5} pulse={false} />
                      <Label x={(s.A + s.B) / 2} y={274} size={20} color="#d9c2ff" font="serif" italic>
                        p = 4,5
                      </Label>
                      <Arrow x1={s.C - (s.pC * PS) / 2} y1={300} x2={s.C + (s.pC * PS) / 2} y2={300} color="spr" width={5} pulse={false} />
                      <Label x={s.C} y={274} size={20} color="#d9c2ff" font="serif" italic>
                        p = −3
                      </Label>
                    </g>
                    <g opacity={1 - s.pre}>
                      <Arrow x1={s.A - (s.pA * PS) / 2} y1={300} x2={s.A + (s.pA * PS) / 2} y2={300} color="spr" width={5} pulse={false} />
                      <Label x={s.A} y={274} size={20} color="#d9c2ff" font="serif" italic>
                        p = −1,5
                      </Label>
                      <Arrow x1={midBC - (s.pBC * PS) / 2} y1={300} x2={midBC + (s.pBC * PS) / 2} y2={300} color="spr" width={5} pulse={false} />
                      <Label x={midBC} y={274} size={20} color="#d9c2ff" font="serif" italic>
                        p = +3
                      </Label>
                    </g>
                    <Arrow x1={VC - 0.75 * PS} y1={478} x2={VC + 0.75 * PS} y2={478} color="spr" width={7} pulse={false} />
                    <Label x={VC - 60} y={478} size={22} color={C.spr} anchor="end" weight={700}>
                      Σp = 1,5
                    </Label>
                    <Label x={VC + 60} y={478} size={20} color={C.muted} anchor="start">
                      (sebelum = sesudah)
                    </Label>
                  </g>
                ) : null}
              </g>
            );
          })}
          </g>
          <Motes x={1395} y={370} rx={400} ry={130} n={10} color="cyan" opacity={0.25 * (1 - rule)} seed={2} />
          {/* aturan ×2 (baris 5) */}
          <g opacity={bars2}>
            {[
              ['T', 1, C.cyan, 446],
              ['T + 10 °C', 2, C.kin, 496],
            ].map(([lbl, n, c, y]) => (
              <g key={lbl as string}>
                <Label x={1150} y={y as number} size={22} color={c as string} anchor="end" weight={600}>
                  {lbl}
                </Label>
                <rect x={1170} y={(y as number) - 14} width={260 * (n as number) * bars2} height={28} rx={7} fill={c as string} opacity={0.85} />
                <Label x={1180 + 260 * (n as number) * bars2} y={y as number} size={20} color={c as string} anchor="start" font="mono">
                  {n === 1 ? '1×' : '≈ 2×'}
                </Label>
              </g>
            ))}
            <Twinkles x={1690} y={496} rx={40} ry={20} n={3} color="kin" seed={6} />
          </g>
        </g>

        {/* ===================== panel bawah kanan ===================== */}
        <g opacity={panelIn}>
          <rect x={950} y={566} width={890} height={306} rx={22} fill="rgba(10,16,36,0.72)" stroke={C.line} strokeWidth={2} />
        </g>
        {/* kurva energi */}
        <g opacity={eProf}>
          <Label x={980} y={598} size={20} color={C.muted} anchor="start" weight={600} spacing={2}>
            PROFIL ENERGI
          </Label>
          <path d={E_PATH} fill="none" stroke={C.ink} strokeOpacity={0.25} strokeWidth={10} />
          <path d={E_PATH} fill="none" stroke={C.ink} strokeWidth={3.5} />
          <Label x={EX0 + 70} y={EBASE - 26} size={20} color={C.muted}>
            A–B + C
          </Label>
          <Label x={EX1 - 70} y={EBASE + 0.45 * ESC - 26} size={20} color={C.muted}>
            A + B–C
          </Label>
          <g opacity={eaLbl}>
            <line x1={ePt(0.5)[0] - 70} y1={EBASE} x2={ePt(0.5)[0] - 70} y2={EBASE - ESC + 6} stroke={C.heat} strokeWidth={3.5} markerEnd="url(#arrow-heat)" markerStart="url(#arrow-heat)" />
            <line x1={EX0} y1={EBASE} x2={ePt(0.5)[0] - 50} y2={EBASE} stroke={C.heat} strokeOpacity={0.6} strokeWidth={2} strokeDasharray="5 6" />
            <Label x={ePt(0.5)[0] - 92} y={EBASE - ESC / 2} size={28} color={C.heat} anchor="end" font="serif" italic weight={700}>
              E<TSub>a</TSub>
            </Label>
            <Glow x={ePt(0.5)[0]} y={EBASE - ESC} r={70} color="heat" opacity={0.6} />
          </g>
          <Spark x={bx} y={by - 14} r={10} color="gold" trail={[1, 2, 3, 4].map((k) => ePt(Math.max(0, ball - 0.012 * k)).map((v, j) => (j ? v - 14 : v)) as [number, number])} />
        </g>
        {/* sebaran energi (suhu) */}
        <g opacity={mbIn}>
          <Label x={980} y={598} size={20} color={C.muted} anchor="start" weight={600} spacing={2}>
            SEBARAN ENERGI MOLEKUL
          </Label>
          <line x1={MX0} y1={MBASE} x2={MX1 + 20} y2={MBASE} stroke={C.muted} strokeWidth={2} markerEnd="url(#arrow-muted)" />
          <Label x={MX1 + 10} y={MBASE - 22} size={20} color={C.muted} font="serif" italic>
            E
          </Label>
          <path d={tailD} fill={C.kin} opacity={0.45 + 0.1 * Math.sin(t * 2)} />
          <g opacity={heat}>
            <path d={mbPath(1)} fill="none" stroke={C.cyan} strokeWidth={2.5} strokeDasharray="7 7" opacity={0.8} />
            <Label x={mPt(0.5, 1)[0] - 10} y={mPt(0.5, 1)[1] - 22} size={20} color={C.cyan}>
              T rendah
            </Label>
          </g>
          <path d={mbPath(kT)} fill="none" stroke={C.cyan} strokeWidth={4} opacity={1 - heat} />
          <path d={mbPath(kT)} fill="none" stroke={C.kin} strokeWidth={4} opacity={heat} />
          <g opacity={heat}>
            <Label x={mPt(1.6, kT)[0] + 40} y={mPt(1.6, kT)[1] - 16} size={20} color={C.kin} anchor="start">
              T tinggi
            </Label>
          </g>
          <line x1={eaX} y1={MBASE} x2={eaX} y2={640} stroke={C.heat} strokeWidth={3} strokeDasharray="8 6" />
          <Label x={eaX + 10} y={640} size={26} color={C.heat} anchor="start" font="serif" italic weight={700}>
            E<TSub>a</TSub>
          </Label>
          <g opacity={tailLbl}>
            <Label x={eaX + 170} y={MBASE - 70} size={20} color={C.kin} anchor="start">
              cukup energi
            </Label>
            <Label x={eaX + 170} y={MBASE - 46} size={20} color={C.kin} anchor="start">
              → luas bertambah
            </Label>
          </g>
          {/* penggeser suhu */}
          <g>
            <Label x={1440} y={604} size={20} color={C.muted} anchor="end">
              suhu
            </Label>
            <rect x={1460} y={596} width={300} height={14} rx={7} fill="#1a2850" />
            <rect x={1460} y={596} width={60 + 240 * heat} height={14} rx={7} fill={C.kin} opacity={0.35 + 0.6 * heat} />
            <circle cx={1520 + 240 * heat} cy={603} r={13} fill={C.ink} stroke={C.kin} strokeWidth={3} />
          </g>
        </g>
        <Motes x={500} y={540} rx={360} ry={300} n={12} color="cyan" opacity={0.25 * (1 - heat)} seed={9} />
        <Motes x={500} y={540} rx={360} ry={300} n={12} color="kin" opacity={0.3 * heat} seed={9} />
      </Stage>

      {/* ===================== kartu ===================== */}
      <Formula x={1395} y={719} p={slot(t, cue(0) + 0.8, wordOf(1, 'keras') - 0.2)} accent={C.gold} size={56} caption="tumbukan dulu, baru reaksi">
        <Tint c={ATOMS.A.fill}>A</Tint>–<Tint c={ATOMS.B.fill}>B</Tint> + <Tint c={ATOMS.C.fill}>C</Tint> → <Tint c={ATOMS.A.fill}>A</Tint> + <Tint c={ATOMS.B.fill}>B</Tint>–<Tint c={ATOMS.C.fill}>C</Tint>
      </Formula>
      <Formula x={1395} y={719} p={slot(t, cue(3) + 0.1, cue(4) + 0.1)} accent={C.spr} size={56} caption="4,5 + (−3) = (−1,5) + 3 = 1,5 (satuan sebarang)">
        <V color={C.spr}>p</V>
        <Sub>AB</Sub> + <V color={C.spr}>p</V>
        <Sub>C</Sub> = <V color={C.spr}>p</V>
        <Sub>A</Sub> + <V color={C.spr}>p</V>
        <Sub>BC</Sub>
      </Formula>
      <Card x={1395} y={322} opacity={rule} scale={0.95 + 0.05 * rule} accent={C.kin} style={{padding: '16px 36px'}}>
        <div style={{fontFamily: FONT.serif, fontSize: 56, lineHeight: 1.25, textAlign: 'center'}}>
          laju ≈ <Tint c={C.kin}>2×</Tint> per +10 °C
        </div>
        <div style={{fontFamily: FONT.sans, fontSize: 24, color: C.muted, textAlign: 'center', marginTop: 6}}>aturan praktis — berlaku kira-kira, untuk banyak reaksi</div>
      </Card>
    </AbsoluteFill>
  );
};
