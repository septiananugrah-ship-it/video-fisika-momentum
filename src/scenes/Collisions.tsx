import React from 'react';
import {AbsoluteFill} from 'remotion';
import {EASE_IN_OUT, cyc, mix, ramp, rand, win} from '../anim';
import {Arrow, Glow, Label, Motes, Note, Ripple, Stage, Stream, Twinkles} from '../components/primitives';
import {useScene} from '../SceneContext';
import {C, FONT} from '../theme';

// Tiga jalur, kondisi awal sama: A 1 kg, v = 4 m/s menabrak B 3 kg yang diam (p = 4 kg·m/s, K = 8 J).
// vA′ = (m₁ − e·m₂)v/(m₁+m₂), vB′ = (1+e)m₁v/(m₁+m₂):
//   e = 1   → vA′ = −2,  vB′ = 2    (K′ = 2 + 6 = 8 J, hilang 0)
//   e = 0,5 → vA′ = −0,5, vB′ = 1,5 (K′ = 0,125 + 3,375 = 3,5 J, hilang 4,5 J)
//   e = 0   → keduanya 1 m/s        (K′ = 2 J, hilang 6 J)
// Σp sesudah = 4 kg·m/s di ketiga jalur. Skala 80 px/m, 30 px per kg·m/s, batang 300 px = 8 J.

const S = 80;
const PKc = 30;
const M1 = 1;
const M2 = 3;
const V0 = 4;
const WA = 90;
const HA = 64;
const WB = 130;
const HB = 84;
const XB = 780;
const XAC = XB - WB / 2 - WA / 2;
const P = 4.6;
const TCL = 1.3;
const BAR = 300;
const BX = 1404;

type LaneDef = {e: number; title: string; eTxt: string; dot: string; ty: number};
const LANES: LaneDef[] = [
  {e: 1, title: 'lenting sempurna', eTxt: 'e = 1', dot: C.cyan, ty: 400},
  {e: 0.5, title: 'lenting sebagian', eTxt: '0 < e < 1', dot: C.gold, ty: 600},
  {e: 0, title: 'tidak lenting sama sekali', eTxt: 'e = 0', dot: C.press, ty: 800},
];
const after = (e: number) => {
  const va = ((M1 - e * M2) * V0) / (M1 + M2);
  const vb = ((1 + e) * M1 * V0) / (M1 + M2);
  const K = 0.5 * M1 * va * va + 0.5 * M2 * vb * vb;
  return {va, vb, K};
};
const K0 = 0.5 * M1 * V0 * V0;
const dec = (v: number) => (Math.abs(v - Math.round(v)) < 0.01 ? String(Math.round(v)) : v.toFixed(1).replace('.', ','));
const fr = (x: number) => ((x % 1) + 1) % 1;

const Glider: React.FC<{x: number; y: number; w: number; h: number; color: string; label: string; sq?: number; t: number; seed: number; clay?: number}> = ({x, y, w, h, color, label, sq = 0, t, seed, clay = 0}) => {
  const sx = 1 - 0.1 * sq;
  return (
    <g transform={`translate(${x} ${y}) scale(${sx} ${1 + 0.06 * sq})`}>
      <ellipse cx={0} cy={10} rx={w * 0.52} ry={6} fill="#000" opacity={0.35} />
      {[0, 1, 2].map((i) => {
        const ph = fr(t * 2.3 + i * 0.33 + seed);
        return <circle key={i} cx={-w * 0.3 + i * w * 0.3} cy={-2 - ph * 7} r={2} fill={C.cyan} opacity={0.5 * cyc(ph)} />;
      })}
      <path d={`M${-w / 2 + 4},-3 L${-w / 2 + 16},-16 L${w / 2 - 16},-16 L${w / 2 - 4},-3 Z`} fill="#18224a" stroke={color} strokeOpacity={0.55} strokeWidth={2} />
      <rect x={-w / 2} y={-h} width={w} height={h - 16} rx={12} fill="url(#crate)" stroke={color} strokeWidth={3} />
      <rect x={-w / 2 + 8} y={-h + 7} width={w - 16} height={6} rx={3} fill="#fff" opacity={0.12} />
      {clay > 0 ? <path d={`M${-w / 2 - 2},${-h * 0.75} Q${-w / 2 - 14 * clay},${-h * 0.5} ${-w / 2 - 2},${-h * 0.25 - 4}`} fill="#b07a4a" stroke="#e0a874" strokeWidth={2} /> : null}
      <text x={0} y={-h / 2 - 8} textAnchor="middle" dominantBaseline="central" fontFamily={FONT.head} fontWeight={600} fontSize={24} fill={C.ink}>
        {label}
      </text>
    </g>
  );
};

