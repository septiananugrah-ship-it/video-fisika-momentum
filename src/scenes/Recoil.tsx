import React from 'react';
import {AbsoluteFill} from 'remotion';
import {BACK, EASE_IN_OUT, cyc, ramp} from '../anim';
import {Arrow, Badge, Formula, Frac, Glow, Label, Motes, Ripple, Stage, Sub, Twinkles, V} from '../components/primitives';
import {useScene} from '../SceneContext';
import {C} from '../theme';

// Bagian 1 (baris 0–3): dua pemain sepatu luncur diam (Σp = 0), saling dorong 0,4 s (gaya setengah langkah halus),
//   lalu meluncur tanpa gesekan: 50 kg → −1,5 m/s, 75 kg → +1,0 m/s (|p| = 75 kg·m/s keduanya). Skala 20 px/m.
// Bagian 2 (baris 4–5): senapan 4 kg di dudukan rel licin, peluru 10 g, 400 m/s → V = 0,010·400/4 = 1,0 m/s.
//   Tolakan waktu nyata skala 300 px/m (1 m/s = 300 px/s) bebas 0,3 s lalu diredam penyangga pegas.
//   Tayangan ulang gerak lambat ×1/800: peluru 0,5 m/s layar = 150 px/s; senapan 1/800 m/s ≈ diam (jujur).

const ICE = 700;
const SK = 20; // px per meter
const XA0 = 892;
const XB0 = 1028;
const VA = -1.5;
const VB = 1.0;
const TP = 0.4;
const PK1 = 2.4; // px per kg·m/s (bagian 1)
const PK2 = 40; // px per kg·m/s (bagian 2)

const smooth = (x: number) => {
  const k = Math.max(0, Math.min(1, x));
  return k * k * (3 - 2 * k);
};
/** perpindahan (dalam satuan v·s) untuk kecepatan yang naik halus 0 → 1 selama T */
const disp = (tau: number, T: number) => {
  if (tau <= 0) return 0;
  if (tau >= T) return T / 2 + (tau - T);
  const x = tau / T;
  return T * (x * x * x - (x * x * x * x) / 2);
};
const fr = (x: number) => ((x % 1) + 1) % 1;
const slot = (t: number, a: number, b: number) => Math.min(ramp(t, a, a + 0.5), 1 - ramp(t, b - 0.45, b - 0.05, EASE_IN_OUT));

