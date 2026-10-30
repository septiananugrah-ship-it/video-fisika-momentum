import React from 'react';
import {AbsoluteFill} from 'remotion';
import {BACK, EASE_IN_OUT, mix, ramp, rand, win} from '../anim';
import {Spring} from '../components/physics';
import {Arrow, Glow, Label, Motes, Ripple, Spark, Stage, Stream, Twinkles} from '../components/primitives';
import {useScene} from '../SceneContext';
import {C, FONT} from '../theme';

// Pembuka: tiga kejadian yang dihitung analitik —
// (A) ayunan Newton 5 bola (bandul, denyut momentum ungu merambat menembus bola tengah),
// (B) dua pemain sepatu luncur saling dorong (50 kg & 75 kg: momentum sama, yang ringan lebih cepat),
// (C) roket di ruang hampa (gas buang dihitung di kerangka lab: v_gas = V(saat lepas) − u),
// (D) ketiganya dikecilkan menjadi panel → kata "momentum" → dua kereta berpegas: p₁ dan p₂ berubah, Σp tetap.

const fr = (v: number) => ((v % 1) + 1) % 1;
const SRC_X = 960;
const SRC_Y = 540;

/* ------------------------------------------------------------------ */
/* A. Ayunan Newton                                                     */
/* ------------------------------------------------------------------ */
const FY = 250; // batang penggantung
const LEN = 330; // panjang tali
const BR = 40; // jari-jari bola
const BX = [0, 1, 2, 3, 4].map((k) => SRC_X + (k - 2) * 2 * BR);
const TH0 = 0.55; // simpangan awal (rad)
const TP = 1.7; // periode bandul (dtk)
const OM = (2 * Math.PI) / TP;
const DP = 0.14; // denyut menembus bola tengah (diperlambat agar terlihat)
const PER = TP + 2 * DP;

type Cradle = {th: number[]; om: number[]; pulse: number; dir: number; hitL: number; hitR: number};
const cradleAt = (t: number, pull: number, tr: number): Cradle => {
  const th = [0, 0, 0, 0, 0];
  const om = [0, 0, 0, 0, 0];
  let pulse = -1;
  let dir = 1;
  const t1 = tr + TP / 4;
  let hitL = -1;
  let hitR = -1;
  if (t < tr) {
    th[0] = -TH0 * pull;
  } else if (t < t1) {
    const s = t - tr;
    th[0] = -TH0 * Math.cos(OM * s);
    om[0] = TH0 * OM * Math.sin(OM * s);
  } else {
    const s = (t - t1) % PER;
    hitL = s;
    if (t - t1 >= DP + TP / 2) hitR = fr((t - t1 - DP - TP / 2) / PER) * PER;
    if (s < DP) {
      pulse = s / DP;
      dir = 1;
    } else if (s < DP + TP / 2) {
      const u = s - DP;
      th[4] = TH0 * Math.sin(OM * u);
      om[4] = TH0 * OM * Math.cos(OM * u);
    } else if (s < 2 * DP + TP / 2) {
      pulse = (s - DP - TP / 2) / DP;
      dir = -1;
    } else {
      const u = s - 2 * DP - TP / 2;
      th[0] = -TH0 * Math.sin(OM * u);
      om[0] = -TH0 * OM * Math.cos(OM * u);
    }
  }
  return {th, om, pulse, dir, hitL, hitR};
};

