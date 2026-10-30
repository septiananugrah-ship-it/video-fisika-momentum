import React from 'react';
import {AbsoluteFill} from 'remotion';
import {EASE, EASE_IN, EASE_IN_OUT, mix, ramp, win} from '../anim';
import {Plot, px, py, type Axes} from '../components/physics';
import {Arrow, Formula, Frac, Glow, Label, Motes, Part, Ripple, Stage, Tint, Twinkles, V} from '../components/primitives';
import {useScene} from '../SceneContext';
import {C, FONT} from '../theme';

// Impuls = gaya × selang waktu = perubahan momentum.
// Fase A (baris 0–3): kereta di rel (kamera mengikuti; garis rel bergulir sesuai posisi hasil integrasi).
//   Dorongan 1: gaya tetap selama Δt → p naik linear (grafik F–t persegi, luas hijau = F·Δt).
//   Dorongan 2 (baris 3): gaya berbentuk benjolan sin² → p naik mengikuti integralnya; luas di bawah kurva = J.
//   Skala panah momentum: 30 px per kg·m/s (kedua dorongan masing-masing J = 3 satuan).
// Fase B (baris 4–6): bola 0,4 kg datang ke KIRI 10 m/s (v₁ = −10 m/s), ditendang ke KANAN 15 m/s (v₂ = +15 m/s),
//   arah kanan positif: Δp = 0,4·(15 − (−10)) = +10 N·s. Kontak 0,02 s → F̄ = 500 N (kurva sin², puncak 1000 N).
//   Gerak bola diperlambat (26 px/s per m/s); selama kontak kecepatan berubah mulus dari v₁ ke v₂.

const KP = 30; // px per kg·m/s
const CART_X = 520;
const GA = 560; // lantai fase A
const KV = 25; // px/s per kg·m/s (laju kereta)

const g2 = (u: number) => (u <= 0 ? 0 : u >= 1 ? 1 : u - Math.sin(2 * Math.PI * u) / (2 * Math.PI));
const int2 = (u: number) => (u <= 0 ? 0 : u >= 1 ? 0.5 + (u - 1) : u * u * 0.5 + (Math.cos(2 * Math.PI * u) - 1) / (4 * Math.PI * Math.PI));
const int1 = (u: number) => (u <= 0 ? 0 : u >= 1 ? 0.5 + (u - 1) : u * u * 0.5);

