import React from 'react';
import {AbsoluteFill} from 'remotion';
import {EASE_IN_OUT, mix, ramp, rand, win} from '../anim';
import {Arrow, Card, Formula, Frac, Glow, Label, Motes, Ripple, Stage, Sup, Tint, Twinkles, V} from '../components/primitives';
import {useScene} from '../SceneContext';
import {ATOM, C, FONT} from '../theme';

// Tekanan gas = hujan tumbukan.
// Tabung berisi molekul N₂ yang memantul (posisi "dilipat" tertutup per frame, tanpa state).
// Perbesaran: satu molekul menabrak dinding → kecepatan berbalik → Δp = (−mv) − (+mv) = −2mv (besar 2mv).
// Angka (AUDIT): m = 28 × 1,66×10⁻²⁷ = 4,65×10⁻²⁶ kg; v ≈ 500 m/s; 2mv = 4,65×10⁻²³ ≈ 5×10⁻²³ kg·m/s;
// fluks ≈ nv̄/4 ≈ 3×10²³ cm⁻²s⁻¹ (orde "triliunan triliun", kualitatif).

// ---------- tabung ----------
const BX0 = 130;
const BX1 = 880;
const BY0 = 300;
const BY1 = 860;
const WALL = 14;
const MR = 18; // jangkauan molekul dari pusat
const LO_X = BX0 + WALL / 2 + MR;
const HI_X = BX1 - WALL / 2 - MR;
const LO_Y = BY0 + WALL / 2 + MR;
const HI_Y = BY1 - WALL / 2 - MR;
const NMOL = 34;
const LENS_Y = 430;

// ---------- jendela perbesaran ----------
const ZX0 = 1000;
const ZX1 = 1830;
const ZY0 = 200;
const ZY1 = 540;
const ZWALL = 1745;
const ZR = 34; // jangkauan molekul besar
const ZY = 382;
const ZP = 3.4; // periode satu pantulan
const ZV = 260; // px/s

const fold = (u: number, lo: number, hi: number) => {
  const L = hi - lo;
  const m = (((u - lo) % (2 * L)) + 2 * L) % (2 * L);
  return lo + (m < L ? m : 2 * L - m);
};

type Mol = {x0: number; y0: number; vx: number; vy: number; rot0: number; w: number};
const MOLS: Mol[] = Array.from({length: NMOL}, (_, i) => {
  const s = 130 + 190 * Math.sqrt(rand(i * 3.1 + 1)); // sebaran laju (kasar, ala Maxwell)
  const a = rand(i * 7.7 + 2) * Math.PI * 2;
  return {
    x0: LO_X + rand(i * 1.3 + 5) * (HI_X - LO_X),
    y0: LO_Y + rand(i * 2.9 + 8) * (HI_Y - LO_Y),
    vx: s * Math.cos(a),
    vy: s * Math.sin(a),
    rot0: rand(i * 5.3) * 360,
    w: (rand(i * 9.1) - 0.5) * 300,
  };
});

const molAt = (m: Mol, t: number) => ({x: fold(m.x0 + m.vx * t, LO_X, HI_X), y: fold(m.y0 + m.vy * t, LO_Y, HI_Y)});

/** Detik sejak molekul terakhir menabrak dinding kanan. */
const sinceRightHit = (m: Mol, t: number) => {
  const L = HI_X - LO_X;
  const u = m.x0 + m.vx * t;
  if (m.vx > 0) {
    const d = (((u - LO_X - L) % (2 * L)) + 2 * L) % (2 * L);
    return d / m.vx;
  }
  const d = (((LO_X + L - u) % (2 * L)) + 2 * L) % (2 * L);
  return d / -m.vx;
};

/** Molekul N₂: dua atom N terikat. */
const N2: React.FC<{x: number; y: number; rot: number; s?: number; op?: number; ring?: number}> = ({x, y, rot, s = 1, op = 1, ring = 0}) => {
  if (op <= 0.001) return null;
  const d = 8 * s;
  const r = 9 * s;
  const a = (rot * Math.PI) / 180;
  const dx = Math.cos(a) * d;
  const dy = Math.sin(a) * d;
  return (
    <g opacity={op}>
      {ring > 0.01 ? <circle cx={x} cy={y} r={30 * s} fill="none" stroke={C.gold} strokeWidth={2.5} opacity={ring} /> : null}
      <circle cx={x - dx} cy={y - dy} r={r} fill={ATOM.N.fill} stroke="#a9c0ff" strokeWidth={1.2} />
      <circle cx={x + dx} cy={y + dy} r={r} fill={ATOM.N.fill} stroke="#a9c0ff" strokeWidth={1.2} />
      <circle cx={x - dx - r * 0.3} cy={y - dy - r * 0.35} r={r * 0.32} fill="#fff" opacity={0.55} />
      <circle cx={x + dx - r * 0.3} cy={y + dy - r * 0.35} r={r * 0.32} fill="#fff" opacity={0.55} />
    </g>
  );
};

