import React from 'react';
import {AbsoluteFill} from 'remotion';
import {BACK, EASE_IN_OUT, ramp, win} from '../anim';
import {Plot, px, py, type Axes} from '../components/physics';
import {Arrow, Badge, Formula, Frac, Glow, Label, Motes, Part, Ripple, Stage, Tint, Twinkles, V} from '../components/primitives';
import {useScene} from '../SceneContext';
import {C, FONT} from '../theme';

// Memperlama tumbukan, memperkecil gaya.
// Fase A (baris 0–1): grafik F–t dengan luas (Δp) TETAP; bentuknya berubah dari runcing-tinggi ke rendah-lebar
//   (tinggi = luas / lebar, profil super-Gauss), penggeser Δt bergerak.
// Fase B (baris 2–5): penumpang 60 kg, 10 m/s → Δp = 600 N·s. Dua kabin (kerangka mobil, gerak lambat ×10,
//   80 px per meter): (atas) tanpa sabuk: melayang 0,5 m lalu membentur dasbor, berhenti dalam 0,01 s (4 px);
//   (bawah) sabuk + kantong udara: langsung diperlambat selama 0,2 s (80 px). Grafik F–t satu skala:
//   60 kN × 0,01 s dan 3 kN × 0,2 s → luas sama (600 N·s), tinggi beda 20×.
// Fase C (baris 6): mendarat dengan menekuk lutut (jatuh bebas lalu pinggul diperlambat merata),
//   menangkap telur sambil menarik tangan (telur diperlambat sepanjang arah geraknya).

/* ------------------------------------------------------------------ */
/* Kabin mobil                                                          */
/* ------------------------------------------------------------------ */
const VW = 800;
const VH = 290;
const SLOW = 10;
const PXM = 80; // px per meter
const VREL = (10 * PXM) / SLOW; // 80 px/s laju relatif setelah mobil berhenti (gerak lambat)

/** Perpindahan penumpang relatif kabin setelah mobil berhenti (u detik video). */
const dTop = (u: number) => {
  if (u <= 0) return 0;
  if (u < 0.5) return VREL * u; // melayang bebas 0,5 m
  const w = Math.min(u - 0.5, 0.1); // berhenti dalam 0,01 s nyata = 0,1 s video
  return 40 + VREL * w - (VREL / (2 * 0.1)) * w * w;
};
const dBot = (u: number) => {
  if (u <= 0) return 0;
  const w = Math.min(u, 2.0); // diperlambat merata 0,2 s nyata = 2 s video
  return VREL * w - (VREL / (2 * 2.0)) * w * w;
};