const CradleView: React.FC<{t: number; c: Cradle; arrows?: number; mini?: boolean}> = ({t, c, arrows = 1, mini}) => {
  const pos = c.th.map((th, k) => [BX[k] + LEN * Math.sin(th), FY + LEN * Math.cos(th)] as [number, number]);
  const px = c.pulse >= 0 ? (c.dir > 0 ? mix(BX[0] + BR, BX[4] - BR, c.pulse) : mix(BX[4] - BR, BX[0] + BR, c.pulse)) : 0;
  return (
    <g>
      <Glow x={SRC_X} y={FY + LEN} r={420} color="spr" opacity={0.28} />
      {/* rangka */}
      <rect x={600} y={700} width={720} height={26} rx={10} fill="#1a2550" stroke="#56628f" strokeWidth={2} />
      <rect x={612} y={704} width={696} height={5} rx={2.5} fill="#fff" opacity={0.08} />
      <path d={`M640,700 L640,${FY} L1280,${FY} L1280,700`} fill="none" stroke="#7d89b5" strokeWidth={9} strokeLinejoin="round" />
      <path d={`M640,700 L640,${FY} L1280,${FY} L1280,700`} fill="none" stroke="#c9d3ee" strokeOpacity={0.35} strokeWidth={2} strokeLinejoin="round" />
      {/* bayangan bola di alas */}
      {pos.map(([x], k) => (
        <ellipse key={`s${k}`} cx={x} cy={712} rx={BR * 0.9} ry={6} fill="#000" opacity={0.35} />
      ))}
      {/* tali V */}
      {pos.map(([x, y], k) => (
        <g key={`r${k}`} stroke="#c9d3ee" strokeOpacity={0.55} strokeWidth={2}>
          <line x1={BX[k] - 16} y1={FY} x2={x} y2={y} />
          <line x1={BX[k] + 16} y1={FY} x2={x} y2={y} />
        </g>
      ))}
      {/* denyut momentum di bola-bola tengah */}
      {[1, 2, 3].map((k) => {
        const near = c.pulse >= 0 ? Math.max(0, 1 - Math.abs(px - BX[k]) / (BR * 1.6)) : 0;
        return <Glow key={`g${k}`} x={BX[k]} y={FY + LEN} r={BR * 2.6} color="spr" opacity={near} still />;
      })}
      {pos.map(([x, y], k) => (
        <g key={`b${k}`}>
          <circle cx={x} cy={y} r={BR} fill="url(#hk-steel)" stroke="#e6ecff" strokeOpacity={0.5} strokeWidth={2} />
          <ellipse cx={x - BR * 0.34} cy={y - BR * 0.4} rx={BR * 0.28} ry={BR * 0.18} fill="#fff" opacity={0.75} />
          <circle cx={x + BR * 0.2} cy={y + BR * 0.3} r={BR * 0.55} fill="none" stroke="#fff" strokeOpacity={0.08} strokeWidth={3} />
        </g>
      ))}
      {c.pulse >= 0 ? (
        <Spark
          x={px}
          y={FY + LEN}
          r={mini ? 14 : 10}
          color="spr"
          opacity={Math.sin(Math.PI * Math.min(1, c.pulse * 1.1 + 0.05)) * 0.6 + 0.4}
          trail={[1, 2, 3, 4].map((k) => [px - c.dir * k * 14, FY + LEN] as [number, number])}
        />
      ) : null}
      {/* riak saat bola menumbuk */}
      {c.hitL >= 0 ? <Ripple x={BX[0] + BR} y={FY + LEN} p={c.hitL / 0.8} r={mini ? 120 : 90} color="spr" rings={2} /> : null}
      {c.hitR >= 0 ? <Ripple x={BX[4] - BR} y={FY + LEN} p={c.hitR / 0.8} r={mini ? 120 : 90} color="spr" rings={2} /> : null}
      {/* panah momentum di bola yang bergerak: panjang ∝ kecepatan */}
      {arrows > 0.001
        ? [0, 4].map((k) => {
            const v = (c.om[k] * Math.cos(c.th[k])) / (OM * TH0); // −1..1
            const [x, y] = pos[k];
            return <Arrow key={`a${k}`} x1={x} y1={y - BR - 34} x2={x + 150 * v} y2={y - BR - 34} color="spr" width={mini ? 12 : 7} opacity={arrows * Math.min(1, Math.abs(v) * 4)} />;
          })
        : null}
      {!mini ? <Motes x={SRC_X} y={FY + LEN - 40} rx={440} ry={220} n={22} color="spr" opacity={0.4} seed={3} /> : null}
    </g>
  );
};

/* ------------------------------------------------------------------ */
/* B. Sepatu luncur                                                     */
/* ------------------------------------------------------------------ */
const ICE = 760;
const KPX = 70; // px/s per m/s
const PUSH = 0.5;
const glideX = (s: number, v: number) => (s <= 0 ? 0 : s < PUSH ? (v * s * s) / (2 * PUSH) : (v * PUSH) / 2 + v * (s - PUSH));
const glideV = (s: number, v: number) => (s <= 0 ? 0 : s < PUSH ? (v * s) / PUSH : v);

