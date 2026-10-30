import React from 'react';
import {AbsoluteFill} from 'remotion';
import {BACK, EASE_IN_OUT, cyc, mix, ramp, win} from '../anim';
import {Arrow, Badge, Formula, Frac, Glow, Label, Motes, Note, Ripple, Spark, Stage, Sub, Sup, Twinkles, V} from '../components/primitives';
import {useScene} from '../SceneContext';
import {C, FONT} from '../theme';

// Kiri: ayunan Newton (5 bola baja, L = 330 px, θ₀ = 28°, periode 1,8 s). Satu bola masuk → satu bola keluar:
//   bola kiri θ = θ₀·min(0, sin φ), bola kanan θ = θ₀·max(0, sin φ); tiga bola tengah diam. Momentum merambat
//   melalui bola tengah (denyut ungu) di setiap tumbukan.
// Kanan, fase A (baris 1–2): dua bola bermassa sama, lenting: v₁′ = 0, v₂′ = v (bertukar kecepatan).
// Fase B (baris 3–4): uji pikiran "dua bola keluar dengan v/2": p = 2m·v/2 = mv ✓, K = 2·½m(v/2)² = ¼mv² ✗.
// Fase C (baris 5): biliar tampak atas, tumbukan lurus: bola putih berhenti, bola sasaran melaju ke lubang.

const CXL = 470; // posisi akhir ayunan (kiri)
const TOP = 252;
const LEN = 330;
const BR = 40;
const TH0 = (28 * Math.PI) / 180;
const PER = 1.8;
const OM = (2 * Math.PI) / PER;
const fr = (x: number) => ((x % 1) + 1) % 1;
const slot = (t: number, a: number, b: number) => Math.min(ramp(t, a, a + 0.5), 1 - ramp(t, b - 0.45, b - 0.05, EASE_IN_OUT));

const Steel: React.FC<{x: number; y: number; r?: number; opacity?: number; tint?: string}> = ({x, y, r = BR, opacity = 1, tint}) => (
  <g opacity={opacity}>
    <circle cx={x} cy={y} r={r * 1.7} fill="url(#soft-cyan)" opacity={0.25} />
    <circle cx={x} cy={y} r={r} fill={tint ?? 'url(#el-steel)'} stroke="#dfe8ff" strokeOpacity={0.6} strokeWidth={2} />
    <ellipse cx={x - r * 0.32} cy={y - r * 0.36} rx={r * 0.3} ry={r * 0.18} fill="#fff" opacity={0.7} transform={`rotate(-30 ${x - r * 0.32} ${y - r * 0.36})`} />
    <path d={`M${x - r * 0.7},${y + r * 0.35} Q${x},${y + r * 0.85} ${x + r * 0.7},${y + r * 0.35}`} fill="none" stroke="#fff" strokeOpacity={0.18} strokeWidth={3} />
  </g>
);

const PoolBall: React.FC<{x: number; y: number; r: number; color: string; num?: string; spin: number; opacity?: number}> = ({x, y, r, color, num, spin, opacity = 1}) => (
  <g opacity={opacity}>
    <ellipse cx={x + 4} cy={y + 6} rx={r} ry={r * 0.8} fill="#000" opacity={0.3} />
    <circle cx={x} cy={y} r={r} fill={color} stroke="#fff" strokeOpacity={0.4} strokeWidth={1.5} />
    {num ? (
      <g>
        <circle cx={x + Math.cos(spin) * r * 0.35} cy={y + Math.sin(spin * 0.6) * r * 0.2} r={r * 0.42} fill="#fff" />
        <text x={x + Math.cos(spin) * r * 0.35} y={y + Math.sin(spin * 0.6) * r * 0.2} textAnchor="middle" dominantBaseline="central" fontFamily={FONT.head} fontWeight={700} fontSize={r * 0.6} fill="#111">
          {num}
        </text>
      </g>
    ) : null}
    <circle cx={x - r * 0.35} cy={y - r * 0.38} r={r * 0.22} fill="#fff" opacity={0.6} />
  </g>
);