/** Grafik F–t langsung (pena berjalan), luas di bawah kurva diwarnai hijau. */
const LiveFT: React.FC<{x0: number; y0: number; w: number; h: number; dt: number; pen: number; bump: boolean; op: number; t: number; areaLabel: string; showDt: number}> = ({
  x0,
  y0,
  w,
  h,
  dt,
  pen,
  bump,
  op,
  t,
  areaLabel,
  showDt,
}) => {
  if (op <= 0.001) return null;
  const T0 = -0.5;
  const T1 = dt + 0.8;
  const gx = (tau: number) => x0 + 24 + ((tau - T0) / (T1 - T0)) * (w - 40);
  const F = (tau: number) => (tau < 0 || tau > dt ? 0 : bump ? Math.sin((Math.PI * tau) / dt) ** 2 : 1);
  const FH = bump ? h * 0.92 : h * 0.55; // tinggi: persegi F tetap, benjolan puncak = 2× rata-rata (luas sama)
  const end = Math.min(pen, T1);
  const pts: string[] = [];
  const area: string[] = [];
  if (end > T0) {
    const n = 80;
    for (let i = 0; i <= n; i++) {
      const tau = T0 + ((end - T0) * i) / n;
      // persegi: sudut tegak digambar sebagai langkah tajam
      pts.push(`${i ? 'L' : 'M'}${gx(tau).toFixed(1)},${(y0 - FH * F(tau)).toFixed(1)}`);
    }
    if (!bump) {
      // pastikan sisi tegak persegi tampak (sampel di tepi)
      pts.length = 0;
      const e = Math.min(end, T1);
      pts.push(`M${gx(T0)},${y0}`);
      if (e > 0) pts.push(`L${gx(0)},${y0} L${gx(0)},${y0 - FH}`);
      if (e > 0) pts.push(`L${gx(Math.min(e, dt))},${y0 - FH}`);
      if (e > dt) pts.push(`L${gx(dt)},${y0} L${gx(e)},${y0}`);
      if (e <= 0) pts.push(`L${gx(e)},${y0}`);
    }
    const a1 = Math.min(Math.max(end, 0), dt);
    if (a1 > 0) {
      const m = 40;
      area.push(`M${gx(0)},${y0}`);
      for (let i = 0; i <= m; i++) {
        const tau = (a1 * i) / m;
        area.push(`L${gx(tau).toFixed(1)},${(y0 - FH * (bump ? F(tau) : 1)).toFixed(1)}`);
      }
      area.push(`L${gx(a1)},${y0} Z`);
    }
  }
  const penX = gx(Math.max(T0, end));
  const penY = y0 - FH * F(Math.max(T0, end));
  const done = ramp(pen, dt, dt + 0.4);
  return (
    <g opacity={op}>
      <rect x={x0 - 60} y={y0 - h - 70} width={w + 120} height={h + 140} rx={18} fill="rgba(10,16,36,0.7)" stroke={C.line} strokeWidth={2} />
      <line x1={x0} y1={y0} x2={x0 + w + 10} y2={y0} stroke={C.muted} strokeWidth={3} markerEnd="url(#arrow-muted)" />
      <line x1={x0} y1={y0 + 8} x2={x0} y2={y0 - h - 30} stroke={C.muted} strokeWidth={3} markerEnd="url(#arrow-muted)" />
      <Label x={x0 + w + 30} y={y0} size={28} font="serif" italic anchor="start">
        t
      </Label>
      <Label x={x0 + 16} y={y0 - h - 40} size={28} font="serif" italic anchor="start" color={C.force}>
        F
      </Label>
      {area.length ? <path d={area.join(' ')} fill={C.work} opacity={0.55} /> : null}
      {pts.length ? <path d={pts.join(' ')} fill="none" stroke={C.force} strokeWidth={4} strokeLinejoin="round" /> : null}
      {pen > T0 && pen < T1 ? <circle cx={penX} cy={penY} r={7} fill={C.force} /> : null}
      {pen > T0 && pen < T1 ? <circle cx={penX} cy={penY} r={22} fill="url(#soft-force)" /> : null}
      {/* Δt di sumbu waktu */}
      <g opacity={showDt}>
        <line x1={gx(0)} y1={y0 + 30} x2={gx(dt)} y2={y0 + 30} stroke={C.ink} strokeWidth={2} markerStart="url(#arrow-ink)" markerEnd="url(#arrow-ink)" />
        <Label x={(gx(0) + gx(dt)) / 2} y={y0 + 56} size={26} font="serif" italic>
          Δt
        </Label>
      </g>
      <Label x={(gx(0) + gx(dt)) / 2} y={y0 - FH * (bump ? 0.32 : 0.5)} size={30} color="#eafff4" weight={600} opacity={done}>
        {areaLabel}
      </Label>
      <Twinkles x={(gx(0) + gx(dt)) / 2} y={y0 - FH * 0.4} rx={(gx(dt) - gx(0)) / 2} ry={FH * 0.3} n={4} color="work" opacity={done} seed={t > 0 ? 3 : 4} />
    </g>
  );
};

/** Kaki dua ruas (IK sederhana), lutut di sisi depan (+x). */
const leg = (hx: number, hy: number, fx: number, fy: number, L = 112) => {
  const dx = fx - hx;
  const dy = fy - hy;
  const d = Math.min(2 * L - 0.5, Math.hypot(dx, dy));
  const ux = dx / Math.hypot(dx, dy);
  const uy = dy / Math.hypot(dx, dy);
  const ex = hx + ux * d;
  const ey = hy + uy * d;
  const hgt = Math.sqrt(Math.max(0, L * L - (d / 2) ** 2));
  // normal ke arah depan (+x)
  let nx = -uy;
  let ny = ux;
  if (nx < 0) {
    nx = -nx;
    ny = -ny;
  }
  const kx = hx + (ux * d) / 2 + nx * hgt;
  const ky = hy + (uy * d) / 2 + ny * hgt;
  return {kx, ky, ex, ey};
};

// fase B
const GBY = 520; // tanah
const BR = 32;
const BCY = GBY - BR;
const XC = 560; // pusat bola saat kontak mulai
const V1 = -260; // −10 m/s
const V2 = 390; // +15 m/s
const TAU = 0.16; // kontak (diperlambat)
const HIP: [number, number] = [420, 332];
const PK = 7.5;