const Skater: React.FC<{x: number; y: number; dir: 1 | -1; sc: number; reach: number; glide: number; t: number; color: string; seed: number}> = ({x, y, dir, sc, reach, glide, t, color, seed}) => {
  const breath = 2 * Math.sin(t * 2.2 + seed);
  const lean = mix(4, -10, glide); // condong ke belakang saat meluncur menjauh
  const sh: [number, number] = [dir * lean * 0.8, -188 + breath];
  const hip: [number, number] = [0, -104];
  const handF: [number, number] = [dir * mix(48, 70, reach) * (1 - glide) + dir * -30 * glide, mix(-160, -150, reach) + 40 * glide];
  const handB: [number, number] = [dir * mix(40, 66, reach) * (1 - glide) - dir * 55 * glide, mix(-150, -140, reach) + 10 * glide];
  const backFoot: [number, number] = [mix(-14 * dir, 46 * dir, glide), -8 - 10 * glide];
  const frontFoot: [number, number] = [12 * dir * (1 - glide) - 8 * dir * glide, -6];
  return (
    <g transform={`translate(${x} ${y}) scale(${sc})`}>
      <g stroke={C.ink} strokeWidth={8} strokeLinecap="round" fill="none">
        <path d={`M${hip[0]},${hip[1]} L${backFoot[0] * 0.5 + 4 * dir},-56 L${backFoot[0]},${backFoot[1]}`} />
        <path d={`M${hip[0]},${hip[1]} L${frontFoot[0] + 10 * dir},-54 L${frontFoot[0]},${frontFoot[1]}`} />
        <path d={`M${sh[0]},${sh[1] + 12} L${handB[0] * 0.55},${(sh[1] + handB[1]) / 2 + 6} L${handB[0]},${handB[1]}`} strokeOpacity={0.8} />
      </g>
      <path d={`M${hip[0] - 16},${hip[1] + 6} L${sh[0] - 18},${sh[1] + 6} Q${sh[0]},${sh[1] - 6} ${sh[0] + 18},${sh[1] + 6} L${hip[0] + 16},${hip[1] + 6} Z`} fill={color} stroke={C.ink} strokeOpacity={0.6} strokeWidth={2} />
      <path d={`M${sh[0]},${sh[1] + 12} L${handF[0] * 0.55},${(sh[1] + handF[1]) / 2 + 4} L${handF[0]},${handF[1]}`} stroke={C.ink} strokeWidth={8} strokeLinecap="round" fill="none" />
      <circle cx={sh[0] + dir * 4} cy={sh[1] - 30} r={21} fill={C.bg} stroke={C.ink} strokeWidth={6} />
      <path d={`M${sh[0] + dir * 4 - 20},${sh[1] - 38} Q${sh[0] + dir * 4},${sh[1] - 62} ${sh[0] + dir * 4 + 20},${sh[1] - 38}`} fill={color} opacity={0.9} />
      {/* sepatu + bilah */}
      {[backFoot, frontFoot].map(([fx, fy], k) => (
        <g key={k}>
          <rect x={fx - 14} y={fy - 14} width={30} height={14} rx={5} fill="#e9eefc" />
          <line x1={fx - 20} y1={fy + 4} x2={fx + 24} y2={fy + 4} stroke="#bfe9ff" strokeWidth={3} strokeLinecap="round" />
        </g>
      ))}
    </g>
  );
};

const SkaterView: React.FC<{t: number; s: number; labels?: number; mini?: boolean}> = ({t, s, labels = 1, mini}) => {
  const vL = 1.5 * KPX;
  const vH = 1.0 * KPX;
  const xL = 895 - glideX(s, vL);
  const xH = 1030 + glideX(s, vH);
  const f = s <= 0 ? 0 : Math.min(1, s / PUSH);
  const reach = s < 0 ? ramp(s, -0.8, 0) : 1 - ramp(s, PUSH, PUSH + 0.8);
  const glide = ramp(s, PUSH * 0.6, PUSH + 0.9, EASE_IN_OUT);
  const pLen = 150 * f; // momentum sama besar: 75 kg·m/s
  return (
    <g>
      <Glow x={SRC_X} y={ICE - 120} r={560} color="cyan" opacity={0.22} />
      {/* es */}
      <rect x={120} y={ICE} width={1680} height={110} fill="url(#hk-ice)" />
      <line x1={120} y1={ICE} x2={1800} y2={ICE} stroke="#cfeaff" strokeOpacity={0.7} strokeWidth={3} />
      {Array.from({length: 9}, (_, k) => {
        const x = 160 + k * 200 + 30 * Math.sin(t * 0.3 + k);
        return <path key={k} d={`M${x},${ICE + 26 + (k % 3) * 18} l90,0`} stroke="#dff3ff" strokeOpacity={0.12 + 0.08 * Math.sin(t + k)} strokeWidth={2} />;
      })}
      {/* goresan bilah di es */}
      {s > 0 ? (
        <g stroke="#e8f6ff" strokeLinecap="round" opacity={0.35}>
          <line x1={xL + 14} y1={ICE - 2} x2={895} y2={ICE - 2} strokeWidth={2} />
          <line x1={xH - 14} y1={ICE - 2} x2={1030} y2={ICE - 2} strokeWidth={2} />
        </g>
      ) : null}
      {/* pantulan */}
      <clipPath id={mini ? 'hk-iceclip-m' : 'hk-iceclip'}>
        <rect x={0} y={ICE} width={1920} height={120} />
      </clipPath>
      <g clipPath={`url(#${mini ? 'hk-iceclip-m' : 'hk-iceclip'})`}>
      <g transform={`translate(0 ${2 * ICE}) scale(1 -1)`} opacity={0.14}>
        <Skater x={xL} y={ICE} dir={1} sc={1.2} reach={reach} glide={glide} t={t} color="#ff8fc8" seed={0} />
        <Skater x={xH} y={ICE} dir={-1} sc={1.45} reach={reach} glide={glide} t={t} color="#6fb8ff" seed={2} />
      </g>
      </g>
      <Skater x={xL} y={ICE} dir={1} sc={1.2} reach={reach} glide={glide} t={t} color="#ff8fc8" seed={0} />
      <Skater x={xH} y={ICE} dir={-1} sc={1.45} reach={reach} glide={glide} t={t} color="#6fb8ff" seed={2} />
      {/* kilatan dorongan di tangan */}
      <Ripple x={962} y={ICE - 200} p={s / 0.9} r={110} color="force" rings={2} />
      {/* panah momentum (ungu, sama panjang) & kecepatan (toska, beda panjang) */}
      <Arrow x1={xL} y1={ICE - 360} x2={xL - pLen} y2={ICE - 360} color="spr" width={mini ? 12 : 8} opacity={Math.min(1, f * 3)} />
      <Arrow x1={xH} y1={ICE - 410} x2={xH + pLen} y2={ICE - 410} color="spr" width={mini ? 12 : 8} opacity={Math.min(1, f * 3)} />
      <Arrow x1={xL} y1={ICE + 50} x2={xL - (glideV(s, vL) / KPX) * 80} y2={ICE + 50} color="cyan" width={mini ? 10 : 6} opacity={Math.min(1, f * 3)} />
      <Arrow x1={xH} y1={ICE + 50} x2={xH + (glideV(s, vH) / KPX) * 80} y2={ICE + 50} color="cyan" width={mini ? 10 : 6} opacity={Math.min(1, f * 3)} />
      {labels > 0.001 ? (
        <g opacity={labels * ramp(s, PUSH + 0.3, PUSH + 1.0)}>
          <Label x={xL - pLen / 2} y={ICE - 396} size={28} color={C.spr} font="serif" italic weight={600}>
            p
          </Label>
          <Label x={xH + pLen / 2} y={ICE - 446} size={28} color={C.spr} font="serif" italic weight={600}>
            p
          </Label>
          <Label x={xL - 40} y={ICE + 86} size={22} color={C.cyan} font="mono">
            lebih cepat
          </Label>
          <Label x={xH + 40} y={ICE + 86} size={22} color={C.cyan} font="mono">
            lebih lambat
          </Label>
        </g>
      ) : null}
    </g>
  );
};