const Cabin: React.FC<{x: number; y: number; t: number; tc: number; belt: boolean; label: string; op: number; clipId: string}> = ({x, y, t, tc, belt, label, op, clipId}) => {
  if (op <= 0.001) return null;
  const u = t - tc;
  const d = belt ? dBot(u) : dTop(u);
  // gulir pemandangan: 10 m/s nyata → 80 px/s (gerak lambat) sampai mobil berhenti
  const S = VREL * Math.min(t, tc) * 3;
  const shake = u > 0 && u < 0.4 ? 4 * Math.sin(u * 70) * (1 - u / 0.4) : 0;
  const lean = 0.45 * d;
  const hip: [number, number] = [232 + 0.5 * d, 205];
  const sh: [number, number] = [222 + d + lean * 0.6, 108 + 0.15 * lean];
  const head: [number, number] = [sh[0] + 8 + 0.3 * lean, sh[1] - 34 + 0.1 * lean];
  const knee: [number, number] = [332 + 0.25 * d, 196];
  const foot: [number, number] = [392, 262];
  const dashX = belt ? 380 : 286;
  const hitFlash = !belt ? ramp(u, 0.48, 0.52) * (1 - ramp(u, 0.6, 1.4)) : 0;
  const bag = belt ? ramp(u, 0, 0.3, BACK) * (1 - 0.35 * ramp(u, 3, 8)) : 0;
  const chestX = sh[0] + 26;
  const bagFront = Math.min(dashX - 6 - 70 * bag, chestX);
  const decel = belt ? (u > 0 && u < 2 ? 1 : 0) : u > 0.5 && u < 0.6 ? 1 : 0;
  const Fafter = belt ? 0 : ramp(u, 0.5, 0.52) * (1 - ramp(u, 0.6, 1.3, EASE_IN_OUT));
  const Flen = belt ? 10 * decel : 200 * Math.max(decel, Fafter);
  const brk = ramp(u, -0.1, 0.05);
  return (
    <g opacity={op} transform={`translate(${x + shake} ${y})`}>
      <clipPath id={clipId}>
        <rect x={0} y={0} width={VW} height={VH} rx={20} />
      </clipPath>
      <rect x={0} y={0} width={VW} height={VH} rx={20} fill="#0a1128" stroke={C.line} strokeWidth={2} />
      <g clipPath={`url(#${clipId})`}>
        {/* jendela + pemandangan yang bergulir */}
        <clipPath id={`${clipId}-w`}>
          <path d="M110,28 L470,28 L570,128 L110,128 Z" />
        </clipPath>
        <path d="M110,28 L470,28 L570,128 L110,128 Z" fill="#12234a" />
        <g clipPath={`url(#${clipId}-w)`}>
          {Array.from({length: 7}, (_, k) => {
            const xx = ((((k * 150 - S) % 1050) + 1050) % 1050) - 100;
            return (
              <g key={k}>
                <line x1={xx} y1={40} x2={xx} y2={128} stroke="#c9d3ee" strokeOpacity={0.35} strokeWidth={5} />
                <circle cx={xx + 10} cy={46} r={5} fill={C.gold} opacity={0.5} />
              </g>
            );
          })}
          {Array.from({length: 4}, (_, k) => {
            const xx = ((((k * 260 - S * 0.4) % 1040) + 1040) % 1040) - 120;
            return <path key={`h${k}`} d={`M${xx},128 Q${xx + 70},84 ${xx + 160},128 Z`} fill="#1b2d5c" />;
          })}
        </g>
        <path d="M110,28 L470,28 L570,128 L110,128 Z" fill="none" stroke="#56628f" strokeWidth={4} />
        <line x1={20} y1={132} x2={780} y2={132} stroke="#56628f" strokeWidth={3} />
        <line x1={20} y1={268} x2={780} y2={268} stroke="#56628f" strokeWidth={3} />
        {/* kursi */}
        <path d="M150,252 L160,212 L290,212 L292,236 L270,252 Z" fill="#2c3a6b" stroke="#6d7bb0" strokeWidth={2} />
        <path d="M150,214 L132,96 Q134,80 152,82 L176,92 L190,212 Z" fill="#2c3a6b" stroke="#6d7bb0" strokeWidth={2} />
        {/* penumpang */}
        <g stroke={C.ink} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" fill="none">
          <path d={`M${hip[0]},${hip[1]} L${knee[0]},${knee[1]} L${foot[0]},${foot[1]}`} strokeOpacity={0.85} />
          <path d={`M${sh[0]},${sh[1] + 8} L${sh[0] + 44 + 0.3 * lean},${sh[1] + 52} L${sh[0] + 84 + 0.4 * lean},${sh[1] + 50}`} strokeOpacity={0.8} />
        </g>
        <path d={`M${hip[0] - 18},${hip[1] + 4} L${sh[0] - 16},${sh[1]} Q${sh[0]},${sh[1] - 10} ${sh[0] + 18},${sh[1]} L${hip[0] + 18},${hip[1] + 4} Z`} fill="#3a6fd6" stroke={C.ink} strokeOpacity={0.5} strokeWidth={2} />
        <circle cx={head[0]} cy={head[1]} r={22} fill={C.bg} stroke={C.ink} strokeWidth={6} />
        {belt ? (
          <g>
            <line x1={sh[0] - 6} y1={sh[1] - 4} x2={hip[0] + 22} y2={hip[1] + 2} stroke="#cfd6ea" strokeWidth={7} strokeLinecap="round" />
            <line x1={sh[0] - 6} y1={sh[1] - 4} x2={150} y2={70} stroke="#cfd6ea" strokeWidth={6} strokeLinecap="round" opacity={0.8} />
          </g>
        ) : null}
        {/* dasbor */}
        <path d={`M${dashX},96 L790,96 L790,268 L${dashX + 70},268 L${dashX + 46},160 L${dashX},150 Z`} fill="#232f5a" stroke="#6d7bb0" strokeWidth={3} strokeLinejoin="round" />
        <rect x={dashX + 30} y={110} width={60} height={12} rx={6} fill={C.cyan} opacity={0.35} />
        {/* kantong udara */}
        {bag > 0.01 ? (
          <ellipse cx={(bagFront + dashX) / 2} cy={118} rx={Math.max(4, (dashX - bagFront) / 2)} ry={14 + 44 * bag} fill="#e8ecf8" opacity={0.92} stroke="#aab4d4" strokeWidth={2} />
        ) : null}
        {/* kilatan benturan */}
        <circle cx={dashX} cy={120} r={70} fill="url(#soft-heat)" opacity={hitFlash} />
        <Ripple x={dashX} y={120} p={!belt ? (u - 0.5) / 0.9 : 0} r={110} color="heat" rings={2} />
        {/* gaya pada penumpang (melawan gerak) */}
        <Arrow x1={chestX + 4} y1={sh[1] + 16} x2={chestX + 4 - Flen} y2={sh[1] + 16} color="force" width={9} opacity={Math.min(1, Flen / 6)} pulse={false} />
        {/* lampu rem / bahaya berkedip setelah berhenti */}
        <circle cx={760} cy={50} r={9} fill={C.gold} opacity={u > 0.6 ? 0.25 + 0.6 * (0.5 + 0.5 * Math.sin(t * 6)) : 0.1} />
      </g>
      <Label x={22} y={-24} size={24} color={belt ? C.work : C.heat} anchor="start" font="mono">
        {label}
      </Label>
      <Label x={VW - 16} y={-24} size={20} color={C.muted} anchor="end" font="mono" opacity={brk}>
        gerak lambat ×10
      </Label>
    </g>
  );
};