const ballAt = (s: number) => {
  if (s < 0) return {x: XC + V1 * s, v: V1, d: 0};
  if (s <= TAU) {
    const x = XC + V1 * s + (V2 - V1) * ((s * s) / (2 * TAU) + (TAU / (4 * Math.PI * Math.PI)) * (Math.cos((2 * Math.PI * s) / TAU) - 1));
    const d = (V2 - V1) * (s / 2 - (s * s) / (2 * TAU) - (TAU / (4 * Math.PI * Math.PI)) * (Math.cos((2 * Math.PI * s) / TAU) - 1));
    const v = V1 + (V2 - V1) * (s / TAU - Math.sin((2 * Math.PI * s) / TAU) / (2 * Math.PI));
    return {x, v, d};
  }
  return {x: XC + (TAU * (V1 + V2)) / 2 + V2 * (s - TAU), v: V2, d: 0};
};

const footAt = (s: number): [number, number] => {
  const rest: [number, number] = [452, GBY];
  const back: [number, number] = [292, 440];
  const hit: [number, number] = [XC - BR, BCY];
  const thru: [number, number] = [650, 392];
  if (s < -0.62) return rest;
  if (s < -0.3) {
    const p = ramp(s, -0.62, -0.3, EASE_IN_OUT);
    return [mix(rest[0], back[0], p), mix(rest[1], back[1], p) - 30 * Math.sin(Math.PI * p)];
  }
  if (s < 0) {
    const p = ramp(s, -0.3, 0, EASE_IN);
    return [mix(back[0], hit[0], p), mix(back[1], hit[1], p) + 30 * Math.sin(Math.PI * p)];
  }
  if (s < TAU) return [hit[0] + ((V1 + V2) / 2) * s, hit[1]];
  const c: [number, number] = [hit[0] + ((V1 + V2) / 2) * TAU, hit[1]];
  if (s < TAU + 0.4) {
    const p = ramp(s, TAU, TAU + 0.4, EASE);
    return [mix(c[0], thru[0], p), mix(c[1], thru[1], p)];
  }
  const p = ramp(s, TAU + 0.6, TAU + 1.6, EASE_IN_OUT);
  return [mix(thru[0], rest[0], p), mix(thru[1], rest[1], p) - 20 * Math.sin(Math.PI * p)];
};