/* ------------------------------------------------------------------ */
/* C. Roket di ruang hampa                                              */
/* ------------------------------------------------------------------ */
const RX0 = 520;
const RY = 540;
const A0 = 26; // px/s² (bertambah karena massa roket berkurang)
const U_EX = 300; // laju gas relatif roket, px/s
const rocketV = (s: number) => (s <= 0 ? 0 : A0 * (s + 0.15 * s * s));
const rocketX = (s: number) => (s <= 0 ? RX0 : RX0 + A0 * (s * s * 0.5 + 0.05 * s * s * s));

const STARS = Array.from({length: 70}, (_, i) => ({x: rand(i * 3.1) * 1920, y: 170 + rand(i * 5.7) * 720, r: 0.8 + rand(i * 1.3) * 2, z: 0.2 + rand(i * 9.1) * 0.8}));

const RocketView: React.FC<{t: number; s: number; mini?: boolean; labels?: number}> = ({t, s, mini, labels = 1}) => {
  const x = rocketX(s);
  const V = rocketV(s);
  const on = s > 0 ? Math.min(1, s * 4) : 0;
  const nozzle = (tau: number) => rocketX(tau) - 125;
  const yw = (tt: number) => RY + 4 * Math.sin(tt * 1.7);
  const gas: React.ReactNode[] = [];
  if (s > 0) {
    const n = 46;
    for (let k = 0; k < n; k++) {
      const tau = Math.floor(s / 0.045) * 0.045 - k * 0.045;
      if (tau < 0) break;
      const age = s - tau;
      const vy = (rand(Math.round(tau / 0.045) * 1.7) - 0.5) * 70;
      const gx = nozzle(tau) + (rocketV(tau) - U_EX) * age;
      const gy = yw(tau) + vy * age;
      const life = age / 2.0;
      if (life >= 1) continue;
      gas.push(
        <g key={k} opacity={Math.min(1, life * 12) * (1 - life)}>
          <circle cx={gx} cy={gy} r={5 + 26 * life} fill={life < 0.25 ? 'url(#soft-gold)' : 'url(#soft-kin)'} />
          <circle cx={gx} cy={gy} r={2.5 + 3 * (1 - life)} fill={life < 0.2 ? '#fff4d0' : C.kin} opacity={0.8} />
        </g>,
      );
    }
  }
  // momentum gas = − momentum roket (mula-mula diam)
  const pLen = Math.min(260, V * 0.85);
  const fl = 1 + 0.12 * Math.sin(t * 31) + 0.08 * Math.sin(t * 17 + 1);
  return (
    <g>
      {STARS.map((st, i) => {
        const sx = ((((st.x - st.z * (x - RX0) * 0.35) % 1920) + 1920) % 1920);
        return <circle key={i} cx={sx} cy={st.y} r={st.r} fill="#dfe8ff" opacity={(0.35 + 0.4 * st.z) * (0.6 + 0.4 * Math.sin(t * (1 + st.z * 2) + i))} />;
      })}
      <Glow x={1500} y={300} r={260} color="spr" opacity={0.18} />
      <Glow x={x} y={yw(t)} r={300} color="cyan" opacity={0.2} />
      {gas}
      <g transform={`translate(${x} ${yw(t)}) rotate(${1.2 * Math.sin(t * 1.3)}) scale(1.6)`}>
        {on > 0 ? (
          <g opacity={on}>
            <path d={`M-78,-14 Q${-78 - 70 * fl},0 -78,14 Z`} fill={C.kin} opacity={0.8} />
            <path d={`M-78,-8 Q${-78 - 38 * fl},0 -78,8 Z`} fill="#fff4d0" />
            <circle cx={-90} cy={0} r={36} fill="url(#soft-gold)" />
          </g>
        ) : null}
        <path d="M-60,-22 L-96,-48 L-86,-22 Z M-60,22 L-96,48 L-86,22 Z" fill={C.heat} opacity={0.85} />
        <rect x={-86} y={-15} width={16} height={30} rx={4} fill="#5b6585" />
        <path d="M-72,-26 L48,-26 Q96,-18 112,0 Q96,18 48,26 L-72,26 Z" fill="#dfe6f8" stroke="#ffffff" strokeOpacity={0.6} strokeWidth={2} />
        <path d="M48,-26 Q96,-18 112,0 Q96,18 48,26 Z" fill={C.heat} opacity={0.9} />
        <rect x={-66} y={-20} width={110} height={6} rx={3} fill="#fff" opacity={0.5} />
        <circle cx={12} cy={0} r={11} fill="#16224a" stroke={C.cyan} strokeWidth={3} />
        <circle cx={9} cy={-3} r={3} fill="#fff" opacity={0.7} />
      </g>
      {/* momentum roket (kanan) dan gas (kiri) sama besar */}
      <Arrow x1={x + 20} y1={yw(t) - 100} x2={x + 20 + pLen} y2={yw(t) - 100} color="spr" width={mini ? 12 : 7} opacity={on} />
      <Arrow x1={x - 230} y1={yw(t) + 120} x2={x - 230 - pLen} y2={yw(t) + 120} color="spr" width={mini ? 12 : 7} opacity={on * 0.85} />
      {labels > 0.001 ? (
        <g opacity={labels * ramp(s, 1.0, 1.8)}>
          <Label x={x + 20 + pLen / 2} y={yw(t) - 136} size={24} color={C.spr} font="mono">
            roket
          </Label>
          <Label x={x - 230 - pLen / 2} y={yw(t) + 156} size={24} color={C.spr} font="mono">
            gas buang
          </Label>
        </g>
      ) : null}
    </g>
  );
};

