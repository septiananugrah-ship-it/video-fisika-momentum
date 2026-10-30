import React from 'react';
import {AbsoluteFill} from 'remotion';
import {BACK, EASE_IN_OUT, cyc, mix, ramp, rand, win} from '../anim';
import {Arrow, Formula, Frac, Glow, Label, Motes, Note, Ripple, Stage, Sqrt, Sub, Twinkles, V} from '../components/primitives';
import {useScene} from '../SceneContext';
import {C, FONT} from '../theme';

// Fase 1 (baris 0–2): dua bola 1 kg, v₁ = 4 m/s menabrak bola diam. v₁′ = (1 − e)/2·v₁, v₂′ = (1 + e)/2·v₁
//   (kekal momentum + definisi e). e tiap putaran diambil dari jarum skala e pada saat tumbukan
//   (0,5 bawaan; 1 saat "satu", 0 saat "nol"). Skala 70 px/m, kecepatan 30 px per m/s.
// Fase 2 (baris 3–5): bola dijatuhkan dari 1,00 m (540 px/m, g = 10 m/s²), e = 0,8:
//   tinggi pantulan h_n = 0,64ⁿ m (0,64; 0,41; 0,26 …), kecepatan tumbukan v_n = 0,8ⁿ·√20 m/s.
//   Gerak mendatar tetap 0,45 m/s (jejak stroboskop seperti foto). Gerak lambat ×2,5.

const fr = (x: number) => ((x % 1) + 1) % 1;
const slot = (t: number, a: number, b: number) => Math.min(ramp(t, a, a + 0.5), 1 - ramp(t, b - 0.45, b - 0.05, EASE_IN_OUT));
const dec = (v: number, d = 1) => v.toFixed(d).replace('.', ',');

// ---------- fase 1 ----------
const TY = 640;
const R1 = 38;
const S1 = 70;
const V1 = 4;
const XB1 = 1000;
const XA1C = XB1 - 2 * R1;
const P1 = 4.4;
const TC1 = 1.5;
const GX0 = 560;
const GX1 = 1360;

// ---------- fase 2 ----------
const FL = 840;
const SY = 540; // px per meter (tinggi)
const RB = 26;
const XR0 = 420;
const VXP = 243; // px per detik fisis
const SLOW = 2.5;
const E2 = 0.8;
const G = 10;
const V0 = Math.sqrt(2 * G * 1);
const T0 = Math.sqrt(2 / G);
const ball = (tp: number) => {
  // tp = waktu fisis sejak dilepas → {h (m), vy (m/s), n (pantulan ke-), tn (waktu sejak pantulan)}
  if (tp < 0) return {h: 1, vy: 0, n: 0, since: -1};
  if (tp < T0) return {h: 1 - 0.5 * G * tp * tp, vy: -G * tp, n: 0, since: -1};
  let tt = tp - T0;
  for (let n = 1; n < 14; n++) {
    const vn = V0 * E2 ** n;
    const d = (2 * vn) / G;
    if (tt < d) return {h: vn * tt - 0.5 * G * tt * tt, vy: vn - G * tt, n, since: tt};
    tt -= d;
  }
  return {h: 0, vy: 0, n: 14, since: tt + 10};
};
const TOTAL = T0 + (2 * V0 * E2) / (G * (1 - E2));

const Steel: React.FC<{x: number; y: number; r: number; opacity?: number}> = ({x, y, r, opacity = 1}) => (
  <g opacity={opacity}>
    <circle cx={x} cy={y} r={r * 1.8} fill="url(#soft-cyan)" opacity={0.28} />
    <circle cx={x} cy={y} r={r} fill="url(#rs-steel)" stroke="#dfe8ff" strokeOpacity={0.6} strokeWidth={2} />
    <ellipse cx={x - r * 0.32} cy={y - r * 0.36} rx={r * 0.3} ry={r * 0.18} fill="#fff" opacity={0.7} />
  </g>
);