export const Impulse: React.FC = () => {
  const {t, cue, cueEnd, wordOf} = useScene();

  const phA = ramp(t, -0.4, 0.8) * (1 - ramp(t, cue(4) - 0.6, cue(4) + 0.1, EASE_IN_OUT));
  const phB = ramp(t, cue(4) - 0.2, cue(4) + 0.6);

  // ---------- fase A ----------
  const tA = wordOf(0, 'memberinya') + 0.1;
  const dA = Math.max(1.2, Math.min(2.4, cueEnd(0) + 0.2 - tA));
  const tB = wordOf(3, 'impuls') - 0.3;
  const dB = Math.max(1.3, Math.min(2.6, cueEnd(3) - tB));
  const uA = (t - tA) / dA;
  const uB = (t - tB) / dB;
  const p = 3 * Math.min(1, Math.max(0, uA)) + 3 * g2(uB);
  const X = KV * 3 * (dA * int1(uA) + dB * int2(uB));
  const fA = uA > 0 && uA < 1 ? 1 : 0;
  const fAop = Math.min(ramp(t, tA - 0.12, tA), 1 - ramp(t, tA + dA, tA + dA + 0.12));
  const fB = uB > 0 && uB < 1 ? Math.sin(Math.PI * uB) ** 2 : 0;
  const Flen = 150 * fA * fAop + 260 * fB;
  const g1op = 1 - ramp(t, tB - 1.0, tB - 0.4, EASE_IN_OUT);
  const g2op = ramp(t, tB - 0.6, tB - 0.1);
  const card1 = win(t, wordOf(1, 'impuls') - 0.3, cue(2) - 0.45, 0.6, 0.35);
  const c1dp = ramp(t, wordOf(1, 'perubahan') - 0.2, wordOf(1, 'perubahan') + 0.4);
  const card2a = win(t, cue(2) + 0.05, wordOf(2, 'kali') - 0.55, 0.6, 0.35);
  const card2b = ramp(t, wordOf(2, 'kali') - 0.2, wordOf(2, 'kali') + 0.4);
  const graphA = ramp(t, tA - 1.0, tA - 0.3);
  const hl3 = ramp(t, wordOf(3, 'luas') - 0.3, wordOf(3, 'luas') + 0.4);

  // ---------- fase B ----------
  const tK = wordOf(4, 'ditendang') + 0.15;
  const sRaw = t - tK;
  const s = sRaw <= TAU + 2.4 ? sRaw : ((((sRaw + 5) % PK) + PK) % PK) - 5;
  const ball = ballAt(s);
  const [fx, fy] = footAt(s);
  const L = leg(HIP[0], HIP[1], fx, fy);
  const S = leg(HIP[0] - 6, HIP[1], 392, GBY);
  const ballOp = Math.min(1, Math.max(0, (1820 - ball.x) / 80)) * Math.min(1, Math.max(0, (ball.x - 120) / 60));
  const contact = s >= 0 && s <= TAU ? Math.sin((Math.PI * s) / TAU) : 0;
  const lM = ramp(t, cue(4) + 0.2, cue(4) + 0.8);
  const lV1 = ramp(t, wordOf(4, 'sepuluh') - 0.3, wordOf(4, 'sepuluh') + 0.4);
  const lV2 = ramp(t, wordOf(4, 'lima') - 0.3, wordOf(4, 'lima') + 0.4);
  const readouts = lM * (1 - ramp(t, cue(5) - 0.4, cue(5) + 0.2, EASE_IN_OUT));
  const vec = win(t, cue(5) - 0.1, cue(6) - 0.4, 0.6, 0.5);
  const vP1 = ramp(t, cue(5) + 0.1, cue(5) + 0.7);
  const vP2 = ramp(t, cue(5) + 0.6, cue(5) + 1.2);
  const vDp = ramp(t, wordOf(5, 'dua') - 0.3, wordOf(5, 'dua') + 0.6, EASE_IN_OUT);
  const vArah = ramp(t, wordOf(5, 'Arah') - 0.3, wordOf(5, 'Arah') + 0.4);
  const card5 = win(t, wordOf(5, 'dua') - 0.4, cue(6) - 0.45, 0.6, 0.35);
  const c5res = ramp(t, wordOf(5, 'sepuluh') - 0.2, wordOf(5, 'sepuluh') + 0.4);
  const graphB = ramp(t, cue(6) + 0.0, cue(6) + 0.7);
  const drawB = ramp(t, wordOf(6, 'menyentuh') - 0.2, wordOf(6, 'dua') + 0.6, EASE_IN_OUT);
  const avgB = ramp(t, wordOf(6, 'rata') - 0.3, wordOf(6, 'rata') + 0.4);
  const card6 = ramp(t, cue(6) + 0.2, cue(6) + 0.8);
  const c6res = ramp(t, wordOf(6, 'lima') - 0.2, wordOf(6, 'lima') + 0.4);
  const dimB = 1 - 0.25 * ramp(t, cue(6) - 0.2, cue(6) + 0.6);

  const AX: Axes = {x0: 210, y0: 836, w: 500, h: 200, xmax: 0.03, ymax: 1100};
  const bumpPts: string[] = [];
  const bumpArea: string[] = [`M${px(AX, 0)},${AX.y0}`];
  const tEnd = 0.02 * drawB;
  for (let i = 0; i <= 50; i++) {
    const tt = (tEnd * i) / 50;
    const yy = py(AX, 1000 * Math.sin((Math.PI * tt) / 0.02) ** 2);
    bumpPts.push(`${i ? 'L' : 'M'}${px(AX, tt).toFixed(1)},${yy.toFixed(1)}`);
    bumpArea.push(`L${px(AX, tt).toFixed(1)},${yy.toFixed(1)}`);
  }
  bumpArea.push(`L${px(AX, tEnd)},${AX.y0} Z`);

  const OX = 360; // asal diagram vektor
  return (
    <AbsoluteFill>
      <Stage>
        {/* ======================= FASE A ======================= */}
        {phA > 0.001 ? (
          <g opacity={phA}>
            <Glow x={CART_X} y={GA - 70} r={360} color="spr" opacity={0.2 + 0.05 * p} />
            {/* rel bergulir sesuai posisi kereta */}
            <rect x={100} y={GA} width={880} height={18} rx={9} fill="#1a2550" stroke="#56628f" strokeWidth={2} />
            {Array.from({length: 11}, (_, k) => {
              const x = 100 + ((((k * 90 - X) % 990) + 990) % 990);
              return <rect key={k} x={x} y={GA + 24} width={40} height={4} rx={2} fill="#c9d3ee" opacity={0.3 * Math.min(1, (x - 100) / 60) * Math.min(1, (980 - x) / 60)} />;
            })}
            {/* garis gerak saat cepat */}
            {[0, 1, 2].map((k) => (
              <line key={k} x1={CART_X - 110} y1={GA - 30 - k * 26} x2={CART_X - 110 - 0.6 * KV * p} y2={GA - 30 - k * 26} stroke="#cfe0ff" strokeOpacity={0.25} strokeWidth={3} strokeLinecap="round" />
            ))}
            <g transform={`translate(${CART_X} ${GA})`}>
              <ellipse cx={0} cy={5} rx={100} ry={7} fill="#000" opacity={0.35} />
              <rect x={-90} y={-120} width={180} height={98} rx={12} fill="url(#crate)" stroke={C.ink} strokeOpacity={0.7} strokeWidth={3} />
              <rect x={-80} y={-112} width={160} height={8} rx={4} fill="#fff" opacity={0.1} />
              <text x={0} y={-71} textAnchor="middle" dominantBaseline="central" fontFamily={FONT.serif} fontStyle="italic" fontWeight={600} fontSize={40} fill={C.ink}>
                m
              </text>
              {[-52, 52].map((wx) => (
                <g key={wx} transform={`translate(${wx} -14) rotate(${((X / 14) * 180) / Math.PI})`}>
                  <circle r={14} fill="#0b1022" stroke={C.muted} strokeWidth={3} />
                  <line x1={-11} y1={0} x2={11} y2={0} stroke={C.muted} strokeWidth={2.5} />
                  <line x1={0} y1={-11} x2={0} y2={11} stroke={C.muted} strokeWidth={2.5} />
                </g>
              ))}
            </g>
            {/* gaya F (kuning) mendorong dari belakang */}
            <Arrow x1={CART_X - 100 - Flen} y1={GA - 70} x2={CART_X - 100} y2={GA - 70} color="force" width={10} opacity={Math.min(1, Flen / 30)} />
            <Label x={CART_X - 100 - Flen / 2} y={GA - 112} size={32} font="serif" italic weight={600} color={C.force} opacity={Math.min(1, Flen / 60)}>
              F
            </Label>
            <circle cx={CART_X - 92} cy={GA - 70} r={30} fill="url(#soft-force)" opacity={Math.min(1, Flen / 60)} />
            {/* momentum (ungu) di atas kereta: panjang ∝ p */}
            <Arrow x1={CART_X - 60} y1={GA - 170} x2={CART_X - 60 + KP * p} y2={GA - 170} color="spr" width={9} opacity={Math.min(1, p * 2)} />
            <Label x={CART_X - 84} y={GA - 170} size={32} font="serif" italic weight={600} color={C.spr} anchor="end" opacity={Math.min(1, p * 2)}>
              p
            </Label>
            <Label x={CART_X} y={GA - 210} size={24} font="mono" color={C.muted} opacity={win(t, cue(0), tA - 0.2, 0.5, 0.4)}>
              diam: p = 0
            </Label>
            {/* stopwatch Δt */}
            <g transform={`translate(${CART_X + 250} ${GA - 230})`} opacity={graphA}>
              <circle r={44} fill="rgba(10,16,36,0.85)" stroke={C.muted} strokeWidth={3} />
              <rect x={-8} y={-58} width={16} height={10} rx={3} fill={C.muted} />
              {(() => {
                const a = Math.min(1, Math.max(0, uA)) * 0.999;
                const b = Math.min(1, Math.max(0, uB)) * 0.999;
                const f = b > 0 ? b : a;
                const ang = f * 2 * Math.PI;
                const large = f > 0.5 ? 1 : 0;
                return f > 0.001 ? (
                  <path d={`M0,0 L0,-36 A36,36 0 ${large} 1 ${36 * Math.sin(ang)},${-36 * Math.cos(ang)} Z`} fill={C.force} opacity={0.6} />
                ) : null;
              })()}
              <line x1={0} y1={0} x2={30 * Math.sin(t * 2.5)} y2={-30 * Math.cos(t * 2.5)} stroke={C.ink} strokeWidth={3} strokeLinecap="round" />
              <Label x={0} y={70} size={24} font="serif" italic>
                Δt
              </Label>
            </g>
            {/* grafik F–t */}
            <LiveFT x0={1160} y0={620} w={560} h={300} dt={dA} pen={t - tA} bump={false} op={graphA * g1op} t={t} areaLabel="F · Δt" showDt={ramp(t, tA + dA - 0.2, tA + dA + 0.3)} />
            <LiveFT x0={1160} y0={620} w={560} h={300} dt={dB} pen={t - tB} bump op={g2op} t={t} areaLabel="luas = J" showDt={ramp(t, tB + dB - 0.2, tB + dB + 0.3)} />
            <Glow x={1440} y={520} r={260} color="work" opacity={0.45 * hl3 * ramp(t, tB + dB * 0.5, tB + dB)} />
            <Motes x={760} y={460} rx={700} ry={220} n={22} color="spr" opacity={0.35} seed={2} />
          </g>
        ) : null}

        {/* ======================= FASE B ======================= */}
        {phB > 0.001 ? (
          <g opacity={phB}>
            <g opacity={dimB}>
              <Glow x={XC} y={BCY} r={360} color="kin" opacity={0.18} />
              {/* rumput */}
              <rect x={100} y={GBY} width={1720} height={30} fill="#0f2a2a" opacity={0.6} />
              <line x1={100} y1={GBY} x2={1820} y2={GBY} stroke={C.work} strokeOpacity={0.45} strokeWidth={3} />
              {Array.from({length: 40}, (_, k) => {
                const x = 120 + k * 43;
                const sw = 3 * Math.sin(t * 1.6 + k * 0.7);
                return <path key={k} d={`M${x},${GBY} q${2 + sw},-9 ${4 + sw},-14`} fill="none" stroke={C.work} strokeOpacity={0.35} strokeWidth={2} strokeLinecap="round" />;
              })}
              {/* gawang di kanan */}
              <path d="M1700,520 L1700,330 L1800,350 L1800,520" fill="none" stroke="#c9d3ee" strokeOpacity={0.5} strokeWidth={5} />
              {Array.from({length: 6}, (_, k) => (
                <line key={k} x1={1700} y1={350 + k * 30} x2={1800} y2={366 + k * 28} stroke="#c9d3ee" strokeOpacity={0.15} strokeWidth={1.5} />
              ))}
              {/* penendang */}
              <g stroke={C.ink} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" fill="none">
                <path d={`M${HIP[0] - 6},${HIP[1]} L${S.kx},${S.ky} L${S.ex},${S.ey}`} strokeOpacity={0.75} />
                <path d={`M${HIP[0]},${HIP[1]} L${HIP[0] + 8},${HIP[1] - 126}`} />
                <path d={`M${HIP[0] + 8},${HIP[1] - 112} L${HIP[0] - 30 + 20 * Math.sin(t * 1.4)},${HIP[1] - 52} `} strokeOpacity={0.75} />
                <path d={`M${HIP[0] + 8},${HIP[1] - 112} L${HIP[0] + 52},${HIP[1] - 66 + 6 * Math.sin(t * 1.4)}`} />
                <path d={`M${HIP[0]},${HIP[1]} L${L.kx},${L.ky} L${L.ex},${L.ey}`} />
              </g>
              <path d={`M${HIP[0] - 18},${HIP[1] + 4} L${HIP[0] - 8},${HIP[1] - 116} L${HIP[0] + 26},${HIP[1] - 116} L${HIP[0] + 22},${HIP[1] + 4} Z`} fill="#3a6fd6" stroke={C.ink} strokeOpacity={0.5} strokeWidth={2} />
              <circle cx={HIP[0] + 12} cy={HIP[1] - 150} r={22} fill={C.bg} stroke={C.ink} strokeWidth={6} />
              {/* sepatu */}
              <ellipse cx={L.ex + 6} cy={L.ey + 2} rx={20} ry={9} fill={C.kin} />
              <ellipse cx={S.ex + 6} cy={S.ey - 4} rx={20} ry={9} fill={C.kin} opacity={0.8} />
              {/* bola */}
              <g opacity={ballOp}>
                <ellipse cx={ball.x} cy={GBY + 3} rx={BR * 0.9} ry={5} fill="#000" opacity={0.35} />
                <g transform={`translate(${ball.x + ball.d / 2} ${BCY}) scale(${1 - ball.d / (2 * BR)} ${1 + ball.d / (5 * BR)})`}>
                  <circle r={BR} fill="#f4f6ff" stroke="#2a355e" strokeWidth={2} />
                  <g transform={`rotate(${((ball.x / BR) * 180) / Math.PI})`}>
                    <path d="M0,-10 L9.5,-3 L6,8 L-6,8 L-9.5,-3 Z" fill="#1b2140" />
                    {[0, 72, 144, 216, 288].map((a) => (
                      <path key={a} transform={`rotate(${a}) translate(0 -27)`} d="M0,-5 L5,-1 L3,5 L-3,5 L-5,-1 Z" fill="#1b2140" />
                    ))}
                  </g>
                  <circle cx={-10} cy={-12} r={7} fill="#fff" opacity={0.6} />
                </g>
                {/* garis gerak */}
                {[0, 1].map((k) => (
                  <line
                    key={k}
                    x1={ball.x - Math.sign(ball.v) * (BR + 10)}
                    y1={BCY - 10 + k * 20}
                    x2={ball.x - Math.sign(ball.v) * (BR + 10 + Math.abs(ball.v) * 0.12)}
                    y2={BCY - 10 + k * 20}
                    stroke="#cfe0ff"
                    strokeOpacity={0.3 * (1 - contact)}
                    strokeWidth={2.5}
                    strokeLinecap="round"
                  />
                ))}
                {/* kecepatan (toska) */}
                <Arrow x1={ball.x} y1={BCY - 70} x2={ball.x + ball.v * 0.32} y2={BCY - 70} color="cyan" width={6} opacity={Math.min(1, Math.abs(ball.v) / 60)} pulse={false} />
                <Label x={ball.x} y={BCY + 70} size={22} font="mono" color={C.muted} opacity={lM}>
                  0,4 kg
                </Label>
              </g>
              {/* gaya kaki pada bola selama kontak */}
              <Arrow x1={XC - BR - 30} y1={BCY - 2} x2={XC - BR + 150} y2={BCY - 2} color="force" width={10} opacity={contact} pulse={false} />
              <Ripple x={XC - BR} y={BCY} p={s / 0.9} r={130} color="force" rings={3} />
            </g>

            {/* bacaan kecepatan (baris 4) */}
            <g opacity={readouts}>
              <Label x={140} y={640} size={34} font="mono" color={C.cyan} anchor="start" opacity={lV1}>
                v₁ = −10 m/s (datang ke kiri)
              </Label>
              <Label x={140} y={710} size={34} font="mono" color={C.cyan} anchor="start" opacity={lV2}>
                v₂ = +15 m/s (balik ke kanan)
              </Label>
              <Label x={140} y={780} size={24} font="mono" color={C.muted} anchor="start" opacity={lV2}>
                arah kanan positif →
              </Label>
            </g>

            {/* diagram vektor momentum (baris 5): skala 30 px per kg·m/s */}
            {vec > 0.001 ? (
              <g opacity={vec}>
                <line x1={OX} y1={590} x2={OX} y2={830} stroke={C.muted} strokeOpacity={0.5} strokeWidth={2} strokeDasharray="4 6" />
                <Arrow x1={OX} y1={620} x2={OX - 4 * KP * vP1} y2={620} color="spr" width={9} opacity={vP1} />
                <Label x={590} y={620} size={28} color={C.spr} anchor="start" opacity={vP1}>
                  p₁ = −4 kg·m/s
                </Label>
                <Arrow x1={OX} y1={700} x2={OX + 6 * KP * vP2} y2={700} color="spr" width={9} opacity={vP2} />
                <Label x={590} y={700} size={28} color={C.spr} anchor="start" opacity={vP2}>
                  p₂ = +6 kg·m/s
                </Label>
                <line x1={OX - 4 * KP} y1={620} x2={OX - 4 * KP} y2={790} stroke={C.spr} strokeOpacity={0.4 * vDp} strokeWidth={2} strokeDasharray="3 5" />
                <line x1={OX + 6 * KP} y1={700} x2={OX + 6 * KP} y2={790} stroke={C.spr} strokeOpacity={0.4 * vDp} strokeWidth={2} strokeDasharray="3 5" />
                <Arrow x1={OX - 4 * KP} y1={790} x2={OX - 4 * KP + 10 * KP * vDp} y2={790} color="work" width={11} opacity={Math.min(1, vDp * 4)} />
                <Label x={590} y={790} size={30} color={C.work} weight={600} anchor="start" opacity={ramp(vDp, 0.7, 1)}>
                  Δp = +10 N·s
                </Label>
                <Label x={OX - 4 * KP + 5 * KP} y={832} size={22} font="mono" color={C.muted} opacity={vArah}>
                  balik arah → selisihnya 4 + 6
                </Label>
                <Twinkles x={OX + 30} y={790} rx={160} ry={20} n={4} color="work" opacity={ramp(vDp, 0.8, 1)} />
              </g>
            ) : null}

            {/* grafik gaya tendangan (baris 6) */}
            {graphB > 0.001 ? (
              <g opacity={graphB}>
                <rect x={110} y={600} width={760} height={290} rx={18} fill="rgba(10,16,36,0.72)" stroke={C.line} strokeWidth={2} />
                <Plot a={AX} xLabel="t (s)" yLabel="F (N)" xTicks={[0, 0.01, 0.02, 0.03]} yTicks={[500, 1000]} />
                <path d={bumpArea.join(' ')} fill={C.work} opacity={0.5} />
                <path d={bumpPts.join(' ')} fill="none" stroke={C.force} strokeWidth={4} />
                <g opacity={avgB}>
                  <rect x={px(AX, 0)} y={py(AX, 500)} width={px(AX, 0.02) - px(AX, 0)} height={AX.y0 - py(AX, 500)} fill="none" stroke={C.force} strokeWidth={2.5} strokeDasharray="8 6" />
                  <Label x={px(AX, 0.02) + 14} y={py(AX, 500)} size={26} color={C.force} anchor="start" weight={600}>
                    rata-rata 500 N
                  </Label>
                </g>
                <Label x={px(AX, 0.01)} y={py(AX, 260)} size={22} color="#eafff4" weight={600} opacity={ramp(drawB, 0.8, 1)}>
                  10 N·s
                </Label>
              </g>
            ) : null}
          </g>
        ) : null}
      </Stage>

      {/* ======================= kartu ======================= */}
      <Formula x={960} y={800} p={phA * card1} accent={C.work} size={64} caption="impuls">
        <Tint c="work">
          <V>J</V>
        </Tint>{' '}
        = <Tint c="force">
          <V>F</V>
        </Tint>{' '}
        Δ<V>t</V>
        <Part p={c1dp}>
          {' '}
          = <Tint c="spr">Δ<V>p</V></Tint>
        </Part>
      </Formula>
      <Formula x={960} y={790} p={phA * card2a} accent={C.force} size={60} caption="hukum II Newton">
        <Tint c="force">
          <V>F</V>
        </Tint>{' '}
        = <Frac n={<Tint c="spr">Δ<V>p</V></Tint>} d={<>Δ<V>t</V></>} />
      </Formula>
      <Formula x={960} y={800} p={phA * card2b} accent={C.work} size={66} caption="impuls = perubahan momentum">
        <Tint c="force">
          <V>F</V>
        </Tint>{' '}
        Δ<V>t</V> = <Tint c="spr">Δ<V>p</V></Tint>
      </Formula>
      <Formula x={1360} y={720} p={phB * card5} accent={C.work} size={56}>
        Δ<V>p</V> = 0,4 · (15 − (−10)) <Part p={c5res}>= <Tint c="work">10 N·s</Tint></Part>
      </Formula>
      <Formula x={1340} y={720} p={phB * card6} accent={C.force} size={58} caption="gaya rata-rata selama kontak">
        <Tint c="force">
          <V>F̄</V>
        </Tint>{' '}
        = <Frac n={<Tint c="work">10 N·s</Tint>} d="0,02 s" />
        <Part p={c6res}>
          {' '}
          = <Tint c="force">500 N</Tint>
        </Part>
      </Formula>
    </AbsoluteFill>
  );
};