/* ------------------------------------------------------------------ */
/* D. Dua kereta berpegas: p₁ ⇄ p₂, Σp tetap                            */
/* ------------------------------------------------------------------ */
const TRK = 700;
const VC = 34; // px/s (laju pusat massa)
const OMS = (2 * Math.PI) / 2.6;
const KP = 2.2; // px panah per px/s
const cartsAt = (s: number) => {
  const amp = VC / OMS;
  const x1 = 420 + VC * s + amp * Math.sin(OMS * s);
  const x2 = 660 + VC * s - amp * Math.sin(OMS * s);
  const v1 = VC * (1 + Math.cos(OMS * s));
  const v2 = VC * (1 - Math.cos(OMS * s));
  return {x1, x2, v1, v2};
};

const Cart: React.FC<{x: number; y: number; color: string; label: string; t: number; dist: number}> = ({x, y, color, label, dist}) => (
  <g transform={`translate(${x} ${y})`}>
    <ellipse cx={0} cy={6} rx={70} ry={7} fill="#000" opacity={0.35} />
    <rect x={-62} y={-78} width={124} height={66} rx={12} fill="url(#crate)" stroke={color} strokeWidth={3} />
    <rect x={-54} y={-72} width={108} height={8} rx={4} fill="#fff" opacity={0.1} />
    <text x={0} y={-45} textAnchor="middle" dominantBaseline="central" fontFamily={FONT.serif} fontStyle="italic" fontWeight={600} fontSize={30} fill={C.ink}>
      {label}
    </text>
    {[-36, 36].map((wx) => (
      <g key={wx} transform={`translate(${wx} -9) rotate(${(dist / 9) * (180 / Math.PI)})`}>
        <circle r={9} fill="#0b1022" stroke={C.muted} strokeWidth={3} />
        <line x1={-7} y1={0} x2={7} y2={0} stroke={C.muted} strokeWidth={2} />
      </g>
    ))}
  </g>
);

