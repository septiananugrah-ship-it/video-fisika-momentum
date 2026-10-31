import React from 'react';
import {AbsoluteFill, interpolateColors} from 'remotion';
import {BACK, EASE_IN_OUT, cyc, mix, ramp, rand} from '../anim';
import {HeatShimmer} from '../components/physics';
import {Arrow, Formula, Frac, Glow, Label, Motes, Note, Ripple, Stage, Sub, V} from '../components/primitives';
import {useScene} from '../SceneContext';
import {C, FONT} from '../theme';

// Keselamatan berkendara (Δt ↑ → F ↓, Δp sama):
//  baris 0: mobil modern menabrak dinding (gerak lambat), zona remuk terlipat seperti akordeon.
//  baris 1: diulang sambil kurva F–t tergambar: rendah & lebar. Kartu F = Δp/Δt.
//  baris 2: mobil kaku di lajur bawah: berhenti mendadak, kurva tinggi & sempit, luas sama (= Δp).
//  baris 3: kamera masuk ke kabin: sabuk menahan tubuh (v tubuh = v mobil), kantong udara mengembang,
//           kepala tenggelam pelan (bidang tekan luas, Δt kepala lama).
//  baris 4: penampang helm jatuh ke jalan: busa EPS remuk perlahan.
// Gerak kabin setelah kontak memakai profil gaya sin² (F₁Δt₁ = F₂Δt₂ karena v₀ dan m sama).

const XB = 1080; // muka dinding
const LC = 250; // panjang bagian kaku (kabin + bagasi)
const VCAR = 110; // px/dtk (gerak lambat)
const DA = 1.6; // lama tumbukan mobil berzona remuk (dtk visual)
const DB = 0.32; // lama tumbukan mobil kaku (5× lebih singkat)
const LZA = 96;
const LZB = 26;
const GA = 500; // lantai lajur A
const GB = 800; // lantai lajur B

const cl = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const stopFrac = (s: number, D: number) => {
  const u = cl(s / D);
  return u - Math.sin(2 * Math.PI * u) / (2 * Math.PI);
};
const stopDist = (s: number, D: number, V: number) => {
  const x = cl(s, 0, D);
  return V * (x - (x * x) / (2 * D) + (D * (1 - Math.cos((2 * Math.PI * x) / D))) / (4 * Math.PI ** 2));
};
const stopAcc = (s: number, D: number, V: number) => (s <= 0 || s >= D ? 0 : ((2 * V) / D) * Math.sin((Math.PI * s) / D) ** 2);

type Run = {xr: number; c: number; v: number; a: number; tau: number};
const runAt = (t: number, tc: number, D: number, LZ: number): Run => {
  const tau = t - tc;
  const c = stopDist(tau, D, VCAR);
  const xf = tau < 0 ? XB + VCAR * tau : XB;
  return {xr: xf - (LZ - c) - LC, c, v: tau < 0 ? VCAR : VCAR * (1 - stopFrac(tau, D)), a: stopAcc(tau, D, VCAR), tau};
};

/* ------------------------------------------------------------------ */
/* Mobil tampak samping dengan zona remuk berlipat (akordeon)           */
/* ------------------------------------------------------------------ */
const CrashCar: React.FC<{run: Run; g: number; LZ: number; zoneHi: number; lean: number; opacity: number; t: number; hazard: number; shake?: number; tint: string; rigid?: boolean}> = ({
  run,
  g,
  LZ,
  zoneHi,
  lean,
  opacity,
  t,
  hazard,
  shake = 0,
  tint,
  rigid,
}) => {
  if (opacity <= 0.001) return null;
  const {xr, c} = run;
  const L = LZ - c;
  const s = LZ / 8;
  const h = L / 8;
  const amp = Math.min(13, Math.sqrt(Math.max(0, s * s - h * h)));
  const top: string[] = [];
  const bot: string[] = [];
  const folds: number[] = [];
  for (let i = 0; i <= 8; i++) {
    const x = LC + i * h;
    const yb = mix(-100, -90, i / 8);
    top.push(`${x.toFixed(1)},${(yb - (i % 2 ? amp : 0)).toFixed(1)}`);
    bot.push(`${x.toFixed(1)},${(-34 - (i % 2 ? amp * 0.7 : 0)).toFixed(1)}`);
    if (i % 2 && i < 8) folds.push(x);
  }
  const zoneD = `M${top.join(' L')} L${(LC + L).toFixed(1)},-34 L${bot.reverse().join(' L')} Z`;
  const wheel = ((xr / 26) * 180) / Math.PI;
  const hz = hazard * (0.5 + 0.5 * Math.sin(t * 6.5));
  return (
    <g opacity={opacity} transform={`translate(${(xr + shake).toFixed(1)} ${g})`}>
      <ellipse cx={(LC + L) / 2} cy={4} rx={(LC + L) / 2 + 20} ry={9} fill="#000" opacity={0.35} />
      {/* bagian kaku */}
      <path d={`M0,-34 L0,-84 Q4,-96 20,-98 L62,-100 L92,-142 Q98,-148 108,-148 L190,-148 Q200,-148 206,-140 L${LC},-100 L${LC},-34 Z`} fill="#16224a" stroke={tint} strokeWidth={3.5} strokeLinejoin="round" />
      <path d="M72,-102 L97,-136 L138,-136 L138,-102 Z" fill={tint} opacity={0.22} />
      <path d="M150,-102 L150,-136 L190,-136 Q197,-136 201,-130 L226,-102 Z" fill={tint} opacity={0.22} />
      <line x1={144} y1={-100} x2={144} y2={-40} stroke={tint} strokeOpacity={0.35} strokeWidth={2} />
      {rigid ? (
        <path d={`M8,-90 L136,-40 M8,-40 L136,-90 M152,-90 L${LC - 6},-40 M152,-40 L${LC - 6},-90 M4,-65 L${LC},-65`} stroke={tint} strokeOpacity={0.45} strokeWidth={3} fill="none" />
      ) : null}
      {/* penumpang */}
      <line x1={172} y1={-96} x2={176 + lean * 0.8} y2={-112} stroke="#c9d2ee" strokeWidth={9} strokeLinecap="round" />
      <circle cx={180 + lean} cy={-122} r={10} fill="#c9d2ee" />
      {/* zona depan */}
      <path d={zoneD} fill="#16224a" stroke={tint} strokeWidth={3.5} strokeLinejoin="round" />
      <path d={zoneD} fill={C.force} opacity={0.2 * zoneHi} />
      {folds.map((x, i) => (
        <line key={i} x1={x} y1={-92} x2={x} y2={-40} stroke={C.force} strokeOpacity={0.55 * zoneHi * cl(c / 20)} strokeWidth={2} strokeDasharray="4 4" />
      ))}
      <rect x={LC + L - 9} y={-82} width={9} height={11} rx={3} fill={C.gold} opacity={0.6 + 0.4 * hz} />
      <rect x={-3} y={-82} width={8} height={12} rx={3} fill={C.heat} opacity={0.5 + 0.5 * hz} />
      {hazard > 0.01 ? (
        <>
          <circle cx={LC + L - 4} cy={-76} r={26} fill="url(#soft-gold)" opacity={hz} />
          <circle cx={0} cy={-76} r={26} fill="url(#soft-kin)" opacity={hz} />
        </>
      ) : null}
      {[50, LC - 34].map((wx) => (
        <g key={wx} transform={`translate(${wx} -26) rotate(${wheel.toFixed(1)})`}>
          <circle r={26} fill="#0b1022" stroke={C.muted} strokeWidth={4} />
          <circle r={10} fill="#2a355e" />
          <line x1={-22} y1={0} x2={22} y2={0} stroke={C.muted} strokeWidth={3} />
          <line x1={0} y1={-22} x2={0} y2={22} stroke={C.muted} strokeWidth={3} />
        </g>
      ))}
    </g>
  );
};