export const Elastic: React.FC = () => {
  const {t, cue, wordOf} = useScene();
  const stageIn = ramp(t, -0.4, 0.8);

  // ===== ayunan Newton =====
  const slide = ramp(t, cue(1) - 0.6, cue(1) + 0.8, EASE_IN_OUT);
  const shiftX = mix(960 - CXL, 0, slide);
  const scl = mix(1.12, 1, slide);
  const phi = OM * (t + 0.45);
  const sn = Math.sin(phi);
  const thL = TH0 * Math.min(0, sn);
  const thR = TH0 * Math.max(0, sn);
  const balls = [0, 1, 2, 3, 4].map((i) => {
    const bx = CXL + (i - 2) * 2 * BR;
    const th = i === 0 ? thL : i === 4 ? thR : 0;
    return {ax: bx, x: bx + LEN * Math.sin(th), y: TOP + LEN * Math.cos(th)};
  });
  const vx = LEN * TH0 * OM * Math.cos(phi); // px/s bola aktif
  const activeIdx = sn >= 0 ? 4 : 0;
  const sinceHit = (((phi % Math.PI) + Math.PI) % Math.PI) / OM;
  const outRight = Math.floor(phi / Math.PI) % 2 === 0;
  const pq = sinceHit / 0.16;
  const pulseX = outRight ? mix(balls[0].ax, balls[4].ax, Math.min(1, pq)) : mix(balls[4].ax, balls[0].ax, Math.min(1, pq));
  const hitX = outRight ? balls[0].ax + BR : balls[4].ax - BR;
  const cradleP = ramp(t, wordOf(0, 'Newton') - 0.3, wordOf(0, 'Newton') + 0.5);
  const badge0 = win(t, wordOf(0, 'hampir') - 0.3, cue(1) - 0.3, 0.5, 0.5);

  // ===== fase kanan =====
  const phA = win(t, cue(1) + 0.1, cue(3) - 0.4, 0.6, 0.5);
  const phB = win(t, cue(3) - 0.1, cue(5) - 0.4, 0.6, 0.5);
  const phC = ramp(t, cue(5) - 0.1, cue(5) + 0.6);

  // fase A: dua bola, v = 200 px/s
  const PA = 3.4;
  const tauA = fr((t - cue(1) - 0.1) / PA) * PA;
  const envA = Math.min(1, tauA / 0.35) * Math.min(1, (PA - tauA) / 0.4);
  const TCA = 1.6;
  const XBA = 1400;
  const YA = 540;
  const xA1 = tauA < TCA ? XBA - 2 * BR - 200 * (TCA - tauA) : XBA - 2 * BR;
  const xA2 = tauA < TCA ? XBA : XBA + 200 * (tauA - TCA);
  const afterA = ramp(tauA, TCA, TCA + 0.05);
  const stopChip = ramp(t, wordOf(2, 'berhenti') - 0.3, wordOf(2, 'berhenti') + 0.4) * phA;
  const swap = ramp(t, wordOf(1, 'bertukar') - 0.3, wordOf(1, 'bertukar') + 0.6);

  // fase B: uji pikiran
  const inBall = ramp(t, cue(3) + 0.1, cue(3) + 0.8);
  const opt1 = ramp(t, wordOf(3, 'Dua') - 0.3, wordOf(3, 'Dua') + 0.4);
  const opt2 = ramp(t, wordOf(3, 'satu') - 0.4, wordOf(3, 'satu') + 0.3);
  const pChk = ramp(t, wordOf(3, 'momentumnya') - 0.4, wordOf(3, 'momentumnya') + 0.3);
  const kChk = ramp(t, wordOf(3, 'energi') - 0.3, wordOf(3, 'energi') + 0.4);
  const bigX = ramp(t, wordOf(3, 'tidak') - 0.2, wordOf(3, 'tidak') + 0.4, BACK);
  const win4 = ramp(t, wordOf(4, 'kedua') - 0.4, wordOf(4, 'kedua') + 0.4, BACK);
  const PB = 2.6;
  const tauB = fr((t - cue(3)) / PB) * PB;
  const glideB = 60 * (tauB / PB);
  const envB = Math.min(1, tauB / 0.3) * Math.min(1, (PB - tauB) / 0.4);

  // fase C: biliar
  const PC = 4.2;
  const tauC = fr((t - cue(5) - 0.1) / PC) * PC;
  const envC = Math.min(1, tauC / 0.3) * Math.min(1, (PC - tauC) / 0.45);
  const BRc = 24;
  const YC = 590;
  const XT = 1500;
  const VC = 380;
  const hitStick = 0.5;
  const xCue0 = 1140;
  const tHitC = hitStick + (XT - 2 * BRc - xCue0) / VC;
  const xCue = tauC < hitStick ? xCue0 : tauC < tHitC ? xCue0 + VC * (tauC - hitStick) : XT - 2 * BRc;
  const xTgt = tauC < tHitC ? XT : XT + VC * (tauC - tHitC);
  const pocketX = 1766;
  const inPocket = ramp(xTgt, pocketX - 20, pocketX + 10);
  const stickX = tauC < hitStick ? xCue0 - BRc - 30 - 60 * (1 - ramp(tauC, 0.1, hitStick, (x) => x * x)) : xCue0 - BRc - 30 - 40 * ramp(tauC, hitStick, hitStick + 0.6);
  const stopC = ramp(t, wordOf(5, 'berhenti') - 0.3, wordOf(5, 'berhenti') + 0.4);

  // kartu
  const k1 = slot(t, wordOf(1, 'bertukar') - 0.3, cue(2) + 0.2);
  const k2 = slot(t, cue(2) + 0.2, cue(3));
  const k3 = slot(t, wordOf(3, 'energi') - 0.4, cue(4));
  const k4 = slot(t, cue(4) + 0.1, cue(5));
  const k5 = ramp(t, wordOf(5, 'sasaran') - 0.4, wordOf(5, 'sasaran') + 0.3);

  return (
    <AbsoluteFill>
      <Stage>
        <defs>
          <radialGradient id="el-steel" cx="35%" cy="30%" r="80%">
            <stop offset="0%" stopColor="#f4f8ff" />
            <stop offset="35%" stopColor="#a9b6d8" />
            <stop offset="75%" stopColor="#4a5684" />
            <stop offset="100%" stopColor="#1c2346" />
          </radialGradient>
          <linearGradient id="el-felt" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0f6b4f" />
            <stop offset="100%" stopColor="#0a4a37" />
          </linearGradient>
        </defs>
        <g opacity={stageIn}>
          {/* ===== ayunan Newton ===== */}
          <g transform={`translate(${shiftX + CXL} 0) scale(${scl}) translate(${-CXL} 0)`} opacity={mix(1, 0.75, phC)}>
            <Glow x={CXL} y={520} r={360} color="cyan" opacity={0.18} />
            <rect x={CXL - 250} y={TOP - 14} width={500} height={16} rx={8} fill="#2a3462" stroke={C.muted} strokeWidth={2} />
            <rect x={CXL - 244} y={TOP - 2} width={10} height={470} fill="#25305a" stroke={C.muted} strokeOpacity={0.6} strokeWidth={1.5} />
            <rect x={CXL + 234} y={TOP - 2} width={10} height={470} fill="#25305a" stroke={C.muted} strokeOpacity={0.6} strokeWidth={1.5} />
            <rect x={CXL - 290} y={TOP + 466} width={580} height={22} rx={8} fill="#1c2550" stroke={C.muted} strokeWidth={2} />
            <ellipse cx={CXL} cy={TOP + 500} rx={300} ry={12} fill="#000" opacity={0.3} />
            {/* pantulan bola di alas */}
            {balls.map((b, i) => (
              <ellipse key={`r${i}`} cx={b.x} cy={TOP + 470} rx={BR * 0.8} ry={5} fill="#9fb4ff" opacity={0.08 + 0.1 * (1 - (TOP + LEN - b.y) / 60)} />
            ))}
            {balls.map((b, i) => (
              <g key={`s${i}`}>
                <line x1={b.ax - 16} y1={TOP} x2={b.x} y2={b.y - BR + 4} stroke="#c8d4f2" strokeOpacity={0.55} strokeWidth={1.6} />
                <line x1={b.ax + 16} y1={TOP} x2={b.x} y2={b.y - BR + 4} stroke="#c8d4f2" strokeOpacity={0.55} strokeWidth={1.6} />
              </g>
            ))}
            {balls.map((b, i) => (
              <Steel key={i} x={b.x} y={b.y} />
            ))}
            {/* denyut momentum menembus bola tengah */}
            {pq < 1.6 ? <Spark x={pulseX} y={TOP + LEN} r={9} color="spr" opacity={cyc(Math.min(0.99, pq / 1.6)) * cradleP} /> : null}
            <Ripple x={hitX} y={TOP + LEN} p={sinceHit / 0.7} r={70} color="cyan" />
            {/* panah momentum bola aktif */}
            <g opacity={cradleP}>
              <Arrow x1={balls[activeIdx].x} y1={balls[activeIdx].y - 74} x2={balls[activeIdx].x + vx * 0.22} y2={balls[activeIdx].y - 74} color="spr" width={6} pulse={false} />
            </g>
            <Motes x={CXL} y={TOP + LEN} rx={260} ry={80} n={14} color="cyan" opacity={0.45} />
          </g>

          {/* ===== fase A: bertukar kecepatan ===== */}
          <g opacity={phA}>
            <rect x={1000} y={YA + BR + 2} width={800} height={10} rx={4} fill="#1a2752" stroke={C.muted} strokeOpacity={0.5} strokeWidth={1.5} />
            <g opacity={envA}>
              <Steel x={xA1} y={YA} />
              <Steel x={xA2} y={YA} />
              <Ripple x={XBA - BR} y={YA} p={ramp(tauA, TCA, TCA + 0.8)} r={80} color="cyan" />
              <g opacity={1 - afterA}>
                <Arrow x1={xA1} y1={YA - 72} x2={xA1 + 120} y2={YA - 72} color="cyan" width={6} />
                <Label x={xA1 + 140} y={YA - 72} size={30} font="serif" italic color={C.cyan} weight={600} anchor="start">
                  v
                </Label>
                <Label x={xA2} y={YA - 72} size={28} font="mono" color={C.cyan} weight={600}>
                  0
                </Label>
              </g>
              <g opacity={afterA}>
                <Arrow x1={xA2} y1={YA - 72} x2={xA2 + 120} y2={YA - 72} color="cyan" width={6} />
                <Label x={xA2 + 140} y={YA - 72} size={30} font="serif" italic color={C.cyan} weight={600} anchor="start">
                  v
                </Label>
                <Label x={xA1} y={YA - 72} size={28} font="mono" color={C.cyan} weight={600}>
                  0
                </Label>
              </g>
            </g>
            <Badge x={1310} y={YA + 104} text="berhenti total" color={C.heat} opacity={stopChip * ramp(tauA, TCA, TCA + 0.2)} size={24} />
            {/* tabel tukar */}
            <g opacity={swap}>
              <rect x={1060} y={680} width={680} height={170} rx={16} fill="rgba(10,16,36,0.8)" stroke={C.cyan} strokeOpacity={0.45} strokeWidth={2} />
              <Label x={1200} y={710} size={22} color={C.muted} weight={600}>
                sebelum
              </Label>
              <Label x={1600} y={710} size={22} color={C.muted} weight={600}>
                sesudah
              </Label>
              <Label x={1200} y={760} size={30} font="serif" italic color={C.ink}>
                {'v₁ = v'}
              </Label>
              <Label x={1200} y={815} size={30} font="serif" italic color={C.ink}>
                {'v₂ = 0'}
              </Label>
              <Label x={1600} y={760} size={30} font="serif" italic color={C.ink}>
                {'v₁′ = 0'}
              </Label>
              <Label x={1600} y={815} size={30} font="serif" italic color={C.ink}>
                {'v₂′ = v'}
              </Label>
              <path d="M1290,760 C1380,760 1420,815 1510,815" fill="none" stroke={C.cyan} strokeWidth={3} markerEnd="url(#arrow-cyan)" opacity={0.85} />
              <path d="M1290,815 C1380,815 1420,760 1510,760" fill="none" stroke={C.cyan} strokeWidth={3} markerEnd="url(#arrow-cyan)" opacity={0.85} />
              <circle cx={1400} cy={787} r={10 + 3 * Math.sin(t * 4)} fill="url(#soft-cyan)" />
            </g>
          </g>

          {/* ===== fase B: uji pikiran ===== */}
          <g opacity={phB}>
            <g opacity={inBall}>
              <Label x={1020} y={360} size={24} color={C.muted} anchor="start" weight={600}>
                masuk:
              </Label>
              <Steel x={1150} y={360} r={30} />
              <Arrow x1={1150} y1={360} x2={1150 + 140} y2={360} color="cyan" width={6} />
              <Label x={1308} y={360} size={28} font="serif" italic color={C.cyan} anchor="start" weight={600}>
                v
              </Label>
              <Label x={1540} y={360} size={22} color={C.muted} weight={600}>
                keluar … ?
              </Label>
            </g>
            {/* opsi 1: dua bola v/2 */}
            <g opacity={opt1}>
              <rect x={1000} y={410} width={390} height={430} rx={18} fill="rgba(10,16,36,0.75)" stroke={C.heat} strokeOpacity={0.3 + 0.5 * bigX} strokeWidth={2} />
              <Label x={1195} y={440} size={24} color={C.ink} weight={600}>
                dua bola, masing-masing v/2
              </Label>
              <g opacity={envB}>
                <Steel x={1080 + glideB} y={510} r={28} opacity={0.75} />
                <Steel x={1136 + glideB} y={510} r={28} opacity={0.75} />
                <Arrow x1={1080 + glideB} y1={466} x2={1080 + glideB + 70} y2={466} color="cyan" width={4} pulse={false} />
                <Arrow x1={1136 + glideB} y1={480} x2={1136 + glideB + 70} y2={480} color="cyan" width={4} pulse={false} />
              </g>
              <g opacity={pChk}>
                <Label x={1020} y={590} size={26} font="serif" italic color={C.spr} anchor="start" weight={600}>
                  {'p = 2m·(v/2) = mv'}
                </Label>
                <Label x={1360} y={590} size={34} color={C.work} weight={700}>
                  ✓
                </Label>
              </g>
              <g opacity={kChk}>
                <Label x={1020} y={650} size={26} font="serif" italic color={C.kin} anchor="start" weight={600}>
                  {'K = ¼ mv²'}
                </Label>
                <rect x={1020} y={690} width={300} height={26} rx={7} fill="none" stroke={C.kin} strokeWidth={2} strokeDasharray="7 6" strokeDashoffset={-t * 16} opacity={0.7} />
                <rect x={1020} y={690} width={150} height={26} rx={7} fill={C.kin} />
                <rect x={1170} y={690} width={150} height={26} rx={7} fill={C.heat} opacity={0.25 + 0.2 * Math.sin(t * 4)} />
                <Label x={1245} y={703} size={18} font="mono" color="#fff">
                  hilang?
                </Label>
                <Label x={1170} y={750} size={20} color={C.muted}>
                  K awal = ½ mv²
                </Label>
              </g>
              <g opacity={bigX} transform={`translate(1195 620) scale(${0.6 + 0.4 * bigX})`}>
                <path d="M-90,-90 L90,90 M90,-90 L-90,90" stroke={C.heat} strokeWidth={22} strokeLinecap="round" opacity={0.85} />
              </g>
            </g>
            {/* opsi 2: satu bola v */}
            <g opacity={opt2}>
              <rect x={1410} y={410} width={390} height={430} rx={18} fill="rgba(10,16,36,0.75)" stroke={C.work} strokeOpacity={0.3 + 0.6 * win4} strokeWidth={2 + 2 * win4} />
              <Label x={1605} y={440} size={24} color={C.ink} weight={600}>
                satu bola, kecepatan v
              </Label>
              <g opacity={envB}>
                <Steel x={1500 + glideB * 2} y={510} r={28} />
                <Arrow x1={1500 + glideB * 2} y1={466} x2={1500 + glideB * 2 + 140} y2={466} color="cyan" width={4} pulse={false} />
              </g>
              <g opacity={pChk}>
                <Label x={1430} y={590} size={26} font="serif" italic color={C.spr} anchor="start" weight={600}>
                  {'p = m·v = mv'}
                </Label>
                <Label x={1770} y={590} size={34} color={C.work} weight={700}>
                  ✓
                </Label>
              </g>
              <g opacity={kChk}>
                <Label x={1430} y={650} size={26} font="serif" italic color={C.kin} anchor="start" weight={600}>
                  {'K = ½ mv²'}
                </Label>
                <Label x={1770} y={650} size={34} color={C.work} weight={700}>
                  ✓
                </Label>
                <rect x={1430} y={690} width={300} height={26} rx={7} fill={C.kin} />
                <Label x={1580} y={750} size={20} color={C.muted}>
                  sama dengan K awal
                </Label>
              </g>
              <Twinkles x={1605} y={600} rx={170} ry={180} n={6} color="work" opacity={win4} />
              <Glow x={1605} y={620} r={260} color="work" opacity={0.35 * win4} />
            </g>
          </g>

          {/* ===== fase C: biliar ===== */}
          <g opacity={phC}>
            <rect x={1000} y={360} width={800} height={460} rx={34} fill="#5a3a22" stroke="#8a5a34" strokeWidth={3} />
            <rect x={1030} y={390} width={740} height={400} rx={14} fill="url(#el-felt)" />
            <rect x={1030} y={390} width={740} height={400} rx={14} fill="none" stroke="#0c5a42" strokeWidth={10} opacity={0.7} />
            {[
              [1036, 396],
              [1400, 386],
              [1764, 396],
              [1036, 784],
              [1400, 794],
              [1764, 784],
            ].map(([x, y], i) => (
              <circle key={i} cx={x} cy={y} r={22} fill="#050912" stroke="#3a2614" strokeWidth={3} />
            ))}
            <line x1={1220} y1={400} x2={1220} y2={780} stroke="#fff" strokeOpacity={0.12} strokeWidth={2} />
            <circle cx={1220} cy={YC} r={4} fill="#fff" opacity={0.3} />
            <g opacity={envC}>
              {/* jejak gulir */}
              {tauC > hitStick ? <line x1={xCue0} y1={YC} x2={xCue} y2={YC} stroke="#fff" strokeOpacity={0.12} strokeWidth={BRc * 1.6} strokeLinecap="round" /> : null}
              {tauC > tHitC ? <line x1={XT} y1={YC} x2={Math.min(xTgt, pocketX)} y2={YC} stroke={C.gold} strokeOpacity={0.12} strokeWidth={BRc * 1.6} strokeLinecap="round" /> : null}
              <PoolBall x={Math.min(xTgt, pocketX)} y={YC + 4 * inPocket} r={BRc * (1 - 0.35 * inPocket)} color={C.gold} num="3" spin={(xTgt - XT) / BRc} opacity={1 - inPocket} />
              <PoolBall x={xCue} y={YC} r={BRc} color="#f4f4ee" spin={0} />
              {/* stik */}
              <g opacity={1 - ramp(tauC, hitStick + 0.3, hitStick + 0.9)}>
                <line x1={stickX - 170} y1={YC + 16} x2={stickX} y2={YC} stroke="#c88a55" strokeWidth={10} strokeLinecap="round" />
                <line x1={stickX - 18} y1={YC + 1.5} x2={stickX} y2={YC} stroke="#dfe8ff" strokeWidth={10} strokeLinecap="round" />
              </g>
              <Ripple x={XT - BRc} y={YC} p={ramp(tauC, tHitC, tHitC + 0.8)} r={70} color="gold" />
              <Ripple x={pocketX} y={394} p={ramp(xTgt, pocketX - 20, pocketX + 240)} r={60} color="work" />
              {/* panah momentum: berpindah dari bola putih ke bola sasaran */}
              {tauC > hitStick && tauC < tHitC ? <Arrow x1={xCue} y1={YC - 56} x2={xCue + 140} y2={YC - 56} color="spr" width={6} opacity={ramp(tauC, hitStick, hitStick + 0.1)} /> : null}
              {tauC >= tHitC ? <Arrow x1={Math.min(xTgt, pocketX)} y1={YC - 56} x2={Math.min(xTgt, pocketX) + 140} y2={YC - 56} color="spr" width={6} opacity={1 - inPocket} /> : null}
            </g>
            <Badge x={XT - 2 * BRc} y={YC + 74} text="berhenti di tempat" color={C.heat} opacity={stopC * envC * ramp(tauC, tHitC, tHitC + 0.2)} size={24} />
            <Label x={1400} y={845} size={20} color={C.muted} font="mono">
              tampak atas · tumbukan lurus
            </Label>
          </g>
        </g>
      </Stage>
      <Badge x={1580} y={430} text="bola baja: hampir lenting sempurna" color={C.cyan} opacity={badge0} size={28} />
      <Formula x={1400} y={222} p={k1} accent={C.cyan} caption="massa sama + lenting sempurna">
        <V>v</V>
        <Sub>1</Sub>′ = <V>v</V>
        <Sub>2</Sub> ,  <V>v</V>
        <Sub>2</Sub>′ = <V>v</V>
        <Sub>1</Sub>
      </Formula>
      <Formula x={1400} y={222} p={k2} accent={C.cyan} caption="bola yang datang berhenti, bola diam melaju">
        <V>v</V>
        <Sub>1</Sub>′ = 0 ,  <V>v</V>
        <Sub>2</Sub>′ = <V>v</V>
      </Formula>
      <Formula x={1400} y={222} p={k3} accent={C.heat} size={56}>
        2 · ½<V>m</V>
        <span>
          (<Frac n={<V>v</V>} d="2" />)
        </span>
        <Sup>2</Sup> = ¼<V>mv</V>
        <Sup>2</Sup> ≠ ½<V>mv</V>
        <Sup>2</Sup>
      </Formula>
      <Note x={1400} y={222} p={k4} color={C.work} size={32}>
        satu bola, kecepatan <i>v</i>: <span style={{color: C.spr}}>p ✓</span> dan <span style={{color: C.kin}}>K ✓</span>
      </Note>
      <Note x={1400} y={222} p={k5} color={C.spr} size={30}>
        bola putih berhenti, momentumnya pindah ke bola sasaran
      </Note>
    </AbsoluteFill>
  );
};