/* ------------------------------------------------------------------ */
/* Fase C                                                               */
/* ------------------------------------------------------------------ */
const legIK = (hx: number, hy: number, fx: number, fy: number, L: number, fwd: 1 | -1) => {
  const dx = fx - hx;
  const dy = fy - hy;
  const dist = Math.hypot(dx, dy);
  const d = Math.min(2 * L - 0.5, dist);
  const ux = dx / dist;
  const uy = dy / dist;
  const h = Math.sqrt(Math.max(0, L * L - (d / 2) ** 2));
  let nx = -uy;
  let ny = ux;
  if (nx * fwd < 0) {
    nx = -nx;
    ny = -ny;
  }
  return [hx + (ux * d) / 2 + nx * h, hy + (uy * d) / 2 + ny * h] as [number, number];
};

const JG = 790; // tanah pelompat
const JPER = 3.4;
const HJ = 130; // tinggi jatuh (px)
const GJ = 1040; // px/s²
const SL = Math.sqrt((2 * HJ) / GJ);
const VL = GJ * SL;
const TB = 0.4; // lama pengereman pinggul
const jumper = (s: number) => {
  // offset badan ke atas (positif = di udara), tekuk lutut c
  if (s < SL) return {air: HJ - 0.5 * GJ * s * s, c: 0};
  const u = s - SL;
  if (u < TB) return {air: 0, c: VL * u - (VL / (2 * TB)) * u * u};
  const cmax = (VL * TB) / 2;
  return {air: 0, c: cmax * (1 - ramp(u, TB + 0.25, TB + 1.1, EASE_IN_OUT))};
};

const EX0 = 1080;
const EY0 = 470;
const EVX = 400;
const EVY = -420;
const EG = 900;
const ETC = 1.0; // tiba di tangan
const ETB = 0.5; // tangan menarik mundur
const EPER = 3.2;
const eggAt = (s: number) => {
  if (s < ETC) return {x: EX0 + EVX * s, y: EY0 + EVY * s + 0.5 * EG * s * s, caught: 0};
  const vx = EVX;
  const vy = EVY + EG * ETC;
  const cx = EX0 + EVX * ETC;
  const cy = EY0 + EVY * ETC + 0.5 * EG * ETC * ETC;
  const u = Math.min(s - ETC, ETB);
  const k = u - (u * u) / (2 * ETB); // perlambatan merata sepanjang arah gerak
  return {x: cx + vx * k, y: cy + vy * k, caught: 1};
};