/** Dinding beton penahan. */
const Barrier: React.FC<{g: number; t: number; shake: number; crack: number}> = ({g, shake, crack}) => (
  <g transform={`translate(${shake.toFixed(1)} 0)`}>
    <rect x={XB} y={g - 196} width={72} height={196} rx={4} fill="#26305a" stroke="#8fa0d0" strokeWidth={3} />
    {Array.from({length: 7}, (_, k) => (
      <line key={k} x1={XB + 4} y1={g - 180 + k * 26} x2={XB + 68} y2={g - 196 + k * 26} stroke="#3a4a7a" strokeWidth={2} />
    ))}
    <rect x={XB} y={g - 196} width={8} height={196} fill={C.force} opacity={0.5} />
    <path d={`M${XB + 2},${g - 74} l18,-12 l-6,-14 l22,-10 M${XB + 2},${g - 66} l20,10 l-4,16 l18,8`} fill="none" stroke="#c9d2ee" strokeWidth={2} opacity={crack} />
  </g>
);

/** Serpihan + kilatan saat kontak. */
const Debris: React.FC<{x: number; y: number; tau: number; n: number; power: number; seed: number}> = ({x, y, tau, n, power, seed}) => {
  if (tau <= 0 || tau > 1.6) return null;
  return (
    <g>
      {Array.from({length: n}, (_, k) => {
        const ang = Math.PI * (0.55 + 0.6 * rand(k + seed)); // ke kiri-atas
        const sp = power * (90 + 120 * rand(k * 3 + seed));
        const px = x + Math.cos(ang) * sp * tau * 0.9;
        const py = y - Math.sin(ang) * sp * tau + 260 * tau * tau;
        const op = (1 - tau / 1.6) * Math.min(1, tau * 12);
        return <rect key={k} x={px - 3} y={py - 2} width={6 + 4 * rand(k)} height={4} fill={k % 3 ? '#c9d2ee' : C.force} opacity={op} transform={`rotate(${(tau * 400 + k * 40) % 360} ${px} ${py})`} />;
      })}
      <circle cx={x} cy={y} r={60 * power} fill="url(#soft-white)" opacity={Math.max(0, 1 - tau * 4)} />
    </g>
  );
};

/** Uap tipis dari zona remuk yang rusak. */
const Steam: React.FC<{x: number; y: number; t: number; op: number}> = ({x, y, t, op}) => {
  if (op <= 0.01) return null;
  return (
    <g>
      {Array.from({length: 6}, (_, k) => {
        const ph = (((t * 0.35 + k / 6) % 1) + 1) % 1;
        const xx = x + 10 * Math.sin(t * 1.3 + k * 2) + ph * 26 * (k % 2 ? 1 : -1);
        const yy = y - ph * 110;
        return <circle key={k} cx={xx} cy={yy} r={8 + ph * 22} fill="#c9d2ee" opacity={cyc(ph) * 0.18 * op} />;
      })}
    </g>
  );
};

/* ------------------------------------------------------------------ */
/* Kabin dari dalam (baris 3)                                           */
/* ------------------------------------------------------------------ */
const rot = (vx: number, vy: number, deg: number): [number, number] => {
  const a = (deg * Math.PI) / 180;
  return [vx * Math.cos(a) - vy * Math.sin(a), vx * Math.sin(a) + vy * Math.cos(a)];
};

const Limb: React.FC<{pts: [number, number][]; w: number; color?: string}> = ({pts, w, color = '#b9c4e6'}) => {
  const d = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  return (
    <g>
      <path d={d} fill="none" stroke="#0a1024" strokeWidth={w + 6} strokeLinecap="round" strokeLinejoin="round" />
      <path d={d} fill="none" stroke={color} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" />
    </g>
  );
};