const Skater: React.FC<{x: number; s: number; dir: 1 | -1; reach: number; color: string; t: number; seed: number; speed: number}> = ({x, s, dir, reach, color, t, seed, speed}) => {
  const breathe = 1 + 0.012 * Math.sin(t * 2.1 + seed);
  // lengan: dorong (tangan ke depan) ↔ terbuka untuk keseimbangan
  const hand: [number, number] = [52 * reach + -26 * (1 - reach), -128 * reach + -112 * (1 - reach) + 4 * Math.sin(t * 1.7 + seed) * (1 - reach)];
  const elbow: [number, number] = [28 * reach + -8 * (1 - reach), -140 * reach + -122 * (1 - reach)];
  const hand2: [number, number] = [48 * reach + 30 * (1 - reach), -124 * reach + -104 * (1 - reach)];
  const flutter = (k: number) => 6 * Math.sin(t * 7 + k * 1.3 + seed) * (0.3 + Math.min(1, speed));
  const scarf = `M2,-160 Q${-20 - 30 * Math.min(1, speed)},${-160 + flutter(0)} ${-40 - 40 * Math.min(1, speed)},${-150 + flutter(1)}`;
  return (
    <g transform={`translate(${x} ${ICE}) scale(${dir * s} ${s})`}>
      <ellipse cx={0} cy={4} rx={44} ry={7} fill="#000" opacity={0.35} />
      <g transform={`scale(1 ${breathe})`}>
        {/* kaki & sepatu luncur */}
        <path d="M-6,-92 L-14,-50 L-16,-12" fill="none" stroke="#283464" strokeWidth={11} strokeLinecap="round" strokeLinejoin="round" />
        <path d="M6,-92 L12,-50 L10,-12" fill="none" stroke="#2f3b70" strokeWidth={11} strokeLinecap="round" strokeLinejoin="round" />
        <path d="M-26,-4 L-6,-4 L-4,-20 L-22,-22 Z" fill="#e9eefc" stroke="#9aa6d6" strokeWidth={1.5} />
        <path d="M0,-4 L20,-4 L22,-20 L4,-22 Z" fill="#e9eefc" stroke="#9aa6d6" strokeWidth={1.5} />
        <line x1={-30} y1={0} x2={-2} y2={0} stroke="#cfe6ff" strokeWidth={3} strokeLinecap="round" />
        <line x1={-4} y1={0} x2={26} y2={0} stroke="#cfe6ff" strokeWidth={3} strokeLinecap="round" />
        {/* badan */}
        <path d="M-16,-90 Q-20,-130 -12,-158 Q4,-166 18,-156 Q22,-128 16,-90 Z" fill={color} stroke="#fff" strokeOpacity={0.35} strokeWidth={2} />
        <path d="M-8,-150 Q2,-154 12,-148" fill="none" stroke="#fff" strokeOpacity={0.35} strokeWidth={2} />
        {/* syal */}
        <path d={scarf} fill="none" stroke={C.gold} strokeWidth={6} strokeLinecap="round" />
        {/* lengan */}
        <path d={`M4,-150 L${elbow[0]},${elbow[1]} L${hand[0]},${hand[1]}`} fill="none" stroke={color} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" />
        <path d={`M2,-148 L${(hand2[0] + 2) / 2 + 4},${(hand2[1] - 148) / 2 + 6} L${hand2[0]},${hand2[1]}`} fill="none" stroke={color} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" opacity={0.85} />
        <circle cx={hand[0]} cy={hand[1]} r={6} fill="#f0d2b4" />
        {/* kepala */}
        <circle cx={4} cy={-178} r={17} fill="#f0d2b4" />
        <path d="M-13,-180 Q-10,-198 6,-197 Q20,-196 21,-182 Q10,-188 -13,-180 Z" fill="#2a2f4a" />
        <circle cx={13} cy={-178} r={2.2} fill="#1a1f33" />
      </g>
    </g>
  );
};

const Rifle: React.FC<{x: number; y: number; opacity?: number; ghost?: boolean}> = ({x, y, opacity = 1, ghost}) => (
  <g transform={`translate(${x} ${y})`} opacity={opacity}>
    {ghost ? (
      <path d="M-205,-18 L-60,-26 L230,-20 L230,-8 L60,-8 L-60,14 L-205,40 Z" fill="none" stroke={C.cyan} strokeWidth={2} />
    ) : (
      <>
        <path d="M-205,-16 L-120,-20 L-58,-10 L-58,14 L-118,12 L-205,40 Q-212,12 -205,-16 Z" fill="#7a4e2d" stroke="#c88a55" strokeWidth={2.5} />
        <path d="M-196,-8 L-130,-12" stroke="#c88a55" strokeOpacity={0.5} strokeWidth={2} />
        <rect x={-62} y={-26} width={124} height={36} rx={6} fill="#39436a" stroke={C.muted} strokeWidth={2} />
        <path d="M-30,10 L-12,10 L-20,46 L-40,46 Z" fill="#7a4e2d" stroke="#c88a55" strokeWidth={2} />
        <path d="M-8,10 Q2,30 18,10" fill="none" stroke={C.muted} strokeWidth={3} />
        <rect x={60} y={-20} width={172} height={12} rx={3} fill="#5b6590" stroke="#9aa6d6" strokeWidth={1.5} />
        <rect x={62} y={-8} width={120} height={8} rx={3} fill="#7a4e2d" />
        <rect x={-36} y={-50} width={104} height={16} rx={8} fill="#2a3256" stroke={C.muted} strokeWidth={2} />
        <rect x={-24} y={-34} width={8} height={10} fill={C.muted} />
        <rect x={44} y={-34} width={8} height={10} fill={C.muted} />
        <circle cx={66} cy={-42} r={6} fill={C.cyan} opacity={0.5} />
        <rect x={-50} y={-22} width={30} height={6} rx={3} fill="#fff" opacity={0.12} />
      </>
    )}
  </g>
);