export const Restitution: React.FC = () => {
  const {t, cue, wordOf} = useScene();
  const stageIn = ramp(t, -0.4, 0.8);

  // ===== fase 1 =====
  const ph1 = 1 - ramp(t, cue(3) - 0.6, cue(3) + 0.05, EASE_IN_OUT);
  const tOne = wordOf(2, 'satu');
  const tZero = wordOf(2, 'nol');
  const eG = (tt: number) => {
    const toOne = ramp(tt, tOne - 0.4, tOne + 0.4, EASE_IN_OUT);
    const toZero = ramp(tt, tZero - 0.4, tZero + 0.4, EASE_IN_OUT);
    return mix(mix(0.5, 1, toOne), 0, toZero);
  };
  // jadwal putaran: berkala, lalu disetel agar tumbukan tepat setelah kata "satu" & "nol"
  const starts: number[] = [];
  for (let s = -0.6; s < tOne - TC1 - 0.2 - 0.5; s += P1) starts.push(s);
  starts.push(tOne - TC1 + 0.35);
  starts.push(Math.max(tZero - TC1 + 0.35, tOne - TC1 + 0.35 + 2.2));
  let sIdx = 0;
  for (let k = 0; k < starts.length; k++) if (t >= starts[k]) sIdx = k;
  const s0 = starts[sIdx];
  const sNext = starts[sIdx + 1] ?? 1e9;
  const tau = Math.max(0, t - s0);
  const env1 = Math.min(1, tau / 0.3) * Math.min(1, (sNext - t) / 0.35) * Math.min(1, (P1 + 1.6 - tau) / 0.45);
  const eL = eG(s0 + TC1);
  const v1p = ((1 - eL) / 2) * V1;
  const v2p = ((1 + eL) / 2) * V1;
  const dt1 = tau - TC1;
  const xa = dt1 < 0 ? XA1C + V1 * S1 * dt1 : XA1C + v1p * S1 * dt1;
  const xb = dt1 < 0 ? XB1 : XB1 + v2p * S1 * dt1;
  const aft = ramp(tau, TC1, TC1 + 0.06);
  const relOn = ramp(t, wordOf(1, 'relatif') - 0.4, wordOf(1, 'relatif') + 0.4);
  const k0 = slot(t, wordOf(0, 'restitusi') - 0.4, cue(1) + 0.3);
  const k1 = slot(t, cue(1) + 0.3, cue(2));
  const gauge = ramp(t, cue(2) - 0.1, cue(2) + 0.6);
  const eNow = eG(t);
  const q0 = win(t, wordOf(0, 'Seberapa') - 0.2, wordOf(0, 'restitusi') - 0.4, 0.4, 0.4);

  // ===== fase 2 =====
  const ph2 = ramp(t, cue(3) - 0.1, cue(3) + 0.6);
  const tDrop = wordOf(3, 'jatuhkan') + 0.2;
  const RUN = TOTAL * SLOW + 1.6;
  const runs = [tDrop, tDrop + RUN + 0.9, tDrop + 2 * (RUN + 0.9), tDrop + 3 * (RUN + 0.9)];
  let rIdx = 0;
  for (let k = 0; k < runs.length; k++) if (t >= runs[k] - 0.8) rIdx = k;
  const r0 = runs[rIdx];
  const tp = (t - r0) / SLOW;
  const st = ball(tp);
  const bxp = XR0 + VXP * Math.max(0, Math.min(tp, TOTAL));
  const byp = FL - RB - st.h * SY;
  const envR = Math.min(1, (t - (r0 - 0.8)) / 0.5) * Math.min(1, (r0 + RUN - t) / 0.6);
  const magnet = 1 - ramp(t, r0 - 0.02, r0 + 0.05);
  const strobe: [number, number][] = [];
  for (let s = 0; s < Math.min(tp, TOTAL); s += 0.045) strobe.push([XR0 + VXP * s, FL - RB - ball(s).h * SY]);
  const lbl100 = ramp(t, wordOf(4, 'satu') - 0.3, wordOf(4, 'satu') + 0.4);
  const lbl64 = ramp(t, wordOf(4, 'enam') - 0.3, wordOf(4, 'enam') + 0.4);
  const lbl41 = ramp(t, wordOf(5, 'empat') - 0.3, wordOf(5, 'empat') + 0.4);
  const xPeak = (n: number) => {
    let s = T0;
    for (let k = 1; k < n; k++) s += (2 * V0 * E2 ** k) / G;
    s += (V0 * E2 ** n) / G;
    return XR0 + VXP * s;
  };
  const yH = (h: number) => FL - h * SY;
  const k3 = slot(t, wordOf(3, 'akar') - 0.4, cue(4) + 0.4);
  const k4 = slot(t, wordOf(4, 'akar') - 0.5, cue(5));
  const k5 = ramp(t, cue(5) + 0.1, cue(5) + 0.7);
  const answer = ramp(t, wordOf(4, 'delapan') - 0.3, wordOf(4, 'delapan') + 0.4);
  const lastHit = st.n >= 1 && st.n < 14 ? st.since : -1;
  const vIn = V0 * E2 ** (st.n - 1);
  const vOut = V0 * E2 ** st.n;
  const hitArr = lastHit >= 0 && lastHit < 0.18 && st.n <= 3 ? 1 - lastHit / 0.18 : 0;
  const hitX = st.n >= 1 ? XR0 + VXP * (tp - lastHit) : 0;

  return (
    <AbsoluteFill>
      <Stage>
        <defs>
          <radialGradient id="rs-steel" cx="35%" cy="30%" r="80%">
            <stop offset="0%" stopColor="#f4f8ff" />
            <stop offset="35%" stopColor="#a9b6d8" />
            <stop offset="75%" stopColor="#4a5684" />
            <stop offset="100%" stopColor="#1c2346" />
          </radialGradient>
          <linearGradient id="rs-gauge" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={C.press} />
            <stop offset="50%" stopColor={C.gold} />
            <stop offset="100%" stopColor={C.cyan} />
          </linearGradient>
        </defs>
        <g opacity={stageIn}>
          {/* ============ fase 1 ============ */}
          <g opacity={ph1}>
            <Glow x={960} y={TY - 60} r={600} color="cyan" opacity={0.14} />
            <rect x={260} y={TY} width={1400} height={12} rx={4} fill="#1a2752" stroke={C.muted} strokeOpacity={0.5} strokeWidth={1.5} />
            <rect x={260} y={TY + 12} width={1400} height={30} fill="url(#ground)" />
            <g opacity={env1}>
              {/* gumpal lilin saat e → 0 */}
              <ellipse cx={xb - R1 + 2} cy={TY - R1} rx={9} ry={16} fill="#b07a4a" opacity={1 - Math.min(1, eL * 6)} />
              <Steel x={xb} y={TY - R1} r={R1} />
              <Steel x={xa} y={TY - R1} r={R1} />
              <Ripple x={XB1 - R1} y={TY - R1} p={ramp(tau, TC1, TC1 + 0.8)} r={80} color={eL > 0.7 ? 'cyan' : 'heat'} />
              {/* panah kecepatan */}
              <g opacity={1 - aft}>
                <Arrow x1={xa} y1={TY - 112} x2={xa + V1 * 30} y2={TY - 112} color="cyan" width={6} />
                <Label x={xa + V1 * 30 + 16} y={TY - 112} size={28} font="serif" italic color={C.cyan} weight={600} anchor="start">
                  v₁
                </Label>
              </g>
              <g opacity={aft}>
                {v1p * 30 > 4 ? <Arrow x1={xa} y1={TY - 112} x2={xa + v1p * 30} y2={TY - 112} color="cyan" width={6} pulse={false} /> : null}
                <Label x={xa - 24} y={TY - 112} size={28} font="serif" italic color={C.cyan} weight={600} anchor="end">
                  v₁′
                </Label>
                <Arrow x1={xb} y1={TY - 150} x2={xb + v2p * 30} y2={TY - 150} color="cyan" width={6} />
                <Label x={xb + v2p * 30 + 16} y={TY - 150} size={28} font="serif" italic color={C.cyan} weight={600} anchor="start">
                  v₂′
                </Label>
              </g>
            </g>
            <Label x={1020} y={TY - 120} size={130} font="serif" italic color={C.gold} weight={600} opacity={q0 * 0.9}>
              e ?
            </Label>
            {/* panel kecepatan relatif */}
            <g opacity={relOn * ph1}>
              <rect x={420} y={692} width={1080} height={176} rx={18} fill="rgba(10,16,36,0.8)" stroke={C.cyan} strokeOpacity={0.45} strokeWidth={2} />
              <Label x={444} y={746} size={24} color={C.ink} anchor="start">
                relatif sebelum
              </Label>
              <rect x={680} y={732} width={V1 * 80} height={28} rx={7} fill={C.cyan} opacity={0.9} />
              <Label x={680 + V1 * 80 + 14} y={746} size={24} font="mono" color={C.cyan} weight={600} anchor="start">
                {`${dec(V1, 1)} m/s`}
              </Label>
              <Label x={444} y={806} size={24} color={C.ink} anchor="start">
                relatif sesudah
              </Label>
              <g opacity={env1 > 0 ? Math.max(aft * env1, 0.25) : 0.25}>
                <rect x={680} y={792} width={Math.max(2, (v2p - v1p) * 80 * aft)} height={28} rx={7} fill={C.cyan} />
                <Label x={680 + (v2p - v1p) * 80 * aft + 14} y={806} size={24} font="mono" color={C.cyan} weight={600} anchor="start">
                  {`${dec((v2p - v1p) * aft, 1)} m/s`}
                </Label>
              </g>
              <Label x={1460} y={776} size={40} font="serif" italic color={C.gold} weight={600} anchor="end">
                {`e = ${dec(eL, 1)}`}
              </Label>
            </g>
          </g>

          {/* skala e */}
          <g opacity={gauge * ph1}>
            <rect x={GX0} y={320} width={GX1 - GX0} height={18} rx={9} fill="url(#rs-gauge)" opacity={0.9} />
            {[0, 0.25, 0.5, 0.75, 1].map((v) => (
              <line key={v} x1={mix(GX0, GX1, v)} y1={344} x2={mix(GX0, GX1, v)} y2={356} stroke={C.muted} strokeWidth={2} />
            ))}
            <Label x={GX0} y={380} size={26} font="mono" color={C.press} weight={600}>
              0
            </Label>
            <Label x={GX0} y={414} size={22} color={C.press} weight={600}>
              menempel
            </Label>
            <Label x={(GX0 + GX1) / 2} y={414} size={22} color={C.gold} weight={600}>
              lenting sebagian
            </Label>
            <Label x={GX1} y={380} size={26} font="mono" color={C.cyan} weight={600}>
              1
            </Label>
            <Label x={GX1} y={414} size={22} color={C.cyan} weight={600}>
              lenting sempurna
            </Label>
            {(() => {
              const mx = mix(GX0, GX1, eNow);
              return (
                <g>
                  <circle cx={mx} cy={329} r={22} fill="url(#soft-gold)" />
                  <path d={`M${mx - 14},${292} L${mx + 14},${292} L${mx},${314} Z`} fill={C.ink} />
                  <Label x={mx} y={268} size={30} font="serif" italic color={C.ink} weight={600}>
                    {`e = ${dec(eNow, 1)}`}
                  </Label>
                </g>
              );
            })()}
          </g>

          {/* ============ fase 2 ============ */}
          <g opacity={ph2}>
            <Glow x={760} y={620} r={560} color="cyan" opacity={0.12} />
            {/* lantai */}
            <rect x={120} y={FL} width={1600} height={50} fill="url(#ground)" />
            <path d={Array.from({length: 46}, (_, i) => `M${140 + i * 34},${FL + 2} l-14,20`).join(' ')} stroke={C.faint} strokeWidth={2} />
            <line x1={120} y1={FL} x2={1720} y2={FL} stroke={C.ink} strokeOpacity={0.85} strokeWidth={3} />
            {/* mistar tinggi */}
            <rect x={232} y={yH(1.05)} width={16} height={1.05 * SY} rx={4} fill="#1a2550" stroke={C.muted} strokeOpacity={0.6} strokeWidth={1.5} />
            {Array.from({length: 21}, (_, i) => {
              const h = i * 0.05;
              const major = i % 2 === 0;
              return <line key={i} x1={major ? 232 : 240} y1={yH(h)} x2={248} y2={yH(h)} stroke={C.muted} strokeWidth={major ? 2 : 1.2} />;
            })}
            <Label x={222} y={yH(0)} size={20} font="mono" color={C.muted} anchor="end">
              0
            </Label>
            <Label x={222} y={yH(0.5)} size={20} font="mono" color={C.muted} anchor="end">
              0,5
            </Label>
            {/* garis tinggi */}
            <g opacity={lbl100}>
              <line x1={250} y1={yH(1)} x2={XR0 + 60} y2={yH(1)} stroke={C.gold} strokeWidth={2} strokeDasharray="8 7" strokeDashoffset={-t * 14} />
              <Label x={222} y={yH(1)} size={24} font="mono" color={C.gold} weight={600} anchor="end">
                1,00 m
              </Label>
            </g>
            <g opacity={lbl64}>
              <line x1={250} y1={yH(0.64)} x2={xPeak(1) + 40} y2={yH(0.64)} stroke={C.gold} strokeWidth={2} strokeDasharray="8 7" strokeDashoffset={-t * 14} />
              <Label x={222} y={yH(0.64)} size={24} font="mono" color={C.gold} weight={600} anchor="end">
                0,64 m
              </Label>
            </g>
            <g opacity={lbl41}>
              <line x1={250} y1={yH(0.4096)} x2={xPeak(2) + 40} y2={yH(0.4096)} stroke={C.gold} strokeWidth={2} strokeDasharray="8 7" strokeDashoffset={-t * 14} />
              <Label x={222} y={yH(0.4096)} size={24} font="mono" color={C.gold} weight={600} anchor="end">
                0,41 m
              </Label>
              <Twinkles x={xPeak(2)} y={yH(0.4096) - 30} rx={50} ry={20} n={4} color="gold" />
            </g>
            {/* pemegang magnet */}
            <rect x={XR0 - 60} y={yH(1) - 2 * RB - 46} width={240} height={12} rx={6} fill="#2a3462" />
            <rect x={XR0 - 20} y={yH(1) - 2 * RB - 36} width={40} height={30} rx={6} fill="#39436a" stroke={C.muted} strokeWidth={2} />
            <circle cx={XR0} cy={yH(1) - 2 * RB - 6} r={16} fill="url(#soft-pot)" opacity={magnet * (0.7 + 0.3 * Math.sin(t * 6))} />
            {/* jejak stroboskop */}
            <g opacity={envR}>
              {strobe.map(([x, y], i) => (
                <circle key={i} cx={x} cy={y} r={RB * 0.55} fill={C.cyan} opacity={0.16} />
              ))}
              <ellipse cx={bxp} cy={FL + 4} rx={RB * (1.3 - 0.6 * st.h)} ry={6} fill="#000" opacity={0.45 - 0.25 * st.h} />
              <Steel x={bxp} y={byp} r={RB} />
              {st.n >= 1 && st.n < 6 ? <Ripple x={hitX} y={FL} p={lastHit / 0.5} r={70} color="cyan" /> : null}
              {/* kecepatan masuk & keluar saat memantul: v′ = e·v */}
              <g opacity={hitArr}>
                <Arrow x1={hitX - 40} y1={FL - 30 - vIn * 22} x2={hitX - 40} y2={FL - 30} color="cyan" width={5} pulse={false} />
                <Arrow x1={hitX + 40} y1={FL - 30} x2={hitX + 40} y2={FL - 30 - vOut * 22} color="cyan" width={5} pulse={false} />
              </g>
            </g>
            <Label x={1700} y={FL + 32} size={18} color={C.muted} font="mono" anchor="end">
              gerak lambat ×2,5 · titik = posisi tiap 0,045 s
            </Label>
            <Motes x={760} y={600} rx={520} ry={220} n={16} color="cyan" opacity={0.35} />
            <Twinkles x={1340} y={340} rx={260} ry={50} n={5} color="gold" opacity={answer * (1 - ramp(t, cue(5) - 0.4, cue(5)))} />
          </g>
        </g>
      </Stage>

      <Note x={960} y={226} p={k0} color={C.gold} size={34}>
        koefisien restitusi <i style={{fontFamily: FONT.serif, color: C.gold}}>e</i>: seberapa lenting?
      </Note>
      <Formula x={960} y={226} p={k1} accent={C.gold} caption="kecepatan relatif sesudah ÷ sebelum">
        <V>e</V> = −
        <Frac
          n={
            <>
              <V>v</V>
              <Sub>1</Sub>′ − <V>v</V>
              <Sub>2</Sub>′
            </>
          }
          d={
            <>
              <V>v</V>
              <Sub>1</Sub> − <V>v</V>
              <Sub>2</Sub>
            </>
          }
        />
      </Formula>
      <Formula x={1340} y={340} p={k3} accent={C.gold} caption="bola dijatuhkan ke lantai">
        <V>e</V> ={' '}
        <Sqrt>
          <Frac n={<V>h′</V>} d={<V>h</V>} />
        </Sqrt>
      </Formula>
      <Formula x={1340} y={340} p={k4} accent={C.gold} size={58}>
        <V>e</V> ={' '}
        <Sqrt>
          <Frac n="0,64" d="1,00" />
        </Sqrt>{' '}
        = <span style={{color: answer > 0.5 ? C.ink : C.ink}}>0,8</span>
      </Formula>
      <Formula x={1340} y={340} p={k5} accent={C.gold} caption="0,64 × 0,64 m ≈ 0,41 m">
        <V>h</V>
        <Sub>berikut</Sub> = <V>e</V>
        <sup style={{fontSize: '0.62em', verticalAlign: '0.55em', lineHeight: 0}}>2</sup>
        <V>h</V> = 0,64 <V>h</V>
      </Formula>
      {rand(0) < 0 && cyc(0) ? <span /> : null}
      {BACK(0) < 0 ? <span /> : null}
      {fr(0) < 0 ? <span /> : null}
    </AbsoluteFill>
  );
};