export const Hook: React.FC = () => {
  const {t, cue, wordOf, dur} = useScene();

  // fase
  const phA = 1 - ramp(t, cue(2) - 0.6, cue(2) + 0.1, EASE_IN_OUT);
  const phB = ramp(t, cue(2) - 0.2, cue(2) + 0.6) * (1 - ramp(t, cue(3) - 0.6, cue(3) + 0.1, EASE_IN_OUT));
  const phC = ramp(t, cue(3) - 0.2, cue(3) + 0.6) * (1 - ramp(t, cue(4) - 0.5, cue(4) + 0.2, EASE_IN_OUT));
  const phD = ramp(t, cue(4) - 0.1, cue(4) + 0.8);
  const panels = phD * (1 - ramp(t, cue(6) - 0.4, cue(6) + 0.4, EASE_IN_OUT));
  const phE = ramp(t, cue(6) - 0.1, cue(6) + 0.8);

  // A — ayunan Newton
  const pull = ramp(t, cue(0) + 0.2, wordOf(0, 'ujung') + 0.3, EASE_IN_OUT);
  const tr = wordOf(0, 'lepaskan') + 0.25;
  const cr = cradleAt(t, pull, tr);
  const camA = 1.16 + 0.07 * ramp(t, -0.8, cue(2), EASE_IN_OUT);
  const lStop = win(t, wordOf(1, 'berhenti') - 0.2, cue(2) - 1.0, 0.5, 0.5);
  const lThrow = win(t, wordOf(1, 'terlempar') - 0.2, cue(2) - 1.0, 0.5, 0.5);
  const lMove = win(t, wordOf(1, 'sesuatu') - 0.3, cue(2) - 0.8, 0.6, 0.5);

  // B — sepatu luncur
  const tp = wordOf(2, 'mendorong') + 0.1;
  const sB = t - tp;
  const lRest = win(t, wordOf(2, 'diam') - 0.3, cue(3) - 0.8, 0.5, 0.5);

  // C — roket
  const tig = wordOf(3, 'roket') - 0.2;
  const sC = t - tig;
  const lVac = win(t, wordOf(3, 'hampa') - 0.3, cue(4) - 0.6, 0.5, 0.5);
  const lNoPush = win(t, wordOf(3, 'tidak') - 0.2, cue(4) - 0.6, 0.5, 0.5);

  // D — panel & kata "momentum"
  const PX = [480, 960, 1440];
  const PYc = 360;
  const panelIn = [0, 1, 2].map((i) => ramp(t, cue(4) + 0.1 + i * 0.35, cue(4) + 0.9 + i * 0.35, BACK));
  const word = ramp(t, cue(5) - 0.15, cue(5) + 0.6, BACK);
  const wordUp = ramp(t, cue(6) - 0.4, cue(6) + 0.6, EASE_IN_OUT);
  const feed = win(t, wordOf(4, 'satu') - 0.2, cue(6) - 0.2, 0.6, 0.6);

  // E — kereta berpegas
  const sE = t - (cue(6) - 0.2);
  const ca = cartsAt(Math.max(0, sE));
  const tot = ramp(t, wordOf(6, 'jumlah') - 0.3, wordOf(6, 'jumlah') + 0.5);
  const tetap = ramp(t, wordOf(6, 'tetap') - 0.3, wordOf(6, 'tetap') + 0.4);
  const pin = ramp(t, wordOf(6, 'berpindah') - 0.4, wordOf(6, 'berpindah') + 0.4);
  const out = 1 - ramp(t, dur - 0.9, dur, EASE_IN_OUT);

  // loop mini (untuk panel)
  const sMiniB = fr(t / 5) * 5 - 0.7;
  const opMiniB = Math.min(1, (sMiniB + 0.7) * 3) * Math.min(1, (4.3 - sMiniB) * 3);
  const sMiniC = fr((t + 1.3) / 4.6) * 4.6 - 0.4;
  const opMiniC = Math.min(1, (sMiniC + 0.4) * 3) * Math.min(1, (4.2 - sMiniC) * 3);

  const barH = 300;
  const p1 = ca.v1 / (2 * VC);
  const p2 = ca.v2 / (2 * VC);

  return (
    <AbsoluteFill>
      <Stage>
        <defs>
          <radialGradient id="hk-steel" cx="35%" cy="30%" r="75%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="35%" stopColor="#b9c3e0" />
            <stop offset="75%" stopColor="#56608a" />
            <stop offset="100%" stopColor="#1d2445" />
          </radialGradient>
          <linearGradient id="hk-ice" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#9fd8ff" stopOpacity={0.28} />
            <stop offset="100%" stopColor="#9fd8ff" stopOpacity={0} />
          </linearGradient>
          {PX.map((x, i) => (
            <clipPath key={i} id={`hk-clip${i}`}>
              <rect x={x - 200} y={PYc - 135} width={400} height={270} rx={22} />
            </clipPath>
          ))}
        </defs>

        {/* ===== A ===== */}
        {phA > 0.001 ? (
          <g opacity={phA} transform={`translate(${SRC_X} ${SRC_Y}) scale(${camA}) translate(${-SRC_X} ${-SRC_Y})`}>
            <CradleView t={t} c={cr} arrows={ramp(t, tr, tr + 0.3)} />
            <Label x={BX[0] - 40} y={760} size={26} color={C.muted} font="mono" opacity={lStop}>
              berhenti
            </Label>
            <Label x={BX[4] + 120} y={760} size={26} color={C.muted} font="mono" opacity={lThrow}>
              terlempar
            </Label>
            <Label x={SRC_X} y={222} size={34} color={C.spr} weight={600} opacity={lMove}>
              sesuatu berpindah…?
            </Label>
          </g>
        ) : null}

        {/* ===== B ===== */}
        {phB > 0.001 ? (
          <g opacity={phB}>
            <SkaterView t={t} s={sB} />
            <Label x={SRC_X} y={250} size={30} color={C.muted} font="mono" opacity={lRest}>
              sebelumnya: keduanya diam
            </Label>
          </g>
        ) : null}

        {/* ===== C ===== */}
        {phC > 0.001 ? (
          <g opacity={phC}>
            <RocketView t={t} s={sC} />
            <Label x={300} y={230} size={28} color={C.muted} font="mono" anchor="start" opacity={lVac}>
              ruang hampa — tanpa udara
            </Label>
            <Label x={300} y={276} size={28} color={C.heat} font="mono" anchor="start" opacity={lNoPush}>
              tidak ada yang bisa didorong?
            </Label>
          </g>
        ) : null}

        {/* ===== D: tiga panel → "momentum" ===== */}
        {panels > 0.001 ? (
          <g opacity={panels}>
            {PX.map((x, i) => {
              const q = Math.min(1, panelIn[i]);
              return (
                <g key={i} opacity={q} transform={`translate(0 ${(1 - q) * 30})`}>
                  <rect x={x - 200} y={PYc - 135} width={400} height={270} rx={22} fill="rgba(10,16,36,0.85)" stroke={C.spr} strokeOpacity={0.45} strokeWidth={2} />
                  <g clipPath={`url(#hk-clip${i})`}>
                    <g transform={`translate(${x} ${PYc}) scale(${i === 0 ? 0.42 : i === 1 ? 0.3 : 0.32}) translate(${-SRC_X} ${i === 0 ? -480 : i === 1 ? -620 : -RY})`}>
                      {i === 0 ? <CradleView t={t} c={cr} mini /> : null}
                      {i === 1 ? (
                        <g opacity={opMiniB}>
                          <SkaterView t={t} s={sMiniB} labels={0} mini />
                        </g>
                      ) : null}
                      {i === 2 ? (
                        <g opacity={opMiniC} transform={`translate(${SRC_X - 680} 0)`}>
                          <RocketView t={t} s={sMiniC} labels={0} mini />
                        </g>
                      ) : null}
                    </g>
                  </g>
                  <Label x={x} y={PYc + 166} size={26} color={C.muted} font="mono">
                    {['ayunan Newton', 'sepatu luncur', 'roket'][i]}
                  </Label>
                </g>
              );
            })}
            {PX.map((x, i) => (
              <Stream
                key={`f${i}`}
                pts={[
                  [x, PYc + 196],
                  [mix(x, 960, 0.5), PYc + 250],
                  [960, 640],
                ]}
                color="spr"
                n={6}
                speed={0.7}
                r={5}
                seed={i * 2}
                opacity={feed}
              />
            ))}
          </g>
        ) : null}
        {word > 0.001 ? (
          <g opacity={Math.min(1, word) * (1 - wordUp)}>
            <Glow x={960} y={700} r={520} color="spr" opacity={0.55} />
            <Ripple x={960} y={700} p={ramp(t, cue(5) - 0.1, cue(5) + 1.6, (x) => x)} r={560} color="spr" rings={3} />
            <Twinkles x={960} y={700} rx={360} ry={70} n={7} color="spr" />
          </g>
        ) : null}

        {/* ===== E: dua kereta berpegas, Σp tetap ===== */}
        {phE > 0.001 ? (
          <g opacity={phE * out}>
            <Glow x={760} y={TRK - 60} r={520} color="spr" opacity={0.2} />
            <rect x={200} y={TRK} width={1100} height={18} rx={9} fill="#1a2550" stroke="#56628f" strokeWidth={2} />
            {Array.from({length: 22}, (_, k) => (
              <circle key={k} cx={225 + k * 50} cy={TRK + 9} r={2.5} fill={C.cyan} opacity={0.25 + 0.2 * Math.sin(t * 4 + k)} />
            ))}
            <Spring xa={ca.x1 + 62} xb={ca.x2 - 62} y={TRK - 45} coils={9} amp={14} color={C.muted} width={4} />
            {/* momentum mengalir lewat pegas, arahnya mengikuti siapa yang sedang menerima */}
            <Stream
              pts={[
                [ca.x1 + 70, TRK - 45],
                [ca.x2 - 70, TRK - 45],
              ]}
              color="spr"
              n={4}
              speed={1.2}
              r={4}
              jitter={2}
              opacity={pin * Math.max(0, Math.sin(OMS * Math.max(0, sE)))}
            />
            <Stream
              pts={[
                [ca.x2 - 70, TRK - 45],
                [ca.x1 + 70, TRK - 45],
              ]}
              color="spr"
              n={4}
              speed={1.2}
              r={4}
              jitter={2}
              seed={3}
              opacity={pin * Math.max(0, -Math.sin(OMS * Math.max(0, sE)))}
            />
            <Cart x={ca.x1} y={TRK} color={C.cyan} label="1" t={t} dist={ca.x1} />
            <Cart x={ca.x2} y={TRK} color={C.press} label="2" t={t} dist={ca.x2} />
            <Arrow x1={ca.x1} y1={TRK - 120} x2={ca.x1 + KP * ca.v1} y2={TRK - 120} color="spr" width={7} opacity={Math.min(1, ca.v1 / 8)} />
            <Arrow x1={ca.x2} y1={TRK - 120} x2={ca.x2 + KP * ca.v2} y2={TRK - 120} color="spr" width={7} opacity={Math.min(1, ca.v2 / 8)} />
            <Label x={ca.x1 - 28} y={TRK - 120} size={28} color={C.spr} font="serif" italic weight={600} anchor="end">
              p₁
            </Label>
            <Label x={ca.x2 - 28} y={TRK - 120} size={28} color={C.spr} font="serif" italic weight={600} anchor="end">
              p₂
            </Label>
            {/* total di bawah lintasan: panah tetap mengikuti pusat massa */}
            <g opacity={tot}>
              <Arrow x1={(ca.x1 + ca.x2) / 2 - KP * VC} y1={TRK + 66} x2={(ca.x1 + ca.x2) / 2 + KP * VC} y2={TRK + 66} color="spr" width={9} />
              <Label x={(ca.x1 + ca.x2) / 2 - KP * VC - 24} y={TRK + 66} size={28} color={C.spr} font="serif" italic weight={600} anchor="end">
                Σp
              </Label>
            </g>
            {/* batang */}
            <g transform="translate(1440 0)">
              <rect x={-40} y={300} width={380} height={490} rx={18} fill="rgba(10,16,36,0.75)" stroke={C.line} strokeWidth={2} />
              <line x1={-20} y1={720} x2={320} y2={720} stroke={C.muted} strokeWidth={2} />
              {[
                {x: 0, v: p1, c: '#d6b6ff', l: 'p₁'},
                {x: 110, v: p2, c: C.spr, l: 'p₂'},
              ].map((b) => (
                <g key={b.l}>
                  <rect x={b.x} y={720 - barH} width={70} height={barH} rx={8} fill={C.spr} opacity={0.07} />
                  <rect x={b.x} y={720 - barH * b.v} width={70} height={barH * b.v} rx={8} fill={b.c} opacity={0.9} />
                  <rect x={b.x + 8} y={720 - barH * b.v + 6} width={8} height={Math.max(0, barH * b.v - 12)} rx={4} fill="#fff" opacity={0.18} />
                  <Label x={b.x + 35} y={752} size={28} color={C.spr} font="serif" italic weight={600}>
                    {b.l}
                  </Label>
                </g>
              ))}
              <g opacity={tot}>
                <rect x={220} y={720 - barH * p1} width={70} height={barH * p1} fill="#d6b6ff" opacity={0.9} />
                <rect x={220} y={720 - barH} width={70} height={barH * p2} fill={C.spr} opacity={0.9} />
                <rect x={216} y={716 - barH} width={78} height={barH + 4} rx={8} fill="none" stroke={C.ink} strokeWidth={3} strokeDasharray="10 7" strokeDashoffset={-t * 22} />
                <Label x={255} y={752} size={28} color={C.ink} font="serif" italic weight={600}>
                  Σp
                </Label>
              </g>
              <Label x={255} y={720 - barH - 34} size={28} color={C.gold} weight={600} opacity={tetap}>
                tetap
              </Label>
              <Twinkles x={255} y={720 - barH / 2} rx={70} ry={160} n={5} color="spr" opacity={tetap} seed={4} />
              <Label x={150} y={332} size={22} color={C.muted} font="mono">
                momentum
              </Label>
            </g>
          </g>
        ) : null}
      </Stage>

      {/* kata "momentum" (HTML) */}
      {word > 0.001 ? (
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: mix(640, 196, wordUp),
            textAlign: 'center',
            fontFamily: FONT.head,
            fontWeight: 700,
            fontSize: mix(150, 76, wordUp),
            letterSpacing: mix(-3, 1, wordUp),
            color: C.spr,
            opacity: Math.min(1, word) * out,
            transform: `translateY(-50%) scale(${0.9 + 0.1 * Math.min(1, word)})`,
            textShadow: `0 0 ${46 + 16 * Math.sin(t * 2)}px rgba(183,125,255,0.6)`,
          }}
        >
          {'momentum'.split('').map((ch, i) => {
            const p = ramp(t, cue(5) - 0.15 + i * 0.04, cue(5) + 0.45 + i * 0.04, BACK);
            return (
              <span key={i} style={{display: 'inline-block', opacity: Math.min(1, p), translate: `0px ${(1 - p) * 40 + 3 * Math.sin(t * 1.6 - i * 0.5)}px`}}>
                {ch}
              </span>
            );
          })}
        </div>
      ) : null}
      {/* pemanis kecil di bawah kata saat masih besar */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 752,
          textAlign: 'center',
          fontFamily: FONT.mono,
          fontSize: 26,
          color: C.muted,
          letterSpacing: 4,
          opacity: ramp(t, cue(5) + 0.4, cue(5) + 1.2) * (1 - wordUp),
        }}
      >
        satu besaran · tidak pernah hilang
      </div>
    </AbsoluteFill>
  );
};