export const Collisions: React.FC = () => {
  const {t, cue, wordOf} = useScene();
  const stageIn = ramp(t, -0.4, 0.8);
  const tau = fr((t - 0.2) / P) * P;
  const env = Math.min(1, tau / 0.35) * Math.min(1, (P - tau) / 0.45);
  const dt = tau - TCL;

  const allOn = Math.max(1 - ramp(t, cue(1) - 0.3, cue(1) + 0.3, EASE_IN_OUT), ramp(t, cue(4) - 0.3, cue(4) + 0.4));
  const focus = (i: number) => win(t, cue(i + 1) - 0.3, cue(i + 2) - 0.3, 0.6, 0.6);
  const reveal = (i: number) => ramp(t, cue(i + 1) + 0.2, cue(i + 1) + 1.0);
  const pChip = ramp(t, wordOf(0, 'momentum') - 0.2, wordOf(0, 'momentum') + 0.5);
  const qMark = ramp(t, wordOf(0, 'belum') - 0.3, wordOf(0, 'belum') + 0.4);
  const note0 = Math.min(ramp(t, wordOf(0, 'kekal') - 0.3, wordOf(0, 'kekal') + 0.4), 1 - ramp(t, cue(1) - 0.4, cue(1), EASE_IN_OUT));
  const note4 = ramp(t, wordOf(4, 'energi') - 0.3, wordOf(4, 'energi') + 0.4);
  const totals = ramp(t, wordOf(4, 'berpindah') - 0.3, wordOf(4, 'berpindah') + 0.5);
  const words2 = [wordOf(2, 'panas'), wordOf(2, 'bunyi'), wordOf(2, 'perubahan')];
  const stick = ramp(t, wordOf(3, 'menempel') - 0.3, wordOf(3, 'menempel') + 0.4) * focus(2);

  return (
    <AbsoluteFill>
      <Stage>
        <g opacity={stageIn}>
          {LANES.map((L, i) => {
            const hi = Math.max(allOn, focus(i));
            const op = mix(0.35, 1, hi);
            const {va, vb, K} = after(L.e);
            const lost = K0 - K;
            const y = L.ty;
            const before = dt < 0;
            const xa = before ? XAC + V0 * S * dt : XAC + va * S * dt;
            const xb = before ? XB : XB + vb * S * dt;
            const sq = dt > 0 ? Math.exp(-dt * 30) * (1 - L.e * 0.6) : 0;
            const cX = XAC + WA / 2;
            const hit = ramp(tau, TCL, TCL + 0.9);
            const heat = dt > 0 ? Math.exp(-dt * 1.2) * (lost / 6) : 0;
            const pA = M1 * (before ? V0 : va);
            const pB = M2 * (before ? 0 : vb);
            const rv = reveal(i);
            const wK = (K / K0) * BAR;
            const wL = (lost / K0) * BAR;
            const shimmer = hi * (lost / 6);
            return (
              <g key={i} opacity={op}>
                {/* rel */}
                <Glow x={700} y={y - 40} r={420} color={i === 0 ? 'cyan' : i === 1 ? 'gold' : 'press'} opacity={0.12 * hi} />
                <rect x={130} y={y} width={1160} height={12} rx={4} fill="#1a2752" stroke={C.muted} strokeOpacity={0.5} strokeWidth={1.5} />
                <circle cx={150} cy={y - 34} r={16} fill="none" stroke={L.dot} strokeWidth={2.5} />
                <Label x={150} y={y - 34} size={20} font="mono" color={L.dot} weight={600}>
                  {String(i + 1)}
                </Label>
                <g opacity={env}>
                  {/* panas tumbukan */}
                  {heat > 0.01 ? <Glow x={cX} y={y - 40} r={70 + 50 * heat} color="heat" opacity={heat} still /> : null}
                  <Glider x={xb} y={y} w={WB} h={HB} color={C.gold} label="3 kg" t={t} seed={i} sq={sq} clay={L.e === 0 ? 1 - 0.6 * ramp(tau, TCL, TCL + 0.1) : 0} />
                  <Glider x={xa} y={y} w={WA} h={HA} color={C.cyan} label="1 kg" t={t} seed={i + 0.5} sq={sq} />
                  <Ripple x={cX} y={y - 40} p={hit} r={60 + 40 * (1 - L.e)} color={L.e === 1 ? 'cyan' : 'heat'} />
                  {/* gelombang bunyi */}
                  {L.e < 1
                    ? [0, 1, 2].map((k) => {
                        const q = ramp(tau, TCL + k * 0.12, TCL + 0.9 + k * 0.12, (x) => x);
                        return q > 0 && q < 1 ? (
                          <path key={k} d={`M${cX - 10 - 50 * q},${y - 80 - 30 * q} Q${cX},${y - 100 - 50 * q} ${cX + 10 + 50 * q},${y - 80 - 30 * q}`} fill="none" stroke={C.heat} strokeWidth={3} opacity={(1 - q) * 0.8} />
                        ) : null;
                      })
                    : null}
                  {/* asap / debu panas */}
                  {L.e < 1
                    ? Array.from({length: 6}, (_, k) => {
                        const q = ramp(tau, TCL, TCL + 1.4, (x) => x);
                        const a = rand(k + i * 10) * Math.PI * 2;
                        return q > 0 && q < 1 ? <circle key={k} cx={cX + Math.cos(a) * 40 * q} cy={y - 40 + Math.sin(a) * 30 * q - 20 * q} r={3 + 5 * q} fill={C.heat} opacity={0.4 * (1 - q) * (1 - L.e * 0.5)} /> : null;
                      })
                    : null}
                  {/* panah momentum */}
                  {L.e === 0 && !before ? (
                    <Arrow x1={(xa + xb) / 2} y1={y - 112} x2={(xa + xb) / 2 + (pA + pB) * PKc} y2={y - 112} color="spr" width={6} />
                  ) : (
                    <>
                      <Arrow x1={xa} y1={y - 112} x2={xa + pA * PKc} y2={y - 112} color="spr" width={6} />
                      <Arrow x1={xb} y1={y - 112} x2={xb + pB * PKc} y2={y - 112} color="spr" width={6} />
                    </>
                  )}
                </g>
                {/* kata tumbukan lenting sebagian */}
                {i === 1
                  ? ['panas', 'bunyi', 'perubahan bentuk'].map((w, k) => {
                      const o = win(t, words2[k] - 0.1, words2[k] + 1.6, 0.3, 0.5);
                      return (
                        <Label key={w} x={600 + k * 190} y={y - 150} size={24} color={C.heat} weight={600} opacity={o}>
                          {w}
                        </Label>
                      );
                    })
                  : null}
                {i === 2 ? (
                  <Label x={900} y={y - 150} size={24} color={C.press} weight={600} opacity={stick}>
                    menempel, bergerak bersama
                  </Label>
                ) : null}
                {/* aliran energi hilang → batang merah */}
                {L.e < 1 ? (
                  <Stream
                    pts={[
                      [cX, y - 50],
                      [cX + 260, y - 170],
                      [BX + wK + wL / 2, y - 30],
                    ]}
                    color="heat"
                    n={8}
                    speed={0.45}
                    r={4.5}
                    opacity={0.75 * rv * shimmer * Math.max(focus(i), ramp(t, cue(4), cue(4) + 0.6))}
                  />
                ) : null}
                {/* panel kanan */}
                <rect x={1330} y={y - 168} width={490} height={182} rx={16} fill="rgba(10,16,36,0.8)" stroke={L.dot} strokeOpacity={0.35 + 0.4 * focus(i)} strokeWidth={2} />
                <circle cx={1352} cy={y - 140} r={7} fill={L.dot} />
                <Label x={1368} y={y - 140} size={24} weight={600} color={C.ink} anchor="start">
                  {L.title}
                </Label>
                <Label x={1800} y={y - 140} size={22} font="mono" weight={600} color={L.dot} anchor="end">
                  {L.eTxt}
                </Label>
                <Label x={1352} y={y - 100} size={22} font="mono" weight={600} color={C.spr} anchor="start" opacity={pChip}>
                  {'Σp: 4 → 4 kg·m/s  ✓'}
                </Label>
                <g opacity={qMark * (1 - rv)}>
                  <Label x={1352} y={y - 40} size={26} font="serif" italic weight={600} color={C.kin} anchor="start">
                    K sesudah = ?
                  </Label>
                </g>
                <g opacity={rv}>
                  <Label x={1366} y={y - 56} size={26} font="serif" italic weight={600} color={C.kin}>
                    K
                  </Label>
                  <rect x={BX} y={y - 67} width={BAR} height={22} rx={6} fill={C.kin} />
                  <Label x={BX + BAR + 12} y={y - 56} size={20} font="mono" color={C.kin} weight={600} anchor="start">
                    8 J
                  </Label>
                  <Label x={1366} y={y - 17} size={26} font="serif" italic weight={600} color={C.kin}>
                    K′
                  </Label>
                  <rect x={BX} y={y - 28} width={BAR} height={22} rx={6} fill={C.kin} opacity={0.08} />
                  <rect x={BX} y={y - 28} width={wK * ramp(t, cue(i + 1) + 0.5, cue(i + 1) + 1.4)} height={22} rx={6} fill={C.kin} />
                  {lost > 0.01 ? (
                    <g opacity={ramp(t, cue(i + 1) + 1.0, cue(i + 1) + 1.8)}>
                      <rect x={BX + wK} y={y - 28} width={wL} height={22} rx={6} fill={C.heat} opacity={0.75 + 0.25 * Math.sin(t * 3 + i)} />
                      <Label x={BX + wK + wL / 2} y={y - 17} size={17} font="mono" color="#fff" weight={600}>
                        {`${dec(lost)} J`}
                      </Label>
                    </g>
                  ) : null}
                  <Label x={BX + BAR + 12} y={y - 17} size={20} font="mono" color={C.kin} weight={600} anchor="start">
                    {`${dec(K)} J`}
                  </Label>
                  <rect x={BX - 4} y={y - 32} width={BAR + 8} height={30} rx={8} fill="none" stroke={C.ink} strokeWidth={2} strokeDasharray="8 6" strokeDashoffset={-t * 18} opacity={0.8 * totals} />
                </g>
              </g>
            );
          })}
          <Motes x={720} y={600} rx={560} ry={260} n={26} color="gold" opacity={0.35} />
          <Twinkles x={BX + BAR / 2} y={600} rx={200} ry={260} n={5} color="kin" opacity={totals} />
        </g>
      </Stage>
      <Note x={1080} y={196} p={note0} color={C.spr} size={28}>
        <span style={{color: C.spr}}>Σp selalu kekal</span> <span style={{color: C.muted}}>·</span> <span style={{color: C.kin}}>K belum tentu</span>
      </Note>
      <Note x={1080} y={196} p={note4} color={C.heat} size={28}>
        <span style={{color: C.muted, fontSize: 22}}>seri #1 · </span>energi <span style={{color: C.heat}}>tidak hilang</span>, hanya berpindah bentuk
      </Note>
    </AbsoluteFill>
  );
};