export const Cushion: React.FC = () => {
  const {t, cue, wordOf} = useScene();

  const phA = ramp(t, -0.4, 0.8) * (1 - ramp(t, cue(2) - 0.6, cue(2) + 0.1, EASE_IN_OUT));
  const phB = ramp(t, cue(2) - 0.2, cue(2) + 0.6) * (1 - ramp(t, cue(6) - 0.6, cue(6) + 0.1, EASE_IN_OUT));
  const phC = ramp(t, cue(6) - 0.2, cue(6) + 0.6);

  // ---------- fase A ----------
  const morph = ramp(t, wordOf(1, 'pilih') - 0.4, wordOf(1, 'lamanya') + 1.0, EASE_IN_OUT);
  const breathe = ramp(t, wordOf(1, 'lamanya') + 1.0, wordOf(1, 'lamanya') + 2.0);
  const m = Math.max(0, Math.min(1, morph * (1 - 0.25 * breathe * (0.5 - 0.5 * Math.cos((t - wordOf(1, 'lamanya') - 1.0) * 1.6)))));
  const AREA = 24000;
  const Wd = 64 * 10 ** m; // 64 → 640 px
  const Hd = AREA / (0.9277 * Wd);
  const GX0 = 560;
  const GY0 = 720;
  const GCX = GX0 + 80 + Wd / 2;
  const shapeD = (() => {
    const pts: string[] = [`M${GX0},${GY0}`];
    for (let i = 0; i <= 90; i++) {
      const xx = GX0 + 20 + ((Wd + 140) * i) / 90;
      const z = (2 * (xx - GCX)) / Wd;
      pts.push(`L${xx.toFixed(1)},${(GY0 - Hd * Math.exp(-(z ** 6))).toFixed(1)}`);
    }
    pts.push(`L${GX0 + 160 + Wd},${GY0} Z`);
    return pts.join(' ');
  })();
  const aIn = ramp(t, 0.2, 1.0);
  const lDp = ramp(t, wordOf(1, 'perubahan') - 0.3, wordOf(1, 'perubahan') + 0.5);
  const lPick = ramp(t, wordOf(1, 'pilih') - 0.3, wordOf(1, 'pilih') + 0.4);

  // ---------- fase B ----------
  const tc1 = wordOf(3, 'seperseratus') - 0.4;
  const tc2 = wordOf(4, 'sabuk') - 0.2;
  const cabTop = ramp(t, cue(2) - 0.1, cue(2) + 0.6);
  const cabBot = ramp(t, cue(2) + 0.3, cue(2) + 1.0);
  const lMass = ramp(t, wordOf(2, 'enam') - 0.3, wordOf(2, 'enam') + 0.4);
  const lVel = ramp(t, wordOf(2, 'sepuluh') - 0.3, wordOf(2, 'sepuluh') + 0.4);
  const card2 = win(t, wordOf(2, 'berhenti') - 0.4, cue(3) - 0.45, 0.6, 0.35);
  const card3 = win(t, wordOf(3, 'gayanya') - 0.4, cue(4) - 0.45, 0.6, 0.35);
  const c3res = ramp(t, wordOf(3, 'ribu') - 0.4, wordOf(3, 'ribu') + 0.3);
  const card4 = win(t, wordOf(4, 'gayanya') - 0.4, cue(5) - 0.45, 0.6, 0.35);
  const c4res = ramp(t, wordOf(4, 'tiga') - 0.3, wordOf(4, 'tiga') + 0.3);
  const card5 = ramp(t, cue(5) + 0.1, cue(5) + 0.7);
  const c5res = ramp(t, wordOf(5, 'kali') - 0.4, wordOf(5, 'kali') + 0.3);
  const graph = ramp(t, cue(2) + 0.6, cue(2) + 1.4);
  const pen1 = ramp(t, tc1 + 0.5, tc1 + 0.6, (x) => x);
  const pen2 = ramp(t, tc2, tc2 + 2.0, (x) => x);
  const same = ramp(t, wordOf(5, 'sama') - 0.3, wordOf(5, 'sama') + 0.4);
  const twenty = ramp(t, wordOf(5, 'dua') - 0.3, wordOf(5, 'dua') + 0.5, BACK);
  const pulse = same * (0.5 + 0.5 * Math.sin(t * 3.2));
  const AX: Axes = {x0: 1110, y0: 560, w: 620, h: 330, xmax: 0.25, ymax: 64};
  const spikeW = px(AX, 0.01 * pen1) - px(AX, 0);
  const slabW = px(AX, 0.2 * pen2) - px(AX, 0);
  const yS = py(AX, 60);
  const yL = py(AX, 3);

  // ---------- fase C ----------
  const jIn = ramp(t, cue(6) - 0.1, cue(6) + 0.6);
  const eIn = ramp(t, wordOf(6, 'menarik') - 0.6, wordOf(6, 'menarik') + 0.2);
  const sJ = (((t - cue(6) + 0.2) % JPER) + JPER) % JPER;
  const jOp = Math.min(1, sJ * 5) * Math.min(1, (JPER - sJ) * 5);
  const J = jumper(sJ);
  const JX = 470;
  const hipH = 150 - J.c * 0.75;
  const hipY = JG - J.air - hipH;
  const fL: [number, number] = [JX - 24, JG - J.air];
  const fR: [number, number] = [JX + 24, JG - J.air];
  const kL = legIK(JX - 6, hipY, fL[0], fL[1], 78, 1);
  const kR = legIK(JX + 6, hipY, fR[0], fR[1], 78, 1);
  const shY = hipY - 108 + J.c * 0.15;
  const shX = JX + J.c * 0.35;
  const landP = sJ - SL;
  const sE = (((t - wordOf(6, 'menarik') + 0.8) % EPER) + EPER) % EPER;
  const eOp = Math.min(1, sE * 5) * Math.min(1, (EPER - sE) * 5);
  const egg = eggAt(sE);
  const handRest: [number, number] = [EX0 + EVX * ETC, EY0 + EVY * ETC + 0.5 * EG * ETC * ETC];
  const hand: [number, number] = egg.caught ? [egg.x, egg.y] : [handRest[0] + 6 * Math.sin(t * 2), handRest[1] + 4 * Math.sin(t * 1.7)];
  const shoulder: [number, number] = [1700, 430];
  const elbow = legIK(shoulder[0], shoulder[1], hand[0] + 26, hand[1] + 6, 120, -1);
  const lTitle = ramp(t, cue(6) + 0.3, cue(6) + 1.0);

  return (
    <AbsoluteFill>
      <Stage>
        {/* ======================= FASE A ======================= */}
        {phA > 0.001 ? (
          <g opacity={phA * aIn}>
            <Glow x={960} y={560} r={520} color={m < 0.5 ? 'heat' : 'work'} opacity={0.18} />
            <rect x={GX0 - 80} y={250} width={980} height={580} rx={20} fill="rgba(10,16,36,0.7)" stroke={C.line} strokeWidth={2} />
            <line x1={GX0} y1={GY0} x2={GX0 + 860} y2={GY0} stroke={C.muted} strokeWidth={3} markerEnd="url(#arrow-muted)" />
            <line x1={GX0} y1={GY0 + 8} x2={GX0} y2={290} stroke={C.muted} strokeWidth={3} markerEnd="url(#arrow-muted)" />
            <Label x={GX0 + 880} y={GY0} size={28} font="serif" italic anchor="start">
              t
            </Label>
            <Label x={GX0 + 20} y={292} size={28} font="serif" italic anchor="start" color={C.force}>
              F
            </Label>
            <path d={shapeD} fill={C.work} opacity={0.5} />
            <path d={shapeD} fill="none" stroke={C.force} strokeWidth={4} strokeLinejoin="round" />
            <Label x={GCX} y={GY0 - Math.min(Hd, 200) * 0.45} size={30} color="#eafff4" weight={600} opacity={lDp * ramp(m, 0.25, 0.5)}>
              Δp tetap
            </Label>
            <Label x={GCX + Wd / 2 + 110} y={GY0 - Hd * 0.6} size={26} color="#eafff4" weight={600} anchor="start" opacity={lDp * (1 - ramp(m, 0.25, 0.5))}>
              luas = Δp
            </Label>
            {/* penanda tinggi F */}
            <line x1={GX0 - 14} y1={GY0} x2={GX0 - 14} y2={GY0 - Hd} stroke={C.force} strokeWidth={3} markerStart="url(#arrow-force)" markerEnd="url(#arrow-force)" />
            <Label x={GX0 - 30} y={GY0 - Hd / 2} size={24} color={C.force} anchor="end" opacity={1 - m}>
              F besar
            </Label>
            <Label x={GX0 - 30} y={GY0 - Hd / 2} size={24} color={C.force} anchor="end" opacity={m}>
              F kecil
            </Label>
            {/* Δt + penggeser */}
            <line x1={GCX - Wd / 2} y1={GY0 + 30} x2={GCX + Wd / 2} y2={GY0 + 30} stroke={C.ink} strokeWidth={2} markerStart="url(#arrow-ink)" markerEnd="url(#arrow-ink)" />
            <Label x={GCX} y={GY0 + 56} size={26} font="serif" italic>
              Δt
            </Label>
            <g opacity={lPick}>
              <rect x={GX0 + 120} y={GY0 + 82} width={600} height={8} rx={4} fill={C.line} />
              <rect x={GX0 + 120} y={GY0 + 82} width={600 * m} height={8} rx={4} fill={C.work} opacity={0.8} />
              <circle cx={GX0 + 120 + 600 * m} cy={GY0 + 86} r={13} fill={C.ink} stroke={C.work} strokeWidth={3} />
              <Label x={GX0 + 100} y={GY0 + 86} size={22} font="mono" color={C.muted} anchor="end">
                singkat
              </Label>
              <Label x={GX0 + 740} y={GY0 + 86} size={22} font="mono" color={C.muted} anchor="start">
                lama
              </Label>
            </g>
            <Ripple x={GCX} y={GY0 - Hd} p={ramp(t, 0.6, 2.0, (x) => x)} r={150} color="heat" rings={2} />
            <Motes x={960} y={520} rx={700} ry={280} n={20} color="work" opacity={0.35} seed={9} />
          </g>
        ) : null}

        {/* ======================= FASE B ======================= */}
        {phB > 0.001 ? (
          <g opacity={phB}>
            <Glow x={500} y={330} r={400} color="heat" opacity={0.12 + 0.2 * ramp(t, tc1 + 0.5, tc1 + 0.7) * (1 - ramp(t, tc1 + 1, tc1 + 3))} />
            <Glow x={500} y={660} r={400} color="work" opacity={0.15 * cabBot} />
            <Cabin x={100} y={200} t={t} tc={tc1} belt={false} label="tanpa sabuk → membentur dasbor" op={cabTop} clipId="cu-c1" />
            <Cabin x={100} y={556} t={t} tc={tc2} belt label="sabuk pengaman + kantong udara" op={cabBot} clipId="cu-c2" />
            {/* grafik F–t, satu skala */}
            {graph > 0.001 ? (
              <g opacity={graph}>
                <rect x={1030} y={170} width={790} height={470} rx={18} fill="rgba(10,16,36,0.72)" stroke={C.line} strokeWidth={2} />
                <Plot a={AX} xLabel="t (s)" yLabel="F (kN)" xTicks={[0, 0.05, 0.1, 0.15, 0.2]} yTicks={[20, 40, 60]} />
                {/* paku: 60 kN × 0,01 s */}
                {spikeW > 0.5 ? (
                  <g>
                    <rect x={px(AX, 0)} y={yS} width={spikeW} height={AX.y0 - yS} fill={C.work} opacity={0.55 + 0.3 * pulse} />
                    <rect x={px(AX, 0)} y={yS} width={spikeW} height={AX.y0 - yS} fill="none" stroke={C.heat} strokeWidth={3} />
                  </g>
                ) : null}
                <Label x={px(AX, 0.01) + 14} y={yS + 4} size={26} color={C.heat} anchor="start" weight={600} opacity={ramp(pen1, 0.9, 1)}>
                  60 000 N selama 0,01 s
                </Label>
                {/* lempeng: 3 kN × 0,2 s */}
                {slabW > 0.5 ? (
                  <g>
                    <rect x={px(AX, 0)} y={yL} width={slabW} height={AX.y0 - yL} fill={C.work} opacity={0.55 + 0.3 * pulse} />
                    <rect x={px(AX, 0)} y={yL} width={slabW} height={AX.y0 - yL} fill="none" stroke={C.work} strokeWidth={3} />
                  </g>
                ) : null}
                <Label x={px(AX, 0.12)} y={yL - 26} size={26} color={C.work} weight={600} opacity={ramp(pen2, 0.6, 1)}>
                  3000 N selama 0,2 s
                </Label>
                {pen2 > 0 && pen2 < 1 ? <circle cx={px(AX, 0.2 * pen2)} cy={yL} r={16} fill="url(#soft-work)" /> : null}
                <g opacity={same}>
                  <Label x={px(AX, 0.12)} y={yS + 60} size={28} color="#eafff4" weight={600}>
                    luas sama: 600 N·s
                  </Label>
                  <Twinkles x={px(AX, 0.1)} y={AX.y0 - 60} rx={300} ry={60} n={5} color="work" />
                </g>
              </g>
            ) : null}
          </g>
        ) : null}

        {/* ======================= FASE C ======================= */}
        {phC > 0.001 ? (
          <g opacity={phC}>
            {/* pelompat */}
            <g opacity={jIn}>
              <Glow x={JX} y={JG - 150} r={330} color="work" opacity={0.18} />
              <rect x={150} y={JG} width={640} height={10} rx={5} fill="#1a2550" />
              <line x1={150} y1={JG} x2={790} y2={JG} stroke={C.muted} strokeOpacity={0.7} strokeWidth={3} />
              <g opacity={jOp}>
                <ellipse cx={JX} cy={JG + 4} rx={50 * (1 - 0.5 * Math.min(1, J.air / HJ))} ry={6} fill="#000" opacity={0.35} />
                <g stroke={C.ink} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" fill="none">
                  <path d={`M${JX - 6},${hipY} L${kL[0]},${kL[1]} L${fL[0]},${fL[1]}`} strokeOpacity={0.8} />
                  <path d={`M${JX + 6},${hipY} L${kR[0]},${kR[1]} L${fR[0]},${fR[1]}`} />
                  <path d={`M${shX},${shY + 8} L${shX + 30 + 0.3 * J.c},${shY + 50 - 0.2 * J.c} L${shX + 54 + 0.2 * J.c},${shY + 38 - 0.4 * J.c}`} />
                </g>
                <path d={`M${JX - 18},${hipY + 4} L${shX - 16},${shY} Q${shX},${shY - 10} ${shX + 18},${shY} L${JX + 18},${hipY + 4} Z`} fill="#3a6fd6" stroke={C.ink} strokeOpacity={0.5} strokeWidth={2} />
                <circle cx={shX + 6} cy={shY - 32} r={22} fill={C.bg} stroke={C.ink} strokeWidth={6} />
                {/* sepatu */}
                <ellipse cx={fL[0] + 8} cy={fL[1] - 3} rx={18} ry={7} fill={C.kin} />
                <ellipse cx={fR[0] + 8} cy={fR[1] - 3} rx={18} ry={7} fill={C.kin} />
                {/* garis jatuh */}
                {J.air > 5
                  ? [0, 1, 2].map((k) => (
                      <line key={k} x1={JX - 30 + k * 30} y1={shY - 80} x2={JX - 30 + k * 30} y2={shY - 80 - (HJ - J.air) * 0.5} stroke="#cfe0ff" strokeOpacity={0.3} strokeWidth={2} strokeLinecap="round" />
                    ))
                  : null}
              </g>
              <Ripple x={JX} y={JG} p={landP / 0.9} r={140} color="work" rings={2} />
              {/* gaya pada lutut: rendah tapi lama */}
              <Arrow x1={JX + 90} y1={JG - 10} x2={JX + 90} y2={JG - 10 - (landP > 0 && landP < TB ? 60 : 0)} color="force" width={8} pulse={false} opacity={landP > 0 && landP < TB ? 1 : 0} />
              <Label x={JX} y={300} size={32} color={C.ink} weight={600} opacity={lTitle}>
                menekuk lutut
              </Label>
              <Label x={JX} y={344} size={24} color={C.muted} font="mono" opacity={lTitle}>
                pinggul diperlambat lebih lama
              </Label>
            </g>
            {/* tangkap telur */}
            <g opacity={eIn}>
              <Glow x={1440} y={540} r={330} color="work" opacity={0.18} />
              <path
                d={Array.from({length: 26}, (_, k) => {
                  const ss = (ETC * k) / 25;
                  return `${k ? 'L' : 'M'}${(EX0 + EVX * ss).toFixed(1)},${(EY0 + EVY * ss + 0.5 * EG * ss * ss).toFixed(1)}`;
                }).join(' ')}
                fill="none"
                stroke="#cfe0ff"
                strokeOpacity={0.18}
                strokeWidth={2}
                strokeDasharray="5 8"
              />
              {/* penangkap */}
              <g stroke={C.ink} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" fill="none">
                <path d={`M${shoulder[0]},${shoulder[1]} L${elbow[0]},${elbow[1]} L${hand[0] + 26},${hand[1] + 6}`} />
                <path d={`M1712,${shoulder[1] + 110} L1700,${shoulder[1] - 6}`} />
                <path d={`M1712,${shoulder[1] + 110} L1690,790 M1712,${shoulder[1] + 110} L1740,790`} strokeOpacity={0.8} />
              </g>
              <path d={`M1690,${shoulder[1] + 116} L1688,${shoulder[1] - 10} Q1702,${shoulder[1] - 20} 1720,${shoulder[1] - 10} L1730,${shoulder[1] + 116} Z`} fill="#c85fa0" stroke={C.ink} strokeOpacity={0.5} strokeWidth={2} />
              <circle cx={1706} cy={shoulder[1] - 46} r={22} fill={C.bg} stroke={C.ink} strokeWidth={6} />
              <line x1={1580} y1={790} x2={1820} y2={790} stroke={C.muted} strokeOpacity={0.6} strokeWidth={3} />
              <g opacity={eOp}>
                {/* telapak tangan menangkup */}
                <path d={`M${hand[0] - 26},${hand[1] - 4} Q${hand[0] - 20},${hand[1] + 26} ${hand[0] + 6},${hand[1] + 24} Q${hand[0] + 30},${hand[1] + 18} ${hand[0] + 30},${hand[1] - 2}`} fill="#f2c9a8" stroke={C.ink} strokeOpacity={0.5} strokeWidth={2} />
                <ellipse cx={egg.x} cy={egg.y - 6} rx={16} ry={21} fill="#fff6e6" stroke="#e6d2b0" strokeWidth={2} transform={`rotate(${egg.caught ? 10 : 40 * sE} ${egg.x} ${egg.y - 6})`} />
                <circle cx={egg.x - 5} cy={egg.y - 14} r={4} fill="#fff" opacity={0.8} />
                <Arrow x1={hand[0] + 50} y1={hand[1] - 30} x2={hand[0] + 50 + (egg.caught && sE - ETC < ETB ? 60 : 0)} y2={hand[1] - 30 + (egg.caught && sE - ETC < ETB ? 72 : 0)} color="cyan" width={6} pulse={false} opacity={egg.caught && sE - ETC < ETB ? 1 : 0} />
              </g>
              <Label x={1400} y={300} size={32} color={C.ink} weight={600} opacity={eIn}>
                menarik tangan ke belakang
              </Label>
              <Label x={1400} y={344} size={24} color={C.muted} font="mono" opacity={eIn}>
                telur diperlambat lebih lama
              </Label>
            </g>
          </g>
        ) : null}
      </Stage>

      {/* ======================= HTML ======================= */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 196,
          textAlign: 'center',
          fontFamily: FONT.head,
          fontSize: 40,
          fontWeight: 600,
          color: C.ink,
          opacity: phA * ramp(t, cue(0) - 0.2, cue(0) + 0.6),
          letterSpacing: 1,
        }}
      >
        <span style={{color: C.work}}>Δp</span> sama, <span style={{color: C.force}}>F</span> tergantung <span style={{color: C.ink, borderBottom: `3px solid ${C.work}`}}>Δt</span>
      </div>
      <Badge x={1425} y={770} text={<span>m = 60 kg · v = 10 m/s</span>} color={C.cyan} opacity={phB * Math.min(lMass, 0.4 + 0.6 * lVel) * (1 - ramp(t, wordOf(2, 'berhenti') - 0.6, wordOf(2, 'berhenti') - 0.2, EASE_IN_OUT))} size={30} />
      <Formula x={1425} y={770} p={phB * card2} accent={C.work} size={56}>
        Δ<V>p</V> = 60 kg × 10 m/s = <Tint c="work">600 N·s</Tint>
      </Formula>
      <Formula x={1425} y={770} p={phB * card3} accent={C.heat} size={56}>
        <Tint c="force">
          <V>F</V>
        </Tint>{' '}
        = <Frac n="600 N·s" d="0,01 s" />
        <Part p={c3res}>
          {' '}
          = <Tint c="heat">60 000 N</Tint>
        </Part>
      </Formula>
      <Formula x={1425} y={770} p={phB * card4} accent={C.work} size={56}>
        <Tint c="force">
          <V>F</V>
        </Tint>{' '}
        = <Frac n="600 N·s" d="0,2 s" />
        <Part p={c4res}>
          {' '}
          = <Tint c="work">3000 N</Tint>
        </Part>
      </Formula>
      <Formula x={1425} y={770} p={phB * card5} accent={C.gold} size={56}>
        <Frac n={<Tint c="heat">60 000 N</Tint>} d={<Tint c="work">3000 N</Tint>} />
        <Part p={c5res}>
          {' '}
          = <span style={{color: C.gold, fontWeight: 600}}>20×</span>
        </Part>
      </Formula>
      <Badge x={1480} y={430} text="gaya 20× lebih kecil" color={C.gold} opacity={phB * twenty} scale={0.85 + 0.15 * Math.min(1, twenty)} size={26} />
      <Badge x={960} y={226} text={<span>Δt lebih lama → F lebih kecil</span>} color={C.work} opacity={phC * ramp(t, cue(6) + 0.8, cue(6) + 1.5)} size={28} />
    </AbsoluteFill>
  );
};