export const Recoil: React.FC = () => {
  const {t, cue, wordOf} = useScene();

  // ===== Bagian 1: sepatu luncur =====
  const p1In = ramp(t, -0.4, 0.8);
  const p1Out = 1 - ramp(t, cue(4) - 0.7, cue(4) + 0.1, EASE_IN_OUT);
  const tp = wordOf(1, 'mendorong');
  const tau = t - tp;
  const I = disp(tau, TP);
  const xa = XA0 + VA * SK * I;
  const xb = XB0 + VB * SK * I;
  const vfrac = smooth(tau / TP);
  const reach = 1 - smooth((tau - 0.25) / 0.9);
  const pushF = tau > 0 && tau < TP ? Math.sin((Math.PI * tau) / TP) : 0;
  const zeroLbl = Math.min(ramp(t, wordOf(0, 'diam') - 0.3, wordOf(0, 'diam') + 0.4), 1 - ramp(t, tp - 0.1, tp + 0.4, EASE_IN_OUT));
  const pArr = ramp(t, tp + 0.1, tp + 0.8);
  const gauge = ramp(t, wordOf(1, 'tetap') - 0.3, wordOf(1, 'tetap') + 0.4);
  const vArr = ramp(t, wordOf(2, 'lima') - 0.3, wordOf(2, 'lima') + 0.4);
  const light = ramp(t, cue(3) - 0.2, cue(3) + 0.5) * p1Out;
  const k0 = slot(t, wordOf(0, 'nol') - 0.4, tp + 0.2);
  const k1 = slot(t, wordOf(1, 'sama') - 0.4, wordOf(2, 'lima') - 0.2);
  const k2 = slot(t, wordOf(2, 'lima') - 0.2, cue(3));
  const k3 = slot(t, cue(3) + 0.1, cue(4) - 0.3);

  // ===== Bagian 2: senapan =====
  const p2In = ramp(t, cue(4) - 0.1, cue(4) + 0.6);
  const XR = 700;
  const YR = 540;
  const MUZ = 232;
  const TGT = 1700;
  const tf1 = wordOf(4, 'ditembakkan') + 0.1;
  const tf2 = wordOf(5, 'tertolak') - 0.2;
  const recoil = (tt: number) => {
    if (tt <= 0) return 0;
    if (tt < 0.3) return -300 * tt;
    const b = tt - 0.3;
    if (b < Math.PI / 10) return -90 - 60 * Math.sin(5 * b);
    const r = (tt - 0.3 - Math.PI / 10) / 1.6;
    return -150 + 150 * EASE_IN_OUT(Math.max(0, Math.min(1, r)));
  };
  const dx = recoil(t - tf1) + recoil(t - tf2);
  const xr = XR + dx;
  const vChip = Math.max(win2(t, tf1, tf1 + 1.4), win2(t, tf2, tf2 + 2.6));
  // tayangan ulang gerak lambat
  const ts = wordOf(4, 'Peluru');
  const slowOn = Math.min(ramp(t, ts - 0.3, ts + 0.2), 1 - ramp(t, cue(5) - 0.4, cue(5) + 0.1, EASE_IN_OUT));
  const bx = XR + MUZ + 150 * Math.max(0, t - ts);
  const hitT = ts + (TGT - 20 - (XR + MUZ)) / 150;
  const bulletVis = t < hitT ? 1 : 0;
  const bulletOp = slowOn * (1 - ramp(t, hitT - 0.05, hitT + 0.05));
  const holes = [tf1, hitT, tf2].filter((h) => t > h).length;
  const panel = ramp(t, wordOf(4, 'melesat') - 0.3, wordOf(4, 'melesat') + 0.4);
  const row2 = ramp(t, wordOf(5, 'tertolak') - 0.2, wordOf(5, 'tertolak') + 0.5);
  const k4 = slot(t, wordOf(4, 'empat') - 0.3, cue(5));
  const k5 = ramp(t, wordOf(5, 'satu') - 0.4, wordOf(5, 'satu') + 0.3);
  const badge = ramp(t, wordOf(5, 'recoil') - 0.4, wordOf(5, 'recoil') + 0.3, BACK);
  const rifleArr = Math.max(slowOn, ramp(t, tf2, tf2 + 0.3));

  const flash = (tf: number) => {
    const q = (t - tf) / 0.16;
    return q > 0 && q < 1 ? Math.sin(Math.PI * q) : 0;
  };
  const slowFlash = (() => {
    const q = (t - ts) / 0.9;
    return q > 0 && q < 1 ? Math.sin(Math.PI * q) * slowOn : 0;
  })();
  const fl = Math.max(flash(tf1), flash(tf2), slowFlash);
  const streak = (tf: number) => 1 - ramp(t, tf, tf + 0.3, (x) => x);
  const muzX = xr + MUZ;
  const muzY = YR - 14;

  // asap dari moncong (setelah tembakan pertama)
  const smokeOn = ramp(t, tf1, tf1 + 0.3);

  return (
    <AbsoluteFill>
      <Stage>
        {/* ============ Bagian 1 ============ */}
        <g opacity={p1In * p1Out}>
          <Glow x={960} y={ICE - 80} r={620} color="cyan" opacity={0.18} />
          {/* papan arena di belakang */}
          <rect x={120} y={600} width={1680} height={70} rx={10} fill="#0f1a3a" stroke={C.line} strokeWidth={2} />
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <rect key={i} x={170 + i * 280} y={618} width={180} height={34} rx={6} fill={i % 2 ? C.cyan : C.spr} opacity={0.12 + 0.05 * Math.sin(t * 0.8 + i)} />
          ))}
          {/* es */}
          <path d={`M100,${ICE} L1820,${ICE} L1860,${ICE + 90} L60,${ICE + 90} Z`} fill="#123060" opacity={0.75} />
          <path d={`M100,${ICE} L1820,${ICE}`} stroke="#cfe6ff" strokeOpacity={0.7} strokeWidth={2.5} />
          {Array.from({length: 7}, (_, i) => (
            <path key={i} d={`M${200 + i * 230 + 30 * Math.sin(t * 0.2 + i)},${ICE + 22 + (i % 3) * 18} l120,0`} stroke="#fff" strokeOpacity={0.07} strokeWidth={3} strokeLinecap="round" />
          ))}
          <Twinkles x={960} y={ICE + 45} rx={800} ry={35} n={8} color="cyan" opacity={0.7} />
          {/* jejak sepatu luncur: panjangnya berbanding 1,5 : 1 */}
          {tau > 0 ? (
            <g>
              <line x1={XA0 - 14} y1={ICE + 3} x2={xa + 10} y2={ICE + 3} stroke="#e8f4ff" strokeOpacity={0.45} strokeWidth={2} />
              <line x1={XA0 - 4} y1={ICE + 8} x2={xa + 20} y2={ICE + 8} stroke="#e8f4ff" strokeOpacity={0.3} strokeWidth={2} />
              <line x1={XB0 + 14} y1={ICE + 3} x2={xb - 10} y2={ICE + 3} stroke="#e8f4ff" strokeOpacity={0.45} strokeWidth={2} />
              <line x1={XB0 + 4} y1={ICE + 8} x2={xb - 20} y2={ICE + 8} stroke="#e8f4ff" strokeOpacity={0.3} strokeWidth={2} />
            </g>
          ) : null}
          <Glow x={xa} y={ICE - 120} r={170} color="spr" opacity={0.3} />
          <Glow x={xb} y={ICE - 140} r={200} color="spr" opacity={0.3} />
          <Skater x={xa} s={1.2} dir={1} reach={reach} color="#3b7bd8" t={t} seed={0} speed={vfrac * 1.5} />
          <Skater x={xb} s={1.42} dir={-1} reach={reach} color="#c4507a" t={t} seed={2} speed={vfrac} />
          {/* gaya dorong (aksi–reaksi) */}
          <g opacity={pushF}>
            <Arrow x1={950} y1={ICE - 140} x2={950 - 130 * pushF} y2={ICE - 140} color="force" width={7} pulse={false} />
            <Arrow x1={958} y1={ICE - 166} x2={958 + 130 * pushF} y2={ICE - 166} color="force" width={7} pulse={false} />
          </g>
          <Ripple x={954} y={ICE - 154} p={ramp(t, tp, tp + 1.0)} r={110} color="force" />
          {/* label massa */}
          <Label x={xa} y={ICE + 116} size={26} weight={600} color={C.ink}>
            50 kg
          </Label>
          <Label x={xb} y={ICE + 116} size={26} weight={600} color={C.ink}>
            75 kg
          </Label>
          {/* p = 0 sebelum mendorong */}
          <g opacity={zeroLbl}>
            <Label x={xa - 80} y={410} size={30} font="serif" italic color={C.spr} weight={600}>
              p = 0
            </Label>
            <Label x={xb + 86} y={385} size={30} font="serif" italic color={C.spr} weight={600}>
              p = 0
            </Label>
          </g>
          {/* panah momentum: sama panjang, berlawanan */}
          <g opacity={pArr}>
            <Arrow x1={xa} y1={360} x2={xa + VA * 50 * vfrac * PK1} y2={360} color="spr" width={8} />
            <Arrow x1={xb} y1={360} x2={xb + VB * 75 * vfrac * PK1} y2={360} color="spr" width={8} />
            <Label x={xa - 90} y={322} size={26} font="mono" color={C.spr} weight={600}>
              {`p₁ = −${Math.round(75 * vfrac)} kg·m/s`}
            </Label>
            <Label x={xb + 90} y={322} size={26} font="mono" color={C.spr} weight={600}>
              {`p₂ = +${Math.round(75 * vfrac)} kg·m/s`}
            </Label>
          </g>
          {/* panah kecepatan */}
          <g opacity={vArr}>
            <Arrow x1={xa} y1={ICE + 40} x2={xa + VA * 80} y2={ICE + 40} color="cyan" width={6} />
            <Arrow x1={xb} y1={ICE + 40} x2={xb + VB * 80} y2={ICE + 40} color="cyan" width={6} />
            <Label x={xa - 60} y={ICE + 72} size={26} font="mono" color={C.cyan} weight={600}>
              1,5 m/s
            </Label>
            <Label x={xb + 40} y={ICE + 72} size={26} font="mono" color={C.cyan} weight={600}>
              1,0 m/s
            </Label>
          </g>
          {/* neraca Σp di tengah */}
          <g opacity={gauge}>
            <circle cx={960} cy={560} r={46 + 3 * Math.sin(t * 2)} fill="url(#soft-spr)" />
            <Arrow x1={960} y1={548} x2={960 - 75 * 0.9} y2={548} color="spr" width={5} pulse={false} />
            <Arrow x1={960} y1={572} x2={960 + 75 * 0.9} y2={572} color="spr" width={5} pulse={false} />
            <Label x={960} y={612} size={28} font="mono" color={C.ink} weight={600}>
              Σp = 0
            </Label>
          </g>
          {/* yang ringan lebih cepat: sorot */}
          <Motes x={xa} y={ICE - 130} rx={100} ry={140} n={14} color="cyan" opacity={0.6 * light} />
        </g>

        {/* ============ Bagian 2 ============ */}
        <g opacity={p2In}>
          <Glow x={XR} y={YR} r={420} color="spr" opacity={0.16} />
          <Glow x={TGT} y={YR} r={240} color="heat" opacity={0.14} />
          {/* meja & rel */}
          <rect x={220} y={640} width={800} height={22} rx={6} fill="#24305a" stroke={C.muted} strokeOpacity={0.6} strokeWidth={2} />
          <rect x={250} y={662} width={18} height={150} fill="#1a2448" />
          <rect x={972} y={662} width={18} height={150} fill="#1a2448" />
          <ellipse cx={620} cy={818} rx={420} ry={14} fill="#000" opacity={0.3} />
          <rect x={300} y={612} width={680} height={10} rx={5} fill="#5b6590" />
          <Label x={640} y={690} size={20} color={C.muted} font="mono">
            dudukan rel licin
          </Label>
          {/* penyangga pegas */}
          <rect x={300} y={500} width={26} height={112} rx={6} fill="#2a3462" stroke={C.muted} strokeWidth={2} />
          {(() => {
            const end = Math.min(410, xr - 205);
            const n = 10;
            const d = Array.from({length: n + 1}, (_, i) => {
              const xx = 326 + ((end - 326) * i) / n;
              const yy = YR + 10 + (i === 0 || i === n ? 0 : i % 2 ? -14 : 14);
              return `${i ? 'L' : 'M'}${xx.toFixed(1)},${yy}`;
            }).join(' ');
            return (
              <g>
                <path d={d} fill="none" stroke={C.gold} strokeWidth={4} strokeLinejoin="round" />
                <rect x={end - 6} y={YR - 14} width={12} height={48} rx={4} fill={C.gold} opacity={0.8} />
              </g>
            );
          })()}
          {/* bayangan stroboskop tolakan kedua */}
          {[0, 1, 2, 3, 4, 5].map((k) => {
            const tk = tf2 + k * 0.05;
            const op = 0.3 * ramp(t, tk, tk + 0.02) * (1 - ramp(t, tf2 + 2.4, tf2 + 3.2, EASE_IN_OUT));
            return op > 0.001 ? <Rifle key={k} x={XR - 300 * k * 0.05} y={YR} opacity={op} ghost /> : null;
          })}
          {/* kereta luncur + senapan */}
          <g>
            <rect x={xr - 110} y={588} width={200} height={22} rx={8} fill="#2a3462" stroke={C.muted} strokeWidth={2} />
            <circle cx={xr - 80} cy={612} r={7} fill="#0b1022" stroke={C.muted} strokeWidth={2} />
            <circle cx={xr + 60} cy={612} r={7} fill="#0b1022" stroke={C.muted} strokeWidth={2} />
            <rect x={xr - 96} y={556} width={12} height={34} fill="#3a4470" />
            <rect x={xr + 40} y={548} width={12} height={42} fill="#3a4470" />
            <Rifle x={xr} y={YR} />
          </g>
          <Label x={XR - 120} y={460} size={26} weight={600} color={C.ink} opacity={1}>
            senapan 4 kg
          </Label>
          {/* kilat moncong & bunyi */}
          {fl > 0.01 ? (
            <g transform={`translate(${muzX} ${muzY}) scale(${0.4 + fl})`} opacity={fl}>
              <path d="M0,0 L40,-18 L30,-4 L70,0 L30,4 L40,18 Z" fill={C.gold} />
              <path d="M0,0 L22,-10 L18,0 L22,10 Z" fill="#fff" />
              <circle cx={10} cy={0} r={40} fill="url(#soft-gold)" />
            </g>
          ) : null}
          <Ripple x={muzX} y={muzY} p={ramp(t, tf1, tf1 + 1.0)} r={130} color="gold" />
          <Ripple x={muzX} y={muzY} p={ramp(t, tf2, tf2 + 1.0)} r={130} color="gold" />
          {/* asap */}
          {Array.from({length: 7}, (_, i) => {
            const ph = fr(t * 0.32 + i / 7);
            return <circle key={i} cx={XR + MUZ + 20 + ph * 60 + 10 * Math.sin(t + i)} cy={muzY - 10 - ph * 120} r={8 + ph * 22} fill="#9aa6d6" opacity={0.18 * cyc(ph) * smokeOn} />;
          })}
          {/* jejak peluru waktu nyata */}
          {[tf1, tf2].map((tf, k) => {
            const sOp = t > tf ? streak(tf) : 0;
            return sOp > 0.001 ? (
              <g key={k} opacity={sOp}>
                <line x1={XR + MUZ + 10} y1={muzY} x2={TGT - 20} y2={muzY} stroke={C.gold} strokeOpacity={0.25} strokeWidth={12} strokeLinecap="round" />
                <line x1={XR + MUZ + 10} y1={muzY} x2={TGT - 20} y2={muzY} stroke="#fff4c8" strokeWidth={3} strokeLinecap="round" />
              </g>
            ) : null;
          })}
          {/* sasaran */}
          <g>
            <rect x={TGT - 6} y={630} width={12} height={46} fill="#2a3462" />
            <rect x={TGT - 60} y={672} width={120} height={12} rx={4} fill="#2a3462" />
            <ellipse cx={TGT} cy={muzY} rx={34} ry={104} fill="#e9eefc" stroke={C.muted} strokeWidth={2} />
            <ellipse cx={TGT} cy={muzY} rx={25} ry={76} fill={C.heat} />
            <ellipse cx={TGT} cy={muzY} rx={17} ry={50} fill="#e9eefc" />
            <ellipse cx={TGT} cy={muzY} rx={9} ry={24} fill={C.heat} />
            {Array.from({length: holes}, (_, i) => (
              <circle key={i} cx={TGT - 4 + i * 3} cy={muzY - 2 + (i - 1) * 9} r={4} fill="#0b1022" />
            ))}
            <Ripple x={TGT} y={muzY} p={ramp(t, tf1, tf1 + 0.9)} r={90} color="heat" />
            <Ripple x={TGT} y={muzY} p={ramp(t, hitT, hitT + 0.9)} r={90} color="heat" />
            <Ripple x={TGT} y={muzY} p={ramp(t, tf2, tf2 + 0.9)} r={90} color="heat" />
          </g>
          {/* tayangan ulang gerak lambat: peluru terbang */}
          <g opacity={slowOn}>
            <circle cx={1546} cy={300} r={9} fill={C.heat} opacity={0.6 + 0.4 * Math.sin(t * 4)} />
            <Label x={1564} y={300} size={22} color={C.muted} anchor="start" font="mono">
              gerak lambat ×1/800
            </Label>
          </g>
          {bulletVis ? (
            <g opacity={bulletOp}>
              {Array.from({length: 6}, (_, i) => (
                <line key={i} x1={bx - 24 - i * 22} y1={muzY - 6 + (i % 3) * 6} x2={bx - 40 - i * 22} y2={muzY - 6 + (i % 3) * 6} stroke={C.gold} strokeOpacity={0.5 - i * 0.07} strokeWidth={2} />
              ))}
              <path d={`M${bx - 18},${muzY - 5} L${bx + 4},${muzY - 5} Q${bx + 14},${muzY} ${bx + 4},${muzY + 5} L${bx - 18},${muzY + 5} Z`} fill="#e8b45a" stroke="#fff4c8" strokeWidth={1.5} />
              <g opacity={1 - ramp(bx, TGT - 420, TGT - 260)}>
              <Arrow x1={bx} y1={muzY - 56} x2={bx + 4 * PK2} y2={muzY - 56} color="spr" width={7} />
              <Arrow x1={bx} y1={muzY + 44} x2={bx + 200} y2={muzY + 44} color="cyan" width={5} />
              <Label x={bx + 210} y={muzY + 44} size={22} font="mono" color={C.cyan} weight={600} anchor="start">
                400 m/s
              </Label>
              <Label x={bx + 2 * PK2} y={muzY - 90} size={22} font="mono" color={C.spr} weight={600}>
                peluru 10 g
              </Label>
              </g>
            </g>
          ) : null}
          {/* panah momentum senapan (sama panjang) */}
          <g opacity={rifleArr}>
            <Arrow x1={xr} y1={420} x2={xr - 4 * PK2} y2={420} color="spr" width={7} />
            <Label x={xr - 4 * PK2 - 26} y={420} size={28} font="serif" italic color={C.spr} weight={600} anchor="end">
              p
            </Label>
          </g>
          {/* kecepatan tolakan */}
          <g opacity={vChip}>
            <rect x={XR - 300} y={350} width={220} height={52} rx={14} fill="rgba(10,16,36,0.85)" stroke={C.cyan} strokeOpacity={0.6} strokeWidth={2} />
            <Label x={XR - 190} y={376} size={28} font="mono" color={C.cyan} weight={600}>
              V = 1,0 m/s
            </Label>
          </g>
          {/* panel momentum sesaat setelah ditembakkan */}
          <g opacity={panel}>
            <rect x={1080} y={700} width={720} height={170} rx={18} fill="rgba(10,16,36,0.8)" stroke={C.spr} strokeOpacity={0.5} strokeWidth={2} />
            <Label x={1100} y={724} size={20} color={C.muted} anchor="start" weight={600} spacing={1}>
              sesaat setelah ditembakkan
            </Label>
            <path d="M1112,770 L1140,770 Q1150,775 1140,780 L1112,780 Z" fill="#e8b45a" />
            <Arrow x1={1250} y1={775} x2={1250 + 4 * PK2} y2={775} color="spr" width={6} />
            <Label x={1440} y={775} size={24} font="mono" color={C.spr} weight={600} anchor="start">
              +4 kg·m/s
            </Label>
            <Label x={1700} y={775} size={20} font="mono" color={C.cyan} anchor="start">
              400 m/s
            </Label>
            <g opacity={row2}>
              <rect x={1104} y={822} width={52} height={12} rx={4} fill="#7a4e2d" />
              <rect x={1156} y={824} width={30} height={6} rx={2} fill="#5b6590" />
              <Arrow x1={1250 + 4 * PK2} y1={830} x2={1250} y2={830} color="spr" width={6} />
              <Label x={1440} y={830} size={24} font="mono" color={C.spr} weight={600} anchor="start">
                −4 kg·m/s
              </Label>
              <Label x={1700} y={830} size={20} font="mono" color={C.cyan} anchor="start">
                1 m/s
              </Label>
            </g>
          </g>
        </g>
      </Stage>

      {/* ----- kartu bagian 1 ----- */}
      <Formula x={960} y={225} p={k0} accent={C.spr} caption="mula-mula keduanya diam">
        Σ<V>p</V> = 0 + 0 = 0
      </Formula>
      <Formula x={960} y={225} p={k1} accent={C.spr} caption="Σp tetap nol">
        <V>p</V>
        <Sub>1</Sub> + <V>p</V>
        <Sub>2</Sub> = 0 ⇒ <V>p</V>
        <Sub>1</Sub> = −<V>p</V>
        <Sub>2</Sub>
      </Formula>
      <Formula x={960} y={225} p={k2} accent={C.spr} caption="kg·m/s">
        50 · 1,5 = 75 · 1,0 = 75
      </Formula>
      <Formula x={960} y={225} p={k3} accent={C.cyan} caption="lebih ringan → lebih cepat">
        <Frac
          n={
            <>
              <V>v</V>
              <Sub>1</Sub>
            </>
          }
          d={
            <>
              <V>v</V>
              <Sub>2</Sub>
            </>
          }
        />{' '}
        ={' '}
        <Frac
          n={
            <>
              <V>m</V>
              <Sub>2</Sub>
            </>
          }
          d={
            <>
              <V>m</V>
              <Sub>1</Sub>
            </>
          }
        />{' '}
        = <Frac n="75" d="50" /> = 1,5
      </Formula>
      {/* ----- kartu bagian 2 ----- */}
      <Formula x={960} y={225} p={k4} accent={C.spr} caption="momentum peluru">
        <V>p</V> = 0,010 · 400 = 4 kg·m/s
      </Formula>
      <Formula x={960} y={225} p={k5} accent={C.cyan} caption="kecepatan tolakan senapan">
        <V>V</V> = <Frac n="0,010 · 400" d="4" /> = 1,0 m/s
      </Formula>
      <Badge x={1560} y={300} text="TOLAKAN (RECOIL)" color={C.gold} opacity={badge * (1 - slowOn)} scale={0.9 + 0.1 * badge} size={28} />
    </AbsoluteFill>
  );
};

/** muncul cepat lalu memudar */
function win2(t: number, a: number, b: number) {
  return Math.min(ramp(t, a, a + 0.15), 1 - ramp(t, b - 0.5, b, EASE_IN_OUT));
}