export const Crash: React.FC = () => {
  const {t, cue, wordOf} = useScene();

  /* ---------- waktu ---------- */
  const tA1 = wordOf(0, 'penyok');
  const tA2 = Math.max(tA1 + DA + 2.2, wordOf(1, 'memperpanjang'));
  const tB = Math.max(cue(2) + 1.6, wordOf(2, 'singkat'));
  const zoneHi = ramp(t, wordOf(0, 'mudah') - 0.3, wordOf(0, 'mudah') + 0.5);
  const zoneLbl = ramp(t, wordOf(0, 'zona') - 0.2, wordOf(0, 'zona') + 0.5, BACK);

  const runA1 = runAt(t, tA1, DA, LZA);
  const runA2 = runAt(t, tA2, DA, LZA);
  const runB = runAt(t, tB, DB, LZB);
  const opA1 = ramp(t, -0.6, 0.3) * (1 - ramp(t, tA2 - 1.6, tA2 - 1.1, EASE_IN_OUT));
  const opA2 = ramp(t, tA2 - 1.6, tA2 - 1.1);
  const opB = ramp(t, cue(2) - 0.6, cue(2) + 0.2);
  const runA = opA2 > 0.001 ? runA2 : runA1;

  /* ---------- kamera kiri ---------- */
  const k1 = ramp(t, cue(1) - 1.1, cue(1) + 0.2, EASE_IN_OUT);
  const k2 = ramp(t, cue(2) - 0.9, cue(2) + 0.5, EASE_IN_OUT);
  const s = mix(mix(1.3, 1.25, k1), 1, k2);
  const tx = mix(mix(-45, -257, k1), 0, k2);
  const ty = mix(mix(30, 55, k1), 0, k2);
  const k3 = ramp(t, cue(3) - 0.8, cue(3) + 0.4, EASE_IN_OUT);
  const crashOp = 1 - k3;
  const zx = 972;
  const zy = 380;
  const zs = 1 + 1.6 * k3;

  /* ---------- tumbukan: efek ---------- */
  const shakeB = runB.tau > 0 ? 7 * Math.exp(-runB.tau * 5) * Math.sin(runB.tau * 38) : 0;
  const leanA = Math.min(16, runA.a * 0.03);
  const leanB = Math.min(18, runB.a * 0.026) + (runB.tau > 0 ? 6 * Math.exp(-runB.tau * 3) * Math.sin(runB.tau * 14) : 0);
  const hazA = ramp(t, tA1 + DA, tA1 + DA + 0.6);
  const hazB = ramp(t, tB + 0.5, tB + 1.1);

  /* ---------- grafik F–t ---------- */
  const plotOp = ramp(t, cue(1) - 0.2, cue(1) + 0.6) * crashOp;
  const PX0 = 1280;
  const PY0 = 800;
  const TS = 250; // px per dtk visual
  const FS = 360 / ((2 * VCAR) / DB); // px per satuan percepatan
  const curve = (tau: number, D: number) => {
    const end = cl(tau, 0, 2);
    if (end <= 0) return {d: '', fill: '', pen: null as null | [number, number]};
    const n = 60;
    const pts: [number, number][] = [];
    for (let i = 0; i <= n; i++) {
      const tt = (end * i) / n;
      pts.push([PX0 + tt * TS, PY0 - stopAcc(tt, D, VCAR) * FS]);
    }
    const d = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
    return {d, fill: `${d} L${pts[n][0].toFixed(1)},${PY0} L${PX0},${PY0} Z`, pen: pts[n]};
  };
  const cA = curve(runA2.tau, DA);
  const cB = curve(runB.tau, DB);
  const lblA = ramp(t, tA2 + DA * 0.6, tA2 + DA + 0.3);
  const lblB = ramp(t, tB + 0.4, tB + 1.0);
  const areaHl = ramp(t, wordOf(2, 'besar') - 0.2, wordOf(2, 'besar') + 0.5);
  const tGaya = wordOf(1, 'gaya');
  const tGayanya = wordOf(2, 'gayanya');
  const f1 = ramp(t, tGaya - 0.3, tGaya + 0.5) * (1 - ramp(t, tGayanya - 0.6, tGayanya - 0.1, EASE_IN_OUT));
  const f2 = ramp(t, tGayanya - 0.1, tGayanya + 0.6) * (1 - ramp(t, cue(3) - 0.9, cue(3) - 0.3, EASE_IN_OUT));

  /* ---------- kabin (baris 3) ---------- */
  const kIn = ramp(t, cue(3) - 0.3, cue(3) + 0.7, EASE_IN_OUT);
  const kOc = ramp(t, cue(4) - 0.6, cue(4) + 0.6, EASE_IN_OUT);
  const ocS = mix(1.3, 1, kIn) * mix(1, 0.62, kOc);
  const ocX = mix(960, 560, kOc);
  const ocY = mix(540, 540, kOc);
  const panelsOp = 1 - ramp(t, cue(4) - 0.6, cue(4) - 0.1, EASE_IN_OUT);
  const tD0 = wordOf(3, 'menahan');
  const DOC = 3.6;
  const V0 = 320; // px/dtk tiang di luar jendela
  const vFrac = (tt: number) => (tt < 0 ? 1 : 1 - stopFrac(tt, DOC));
  const vCar = vFrac(t - tD0);
  const vBody = vFrac(t - tD0 - 0.12);
  const postOff = V0 * (t - cue(3) + 1) - (t > tD0 ? V0 * (t - tD0) - stopDist(t - tD0, DOC, V0) : 0);
  const beltHl = ramp(t, wordOf(3, 'Sabuk') - 0.2, wordOf(3, 'Sabuk') + 0.4) * (1 - 0.6 * ramp(t, wordOf(3, 'kantong') - 0.2, wordOf(3, 'kantong') + 0.6));
  const together = ramp(t, wordOf(3, 'ikut') - 0.3, wordOf(3, 'ikut') + 0.4);
  const tBag = wordOf(3, 'kantong');
  const bag = ramp(t, tBag - 0.1, tBag + 0.45, BACK);
  const tHead = wordOf(3, 'memperlama') - 0.2;
  const sink = ramp(t, tHead, tHead + 2.2, EASE_IN_OUT);
  const lurch = ramp(t, tD0, tD0 + 1.0);
  const wide = ramp(t, wordOf(3, 'memperluas') - 0.2, wordOf(3, 'memperluas') + 0.5);
  const headPanel = ramp(t, tHead - 0.1, tHead + 0.6);
  const phi = 7 * lurch + 5 * sink;
  const pitch = 15 * sink;
  const dxBody = 10 * lurch + 4 * sink;
  const hip: [number, number] = [660 + dxBody * 0.6, 630];
  const tv = rot(30, -200, phi);
  const sh: [number, number] = [hip[0] + tv[0] + dxBody * 0.4, hip[1] + tv[1]];
  const hv = rot(26, -62, phi + pitch);
  const head: [number, number] = [sh[0] + hv[0], sh[1] + hv[1]];
  const knee: [number, number] = [900, 612];
  const foot: [number, number] = [1010, 784];
  const wheelC: [number, number] = [1050, 490];
  const elbow: [number, number] = [mix(840, 860, lurch), mix(530, 540, lurch)];
  const hand: [number, number] = [1030, 500];
  const deflate = ramp(t, tHead + 2.0, tHead + 6, EASE_IN_OUT);
  const bagC: [number, number] = [mix(wheelC[0], 905, bag), mix(wheelC[1], 420, bag)];
  const bagRx = 105 * bag * (1 - 0.12 * deflate) * (1 + 0.015 * Math.sin(t * 5));
  const bagRy = 92 * bag * (1 - 0.1 * deflate) * (1 + 0.015 * Math.sin(t * 5 + 1));
  const beltF = runAt(t, tD0, DOC, 0).a;

  /* ---------- helm (baris 4) ---------- */
  const tI = Math.max(cue(4) + 2.0, wordOf(4, 'remuk'));
  const VH = 90;
  const DH = 0.8;
  const ROAD = 760;
  const HX = 1380;
  const TF = 1.9; // jatuh dari diam: 86 px dalam 1,9 dtk → 90 px/dtk saat menyentuh jalan
  const tFall = tI - TF;
  const helmOp = ramp(t, cue(4) - 0.3, cue(4) + 0.5);
  const Y0 = ROAD - 174 - 0.5 * VH * TF;
  const Yh = t < tFall ? Y0 - 8 * Math.sin((t - tFall) * 1.6) * ramp(tFall - t, 0, 0.8) : t < tI ? Y0 + 0.5 * (VH / TF) * (t - tFall) ** 2 : ROAD - 174;
  const dHead = stopDist(t - tI, DH, VH);
  const vHead = t < tFall ? 0 : t < tI ? (VH * (t - tFall)) / TF : VH * (1 - stopFrac(t - tI, DH));
  const aHead = stopAcc(t - tI, DH, VH);
  const helmLbl = ramp(t, cue(4) + 0.3, cue(4) + 1.0);
  const helmNote = ramp(t, wordOf(4, 'memperlama') - 0.3, wordOf(4, 'memperlama') + 0.5);
  const OPEN = 172; // arah lubang leher (derajat, layar)
  const inOpen = (deg: number) => Math.abs(((deg - OPEN + 540) % 360) - 180) < 30;
  const beads: React.ReactNode[] = [];
  if (helmOp > 0.001) {
    for (let ring = 0; ring < 4; ring++) {
      const u = 0.14 + ring * 0.25;
      for (let k = 0; k < 36; k++) {
        const deg = k * 10 + (ring % 2) * 5;
        if (inOpen(deg)) continue;
        const a = (deg * Math.PI) / 180;
        const down = Math.max(0, Math.sin(a));
        const rIn = 110 + dHead * down;
        const T = 160 - rIn;
        const sq = T / 50;
        const r = rIn + u * T;
        const bx = HX + Math.cos(a) * r;
        const by = Yh + Math.sin(a) * r;
        const col = interpolateColors(1 - sq, [0, 0.6], ['#dfe6fb', C.heat]);
        beads.push(<ellipse key={`${ring}-${k}`} cx={bx} cy={by} rx={5.5 * (0.45 + 0.55 * sq)} ry={6.5 * (1 + 0.35 * (1 - sq))} fill={col} opacity={0.8} transform={`rotate(${deg} ${bx.toFixed(1)} ${by.toFixed(1)})`} />);
      }
    }
  }
  const arcPts = (r: number, from: number, to: number, cy: number) => {
    const pts: string[] = [];
    for (let i = 0; i <= 40; i++) {
      const a = ((from + ((to - from) * i) / 40) * Math.PI) / 180;
      pts.push(`${(HX + Math.cos(a) * r).toFixed(1)},${(cy + Math.sin(a) * r).toFixed(1)}`);
    }
    return `M${pts.join(' L')}`;
  };
  const shellD = arcPts(167, OPEN + 32, OPEN + 328, Yh);
  const foamD = arcPts(135, OPEN + 32, OPEN + 328, Yh);

  /* ---------- render ---------- */
  const laneLbl = ramp(t, cue(2) - 0.2, cue(2) + 0.6);
  const slow = ramp(t, 0.2, 1.0) * (1 - ramp(t, cue(3) - 1.0, cue(3) - 0.4, EASE_IN_OUT));

  const lane = (run: Run, g: number, LZ: number, op: number, lean: number, hz: number, zh: number, shake: number, tint: string, seed: number, power: number) => {
    if (op <= 0.001) return null;
    const pLen = run.v * 1.2;
    const fLen = run.a * (250 / ((2 * VCAR) / DB));
    const cx = run.xr + LC / 2 + shake;
    return (
      <g opacity={op}>
        {pLen > 4 ? <Arrow x1={cx} y1={g - 178} x2={cx + pLen} y2={g - 178} color="spr" width={6} /> : null}
        <Label x={cx + pLen + 26} y={g - 178} size={28} font="serif" italic color={C.spr} opacity={cl(pLen / 30)}>
          p
        </Label>
        {fLen > 6 ? <Arrow x1={XB - 8} y1={g - 220} x2={XB - 8 - fLen} y2={g - 220} color="force" width={7} pulse={false} /> : null}
        <Label x={XB - 8 - fLen - 26} y={g - 220} size={28} font="serif" italic color={C.force} opacity={cl(fLen / 20)}>
          F
        </Label>
        <CrashCar run={run} g={g} LZ={LZ} zoneHi={zh} lean={lean} opacity={1} t={t} hazard={hz} shake={shake} tint={tint} rigid={power > 1} />
        <Debris x={XB} y={g - 70} tau={run.tau} n={power > 1 ? 12 : 7} power={power} seed={seed} />
        <Ripple x={XB} y={g - 70} p={run.tau / 1.1} r={130 * power} color={power > 1 ? 'heat' : 'force'} rings={3} />
        {/* garis gerak di belakang mobil */}
        {run.v > 20
          ? [0, 1, 2].map((k) => (
              <line key={k} x1={run.xr - 20 - 30 * k} y1={g - 60 - k * 22} x2={run.xr - 80 - 50 * k} y2={g - 60 - k * 22} stroke="#cfeaff" strokeWidth={2.5} strokeLinecap="round" opacity={(0.18 + 0.12 * Math.sin(t * 7 + k)) * (run.v / VCAR)} />
            ))
          : null}
      </g>
    );
  };

  return (
    <AbsoluteFill>
      <Stage>
        {/* ======== bagian 1: dua lajur tabrakan ======== */}
        {crashOp > 0.001 ? (
          <g opacity={crashOp} transform={`translate(${zx} ${zy}) scale(${zs}) translate(${-zx} ${-zy})`}>
            <g transform={`translate(${tx.toFixed(1)} ${ty.toFixed(1)}) scale(${s.toFixed(4)})`}>
              <Motes x={620} y={GA - 120} rx={520} ry={140} n={22} color="cyan" opacity={0.35} seed={3} />
              {/* lajur A */}
              <rect x={60} y={GA} width={1100} height={36} fill="url(#ground)" />
              <line x1={60} y1={GA} x2={XB} y2={GA} stroke="#3a4a7a" strokeWidth={3} />
              {Array.from({length: 9}, (_, k) => (
                <line key={k} x1={100 + k * 115} y1={GA + 16} x2={150 + k * 115} y2={GA + 16} stroke="#3a4a7a" strokeWidth={4} opacity={0.7} />
              ))}
              <Barrier g={GA} t={t} shake={0} crack={ramp(t, tA1, tA1 + 0.4)} />
              <Glow x={XB} y={GA - 90} r={200} color="force" opacity={0.35 * zoneHi} />
              {lane(runA1, GA, LZA, opA1, Math.min(16, runA1.a * 0.03), hazA, zoneHi, 0, '#9fb2e8', 1, 1)}
              {lane(runA2, GA, LZA, opA2, leanA, ramp(t, tA2 + DA, tA2 + DA + 0.6), zoneHi, 0, '#9fb2e8', 5, 1)}
              <Steam x={XB - 40} y={GA - 100} t={t} op={ramp(t, tA1 + DA * 0.7, tA1 + DA + 0.5) * (1 - ramp(t, tA2 - 1.6, tA2 - 1.1)) + ramp(t, tA2 + DA * 0.7, tA2 + DA + 0.5)} />
              <HeatShimmer x1={XB - 90} x2={XB - 4} y={GA - 96} t={t} amount={0.6 * (ramp(t, tA2 + 0.3, tA2 + DA) + ramp(t, tA1 + 0.3, tA1 + DA) * (1 - ramp(t, tA2 - 1.6, tA2 - 1.1)))} />
              {/* label zona remuk */}
              <g opacity={zoneLbl * (1 - ramp(t, cue(2) - 0.5, cue(2), EASE_IN_OUT))}>
                <path d={`M${XB - 96},${GA - 262} L${XB - 96},${GA - 250} L${XB - 2},${GA - 250} L${XB - 2},${GA - 262}`} fill="none" stroke={C.force} strokeWidth={3} />
                <line x1={XB - 49} y1={GA - 250} x2={XB - 49} y2={GA - 112} stroke={C.force} strokeWidth={2} strokeDasharray="5 6" strokeDashoffset={-t * 18} />
                <Label x={XB - 49} y={GA - 290} size={34} color={C.force} weight={700}>
                  zona remuk
                </Label>
              </g>
              <Label x={110} y={GA - 222} size={26} color="#9fb2e8" anchor="start" weight={600} opacity={laneLbl}>
                dengan zona remuk
              </Label>
              {/* lajur B */}
              <g opacity={opB}>
                <rect x={60} y={GB} width={1100} height={36} fill="url(#ground)" />
                <line x1={60} y1={GB} x2={XB} y2={GB} stroke="#3a4a7a" strokeWidth={3} />
                {Array.from({length: 9}, (_, k) => (
                  <line key={k} x1={100 + k * 115} y1={GB + 16} x2={150 + k * 115} y2={GB + 16} stroke="#3a4a7a" strokeWidth={4} opacity={0.7} />
                ))}
                <Barrier g={GB} t={t} shake={shakeB * 0.4} crack={ramp(t, tB, tB + 0.2)} />
                <Glow x={XB} y={GB - 90} r={220} color="heat" opacity={0.5 * Math.max(0, 1 - Math.abs(runB.tau - 0.15) * 2)} />
                {lane(runB, GB, LZB, 1, leanB, hazB, 0, shakeB, '#eaa6b0', 9, 1.5)}
                <Label x={110} y={GB - 222} size={26} color="#eaa6b0" anchor="start" weight={600} opacity={laneLbl}>
                  mobil kaku
                </Label>
              </g>
            </g>
          </g>
        ) : null}

        <g opacity={slow}>
          <circle cx={104} cy={868} r={8} fill={C.heat} opacity={0.5 + 0.5 * Math.sin(t * 4)} />
          <Label x={122} y={868} size={22} color={C.muted} anchor="start" font="mono">
            gerak lambat
          </Label>
        </g>
        {/* grafik F–t */}
        {plotOp > 0.001 ? (
          <g opacity={plotOp}>
            <rect x={1220} y={410} width={620} height={455} rx={18} fill="rgba(10,16,36,0.6)" stroke={C.line} strokeWidth={2} />
            {[0.25, 0.5, 0.75].map((f) => (
              <line key={f} x1={PX0} y1={PY0 - 360 * f} x2={1790} y2={PY0 - 360 * f} stroke={C.line} strokeWidth={1.5} strokeDasharray="4 8" />
            ))}
            <line x1={PX0} y1={PY0} x2={1800} y2={PY0} stroke={C.muted} strokeWidth={3} markerEnd="url(#arrow-muted)" />
            <line x1={PX0} y1={PY0 + 8} x2={PX0} y2={430} stroke={C.muted} strokeWidth={3} markerEnd="url(#arrow-muted)" />
            <Label x={PX0 + 22} y={438} size={28} font="serif" italic color={C.force} anchor="start">
              F
            </Label>
            <Label x={1806} y={PY0 + 30} size={28} font="serif" italic color={C.ink} anchor="end">
              t
            </Label>
            {cA.d ? (
              <g>
                <path d={cA.fill} fill={C.work} opacity={0.22 + 0.18 * areaHl} />
                <path d={cA.d} fill="none" stroke={C.force} strokeWidth={4} strokeLinejoin="round" />
              </g>
            ) : null}
            {cB.d ? (
              <g>
                <path d={cB.fill} fill={C.heat} opacity={0.22 + 0.18 * areaHl} />
                <path d={cB.d} fill="none" stroke={C.heat} strokeWidth={4} strokeLinejoin="round" />
              </g>
            ) : null}
            {cA.pen && runA2.tau < DA + 0.2 ? <circle cx={cA.pen[0]} cy={cA.pen[1]} r={7} fill="#fff" opacity={0.9} /> : null}
            {cB.pen && runB.tau < DB + 0.3 ? <circle cx={cB.pen[0]} cy={cB.pen[1]} r={7} fill="#fff" opacity={0.9} /> : null}
            <Label x={PX0 + 210} y={PY0 - 24} size={22} color={C.work} weight={600} opacity={lblA}>
              Δt panjang
            </Label>
            <Label x={PX0 + 210} y={PY0 - 106} size={24} color="#9fb2e8" weight={600} opacity={lblA}>
              zona remuk: F kecil
            </Label>
            <g opacity={lblB}>
              <Label x={PX0 + 104} y={470} size={24} color={C.heat} weight={600} anchor="start">
                kaku: F besar
              </Label>
              <Label x={PX0 + 104} y={502} size={22} color={C.heat} anchor="start">
                Δt singkat
              </Label>
            </g>
            <g opacity={areaHl}>
              <Label x={1640} y={640} size={26} color={C.work} weight={700}>
                luas sama
              </Label>
              <Label x={1640} y={674} size={24} color={C.spr} font="serif" italic>
                = Δp
              </Label>
            </g>
          </g>
        ) : null}

        {/* ======== bagian 2: kabin dari dalam ======== */}
        {kIn > 0.001 ? (
          <g opacity={kIn} transform={`translate(${ocX} ${ocY}) scale(${ocS.toFixed(4)}) translate(-960 -540)`}>
            <defs>
              <clipPath id="cr-win">
                <rect x={452} y={274} width={600} height={176} rx={14} />
              </clipPath>
            </defs>
            <Glow x={880} y={470} r={520} color="cyan" opacity={0.25} />
            {/* jendela samping: tiang di luar melambat */}
            <rect x={452} y={274} width={600} height={176} rx={14} fill="#0e1838" />
            <g clipPath="url(#cr-win)">
              {Array.from({length: 16}, (_, k) => {
                const x = 452 + ((((k * 70 - postOff * 0.3) % 1120) + 1120) % 1120) - 40;
                return <rect key={`b${k}`} x={x} y={390 - 30 * rand(k)} width={40} height={60 + 30 * rand(k)} fill="#1c2852" />;
              })}
              {Array.from({length: 5}, (_, k) => {
                const x = 452 + ((((k * 220 - postOff) % 1100) + 1100) % 1100) - 120;
                return (
                  <g key={k}>
                    <rect x={x} y={300} width={12} height={150} fill="#5b6a9e" />
                    <rect x={x - 16} y={300} width={44} height={8} rx={3} fill="#8fa0d0" />
                    <circle cx={x + 6} cy={304} r={10} fill="url(#soft-gold)" />
                  </g>
                );
              })}
              {vCar > 0.05
                ? [0, 1, 2].map((k) => (
                    <line key={k} x1={500 + k * 180} y1={330 + k * 30} x2={500 + k * 180 + 120 * vCar} y2={330 + k * 30} stroke="#cfeaff" strokeWidth={2} opacity={0.25 * vCar} />
                  ))
                : null}
            </g>
            {/* bodi kabin */}
            <path d="M420,800 L420,300 Q440,252 560,248 L1000,248 Q1060,250 1090,282 L1330,520 L1470,540 L1470,600 L1340,620 L1340,800 Z" fill="none" stroke="#9fb2e8" strokeWidth={4} strokeLinejoin="round" />
            <path d="M420,450 L1062,450 L1062,800 L420,800 Z" fill="#121a38" opacity={0.9} />
            <rect x={420} y={800} width={1050} height={18} rx={6} fill="#26305a" />
            <line x1={1090} y1={282} x2={1330} y2={520} stroke={C.cyan} strokeOpacity={0.3} strokeWidth={10} />
            {/* kursi */}
            <path d="M552,700 L560,640 L590,330 Q596,296 626,300 Q650,304 648,340 L630,640 L790,646 Q806,650 804,668 L800,700 Z" fill="#26305a" stroke="#5b6a9e" strokeWidth={3} strokeLinejoin="round" />
            <rect x={596} y={250} width={58} height={44} rx={16} fill="#26305a" stroke="#5b6a9e" strokeWidth={3} />
            {/* dasbor & kemudi */}
            <path d="M1110,560 Q1150,520 1260,520 L1330,520 L1340,610 Q1250,612 1150,622 Z" fill="#1f2a50" stroke="#5b6a9e" strokeWidth={3} />
            <line x1={1160} y1={600} x2={wheelC[0]} y2={wheelC[1]} stroke="#5b6a9e" strokeWidth={12} strokeLinecap="round" />
            {/* tubuh (boneka uji tabrak) */}
            <Limb pts={[hip, knee, foot]} w={44} />
            <circle cx={knee[0]} cy={knee[1]} r={13} fill="#1a2142" />
            <Limb pts={[hip, sh]} w={66} />
            <Limb pts={[sh, elbow, hand]} w={24} />
            <circle cx={elbow[0]} cy={elbow[1]} r={9} fill="#1a2142" />
            <ellipse cx={wheelC[0]} cy={wheelC[1]} rx={14} ry={62} fill="none" stroke="#8fa0d0" strokeWidth={9} transform={`rotate(-28 ${wheelC[0]} ${wheelC[1]})`} />
            {/* sabuk */}
            {(() => {
              const anchor: [number, number] = [606, 318];
              const over: [number, number] = [sh[0] + 6, sh[1] + 2];
              const buckle: [number, number] = [716, 648];
              const d = `M${anchor[0]},${anchor[1]} L${over[0].toFixed(1)},${over[1].toFixed(1)} L${buckle[0]},${buckle[1]} M630,640 L${buckle[0]},${buckle[1]}`;
              const mid: [number, number] = [mix(over[0], buckle[0], 0.4), mix(over[1], buckle[1], 0.4)];
              const fl = Math.min(90, beltF * 0.5);
              return (
                <g>
                  <path d={d} fill="none" stroke={C.work} strokeOpacity={0.35 * beltHl} strokeWidth={34} strokeLinecap="round" strokeLinejoin="round" />
                  <path d={d} fill="none" stroke="#7f8fc6" strokeWidth={13} strokeLinecap="round" strokeLinejoin="round" />
                  <path d={d} fill="none" stroke="#c9d2ee" strokeWidth={2} strokeOpacity={0.6} strokeDasharray="10 8" />
                  <rect x={buckle[0] - 10} y={buckle[1] - 9} width={20} height={18} rx={4} fill="#c9d2ee" />
                  {fl > 8 ? <Arrow x1={mid[0] + 40} y1={mid[1] + 10} x2={mid[0] + 40 - fl} y2={mid[1] + 10 - fl * 0.25} color="force" width={6} pulse={false} /> : null}
                </g>
              );
            })()}
            {/* kantong udara */}
            {bag > 0.001 ? (
              <g>
                <ellipse cx={bagC[0]} cy={bagC[1]} rx={Math.max(1, bagRx)} ry={Math.max(1, bagRy)} fill="#e8ecf5" opacity={0.88} stroke="#ffffff" strokeWidth={2} />
                <path d={`M${bagC[0] - bagRx * 0.5},${bagC[1] - bagRy * 0.55} q${bagRx * 0.3},${bagRy * 0.4} 0,${bagRy * 1.0} M${bagC[0] + bagRx * 0.15},${bagC[1] - bagRy * 0.7} q${bagRx * 0.25},${bagRy * 0.6} 0,${bagRy * 1.3}`} fill="none" stroke="#9aa6d6" strokeWidth={2} opacity={0.7} />
                <circle cx={head[0]} cy={head[1]} r={56} fill="none" stroke="#6f7fb8" strokeWidth={8} opacity={0.4 * sink} />
                {/* gas keluar lewat lubang ventilasi */}
                {Array.from({length: 6}, (_, k) => {
                  const ph = (((t * 0.6 + k / 6) % 1) + 1) % 1;
                  return <circle key={k} cx={bagC[0] + 40 + ph * 60} cy={bagC[1] + bagRy * 0.7 + ph * 50 + 6 * Math.sin(t * 3 + k)} r={4 + ph * 8} fill="#e8ecf5" opacity={cyc(ph) * 0.35 * ramp(t, tHead, tHead + 1)} />;
                })}
              </g>
            ) : null}
            {/* kepala */}
            <line x1={sh[0]} y1={sh[1]} x2={head[0] - 6} y2={head[1] + 20} stroke="#b9c4e6" strokeWidth={22} strokeLinecap="round" />
            <circle cx={head[0]} cy={head[1]} r={44} fill="#c9d2ee" stroke="#0a1024" strokeWidth={4} />
            <g transform={`translate(${head[0] - 6} ${head[1] - 4})`}>
              <circle r={13} fill="#0a1024" />
              <path d="M0,0 L13,0 A13,13 0 0 1 0,13 Z M0,0 L-13,0 A13,13 0 0 1 0,-13 Z" fill={C.gold} />
            </g>
            {/* bidang tekan luas */}
            <g opacity={wide * bag}>
              <path d={`M${head[0] + 30},${head[1] - 34} A46,46 0 0 1 ${head[0] + 30},${head[1] + 34}`} fill="none" stroke={C.force} strokeOpacity={0.35} strokeWidth={14} />
              {[-50, -25, 0, 25, 50].map((deg) => {
                const a = (deg * Math.PI) / 180;
                const x1 = head[0] + Math.cos(a) * 94;
                const y1 = head[1] + Math.sin(a) * 94;
                const x2 = head[0] + Math.cos(a) * 56;
                const y2 = head[1] + Math.sin(a) * 56;
                return <Arrow key={deg} x1={x1} y1={y1} x2={x2} y2={y2} color="force" width={4} pulse={false} />;
              })}
              <Label x={905} y={290} size={26} color={C.force} weight={600}>
                bidang tekan luas
              </Label>
            </g>
            <Label x={1210} y={420} size={26} color="#e8ecf5" weight={600} opacity={ramp(t, tBag + 0.2, tBag + 0.8) * (1 - wide)}>
              kantong udara
            </Label>
            <Label x={560} y={720} size={26} color={C.work} weight={600} opacity={beltHl}>
              sabuk pengaman
            </Label>

            {/* panel kecepatan (kiri) */}
            <g opacity={panelsOp}>
              <rect x={90} y={300} width={312} height={238} rx={16} fill="rgba(10,16,36,0.72)" stroke={C.line} strokeWidth={2} />
              <Label x={110} y={330} size={22} color={C.muted} anchor="start" weight={600} spacing={2}>
                KECEPATAN
              </Label>
              <Label x={110} y={378} size={24} color={C.ink} anchor="start">
                mobil
              </Label>
              <Arrow x1={112} y1={414} x2={112 + 250 * vCar} y2={414} color="cyan" width={7} />
              <Label x={110} y={462} size={24} color={C.ink} anchor="start">
                tubuh
              </Label>
              <Arrow x1={112} y1={498} x2={112 + 250 * vBody} y2={498} color="cyan" width={7} />
              <Label x={392} y={462} size={20} color={C.work} anchor="end" opacity={together}>
                ikut melambat
              </Label>
            </g>
            {/* panel penghentian kepala (kanan) */}
            <g opacity={headPanel * panelsOp}>
              <rect x={1478} y={560} width={350} height={290} rx={16} fill="rgba(10,16,36,0.75)" stroke={C.line} strokeWidth={2} />
              <Label x={1500} y={590} size={22} color={C.muted} anchor="start" weight={600} spacing={2}>
                KEPALA BERHENTI
              </Label>
              <line x1={1496} y1={700} x2={1810} y2={700} stroke={C.muted} strokeWidth={2} />
              <path d={`M1500,700 Q1512,${700 - 160} 1524,700 Z`} fill={C.heat} opacity={0.35} />
              <path d={`M1500,700 Q1512,${700 - 160} 1524,700`} fill="none" stroke={C.heat} strokeWidth={3} />
              <Label x={1546} y={652} size={21} color={C.ink} anchor="start">
                tanpa kantong udara
              </Label>
              <Label x={1546} y={680} size={20} color={C.heat} anchor="start">
                Δt singkat · F besar
              </Label>
              <line x1={1496} y1={826} x2={1810} y2={826} stroke={C.muted} strokeWidth={2} />
              {(() => {
                const w = 160 * ramp(t, tHead, tHead + 2.2);
                return w > 1 ? (
                  <g>
                    <path d={`M1500,826 Q${1500 + w / 2},${826 - 24} ${1500 + w},826 Z`} fill={C.work} opacity={0.4} />
                    <path d={`M1500,826 Q${1500 + w / 2},${826 - 24} ${1500 + w},826`} fill="none" stroke={C.work} strokeWidth={3} />
                  </g>
                ) : null;
              })()}
              <Label x={1500} y={752} size={21} color={C.ink} anchor="start">
                dengan kantong udara
              </Label>
              <Label x={1500} y={780} size={20} color={C.work} anchor="start">
                Δt lama · F kecil
              </Label>
            </g>
            <Label x={960} y={862} size={30} color="#9fb2e8" weight={600} opacity={kOc}>
              sabuk + kantong udara
            </Label>
          </g>
        ) : null}

        {/* ======== bagian 3: penampang helm ======== */}
        {helmOp > 0.001 ? (
          <g opacity={helmOp}>
            <Glow x={HX} y={ROAD - 170} r={330} color="cyan" opacity={0.3} />
            <Motes x={HX} y={ROAD - 200} rx={330} ry={200} n={18} color="cyan" opacity={0.4} seed={11} />
            <rect x={1120} y={ROAD} width={560} height={40} fill="url(#ground)" />
            <line x1={1120} y1={ROAD} x2={1680} y2={ROAD} stroke="#8fa0d0" strokeWidth={3} />
            {Array.from({length: 14}, (_, k) => (
              <path key={k} d={`M${1130 + k * 40},${ROAD + 3} l-14,20`} stroke={C.faint} strokeWidth={2} />
            ))}
            <path d={foamD} fill="none" stroke="#2a3358" strokeWidth={50} opacity={0.8} />
            {beads}
            <path d={shellD} fill="none" stroke="#0a1024" strokeWidth={20} strokeLinecap="round" />
            <path d={shellD} fill="none" stroke="#d6def5" strokeWidth={14} strokeLinecap="round" />
            <path d={arcPts(160, OPEN + 40, OPEN + 320, Yh)} fill="none" stroke="#7f8fc6" strokeWidth={2} opacity={0.6} />
            {/* kepala & leher */}
            <line x1={HX} y1={Yh + dHead} x2={HX + Math.cos((OPEN * Math.PI) / 180) * 210} y2={Yh + dHead + Math.sin((OPEN * Math.PI) / 180) * 210} stroke="#b9c4e6" strokeWidth={70} strokeLinecap="round" />
            <circle cx={HX} cy={Yh + dHead} r={108} fill="#2a355e" stroke="#c9d2ee" strokeWidth={4} />
            <path d={`M${HX - 50},${Yh + dHead - 30} q25,-30 50,-6 q25,-26 50,8 M${HX - 46},${Yh + dHead + 20} q24,-18 46,0 q24,16 46,-4`} fill="none" stroke="#6f7fb8" strokeWidth={4} strokeLinecap="round" opacity={0.7} />
            <Label x={HX} y={Yh + dHead + 62} size={24} color={C.ink} weight={600} opacity={helmLbl}>
              kepala
            </Label>
            {/* kecepatan & gaya */}
            {vHead > 3 ? <Arrow x1={HX + 250} y1={Yh - 70} x2={HX + 250} y2={Yh - 70 + vHead * 1.2} color="cyan" width={6} /> : null}
            <Label x={HX + 278} y={Yh - 70 + vHead * 0.6} size={26} font="serif" italic color={C.cyan} anchor="start" opacity={cl(vHead / 30)}>
              v
            </Label>
            {aHead > 5 ? <Arrow x1={HX - 60} y1={ROAD + 34} x2={HX - 60} y2={ROAD + 34 - aHead * 0.45} color="force" width={7} pulse={false} /> : null}
            <Ripple x={HX} y={ROAD} p={(t - tI) / 1.2} r={200} color="force" rings={3} />
            <HeatShimmer x1={HX - 120} x2={HX + 120} y={ROAD - 10} t={t} amount={0.5 * ramp(t, tI + 0.2, tI + 1.2)} />
            {/* label */}
            <g opacity={helmLbl}>
              <line x1={HX + 150} y1={Yh - 92} x2={HX + 196} y2={Yh - 150} stroke="#d6def5" strokeWidth={2} />
              <Label x={HX + 204} y={Yh - 162} size={26} color="#d6def5" anchor="start" weight={600}>
                cangkang keras
              </Label>
              <line x1={HX + 132} y1={Yh + 30} x2={HX + 206} y2={Yh + 30} stroke="#dfe6fb" strokeWidth={2} />
              <Label x={HX + 214} y={Yh + 30} size={26} color="#dfe6fb" anchor="start" weight={600}>
                busa (EPS)
              </Label>
            </g>
          </g>
        ) : null}
      </Stage>

      {/* ======== kartu rumus ======== */}
      <Formula x={1530} y={292} p={f1} accent={C.force} caption="Δt panjang → F kecil">
        <V color={C.force}>F</V> = <Frac n={<V color={C.spr}>Δp</V>} d={<V>Δt</V>} />
      </Formula>
      <Formula x={1530} y={292} p={f2} accent={C.work} size={56} caption="luas di bawah kurva sama">
        <V color={C.force}>F</V>
        <Sub>1</Sub>
        <V>Δt</V>
        <Sub>1</Sub> = <V color={C.force}>F</V>
        <Sub>2</Sub>
        <V>Δt</V>
        <Sub>2</Sub> = <V color={C.spr}>Δp</V>
      </Formula>
      <Note x={HX} y={226} p={helmNote} color={C.work} size={28}>
        busa remuk perlahan → <span style={{fontFamily: FONT.serif, fontStyle: 'italic'}}>Δt</span> ↑ → <span style={{fontFamily: FONT.serif, fontStyle: 'italic', color: C.force}}>F</span> ↓
      </Note>
    </AbsoluteFill>
  );
};
