import React from 'react';
import {AbsoluteFill} from 'remotion';
import {EASE_IN_OUT, cyc, mix, ramp, rand, win} from '../anim';
import {Arrow, Badge, Formula, Frac, Glow, Label, Motes, Ripple, Stage, Stream, Sub, Sup, Tint, Twinkles, V} from '../components/primitives';
import {useScene} from '../SceneContext';
import {C} from '../theme';

// Momentum cahaya: p = h/λ (AUDIT).
// λ = 500 nm → 6,626×10⁻³⁴ / 5×10⁻⁷ = 1,33×10⁻²⁷ kg·m/s.
// H memancarkan Lyman-α 121,6 nm → p = 5,45×10⁻²⁷; m_H = 1,67×10⁻²⁷ kg → v ≈ 3,3 m/s ("≈ 3 m/s").
// Panjang gelombang digambar berskala sama (0,24 px/nm): 700 nm = 168 px, 500 nm = 120 px, 400 nm = 96 px, 121,6 nm = 29 px.
// Panah momentum (fase 1) ∝ 1/λ: 120 px per 10⁻²⁷ kg·m/s → merah 114, hijau 160, biru 199 px.

const NMPX = 0.24;
const KP = 120; // px per 10⁻²⁷ kg·m/s (fase 1)
const pOf = (nm: number) => 662.6 / nm; // ×10⁻²⁷ kg·m/s
const GREEN = '#3dff7a';
const RED = '#ff4a4a';
const BLUE = '#4f7bff';
const UV = '#7d9bff';
const WHITE = '#fff1c2';

/** Paket gelombang kaku (cahaya di vakum: tidak terdispersi). */
const packetPath = (xc: number, y: number, lamPx: number, amp: number, sig: number) => {
  const n = 150;
  let d = '';
  for (let i = 0; i <= n; i++) {
    const x = xc - 3 * sig + (6 * sig * i) / n;
    const u = x - xc;
    const yy = y - amp * Math.exp(-(u * u) / (2 * sig * sig)) * Math.sin((2 * Math.PI * u) / lamPx);
    d += `${i ? 'L' : 'M'}${x.toFixed(1)},${yy.toFixed(1)} `;
  }
  return d;
};

const Packet: React.FC<{xc: number; y: number; nm: number; color: string; amp?: number; sig?: number; op?: number; width?: number}> = ({xc, y, nm, color, amp = 42, sig = 110, op = 1, width = 4}) => {
  if (op <= 0.001) return null;
  const d = packetPath(xc, y, nm * NMPX, amp, sig);
  return (
    <g opacity={op}>
      <ellipse cx={xc} cy={y} rx={sig * 1.9} ry={amp * 1.6} fill={color} opacity={0.07} />
      <path d={d} fill="none" stroke={color} strokeOpacity={0.25} strokeWidth={width * 3.5} strokeLinejoin="round" />
      <path d={d} fill="none" stroke={color} strokeWidth={width} strokeLinejoin="round" />
    </g>
  );
};

const slot = (t: number, a: number, b: number, fi = 0.5, fo = 0.45) => Math.min(ramp(t, a, a + fi), 1 - ramp(t, b - fo, b, EASE_IN_OUT));

// ---------- fase 1 ----------
const BAND_Y = 470;
const MIRROR_X = 1650;
const PX0 = 200;
const PHIT = 1530; // pusat paket saat menyentuh cermin
const PC = 655; // px/s
const PPER = 3.0;

// ---------- fase 2 ----------
const AY = 470;
const AX0 = 720;
const DRIFT = 18; // px/s (tolakan ≈ 3 m/s, diperlambat agar tetap di layar)
const KB = 40; // px per 10⁻²⁷ kg·m/s (fase 2)
const PB = 5.45 * KB;

