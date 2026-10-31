import React from 'react';
import {AbsoluteFill} from 'remotion';
import {BACK, EASE_IN_OUT, mix, ramp, rand, win} from '../anim';
import {Arrow, Badge, Formula, Frac, Glow, Label, Motes, Ripple, Stage, Tint, Twinkles, V} from '../components/primitives';
import {useScene} from '../SceneContext';
import {C, FONT} from '../theme';

// Momentum = massa × kecepatan.
// Fase A (baris 0): truk merayap pelan (lajur atas) vs peluru yang melesat berulang (lajur bawah).
// Fase B (baris 1–2): kartu p = m v, satuan kg·m/s; balok di rel udara memantul pada bantalan pegas di
//   kedua ujung — kecepatan berbalik mulus (v = v₀ cos), panah momentum menyusut lalu tumbuh ke arah lain.
// Fase C (baris 3–5): SATU skala panah momentum: 0,3 px per kg·m/s → truk 2000 → 600 px, peluru 4 → 1,2 px
//   (lensa memperbesar panah peluru 100× → 120 px). 500 kotak kecil (masing-masing = p peluru) = p truk.

const KPX = 0.3; // px per kg·m/s (fase C)
const GT = 440; // lantai lajur truk
const GB = 650; // lantai lajur peluru
const BY = GB - 40; // ketinggian lintasan peluru
const truckX = (t: number) => 170 + 14 * t; // merayap pelan

const Truck: React.FC<{x: number; y: number; t: number; mass?: number}> = ({x, y, t, mass = 0}) => {
  const rot = ((x / 24) * 180) / Math.PI;
  const bob = 1.2 * Math.sin(t * 5.3);
  return (
    <g transform={`translate(${x} ${y})`}>
      <ellipse cx={-20} cy={4} rx={190} ry={9} fill="#000" opacity={0.4} />
      <g transform={`translate(0 ${bob})`}>
        <rect x={-196} y={-50} width={352} height={14} rx={5} fill="#232f5a" />
        <rect x={-190} y={-170} width={238} height={124} rx={9} fill="url(#crate)" stroke="#8ea0d6" strokeWidth={3} />
        <rect x={-180} y={-162} width={218} height={9} rx={4.5} fill="#fff" opacity={0.09} />
        {[-150, -110, -70, -30, 10].map((lx) => (
          <line key={lx} x1={lx} y1={-150} x2={lx} y2={-62} stroke="#8ea0d6" strokeOpacity={0.18} strokeWidth={2} />
        ))}
        <text x={-71} y={-108} textAnchor="middle" dominantBaseline="central" fontFamily={FONT.head} fontWeight={700} fontSize={34} fill={C.ink} opacity={mass}>
          2000 kg
        </text>
        <path d="M54,-44 L54,-132 L112,-132 L148,-84 L154,-44 Z" fill="#2a3a6e" stroke="#8ea0d6" strokeWidth={3} strokeLinejoin="round" />
        <path d="M66,-122 L106,-122 L134,-86 L66,-86 Z" fill={C.cyan} opacity={0.3} />
        <rect x={146} y={-70} width={10} height={12} rx={3} fill={C.gold} />
        <circle cx={160} cy={-64} r={26} fill="url(#soft-gold)" opacity={0.6} />
      </g>
      {[-150, -100, 108].map((wx) => (
        <g key={wx} transform={`translate(${wx} -22) rotate(${rot})`}>
          <circle r={24} fill="#0b1022" stroke={C.muted} strokeWidth={4} />
          <circle r={9} fill="#2a355e" />
          <line x1={-19} y1={0} x2={19} y2={0} stroke={C.muted} strokeWidth={3} />
          <line x1={0} y1={-19} x2={0} y2={19} stroke={C.muted} strokeWidth={3} />
        </g>
      ))}
    </g>
  );
};

const Bullet: React.FC<{x: number; y: number; s?: number}> = ({x, y, s = 1}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <rect x={-34} y={-8} width={34} height={16} rx={2} fill="#d9a441" stroke="#ffe3a0" strokeOpacity={0.6} strokeWidth={1} />
    <path d="M0,-8 Q20,-8 30,0 Q20,8 0,8 Z" fill="#c8743a" />
    <rect x={-32} y={-6} width={30} height={3} rx={1.5} fill="#fff" opacity={0.4} />
  </g>
);