const slot = (t: number, a: number, b: number, fi = 0.5, fo = 0.45) => Math.min(ramp(t, a, a + fi), 1 - ramp(t, b - fo, b, EASE_IN_OUT));

/** Angka penghitung tumbukan (pemisah ribuan titik). */
const counterText = (x: number, done: boolean, t: number) => {
  const e = Math.floor(x);
  const mant = Math.pow(10, x - e);
  const lead = Math.floor(mant * 1000);
  let digits = String(lead);
  const total = e + 1;
  if (total <= 4) digits = String(Math.floor(Math.pow(10, x)));
  else {
    let rest = '';
    for (let i = 0; i < total - digits.length; i++) rest += done ? '0' : String(Math.floor(rand(i * 3.7 + Math.floor(t * 30) * 0.913) * 10));
    digits = digits + rest;
  }
  if (done) digits = '3' + '0'.repeat(23);
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

export const GasPressure: React.FC = () => {
  const {t, cue, cueEnd, wordOf} = useScene();

  // ---------- fase ----------
  const boxIn = ramp(t, -0.4, 0.6);
  const move = ramp(t, cue(1) - 0.2, cue(1) + 1.2, EASE_IN_OUT);
  const shift = mix(400, 0, move);
  const pressQ = Math.max(win(t, cue(0) + 0.3, cue(1) + 0.3, 0.6, 0.8), ramp(t, wordOf(5, 'tekanan') - 0.4, wordOf(5, 'tekanan') + 0.6));
  const hits = ramp(t, wordOf(1, 'menabrak') - 0.3, wordOf(1, 'menabrak') + 0.5);
  const track = win(t, cue(1) + 0.4, cue(3), 0.6, 0.8);
  const zoomIn = ramp(t, cue(1) + 0.8, cue(1) + 1.8);
  const zoomOut = 1 - ramp(t, wordOf(4, 'tetapi') - 0.2, wordOf(4, 'tetapi') + 0.7, EASE_IN_OUT);
  const zoom = zoomIn * zoomOut;
  const plot = ramp(t, wordOf(4, 'tetapi') + 0.2, wordOf(4, 'tetapi') + 1.0);
  const dpRows = ramp(t, cue(2) + 0.2, cue(2) + 0.9);
  const dp2 = ramp(t, wordOf(2, 'dua') - 0.3, wordOf(2, 'dua') + 0.5);
  const lblN = ramp(t, wordOf(3, 'nitrogen') - 0.2, wordOf(3, 'nitrogen') + 0.5);
  const lblV = ramp(t, wordOf(3, 'lima') - 0.2, wordOf(3, 'lima') + 0.5);
  const small = win(t, cue(4) - 0.1, wordOf(4, 'tetapi') + 0.3, 0.4, 0.5);
  const patch = ramp(t, wordOf(4, 'sentimeter') - 0.3, wordOf(4, 'sentimeter') + 0.5);
  const cnt = ramp(t, wordOf(4, 'triliunan') - 0.6, wordOf(4, 'triliunan') + 2.6, EASE_IN_OUT);
  const cntDone = cnt >= 0.999;
  const nbar = Math.exp(mix(Math.log(0.25), Math.log(400), ramp(t, wordOf(4, 'tetapi') + 0.6, cueEnd(4) + 0.5, EASE_IN_OUT)));
  const avgLbl = ramp(t, cue(5) + 0.2, cue(5) + 1.0);
  const pDone = ramp(t, wordOf(5, 'tekanan') - 0.2, wordOf(5, 'tekanan') + 0.6);

  // ---------- molekul ----------
  const mols = MOLS.map((m, i) => {
    const p = molAt(m, t);
    return {...p, rot: m.rot0 + m.w * t, hit: sinceRightHit(m, t), i};
  });
  const trail = Array.from({length: 7}, (_, k) => molAt(MOLS[0], t - (k + 1) * 0.05));

  // ---------- pengukur tekanan ----------
  const gx = (BX0 + BX1) / 2;
  const gy = 238;
  const needle = (-40 + 75 * boxIn + 3 * Math.sin(t * 9.3) * (1 / Math.sqrt(Math.max(1, nbar))) + 1.5 * Math.sin(t * 5.1)) * (Math.PI / 180);

  // ---------- molekul besar di jendela ----------
  const zt = ((t % ZP) + ZP) % ZP;
  const zx = ZWALL - ZR - ZV * Math.abs(zt - ZP / 2);
  const zop = Math.min(1, zt / 0.45, (ZP - zt) / 0.45);
  const flip = ramp(zt, ZP / 2 - 0.06, ZP / 2 + 0.1);
  const zhit = zt > ZP / 2 ? zt - ZP / 2 : 99;

  // ---------- grafik gaya (lonjakan) ----------
  const NS = 150;
  const GX0 = 1050;
  const GX1 = 1790;
  const GY = 500;
  const HAVG = 140;
  const scroll = Math.round(t * 30);
  let spikes = '';
  for (let i = 0; i < NS; i++) {
    const j = i + scroll;
    const u1 = Math.max(1e-6, rand(j * 1.37 + 3));
    const u2 = rand(j * 7.71 + 9);
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    const bern = rand(j * 4.13 + 1) < nbar ? 1 : 0;
    const gauss = Math.max(0, nbar + Math.sqrt(nbar) * z) / Math.max(nbar, 1);
    const k = mix(bern, gauss, ramp(nbar, 0.6, 1.6, (q) => q));
    const h = Math.min(250, HAVG * k);
    const x = GX1 - (i / (NS - 1)) * (GX1 - GX0);
    spikes += `M${x.toFixed(1)},${GY} V${(GY - h).toFixed(1)} `;
  }
  const avgY = GY - HAVG * Math.min(1, nbar);

  return (
    <AbsoluteFill>
      <Stage>
        <defs>
          <clipPath id="gp-zoom">
            <rect x={ZX0} y={ZY0} width={ZX1 - ZX0} height={ZY1 - ZY0} rx={20} />
          </clipPath>
          <clipPath id="gp-box">
            <rect x={BX0 + WALL / 2} y={BY0 + WALL / 2} width={BX1 - BX0 - WALL} height={BY1 - BY0 - WALL} rx={20} />
          </clipPath>
        </defs>

        {/* ===================== tabung ===================== */}
        <g transform={`translate(${shift} 0)`} opacity={boxIn}>
          <rect x={BX0} y={BY0} width={BX1 - BX0} height={BY1 - BY0} rx={26} fill="#0c1634" fillOpacity={0.85} />
          <rect x={BX0 + 20} y={BY0 + 20} width={BX1 - BX0 - 40} height={BY1 - BY0 - 40} rx={18} fill="url(#soft-water)" opacity={0.25} />
          {/* pengukur tekanan di atas tabung */}
          <rect x={gx - 7} y={gy + 36} width={14} height={BY0 - gy - 36} fill="#7d8bb5" />
          <circle cx={gx} cy={gy} r={46} fill="#0f1838" stroke="#dfe7ff" strokeWidth={4} />
          {Array.from({length: 9}, (_, i) => {
            const a = ((-120 + i * 30) * Math.PI) / 180;
            return <line key={i} x1={gx + 32 * Math.sin(a)} y1={gy - 32 * Math.cos(a)} x2={gx + 40 * Math.sin(a)} y2={gy - 40 * Math.cos(a)} stroke={C.muted} strokeWidth={2} />;
          })}
          <line x1={gx} y1={gy} x2={gx + 34 * Math.sin(needle)} y2={gy - 34 * Math.cos(needle)} stroke={C.press} strokeWidth={4} strokeLinecap="round" />
          <circle cx={gx} cy={gy} r={6} fill={C.press} />
          <Label x={gx + 64} y={gy} size={26} color={C.press} anchor="start" font="serif" italic weight={700}>
            p
          </Label>
          <Glow x={gx} y={gy} r={90} color="press" opacity={0.5 * pDone} />

          {/* molekul */}
          <g clipPath="url(#gp-box)">
            {mols.map((m) => (
              <N2 key={m.i} x={m.x} y={m.y} rot={m.rot} op={m.i === 0 ? 1 : 0.92} ring={m.i === 0 ? track : 0} />
            ))}
            {/* jejak molekul yang dilacak */}
            <g opacity={track}>
              {trail.map((p, k) => (
                <circle key={k} cx={p.x} cy={p.y} r={8 * (1 - k / 8)} fill={C.gold} opacity={0.35 * (1 - k / 7)} />
              ))}
            </g>
          </g>
          {/* kilatan tumbukan di dinding kanan */}
          <g opacity={hits}>
            {mols.map((m) =>
              m.hit < 0.35 ? (
                <g key={m.i} opacity={1 - m.hit / 0.35}>
                  <ellipse cx={BX1 - WALL / 2} cy={m.y} rx={6 + 20 * (m.hit / 0.35)} ry={14 + 26 * (m.hit / 0.35)} fill="none" stroke={C.press} strokeWidth={3} />
                  <line x1={BX1 + 6} y1={m.y} x2={BX1 + 10 + 34 * (1 - m.hit / 0.35)} y2={m.y} stroke={C.press} strokeWidth={4} strokeLinecap="round" />
                </g>
              ) : null,
            )}
          </g>
          {/* dinding */}
          <rect x={BX0} y={BY0} width={BX1 - BX0} height={BY1 - BY0} rx={26} fill="none" stroke="#9fb0d8" strokeWidth={WALL} />
          <rect x={BX0} y={BY0} width={BX1 - BX0} height={BY1 - BY0} rx={26} fill="none" stroke="#fff" strokeOpacity={0.18} strokeWidth={2} />
          {[0.15, 0.85].map((f) => (
            <circle key={f} cx={BX0 + (BX1 - BX0) * f} cy={BY0} r={4} fill="#dfe7ff" opacity={0.7} />
          ))}
          {/* 1 cm² */}
          <g opacity={patch}>
            <rect x={BX1 - 9} y={600} width={18} height={60} rx={3} fill={C.press} opacity={0.75 + 0.25 * Math.sin(t * 6)} />
            <Label x={BX1 + 22} y={690} size={22} color={C.press} anchor="start" weight={700}>
              1 cm²
            </Label>
          </g>
          {/* panah tekanan ke luar di semua dinding */}
          <g opacity={pressQ}>
            {[0.25, 0.5, 0.75].map((f) => {
              const x = mix(BX0, BX1, f);
              const y = mix(BY0, BY1, f);
              const L = 46 + 6 * Math.sin(t * 3 + f * 9);
              return (
                <g key={f}>
                  <Arrow x1={x} y1={BY0 + 14} x2={x} y2={BY0 - L + 6} color="press" width={5} pulse={false} opacity={f === 0.5 ? 0 : 1} />
                  <Arrow x1={x} y1={BY1 - 14} x2={x} y2={BY1 + L - 6} color="press" width={5} pulse={false} />
                  <Arrow x1={BX0 + 14} y1={y} x2={BX0 - L + 6} y2={y} color="press" width={5} pulse={false} />
                  <Arrow x1={BX1 - 14} y1={y} x2={BX1 + L - 6} y2={y} color="press" width={5} pulse={false} />
                </g>
              );
            })}
          </g>
        </g>

        {/* ===================== kaca pembesar ===================== */}
        <g opacity={zoom * boxIn}>
          <line x1={BX1 + 30} y1={LENS_Y - 40} x2={ZX0} y2={ZY0 + 20} stroke={C.muted} strokeOpacity={0.5} strokeWidth={2} strokeDasharray="5 6" />
          <line x1={BX1 + 30} y1={LENS_Y + 40} x2={ZX0} y2={ZY1 - 20} stroke={C.muted} strokeOpacity={0.5} strokeWidth={2} strokeDasharray="5 6" />
          <circle cx={BX1} cy={LENS_Y} r={52} fill="none" stroke={C.gold} strokeWidth={3} />
          <circle cx={BX1} cy={LENS_Y} r={52} fill={C.gold} opacity={0.05} />
        </g>

        {/* ===================== jendela perbesaran ===================== */}
        <g opacity={Math.max(zoom, plot)}>
          <rect x={ZX0} y={ZY0} width={ZX1 - ZX0} height={ZY1 - ZY0} rx={20} fill="rgba(10,16,36,0.85)" stroke={C.line} strokeWidth={2} />
        </g>
        <g opacity={zoom} clipPath="url(#gp-zoom)">
          <Label x={ZX0 + 28} y={ZY0 + 30} size={20} color={C.muted} anchor="start" weight={600} spacing={2}>
            PERBESAR · SATU MOLEKUL N₂
          </Label>
          {/* dinding besar */}
          <rect x={ZWALL} y={ZY0} width={ZX1 - ZWALL} height={ZY1 - ZY0} fill="#56658f" />
          {Array.from({length: 12}, (_, i) => (
            <line key={i} x1={ZWALL + 8} y1={ZY0 + i * 32} x2={ZWALL + 50} y2={ZY0 + i * 32 + 30} stroke="#3a4770" strokeWidth={3} />
          ))}
          <line x1={ZWALL} y1={ZY0} x2={ZWALL} y2={ZY1} stroke="#dfe7ff" strokeWidth={3} />
          <Label x={ZWALL + 42} y={ZY1 - 26} size={20} color={C.ink}>
            dinding
          </Label>
          {/* tumbukan di dinding */}
          {zhit < 0.5 ? (
            <g opacity={1 - zhit / 0.5}>
              <ellipse cx={ZWALL} cy={ZY} rx={8 + 30 * zhit} ry={30 + 60 * zhit} fill="none" stroke={C.press} strokeWidth={4} />
              <Arrow x1={ZWALL + 6} y1={ZY + 70} x2={ZWALL + 70} y2={ZY + 70} color="force" width={5} pulse={false} />
              <Label x={ZWALL + 40} y={ZY + 102} size={20} color={C.force} font="serif" italic>
                F
              </Label>
            </g>
          ) : null}
          {/* molekul besar + kecepatan */}
          <g opacity={zop}>
            <Glow x={zx} y={ZY} r={70} color="pot" opacity={0.5} />
            <N2 x={zx} y={ZY} rot={20 + t * 40} s={2.6} />
            <Arrow x1={zx - 50} y1={ZY - 64} x2={zx + 50} y2={ZY - 64} color="cyan" width={5} opacity={1 - flip} pulse={false} />
            <Arrow x1={zx + 50} y1={ZY - 64} x2={zx - 50} y2={ZY - 64} color="cyan" width={5} opacity={flip} pulse={false} />
            <Label x={zx} y={ZY - 94} size={22} color={C.cyan} font="serif" italic weight={600}>
              v
            </Label>
          </g>
          {/* neraca momentum */}
          <g opacity={dpRows}>
            <Label x={ZX0 + 34} y={300} size={22} color={C.muted} anchor="start">
              sebelum
            </Label>
            <Arrow x1={1170} y1={300} x2={1270} y2={300} color="spr" width={6} pulse={false} />
            <Label x={1290} y={300} size={24} color={C.spr} anchor="start" font="serif" italic weight={600}>
              +mv
            </Label>
            <Label x={ZX0 + 34} y={360} size={22} color={C.muted} anchor="start">
              sesudah
            </Label>
            <Arrow x1={1270} y1={360} x2={1170} y2={360} color="spr" width={6} pulse={false} />
            <Label x={1290} y={360} size={24} color={C.spr} anchor="start" font="serif" italic weight={600}>
              −mv
            </Label>
          </g>
          <g opacity={dp2} transform={`translate(1200 446) scale(${mix(1, 0.25, small)}) translate(-1200 -446)`}>
            <Arrow x1={1300} y1={446} x2={1100} y2={446} color="work" width={7} />
            <Label x={1200} y={480} size={24} color={C.work} font="serif" italic weight={700}>
              Δp = 2mv
            </Label>
          </g>
          <g opacity={small}>
            <Label x={1200} y={410} size={22} color={C.gold} weight={600}>
              sangat kecil!
            </Label>
          </g>
          <g opacity={lblN}>
            <Label x={1560} y={ZY1 - 30} size={22} color="#a9c0ff" weight={600}>
              m ≈ 4,65×10⁻²⁶ kg
            </Label>
          </g>
          <g opacity={lblV}>
            <Label x={1560} y={ZY0 + 34} size={22} color={C.cyan} weight={600}>
              v ≈ 500 m/s (suhu kamar)
            </Label>
          </g>
        </g>

        {/* ===================== grafik gaya pada 1 cm² ===================== */}
        <g opacity={plot}>
          <Label x={ZX0 + 28} y={ZY0 + 30} size={20} color={C.muted} anchor="start" weight={600} spacing={2}>
            GAYA PADA 1 cm² DINDING
          </Label>
          <line x1={GX0 - 10} y1={GY} x2={GX1 + 16} y2={GY} stroke={C.muted} strokeWidth={2} markerEnd="url(#arrow-muted)" />
          <line x1={GX0 - 10} y1={GY} x2={GX0 - 10} y2={ZY0 + 60} stroke={C.muted} strokeWidth={2} markerEnd="url(#arrow-muted)" />
          <Label x={GX1 + 4} y={GY + 22} size={20} color={C.muted} font="serif" italic>
            t
          </Label>
          <Label x={GX0 - 32} y={ZY0 + 70} size={22} color={C.force} font="serif" italic>
            F
          </Label>
          <path d={spikes} stroke={C.force} strokeWidth={2.4} strokeOpacity={mix(0.9, 0.4, ramp(nbar, 3, 60))} fill="none" />
          <line x1={GX0} y1={avgY} x2={GX1} y2={avgY} stroke="#070b18" strokeWidth={9} strokeOpacity={0.6} />
          <line x1={GX0} y1={avgY} x2={GX1} y2={avgY} stroke={C.press} strokeWidth={5} strokeDasharray="14 8" strokeDashoffset={-t * 30} />
          <g opacity={1 - ramp(nbar, 1.5, 6)}>
            <Label x={1300} y={ZY0 + 80} size={22} color={C.force}>
              satu lonjakan = satu tumbukan
            </Label>
          </g>
          <g opacity={avgLbl}>
            <Label x={GX0 + 140} y={avgY - 70} size={24} color={C.press} weight={700}>
              rata-rata: gaya tetap F
            </Label>
          </g>
        </g>
        <Ripple x={gx + shift} y={gy} p={ramp(t, wordOf(5, 'tekanan') - 0.1, wordOf(5, 'tekanan') + 1.3, (q) => q)} r={120} color="press" />
        <Motes x={505 + shift} y={580} rx={360} ry={260} n={14} color="cyan" opacity={0.25 * boxIn} seed={5} />
        <Twinkles x={1415} y={720} rx={300} ry={50} n={5} color="press" opacity={pDone} seed={4} />
      </Stage>

      {/* ===================== kartu (satu per momen) ===================== */}
      <Formula x={1415} y={720} p={slot(t, cue(2) + 0.4, wordOf(3, 'pantulannya'))} accent={C.work} size={56} caption="besarnya dua kali mv">
        <Tint c={C.work}>Δ<V>p</V></Tint> = (−<V>mv</V>) − (+<V>mv</V>) = <Tint c={C.work}>−2<V>mv</V></Tint>
      </Formula>
      <Formula x={1415} y={720} p={slot(t, wordOf(3, 'pantulannya'), wordOf(4, 'tetapi') + 0.2)} accent={C.work} size={56} caption="2 × 4,65×10⁻²⁶ kg × 500 m/s ≈ 4,7×10⁻²³">
        2<V>mv</V> ≈ <Tint c={C.work}>5×10<Sup>−23</Sup> kg·m/s</Tint>
      </Formula>
      <Card x={1415} y={712} opacity={slot(t, wordOf(4, 'tetapi') + 0.3, cue(5) + 0.3)} accent={C.press} style={{padding: '16px 32px'}}>
        <div style={{fontFamily: FONT.head, fontSize: 24, color: C.muted, textAlign: 'center', letterSpacing: 1}}>tumbukan pada 1 cm² dinding dalam 1 detik</div>
        <div style={{fontFamily: FONT.mono, fontSize: 38, color: C.press, textAlign: 'center', marginTop: 6, fontWeight: 600, minWidth: 740}}>
          {counterText(mix(0, 23.48, cnt), cntDone, t)}
        </div>
        <div style={{fontFamily: FONT.head, fontSize: 24, color: C.ink, textAlign: 'center', marginTop: 6, opacity: ramp(cnt, 0.85, 1)}}>
          ≈ 3×10<Sup>23</Sup> · orde triliun × triliun
        </div>
      </Card>
      <Formula x={1415} y={724} p={ramp(t, cue(5) + 0.4, cue(5) + 1.0)} accent={C.press} size={56} caption="jumlah impuls ÷ (waktu × luas)">
        <Tint c={C.press}><V>p</V></Tint> = <Frac n={<V>F</V>} d={<V>A</V>} /> = <Frac n={<>Σ<Tint c={C.work}>Δ<V>p</V></Tint></>} d={<>Δ<V>t</V> · <V>A</V></>} />
      </Formula>
    </AbsoluteFill>
  );
};