export const Photon: React.FC = () => {
  const {t, cue, wordOf} = useScene();

  const phA = 1 - ramp(t, cue(3) - 0.6, cue(3) + 0.2, EASE_IN_OUT);
  const phB = win(t, cue(3) - 0.1, cue(5) - 0.5, 0.6, 0.6);
  const phC = ramp(t, cue(5) - 0.3, cue(5) + 0.6);

  // ================= fase 1: paket gelombang & cermin =================
  const t0 = -0.5;
  const kNow = Math.floor((t - t0) / PPER);
  const green = ramp(t, cue(2) - 0.2, cue(2) + 0.8);
  const arrowIn = ramp(t, wordOf(0, 'membawa') - 0.3, wordOf(0, 'membawa') + 0.5);
  const massB = ramp(t, wordOf(0, 'bermassa') - 0.3, wordOf(0, 'bermassa') + 0.4);
  const cmp = win(t, wordOf(1, 'panjang') - 0.4, cue(2) + 0.3, 0.6, 0.6);
  const lamB = ramp(t, wordOf(2, 'nanometer') - 0.4, wordOf(2, 'nanometer') + 0.4);
  const packets = [kNow - 1, kNow].map((k) => {
    const tau = t - (t0 + k * PPER);
    const hitT = (PHIT - PX0) / PC;
    const inc = {x: PX0 + PC * tau, op: Math.min(ramp(tau, 0, 0.3), 1 - ramp(tau, hitT - 0.05, hitT + 0.2, EASE_IN_OUT))};
    const ref = {x: PHIT - PC * (tau - hitT), op: Math.min(ramp(tau, hitT - 0.05, hitT + 0.2), 1 - ramp(tau, hitT + 0.4, hitT + 0.9, EASE_IN_OUT)) * 0.6};
    return {k, tau, inc, ref, hitT};
  });
  let mirrorAng = 0;
  let pushF = 0;
  for (let k = Math.max(0, kNow - 4); k <= kNow; k++) {
    const th = t0 + k * PPER + (PHIT - PX0) / PC;
    const u = t - th;
    if (u > 0) {
      mirrorAng += 2.2 * Math.exp(-0.9 * u) * Math.sin(4.2 * u);
      pushF = Math.max(pushF, Math.exp(-3 * u));
    }
  }
  const lamPxMain = mix(120, 500 * NMPX, green);
  const pMain = mix(160, pOf(500) * KP, green);

  // ================= fase 2: atom H memancarkan foton UV =================
  const tE = wordOf(3, 'memancarkan') + 0.4;
  const ax = t < tE ? AX0 : AX0 - DRIFT * (t - tE);
  const excited = 1 - ramp(t, tE - 0.1, tE + 0.5, EASE_IN_OUT);
  const orbitR = mix(55, 110, excited);
  const eAng = t * mix(4.4, 2.2, excited);
  const uvX = AX0 + 70 + 700 * (t - tE);
  const uvOp = t > tE - 0.05 ? Math.min(ramp(t, tE - 0.05, tE + 0.2), 1 - ramp(t, tE + 1.3, tE + 1.75, EASE_IN_OUT)) : 0;
  const recoilP = ramp(t, tE, tE + 0.35);
  const bal = ramp(t, tE + 1.2, tE + 2.0);
  const rifle = ramp(t, wordOf(3, 'senapan') - 0.6, wordOf(3, 'senapan') + 0.3);
  const vLbl = ramp(t, cue(4) - 0.2, cue(4) + 0.5);
  const real = ramp(t, wordOf(4, 'nyata') - 0.3, wordOf(4, 'nyata') + 0.5);
  // senapan (berulang)
  const rT = (((t - wordOf(3, 'senapan')) % 3.2) + 3.2) % 3.2;
  const fireU = rT - 0.5;
  const recoil = fireU > 0 ? -34 * (1 - Math.exp(-10 * fireU)) * Math.exp(-1.4 * fireU) : 0;
  const bulletX = 1530 + 620 * Math.max(0, fireU);
  const bulletOp = fireU > 0 ? 1 - ramp(fireU, 0.25, 0.45) : 0;

  // ================= fase 3: pendinginan laser & layar surya =================
  const tau3 = Math.max(0, t - cue(5));
  const cool = Math.exp(-0.24 * tau3);
  const atoms = Array.from({length: 12}, (_, i) => {
    const A = 130 + 150 * rand(i * 3.1);
    const w = 2.0 + 1.6 * rand(i * 5.7);
    const ph = rand(i * 9.3) * Math.PI * 2;
    const x = 520 + A * cool * Math.sin(w * t + ph);
    const v = A * cool * (w * Math.cos(w * t + ph) - 0.24 * Math.sin(w * t + ph));
    const y = 520 + (rand(i * 2.3) - 0.5) * 44 + 5 * Math.sin(t * 1.3 + i);
    return {x, y, v, i};
  });
  const sailDir = Math.atan2(520 - 330, 1380 - 1060);
  const sailS = 0.5 * 7 * tau3 * tau3;
  const sx = 1380 + sailS * Math.cos(sailDir);
  const sy = 520 + sailS * Math.sin(sailDir);
  const cosd = Math.cos(sailDir);
  const sind = Math.sin(sailDir);
  const sailPt = (u: number): [number, number] => [sx - sind * u, sy + cosd * u]; // titik di layar (u ⟂ arah)
  const sun: [number, number] = [1060, 330];
  const coolLbl = ramp(t, wordOf(5, 'mendinginkan') - 0.3, wordOf(5, 'mendinginkan') + 0.6);
  const sailLbl = ramp(t, wordOf(5, 'layar') - 0.4, wordOf(5, 'layar') + 0.5);

  return (
    <AbsoluteFill>
      {/* ===================== fase 1 ===================== */}
      <AbsoluteFill style={{opacity: phA}}>
        <Stage>
          {/* jalur cahaya */}
          <line x1={140} y1={BAND_Y} x2={MIRROR_X - 6} y2={BAND_Y} stroke={C.faint} strokeWidth={2} strokeDasharray="4 10" />
          {/* cermin tergantung */}
          <g transform={`rotate(${mirrorAng} ${MIRROR_X + 6} 250)`}>
            <line x1={MIRROR_X + 6} y1={250} x2={MIRROR_X + 6} y2={380} stroke={C.muted} strokeWidth={2} />
            <rect x={MIRROR_X} y={380} width={14} height={180} rx={4} fill="#cfe3ff" />
            <rect x={MIRROR_X + 10} y={380} width={6} height={180} rx={3} fill="#56658f" />
            <rect x={MIRROR_X + 2} y={388} width={3} height={164} fill="#fff" opacity={0.7} />
          </g>
          <rect x={MIRROR_X - 40} y={236} width={92} height={14} rx={5} fill="#56658f" />
          <g opacity={pushF}>
            <Arrow x1={MIRROR_X + 24} y1={BAND_Y + 110} x2={MIRROR_X + 100} y2={BAND_Y + 110} color="force" width={5} pulse={false} />
            <Label x={MIRROR_X + 62} y={BAND_Y + 142} size={22} color={C.force} font="serif" italic>
              F
            </Label>
          </g>
          <Label x={MIRROR_X + 8} y={600} size={22} color={C.muted}>
            cermin
          </Label>
          <defs>
            <clipPath id="ph-band">
              <rect x={0} y={0} width={MIRROR_X} height={1080} />
            </clipPath>
          </defs>
          {packets.map(({k, tau, inc, ref, hitT}) => (
            <g key={k} clipPath="url(#ph-band)">
              <Packet xc={inc.x} y={BAND_Y} nm={lamPxMain / NMPX} color={WHITE} op={inc.op * (1 - green)} />
              <Packet xc={inc.x} y={BAND_Y} nm={lamPxMain / NMPX} color={GREEN} op={inc.op * green} />
              <Packet xc={ref.x} y={BAND_Y} nm={lamPxMain / NMPX} color={WHITE} op={ref.op * (1 - green)} />
              <Packet xc={ref.x} y={BAND_Y} nm={lamPxMain / NMPX} color={GREEN} op={ref.op * green} />
              <g opacity={arrowIn}>
                <Arrow x1={inc.x - pMain / 2} y1={BAND_Y - 92} x2={inc.x + pMain / 2} y2={BAND_Y - 92} color="spr" width={6} opacity={inc.op} />
                <Label x={inc.x + pMain / 2 + 26} y={BAND_Y - 92} size={28} color={C.spr} font="serif" italic weight={700} opacity={inc.op}>
                  p
                </Label>
                <Arrow x1={ref.x + pMain / 2} y1={BAND_Y - 92} x2={ref.x - pMain / 2} y2={BAND_Y - 92} color="spr" width={6} opacity={ref.op} />
              </g>
              {/* λ (baris 2) */}
              <g opacity={lamB * inc.op * green * ramp(inc.x, 300, 450) * (1 - ramp(inc.x, 1100, 1300))}>
                <line x1={inc.x + lamPxMain / 4} y1={BAND_Y + 64} x2={inc.x + (5 * lamPxMain) / 4} y2={BAND_Y + 64} stroke={GREEN} strokeWidth={3} markerStart="url(#arrow-work)" markerEnd="url(#arrow-work)" />
                <line x1={inc.x + lamPxMain / 4} y1={BAND_Y - 40} x2={inc.x + lamPxMain / 4} y2={BAND_Y + 74} stroke={GREEN} strokeOpacity={0.5} strokeWidth={1.5} strokeDasharray="4 5" />
                <line x1={inc.x + (5 * lamPxMain) / 4} y1={BAND_Y - 40} x2={inc.x + (5 * lamPxMain) / 4} y2={BAND_Y + 74} stroke={GREEN} strokeOpacity={0.5} strokeWidth={1.5} strokeDasharray="4 5" />
                <Label x={inc.x + (3 * lamPxMain) / 4} y={BAND_Y + 96} size={24} color={GREEN} font="serif" italic weight={600}>
                  λ = 500 nm
                </Label>
              </g>
              <Ripple x={MIRROR_X - 4} y={BAND_Y} p={ramp(tau, hitT - 0.05, hitT + 0.9, (q) => q)} r={90} color="force" rings={2} />
            </g>
          ))}
          {/* perbandingan merah vs biru (baris 1) */}
          <g opacity={cmp}>
            {[
              {nm: 700, c: RED, x0: 200, txt: 'merah 700 nm: λ panjang → p kecil'},
              {nm: 400, c: BLUE, x0: 1000, txt: 'biru 400 nm: λ pendek → p besar'},
            ].map(({nm, c, x0, txt}, i) => {
              const ph = (((t * 0.3 + i * 0.3) % 1) + 1) % 1;
              const xc = x0 + 230 + 220 * ph;
              const L = pOf(nm) * KP;
              return (
                <g key={nm}>
                  <g opacity={Math.min(1, ph * 5, (1 - ph) * 5)}>
                    <Packet xc={xc} y={740} nm={nm} color={c} amp={34} sig={110} width={3.5} />
                    <Arrow x1={xc - L / 2} y1={668} x2={xc + L / 2} y2={668} color="spr" width={5} pulse={false} />
                  </g>
                  <Label x={x0 + 340} y={830} size={24} color={c} weight={600}>
                    {txt}
                  </Label>
                </g>
              );
            })}
          </g>
          <Motes x={900} y={470} rx={760} ry={160} n={16} color="force" opacity={0.25} seed={3} />
        </Stage>
        <Badge x={330} y={300} text="massa = 0" color={C.muted} opacity={massB} scale={0.9 + 0.1 * massB} size={28} />
        <Badge x={580} y={300} text="momentum ≠ 0" color={C.spr} opacity={arrowIn} scale={0.9 + 0.1 * arrowIn} size={28} />
        <Formula x={1150} y={292} p={slot(t, cue(1) + 0.3, cue(2) + 0.5)} accent={C.spr} size={60} caption="h = tetapan Planck = 6,626×10⁻³⁴ J·s">
          <V color={C.spr}>p</V> = <Frac n={<V>h</V>} d={<V>λ</V>} />
        </Formula>
        <Formula x={960} y={770} p={slot(t, cue(2) + 0.7, cue(3) + 0.2)} accent={C.spr} size={56}>
          <V color={C.spr}>p</V> = <Frac n={<>6,626×10<Sup>−34</Sup></>} d={<>5×10<Sup>−7</Sup></>} />{' '}
          <span style={{opacity: ramp(t, wordOf(2, 'koma') - 0.6, wordOf(2, 'koma') + 0.2)}}>
            ≈ <Tint c={C.spr}>1,3×10<Sup>−27</Sup></Tint> <span style={{fontSize: 38}}>kg·m/s</span>
          </span>
        </Formula>
      </AbsoluteFill>

      {/* ===================== fase 2 ===================== */}
      <AbsoluteFill style={{opacity: phB}}>
        <Stage>
          {/* atom H */}
          <Glow x={ax} y={AY} r={orbitR * 1.9} color="cyan" opacity={0.55} />
          <circle cx={ax} cy={AY} r={orbitR} fill="none" stroke={C.cyan} strokeOpacity={0.5} strokeWidth={2} strokeDasharray="6 7" />
          <circle cx={ax} cy={AY} r={110} fill="none" stroke={C.gold} strokeOpacity={0.35 * excited} strokeWidth={2} strokeDasharray="3 8" />
          <circle cx={ax} cy={AY} r={13} fill="#ff7a8a" stroke="#ffd0d6" strokeWidth={1.5} />
          <circle cx={ax - 4} cy={AY - 4} r={4} fill="#fff" opacity={0.6} />
          <circle cx={ax + orbitR * Math.cos(eAng)} cy={AY - orbitR * Math.sin(eAng)} r={18} fill="url(#soft-cyan)" />
          <circle cx={ax + orbitR * Math.cos(eAng)} cy={AY - orbitR * Math.sin(eAng)} r={7} fill="#dff6ff" />
          <Label x={ax} y={AY + 150} size={26} color={C.ink} weight={600}>
            atom H
          </Label>
          <Ripple x={AX0} y={AY} p={ramp(t, tE - 0.05, tE + 1.1, (q) => q)} r={170} color="cyan" />
          {/* foton UV */}
          <Packet xc={uvX} y={AY} nm={121.6} color={UV} amp={36} sig={70} op={uvOp} width={3.5} />
          <g opacity={uvOp}>
            <Arrow x1={uvX - PB / 2} y1={AY + 84} x2={uvX + PB / 2} y2={AY + 84} color="spr" width={6} />
            <Label x={uvX} y={AY + 122} size={24} color={C.spr} weight={600}>
              p foton
            </Label>
            <Label x={uvX} y={AY - 62} size={22} color={UV} weight={600}>
              UV 121,6 nm
            </Label>
          </g>
          {/* tolakan atom */}
          <g opacity={recoilP}>
            <Arrow x1={ax - 70} y1={AY} x2={ax - 70 - PB * recoilP} y2={AY} color="spr" width={7} />
            <Label x={ax - 70 - PB / 2} y={AY - 30} size={24} color={C.spr} weight={600}>
              p atom
            </Label>
            {[0, 1, 2].map((k) => (
              <line key={k} x1={ax + 70 + k * 18} y1={AY - 30 + k * 30} x2={ax + 100 + k * 18} y2={AY - 30 + k * 30} stroke={C.ink} strokeOpacity={0.3} strokeWidth={2.5} strokeLinecap="round" />
            ))}
          </g>
          <g opacity={vLbl}>
            <Arrow x1={ax - 20} y1={AY + 106} x2={ax - 110} y2={AY + 106} color="cyan" width={5} pulse={false} />
            <Label x={ax - 128} y={AY + 106} size={26} color={C.cyan} anchor="end" weight={700}>
              v ≈ 3 m/s
            </Label>
          </g>
          <Twinkles x={ax - 160} y={AY + 106} rx={90} ry={24} n={4} color="cyan" opacity={real} seed={8} />
          {/* neraca Σp */}
          <g opacity={bal}>
            <Arrow x1={960} y1={624} x2={960 - PB} y2={624} color="spr" width={6} pulse={false} />
            <Arrow x1={960} y1={624} x2={960 + PB} y2={624} color="spr" width={6} pulse={false} />
            <circle cx={960} cy={624} r={6} fill={C.ink} />
            <Label x={960 - PB / 2} y={598} size={20} color="#d9c2ff">
              p atom
            </Label>
            <Label x={960 + PB / 2} y={598} size={20} color="#d9c2ff">
              p foton
            </Label>
            <Label x={960} y={660} size={22} color={C.ink} weight={600}>
              Σp = 0 sebelum dan sesudah
            </Label>
          </g>
          {/* senapan */}
          <g opacity={rifle}>
            <rect x={1220} y={690} width={600} height={180} rx={18} fill="rgba(10,16,36,0.72)" stroke={C.line} strokeWidth={2} />
            <Label x={1244} y={714} size={18} color={C.muted} anchor="start" weight={600} spacing={2}>
              SEPERTI SENAPAN
            </Label>
            <g transform={`translate(${recoil} 0)`}>
              <path d="M1300,790 L1380,776 L1520,776 L1530,770 L1530,792 L1400,794 L1392,812 L1372,812 L1376,800 L1300,812 Z" fill="#8a6a4a" stroke="#c9a57b" strokeWidth={2} strokeLinejoin="round" />
              <rect x={1430} y={772} width={100} height={8} rx={3} fill="#9fb0d8" />
            </g>
            {fireU > 0 && fireU < 0.15 ? <circle cx={1540} cy={781} r={18 * (1 - fireU / 0.15)} fill={C.gold} opacity={0.85} /> : null}
            <g opacity={bulletOp}>
              <rect x={bulletX} y={777} width={16} height={7} rx={3.5} fill={C.gold} />
            </g>
            <g opacity={Math.min(1, fireU > 0 ? 1 - ramp(fireU, 1.0, 1.6) : 0)}>
              <Arrow x1={1370} y1={840} x2={1310} y2={840} color="spr" width={5} pulse={false} />
              <Arrow x1={1560} y1={840} x2={1620} y2={840} color="spr" width={5} pulse={false} />
              <Label x={1440} y={840} size={18} color="#d9c2ff">
                sama besar, berlawanan
              </Label>
            </g>
          </g>
          <Motes x={900} y={480} rx={600} ry={220} n={14} color="cyan" opacity={0.25} seed={6} />
        </Stage>
        <Formula x={1380} y={258} p={slot(t, cue(3) + 0.3, cue(4) + 0.2)} accent={C.spr} size={56} caption="Lyman-α: elektron H turun n = 2 → 1">
          <V color={C.spr}>p</V> = <Frac n={<V>h</V>} d="121,6 nm" /> ≈ <Tint c={C.spr}>5,45×10<Sup>−27</Sup></Tint> <span style={{fontSize: 36}}>kg·m/s</span>
        </Formula>
        <Formula x={1380} y={258} p={slot(t, cue(4) + 0.2, cue(5) - 0.4)} accent={C.cyan} size={56} caption="≈ 3,3 m/s — kecil, tetapi terukur">
          <V color={C.cyan}>v</V> = <Frac n={<V>p</V>} d={<><V>m</V><Sub>H</Sub></>} /> = <Frac n={<>5,45×10<Sup>−27</Sup></>} d={<>1,67×10<Sup>−27</Sup></>} /> ≈ <Tint c={C.cyan}>3 m/s</Tint>
        </Formula>
      </AbsoluteFill>

      {/* ===================== fase 3 ===================== */}
      <AbsoluteFill style={{opacity: phC}}>
        <Stage>
          <defs>
            <clipPath id="ph-sail">
              <rect x={990} y={200} width={840} height={670} rx={22} />
            </clipPath>
          </defs>
          {/* --- pendinginan laser --- */}
          <rect x={110} y={200} width={830} height={670} rx={22} fill="rgba(10,16,36,0.7)" stroke={C.line} strokeWidth={2} />
          <Label x={525} y={240} size={24} color={C.heat} weight={700} spacing={2}>
            PENDINGINAN LASER
          </Label>
          <circle cx={525} cy={520} r={190} fill="#0b1430" stroke={C.faint} strokeWidth={3} />
          <circle cx={525} cy={520} r={176} fill="none" stroke="#fff" strokeOpacity={0.06} strokeWidth={10} />
          <path d={`M${525 - 150},${520 - 110} A186,186 0 0 1 ${525 + 40},${520 - 182}`} fill="none" stroke="#fff" strokeOpacity={0.18} strokeWidth={4} strokeLinecap="round" />
          <Label x={525} y={352} size={18} color={C.muted}>
            ruang hampa
          </Label>
          <rect x={196} y={494} width={658} height={52} fill={RED} opacity={0.12 + 0.04 * Math.sin(t * 5)} />
          <rect x={196} y={510} width={658} height={20} fill={RED} opacity={0.12} />
          {[
            [140, 1],
            [854, -1],
          ].map(([x, dir]) => (
            <g key={x}>
              <rect x={x} y={482} width={56} height={76} rx={8} fill="#2a355e" stroke={C.muted} strokeWidth={2} />
              <circle cx={dir > 0 ? x + 56 : x} cy={520} r={9} fill={RED} />
              <Label x={x + 28} y={586} size={18} color={C.muted}>
                laser
              </Label>
            </g>
          ))}
          <Stream pts={[[200, 512], [520, 512]]} color="heat" n={8} speed={0.9} r={4} opacity={0.7} jitter={2} />
          <Stream pts={[[850, 528], [530, 528]]} color="heat" n={8} speed={0.9} r={4} opacity={0.7} seed={2} jitter={2} />
          {atoms.map((a) => {
            const toward = a.v > 0 ? 1 : -1;
            const ph = (((t * 3.2 + a.i * 0.37) % 1) + 1) % 1;
            const fl = cyc(ph) * Math.min(1, Math.abs(a.v) / 200);
            return (
              <g key={a.i}>
                <circle cx={a.x + toward * 12} cy={a.y} r={10} fill={RED} opacity={0.6 * fl} />
                <circle cx={a.x} cy={a.y} r={22} fill="url(#soft-cyan)" />
                <circle cx={a.x} cy={a.y} r={9} fill="#dff6ff" />
                {a.i % 3 === 0 ? <Arrow x1={a.x} y1={a.y - 34 - a.i * 2} x2={a.x + a.v * 0.28} y2={a.y - 34 - a.i * 2} color="cyan" width={4} pulse={false} opacity={Math.min(1, Math.abs(a.v) / 80)} /> : null}
              </g>
            );
          })}
          <g opacity={coolLbl}>
            <Label x={525} y={660} size={24} color={C.ink} weight={600}>
              foton menahan atom yang bergerak
            </Label>
            <Label x={525} y={700} size={24} color={C.cyan} weight={600}>
              atom melambat → makin dingin
            </Label>
            <rect x={300} y={760} width={450} height={20} rx={10} fill="#1a2850" />
            <rect x={300} y={760} width={Math.max(8, 450 * cool * cool)} height={20} rx={10} fill={C.kin} opacity={0.9} />
            <Label x={290} y={770} size={20} color={C.muted} anchor="end">
              suhu
            </Label>
          </g>

          {/* --- layar surya --- */}
          <rect x={990} y={200} width={840} height={670} rx={22} fill="rgba(6,9,22,0.85)" stroke={C.line} strokeWidth={2} />
          <g clipPath="url(#ph-sail)">
            {Array.from({length: 34}, (_, i) => {
              const x = 990 + ((((rand(i * 1.7) * 840 - t * (6 + 10 * rand(i)) * (1 + tau3 * 0.2)) % 840) + 840) % 840);
              const y = 200 + rand(i * 3.9) * 670;
              return <circle key={i} cx={x} cy={y} r={0.8 + rand(i * 2.1) * 1.6} fill="#fff" opacity={0.3 + 0.5 * (0.5 + 0.5 * Math.sin(t * 2 + i))} />;
            })}
            <Glow x={sun[0]} y={sun[1]} r={220} color="gold" opacity={0.9} />
            <circle cx={sun[0]} cy={sun[1]} r={46} fill="#ffe08a" />
            <circle cx={sun[0]} cy={sun[1]} r={34} fill="#fff3c8" />
            {[-80, 0, 80].map((u, i) => (
              <Stream key={u} pts={[[sun[0] + 40, sun[1] + 20], sailPt(u)]} color="gold" n={7} speed={0.8} r={4} seed={i * 1.3} jitter={2} />
            ))}
            {[-80, 0, 80].map((u, i) => {
              const p = sailPt(u);
              return <Stream key={u} pts={[p, [p[0] - cosd * 160, p[1] - sind * 160]]} color="gold" n={4} speed={0.8} r={3} opacity={0.5} seed={i + 4} jitter={2} />;
            })}
            {/* layar + wahana */}
            <line x1={sailPt(-130)[0]} y1={sailPt(-130)[1]} x2={sx + cosd * 70} y2={sy + sind * 70} stroke={C.muted} strokeWidth={1.5} />
            <line x1={sailPt(130)[0]} y1={sailPt(130)[1]} x2={sx + cosd * 70} y2={sy + sind * 70} stroke={C.muted} strokeWidth={1.5} />
            <path
              d={`M${sailPt(-130)[0]},${sailPt(-130)[1]} Q${sx - cosd * 18},${sy - sind * 18} ${sailPt(130)[0]},${sailPt(130)[1]}`}
              fill="none"
              stroke="#e6f0ff"
              strokeWidth={7}
              strokeLinecap="round"
            />
            <circle cx={sx + cosd * 74} cy={sy + sind * 74} r={12} fill="#9fb0d8" stroke="#dfe7ff" strokeWidth={2} />
            <Arrow x1={sx + cosd * 100} y1={sy + sind * 100} x2={sx + cosd * 210} y2={sy + sind * 210} color="force" width={6} />
            <Label x={sx + cosd * 230 + 20} y={sy + sind * 230} size={24} color={C.force} font="serif" italic weight={700}>
              F
            </Label>
          </g>
          <Label x={1410} y={240} size={24} color={C.gold} weight={700} spacing={2}>
            LAYAR SURYA
          </Label>
          <Label x={sun[0] + 10} y={sun[1] + 80} size={20} color={C.gold} anchor="start">
            Matahari
          </Label>
          <g opacity={sailLbl}>
            <Label x={1410} y={830} size={24} color={C.ink} weight={600}>
              foton memantul → layar terdorong pelan-pelan
            </Label>
          </g>
        </Stage>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