// rel udara fase B: bantalan pegas di kedua ujung → kecepatan berbalik mulus
const XA = 470; // posisi pusat balok saat mulai menekan pegas kiri
const XB = 1450; // ... pegas kanan
const V0 = 300;
const TC = 0.5; // lama kontak pegas
const TR = (XB - XA) / V0;
const PERB = 2 * (TR + TC);
const glider = (s: number) => {
  const q = ((s % PERB) + PERB) % PERB;
  const A = (V0 * TC) / Math.PI;
  if (q < TR) return {x: XA + V0 * q, v: V0, cl: 0, cr: 0};
  if (q < TR + TC) {
    const u = (Math.PI * (q - TR)) / TC;
    return {x: XB + A * Math.sin(u), v: V0 * Math.cos(u), cl: 0, cr: A * Math.sin(u)};
  }
  if (q < 2 * TR + TC) return {x: XB - V0 * (q - TR - TC), v: -V0, cl: 0, cr: 0};
  const u = (Math.PI * (q - 2 * TR - TC)) / TC;
  return {x: XA - A * Math.sin(u), v: -V0 * Math.cos(u), cl: A * Math.sin(u), cr: 0};
};

const coil = (xa: number, xb: number, y: number, n = 8, amp = 14) => {
  let d = `M${xa},${y}`;
  for (let i = 1; i < 2 * n; i++) d += ` L${(xa + ((xb - xa) * i) / (2 * n)).toFixed(1)},${(y + (i % 2 ? -amp : amp)).toFixed(1)}`;
  return `${d} L${xb},${y}`;
};

export const MomentumScene: React.FC = () => {
  const {t, cue, wordOf} = useScene();

  const phA = ramp(t, -0.4, 0.8) * (1 - ramp(t, cue(1) - 0.5, cue(1) + 0.2, EASE_IN_OUT));
  const phB = ramp(t, cue(1) - 0.1, cue(1) + 0.7) * (1 - ramp(t, cue(3) - 0.6, cue(3) + 0.1, EASE_IN_OUT));
  const phC = ramp(t, cue(3) - 0.1, cue(3) + 0.7);
  const lanes = Math.max(phA, phC);

  const xT = truckX(t);
  const front = xT + 156;

  // peluru melesat berulang (siklus 1,7 dtk, terbang 0,3 dtk)
  const PER = 1.7;
  const ph = (((t + 0.4) / PER) % 1 + 1) % 1;
  const fly = ph / 0.18;
  const xEnd = mix(1780, 1240, phC);
  const xBul = mix(140, xEnd, Math.min(1, fly));
  const bulOp = fly < 1 ? Math.sqrt(Math.sin(Math.PI * fly)) : 0;

  // fase A
  const lTruck = win(t, wordOf(0, 'truk') - 0.3, cue(1) - 0.6, 0.5, 0.5);
  const lBul = win(t, wordOf(0, 'peluru') - 0.3, cue(1) - 0.6, 0.5, 0.5);
  const q = win(t, wordOf(0, 'sulit') - 0.3, cue(1) - 0.6, 0.6, 0.5);

  // fase B
  const fP = ramp(t, wordOf(1, 'momentum') - 0.3, wordOf(1, 'momentum') + 0.4);
  const fParts = ramp(t, wordOf(1, 'massa') - 0.2, wordOf(1, 'massa') + 0.4);
  const fV = ramp(t, wordOf(1, 'kecepatan') - 0.2, wordOf(1, 'kecepatan') + 0.4);
  const unit = ramp(t, wordOf(2, 'Satuannya') - 0.2, wordOf(2, 'Satuannya') + 0.5);
  const sB = t - (cue(1) + 0.2);
  const gl = glider(sB);
  const dirP = ramp(t, wordOf(2, 'arah') - 0.4, wordOf(2, 'arah') + 0.4);
  const vec = ramp(t, wordOf(2, 'vektor') - 0.3, wordOf(2, 'vektor') + 0.4);

  // fase C
  const mT = ramp(t, wordOf(3, 'dua') - 0.3, wordOf(3, 'dua') + 0.4);
  const vT = ramp(t, wordOf(3, 'satu') - 0.3, wordOf(3, 'satu') + 0.4);
  const pT = ramp(t, wordOf(3, 'bermomentum') - 0.2, wordOf(3, 'bermomentum') + 1.2, EASE_IN_OUT);
  const card3 = win(t, wordOf(3, 'bermomentum') - 0.2, cue(4) - 0.45, 0.6, 0.35);
  const lens = win(t, cue(4) - 0.1, cue(5) + 0.4, 0.7, 0.6);
  const mB = ramp(t, wordOf(4, 'sepuluh') - 0.3, wordOf(4, 'sepuluh') + 0.4);
  const vB = ramp(t, wordOf(4, 'empat') - 0.3, wordOf(4, 'empat') + 0.4);
  const pB = ramp(t, wordOf(4, 'bermomentum') - 0.2, wordOf(4, 'bermomentum') + 0.8, EASE_IN_OUT);
  const card4 = win(t, wordOf(4, 'bermomentum') - 0.2, cue(5) - 0.45, 0.6, 0.35);
  const tiny = win(t, wordOf(4, 'hanya') - 0.3, cue(5) + 0.4, 0.5, 0.6);
  const grid = ramp(t, cue(5) + 0.1, cue(5) + 0.7);
  const fill = ramp(t, wordOf(5, 'lima') - 0.5, wordOf(5, 'lima') + 1.4, EASE_IN_OUT);
  const card5 = ramp(t, wordOf(5, 'lima') - 0.2, wordOf(5, 'lima') + 0.5);
  const times = ramp(t, wordOf(5, 'kali') - 0.2, wordOf(5, 'kali') + 0.5, BACK);

  // 500 kotak: 25 × 20, masing-masing = p peluru (4 kg·m/s)
  const GX = 1310;
  const GY = 500;
  const CELL = 12;
  const nFill = Math.round(500 * fill);
  let gridD = '';
  for (let k = 0; k < nFill; k++) {
    const cx = GX + (k % 25) * CELL;
    const cy = GY + 19 * CELL - Math.floor(k / 25) * CELL;
    gridD += `M${cx + 1},${cy + 1}h${CELL - 2}v${CELL - 2}h${-(CELL - 2)}Z`;
  }

  const camC = 1 + 0.03 * ramp(t, cue(4), cue(4) + 2, EASE_IN_OUT) * (1 - ramp(t, cue(5), cue(5) + 1.5, EASE_IN_OUT));

  return (
    <AbsoluteFill>
      <Stage>
        <defs>
          <linearGradient id="mo-streak" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#ffe3a0" stopOpacity={0} />
            <stop offset="100%" stopColor="#ffe3a0" stopOpacity={0.8} />
          </linearGradient>
          <clipPath id="mo-lens">
            <circle cx={1600} cy={590} r={108} />
          </clipPath>
        </defs>

        {/* ================= lajur truk & peluru (fase A dan C) ================= */}
        {lanes > 0.001 ? (
          <g opacity={lanes} transform={`translate(960 540) scale(${camC}) translate(-960 -540)`}>
            <Glow x={xT} y={GT - 90} r={360} color="spr" opacity={0.18 + 0.2 * pT} />
            {/* jalan truk */}
            <rect x={100} y={GT} width={1720} height={44} fill="#121b3a" />
            <line x1={100} y1={GT} x2={1820} y2={GT} stroke={C.muted} strokeOpacity={0.7} strokeWidth={3} />
            {Array.from({length: 18}, (_, k) => (
              <rect key={k} x={110 + k * 100} y={GT + 19} width={50} height={5} rx={2.5} fill="#c9d3ee" opacity={0.25} />
            ))}
            <Truck x={xT} y={GT} t={t} mass={mT} />
            {/* debu kecil di roda belakang (pelan) */}
            {[0, 1, 2].map((k) => {
              const p = (((t * 0.7 + k / 3) % 1) + 1) % 1;
              return <circle key={k} cx={xT - 190 - 30 * p} cy={GT - 8 - 14 * p} r={3 + 6 * p} fill="#c9d3ee" opacity={0.25 * (1 - p) * Math.min(1, p * 6)} />;
            })}
            {/* lintasan peluru */}
            <line x1={100} y1={GB} x2={1820} y2={GB} stroke={C.line} strokeWidth={2} strokeDasharray="6 10" />
            {bulOp > 0.001 ? (
              <g opacity={bulOp}>
                <path d={`M${xBul - 36},${BY - 6} L${xBul - 360},${BY} L${xBul - 36},${BY + 6} Z`} fill="url(#mo-streak)" />
                <Bullet x={xBul} y={BY} />
                {[0, 1, 2].map((k) => (
                  <path key={k} d={`M${xBul - 60 - k * 70},${BY - 18 - k * 6} q20,${18 + k * 6} 0,${36 + k * 12}`} fill="none" stroke="#cfe0ff" strokeOpacity={0.25 - k * 0.06} strokeWidth={2} />
                ))}
              </g>
            ) : null}
            {/* fase A: label & tanya */}
            <Label x={xT - 20} y={GT - 210} size={28} color={C.muted} font="mono" opacity={lTruck * phA}>
              truk · merayap pelan
            </Label>
            <Label x={250} y={BY - 54} size={28} color={C.muted} font="mono" anchor="start" opacity={lBul * phA}>
              peluru · melesat
            </Label>
            {q > 0.001 ? (
              <g opacity={q * phA}>
                <Glow x={1460} y={270} r={200} color="gold" opacity={0.5} />
                <Label x={1460} y={262 + 6 * Math.sin(t * 2)} size={150} color={C.gold} weight={700}>
                  ?
                </Label>
                <Label x={1460} y={384} size={28} color={C.ink} weight={500}>
                  mana yang lebih sulit dihentikan?
                </Label>
              </g>
            ) : null}

            {/* fase C: data truk */}
            {phC > 0.001 ? (
              <g opacity={phC}>
                <Label x={xT - 20} y={GT - 212} size={28} color={C.cyan} font="mono" opacity={vT}>
                  v = 1 m/s
                </Label>
                <Arrow x1={front + 10} y1={GT - 100} x2={front + 10 + 2000 * KPX * pT} y2={GT - 100} color="spr" width={10} opacity={Math.min(1, pT * 5)} />
                <Label x={front + 10 + 2000 * KPX * 0.5} y={GT - 146} size={30} color={C.spr} weight={600} opacity={ramp(pT, 0.6, 1)}>
                  p = 2000 kg·m/s
                </Label>
                <Ripple x={front + 610} y={GT - 100} p={ramp(t, wordOf(3, 'bermomentum') + 1.0, wordOf(3, 'bermomentum') + 2.4, (x) => x)} r={110} color="spr" rings={2} />
                {/* data peluru */}
                <Label x={250} y={BY - 54} size={28} color={C.ink} font="mono" anchor="start" opacity={mB}>
                  m = 10 g = 0,010 kg
                </Label>
                <Label x={250} y={BY + 72} size={28} color={C.cyan} font="mono" anchor="start" opacity={vB}>
                  v = 400 m/s
                </Label>
                {/* panah peluru dengan skala yang sama: 4 × 0,3 = 1,2 px */}
                <g opacity={tiny}>
                  <rect x={720} y={BY + 66} width={1.2} height={12} fill={C.spr} />
                  <circle cx={720.6} cy={BY + 72} r={12} fill="none" stroke={C.spr} strokeOpacity={0.7} strokeWidth={2} strokeDasharray="3 4" />
                  <Label x={746} y={BY + 72} size={22} color={C.spr} font="mono" anchor="start">
                    ← panah p peluru, skala sama (1,2 px)
                  </Label>
                </g>
                {/* lensa pembesar */}
                {lens > 0.001 ? (
                  <g opacity={lens}>
                    <line x1={760} y1={BY} x2={1490} y2={575} stroke={C.spr} strokeOpacity={0.25} strokeWidth={2} strokeDasharray="5 8" />
                    <circle cx={1600} cy={590} r={112} fill="rgba(10,16,36,0.92)" stroke="#c9d3ee" strokeWidth={4} />
                    <g clipPath="url(#mo-lens)">
                      {Array.from({length: 9}, (_, k) => {
                        const p = (((t * 2.4 + rand(k) ) % 1) + 1) % 1;
                        const y = 510 + k * 20;
                        const x = 1720 - p * 260;
                        return <line key={k} x1={x} y1={y} x2={x + 60} y2={y} stroke="#cfe0ff" strokeOpacity={0.35 * Math.sin(Math.PI * p)} strokeWidth={2} strokeLinecap="round" />;
                      })}
                      <Bullet x={1560} y={612 + 2 * Math.sin(t * 9)} s={2.6} />
                      <Arrow x1={1500} y1={556} x2={1500 + 4 * KPX * 100 * pB} y2={556} color="spr" width={8} pulse={false} opacity={Math.min(1, pB * 5)} />
                    </g>
                    <circle cx={1600} cy={590} r={112} fill="none" stroke="#fff" strokeOpacity={0.15} strokeWidth={10} />
                    <Label x={1600} y={736} size={24} color={C.muted} font="mono">
                      panah diperbesar 100×
                    </Label>
                    <Label x={1600} y={668} size={28} color={C.spr} weight={600} opacity={ramp(pB, 0.5, 1)}>
                      p = 4 kg·m/s
                    </Label>
                  </g>
                ) : null}
                {/* 500 kotak = p truk */}
                {grid > 0.001 ? (
                  <g opacity={grid}>
                    <rect x={GX - 14} y={GY - 14} width={25 * CELL + 28} height={20 * CELL + 28} rx={12} fill="rgba(10,16,36,0.8)" stroke={C.spr} strokeOpacity={0.5} strokeWidth={2} />
                    <path d={gridD} fill={C.spr} opacity={0.9} />
                    <Label x={GX + 12.5 * CELL} y={GY + 20 * CELL + 44} size={26} color={C.spr} weight={600}>
                      {`${nFill} × p peluru`}
                    </Label>
                    <Label x={GX + 12.5 * CELL} y={GY + 20 * CELL + 80} size={22} color={C.muted} font="mono">
                      1 kotak = 4 kg·m/s
                    </Label>
                    <Twinkles x={GX + 12.5 * CELL} y={GY + 10 * CELL} rx={180} ry={130} n={6} color="spr" opacity={ramp(fill, 0.9, 1)} />
                  </g>
                ) : null}
              </g>
            ) : null}
            <Motes x={960} y={520} rx={820} ry={260} n={24} color="spr" opacity={0.35} seed={5} />
          </g>
        ) : null}

        {/* ================= fase B: p = m v dan arah ================= */}
        {phB > 0.001 ? (
          <g opacity={phB}>
            <Glow x={960} y={300} r={380} color="spr" opacity={0.3 * fP} />
            <Glow x={gl.x} y={640} r={240} color="spr" opacity={0.25} />
            {/* rel udara */}
            <rect x={300} y={690} width={1320} height={22} rx={11} fill="#1a2550" stroke="#56628f" strokeWidth={2} />
            {Array.from({length: 26}, (_, k) => (
              <circle key={k} cx={330 + k * 50} cy={701} r={2.5} fill={C.cyan} opacity={0.25 + 0.2 * Math.sin(t * 4 + k)} />
            ))}
            {/* dinding & pegas bantalan */}
            <rect x={300} y={570} width={18} height={120} rx={5} fill="#56628f" />
            <rect x={1602} y={570} width={18} height={120} rx={5} fill="#56628f" />
            <path d={coil(318, XA - 70 + gl.cl, 640)} fill="none" stroke={C.muted} strokeWidth={4} strokeLinejoin="round" />
            <path d={coil(XB + 70 + gl.cr, 1602, 640)} fill="none" stroke={C.muted} strokeWidth={4} strokeLinejoin="round" />
            <circle cx={XA - 70 + gl.cl} cy={640} r={34} fill="url(#soft-cyan)" opacity={Math.min(1, gl.cl / 20)} />
            <circle cx={XB + 70 + gl.cr} cy={640} r={34} fill="url(#soft-cyan)" opacity={Math.min(1, gl.cr / 20)} />
            {/* balok */}
            <g transform={`translate(${gl.x} 688)`}>
              <ellipse cx={0} cy={4} rx={72} ry={6} fill="#000" opacity={0.35} />
              <rect x={-70} y={-96} width={140} height={92} rx={12} fill="url(#crate)" stroke={C.ink} strokeOpacity={0.7} strokeWidth={3} />
              <rect x={-60} y={-88} width={120} height={8} rx={4} fill="#fff" opacity={0.1} />
              <text x={0} y={-50} textAnchor="middle" dominantBaseline="central" fontFamily={FONT.serif} fontStyle="italic" fontWeight={600} fontSize={40} fill={C.ink}>
                m
              </text>
            </g>
            <Arrow x1={gl.x} y1={560} x2={gl.x + gl.v * 0.55} y2={560} color="spr" width={9} opacity={Math.min(1, Math.abs(gl.v) / 40)} />
            <Arrow x1={gl.x} y1={790} x2={gl.x + gl.v * 0.3} y2={790} color="cyan" width={6} opacity={fV * Math.min(1, Math.abs(gl.v) / 40)} />
            <Label x={gl.x + gl.v * 0.3 + Math.sign(gl.v) * 26} y={790} size={30} color={C.cyan} font="serif" italic weight={600} opacity={fV * Math.min(1, Math.abs(gl.v) / 120)}>
              v
            </Label>
            <Label x={gl.x + gl.v * 0.55 + Math.sign(gl.v) * 30} y={560} size={30} color={C.spr} font="serif" italic weight={600} opacity={Math.min(1, Math.abs(gl.v) / 120)}>
              p
            </Label>
            {/* tanda arah: + saat ke kanan, − saat ke kiri (silang-pudar mengikuti kecepatan) */}
            <g opacity={dirP}>
              <Label x={gl.x} y={500} size={40} color={C.spr} weight={700} opacity={Math.max(0, Math.min(1, gl.v / 150))}>
                + (ke kanan)
              </Label>
              <Label x={gl.x} y={500} size={40} color={C.spr} weight={700} opacity={Math.max(0, Math.min(1, -gl.v / 150))}>
                − (ke kiri)
              </Label>
              <Arrow x1={330} y1={850} x2={520} y2={850} color="muted" width={4} pulse={false} />
              <Label x={540} y={850} size={24} color={C.muted} font="mono" anchor="start">
                arah positif
              </Label>
            </g>
            <Badge x={1460} y={850} text="besaran vektor: besar + arah" color={C.spr} opacity={vec} scale={0.9 + 0.1 * vec} size={26} />
          </g>
        ) : null}
      </Stage>

      {/* ================= kartu (HTML) ================= */}
      <Formula x={960} y={300} p={phB * fP} accent={C.spr} size={72} caption={<span style={{opacity: fParts}}>momentum = massa × kecepatan</span>}>
        <Tint c="spr">
          <V>p</V>
        </Tint>{' '}
        = <span style={{opacity: 0.25 + 0.75 * fParts}}>
          <V>m</V>
        </span>{' '}
        <span style={{opacity: 0.25 + 0.75 * fV}}>
          <Tint c="cyan">
            <V>v</V>
          </Tint>
        </span>
      </Formula>
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 412,
          textAlign: 'center',
          fontFamily: FONT.mono,
          fontSize: 30,
          color: C.muted,
          opacity: phB * unit,
          translate: `0px ${(1 - unit) * 10}px`,
        }}
      >
        satuan: <span style={{color: C.ink}}>kg · m/s</span>
      </div>
      <Formula x={880} y={800} p={phC * card3} accent={C.spr} size={56}>
        <Tint c="spr">
          <V>p</V>
        </Tint>{' '}
        = 2000 kg × <Tint c="cyan">1 m/s</Tint> = <Tint c="spr">2000 kg·m/s</Tint>
      </Formula>
      <Formula x={880} y={800} p={phC * card4} accent={C.spr} size={56}>
        <Tint c="spr">
          <V>p</V>
        </Tint>{' '}
        = 0,010 kg × <Tint c="cyan">400 m/s</Tint> = <Tint c="spr">4 kg·m/s</Tint>
      </Formula>
      <Formula x={720} y={800} p={phC * card5} accent={C.spr} size={56}>
        <Frac n={<Tint c="spr">2000</Tint>} d={<Tint c="spr">4</Tint>} /> = <span style={{color: C.gold, fontWeight: 600}}>500</span>
        <span style={{display: 'inline-block', opacity: times, transform: `scale(${0.6 + 0.4 * times})`, color: C.gold}}>×</span>
      </Formula>
    </AbsoluteFill>
  );
};
