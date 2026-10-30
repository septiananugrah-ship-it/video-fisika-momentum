import React from 'react';
import {AbsoluteFill} from 'remotion';
import {BACK, EASE_IN_OUT, ramp, rand, smoothPath, win} from '../anim';
import {Arrow, DrawPath, Glow, Motes, Ripple, Spark, Stage, Stream, pointAlong} from '../components/primitives';
import {useScene} from '../SceneContext';
import {C, FONT, type Hue} from '../theme';

// Peta video: tiga kartu bagian dengan ikon yang terus bergerak (dihitung analitik):
// (1) dua kereta bermassa sama bertumbukan lenting di rel (bertukar kecepatan, panah momentum berpindah),
// (2) molekul gas memantul di dalam kotak (kilatan tekanan di dinding) + foton yang menabrak dinding,
// (3) roket naik dengan gas buang (gas dihitung di kerangka lab) dan bintang yang mengalir turun;
// dihubungkan oleh lintasan tempat sebutir cahaya ungu merambat.
const PARTS = [
  {n: '1', title: 'Konsep & cara berpikir', color: C.cyan, hue: 'cyan' as Hue, items: ['Momentum', 'Impuls', 'Kekekalan momentum', 'Jenis-jenis tumbukan', 'Koefisien restitusi']},
  {n: '2', title: 'Momentum di dunia kimia', color: C.spr, hue: 'spr' as Hue, items: ['Tekanan gas', 'Teori tumbukan', 'Momentum cahaya']},
  {n: '3', title: 'Penerapan', color: C.work, hue: 'work' as Hue, items: ['Keselamatan berkendara', 'Bandul balistik', 'Roket']},
];
const KEYS = [
  ['momentum', 'impuls', 'kekekalan', 'jenis', 'restitusi'],
  ['tekanan', 'teori', 'cahaya'],
  ['keselamatan', 'bandul', 'roket'],
];
const CX = [380, 960, 1540];
const TOP = 196;
const CW = 500;
const CH = 600;
const PY = TOP + CH + 40;
const ICON_Y = TOP + 205;

const X0P = CX[0] - 200;
const X1P = CX[2] + 200;
const PTS: [number, number][] = Array.from({length: 61}, (_, i) => {
  const u = i / 60;
  const x = X0P + (X1P - X0P) * u;
  const y = PY + 9 * (1 - Math.cos(((x - CX[0]) / (CX[1] - CX[0])) * Math.PI * 2)) * (x > CX[0] && x < CX[2] ? 1 : 0.3);
  return [x, y];
});
const PTS_D = smoothPath(PTS);
const UX = CX.map((x) => (x - X0P) / (X1P - X0P));

const tri = (raw: number, L: number) => {
  const m = ((raw % (2 * L)) + 2 * L) % (2 * L);
  return m <= L ? {u: m, s: 1} : {u: 2 * L - m, s: -1};
};

/** Ikon tiap bagian (SVG, selalu bergerak). */
const Icon: React.FC<{i: number; x: number; y: number; t: number; act: number}> = ({i, x, y, t, act}) => {
  if (i === 0) {
    // dua kereta bermassa sama di rel: tumbukan lenting = bertukar kecepatan (hantu bebas yang diurutkan)
    const w = 76;
    const x0 = x - 200;
    const x1 = x + 200;
    const L = x1 - x0 - 2 * w;
    const yr = y + 40;
    const g = [tri(30 + 150 * t, L), tri(L * 0.6, L)].map((q, k) => ({u: q.u, v: k === 0 ? 150 * q.s : 0}));
    g.sort((a, b) => a.u - b.u);
    const carts = g.map((q, k) => ({x: x0 + w / 2 + k * w + q.u, v: q.v}));
    const gap = g[1].u - g[0].u;
    const flash = Math.max(0, 1 - gap / 30) ** 2;
    const wallL = Math.max(0, 1 - g[0].u / 26) ** 2;
    const wallR = Math.max(0, 1 - (L - g[1].u) / 26) ** 2;
    return (
      <g>
        <Glow x={x} y={y} r={170} color="cyan" opacity={0.25 + 0.3 * act} />
        <rect x={x0 - 10} y={yr + 4} width={x1 - x0 + 20} height={12} rx={6} fill="#1a2550" stroke="#56628f" strokeWidth={1.5} />
        {[x0 - 12, x1 + 12].map((bx, k) => (
          <rect key={k} x={bx - 5} y={yr - 60} width={10} height={70} rx={4} fill="#56628f" />
        ))}
        <circle cx={x0} cy={yr - 28} r={34} fill="url(#soft-cyan)" opacity={wallL} />
        <circle cx={x1} cy={yr - 28} r={34} fill="url(#soft-cyan)" opacity={wallR} />
        {carts.map((c, k) => (
          <g key={k} transform={`translate(${c.x} ${yr})`}>
            <rect x={-w / 2 + 3} y={-56} width={w - 6} height={48} rx={9} fill="url(#crate)" stroke={k === 0 ? C.cyan : C.press} strokeWidth={2.5} />
            {[-20, 20].map((wx) => (
              <circle key={wx} cx={wx} cy={-6} r={7} fill="#0b1022" stroke={C.muted} strokeWidth={2} />
            ))}
            {Math.abs(c.v) > 1 ? <Arrow x1={0} y1={-80} x2={c.v * 0.55} y2={-80} color="spr" width={6} pulse={false} /> : null}
          </g>
        ))}
        <circle cx={carts[0].x + w / 2} cy={yr - 32} r={44} fill="url(#soft-spr)" opacity={flash} />
      </g>
    );
  }
  if (i === 1) {
    // molekul gas memantul di kotak; tiap pantulan dinding = Δp = 2mv → kilatan tekanan
    const bx0 = x - 160;
    const by0 = y - 70;
    const W = 320;
    const Hh = 190;
    const mol = Array.from({length: 9}, (_, k) => {
      const vx = (90 + rand(k * 3.1) * 120) * (rand(k * 7.7) > 0.5 ? 1 : -1);
      const vy = (70 + rand(k * 5.3) * 110) * (rand(k * 2.9) > 0.5 ? 1 : -1);
      const qx = tri(rand(k * 1.7) * 600 + vx * t, W - 16);
      const qy = tri(rand(k * 4.1) * 600 + vy * t, Hh - 16);
      return {x: bx0 + 8 + qx.u, y: by0 + 8 + qy.u, ux: qx.u, uy: qy.u, k};
    });
    // foton: paket gelombang kecil melaju ke dinding kanan lalu memantul (siklus 3 dtk)
    const ph = ((t / 3) % 1 + 1) % 1;
    const fx = ph < 0.5 ? bx0 + 40 + ph * 2 * (W - 70) : bx0 + W - 30 - 2 * (ph - 0.5) * (W - 70);
    const fy = y + 25 + 30 * Math.sin(t * 0.7);
    return (
      <g>
        <Glow x={x} y={y} r={170} color="spr" opacity={0.25 + 0.3 * act} />
        <rect x={bx0} y={by0} width={W} height={Hh} rx={10} fill="rgba(183,125,255,0.05)" stroke="#c9d3ee" strokeOpacity={0.7} strokeWidth={3} />
        {mol.map((m) => {
          const fl = Math.max(0, 1 - m.ux / 14) + Math.max(0, 1 - (W - 16 - m.ux) / 14);
          const fy2 = Math.max(0, 1 - m.uy / 14) + Math.max(0, 1 - (Hh - 16 - m.uy) / 14);
          const wx = m.ux < (W - 16) / 2 ? bx0 : bx0 + W;
          const wy = m.uy < (Hh - 16) / 2 ? by0 : by0 + Hh;
          return (
            <g key={m.k}>
              {fl > 0.01 ? <circle cx={wx} cy={m.y} r={22} fill="url(#soft-press)" opacity={Math.min(1, fl)} /> : null}
              {fy2 > 0.01 ? <circle cx={m.x} cy={wy} r={22} fill="url(#soft-press)" opacity={Math.min(1, fy2)} /> : null}
              <circle cx={m.x} cy={m.y} r={7} fill={m.k % 3 === 0 ? '#ff5a6e' : '#4d7dff'} />
              <circle cx={m.x - 2} cy={m.y - 2} r={2.4} fill="#fff" opacity={0.7} />
            </g>
          );
        })}
        <path
          d={Array.from({length: 13}, (_, k) => {
            const xx = fx - 30 + k * 5;
            const env = Math.sin((Math.PI * k) / 12);
            return `${k ? 'L' : 'M'}${xx.toFixed(1)},${(fy + 9 * env * Math.sin(k * 1.6 - t * 18)).toFixed(1)}`;
          }).join(' ')}
          fill="none"
          stroke={C.gold}
          strokeWidth={3}
          strokeLinecap="round"
        />
        <circle cx={fx} cy={fy} r={16} fill="url(#soft-gold)" />
      </g>
    );
  }
  // roket naik: gas buang dihitung di kerangka lab, bintang mengalir turun (kamera mengikuti roket)
  const rx = x;
  const ry = y + 10 + 6 * Math.sin(t * 1.1);
  const V = 120; // laju roket (px/s, dalam kerangka bintang)
  const U = 160; // laju gas relatif
  return (
    <g>
      <Glow x={x} y={y} r={170} color="work" opacity={0.25 + 0.3 * act} />
      {Array.from({length: 16}, (_, k) => {
        const sx = x - 190 + rand(k * 2.3) * 380;
        const yy = y - 110 + (((rand(k * 5.1) * 230 + V * 0.6 * t * (0.5 + rand(k))) % 230) + 230) % 230;
        return <line key={k} x1={sx} y1={yy} x2={sx} y2={yy - 6 - 10 * rand(k)} stroke="#dfe8ff" strokeOpacity={0.5} strokeWidth={1.6} strokeLinecap="round" />;
      })}
      {Array.from({length: 14}, (_, k) => {
        const emit = Math.floor(t / 0.07) * 0.07 - k * 0.07;
        const age = t - emit;
        const life = age / 0.38;
        if (life >= 1 || life < 0) return null;
        const spread = (rand(Math.round(emit / 0.07) * 1.3) - 0.5) * 60;
        // kamera ikut roket: gas bergerak ke bawah dengan laju U relatif roket
        const gy = ry + 62 + U * age;
        const gx = rx + spread * age;
        return <circle key={k} cx={gx} cy={gy} r={4 + 16 * life} fill={life < 0.3 ? 'url(#soft-gold)' : 'url(#soft-kin)'} opacity={Math.min(1, life * 10) * (1 - life)} />;
      })}
      <g transform={`translate(${rx} ${ry})`}>
        <path d={`M-9,50 Q0,${78 + 10 * Math.sin(t * 29)} 9,50 Z`} fill={C.kin} />
        <path d="M-5,50 Q0,66 5,50 Z" fill="#fff4d0" />
        <path d="M-14,26 L-30,52 L-14,44 Z M14,26 L30,52 L14,44 Z" fill={C.heat} />
        <path d="M-15,48 L-15,-30 Q-14,-62 0,-78 Q14,-62 15,-30 L15,48 Z" fill="#dfe6f8" />
        <path d="M-15,-30 Q-14,-62 0,-78 Q14,-62 15,-30 Z" fill={C.heat} />
        <circle cx={0} cy={-10} r={7} fill="#16224a" stroke={C.cyan} strokeWidth={2.5} />
      </g>
      <Arrow x1={rx + 52} y1={ry + 20} x2={rx + 52} y2={ry - 60} color="spr" width={6} pulse={false} />
      <Arrow x1={rx - 52} y1={ry + 20} x2={rx - 52} y2={ry + 80} color="spr" width={6} pulse={false} opacity={0.8} />
    </g>
  );
};

export const Roadmap: React.FC = () => {
  const {t, cue, dur, wordOf} = useScene();
  const head = ramp(t, 0, 0.8);
  const ps = [ramp(t, cue(1) - 0.2, cue(1) + 0.7, BACK), ramp(t, cue(2) - 0.2, cue(2) + 0.7, BACK), ramp(t, cue(3) - 0.2, cue(3) + 0.7, BACK)];
  const act = [win(t, cue(1) - 0.2, cue(2) - 0.3, 0.6, 0.8), win(t, cue(2) - 0.2, cue(3) - 0.3, 0.6, 0.8), win(t, cue(3) - 0.2, dur, 0.6, 0.8)];
  const pathP =
    UX[0] * ramp(t, 0.6, cue(1), EASE_IN_OUT) +
    (UX[1] - UX[0]) * ramp(t, cue(2) - 0.6, cue(2) + 0.6, EASE_IN_OUT) +
    (UX[2] - UX[1]) * ramp(t, cue(3) - 0.6, cue(3) + 0.6, EASE_IN_OUT) +
    (1 - UX[2]) * ramp(t, cue(3) + 0.6, cue(3) + 2.2, EASE_IN_OUT);
  const [lx, ly] = pointAlong(PTS, pathP);
  const lead: [number, number][] = [1, 2, 3, 4, 5].map((k) => pointAlong(PTS, Math.max(0, pathP - k * 0.008)));
  const loop = ramp(t, cue(3) + 1.6, cue(3) + 2.6);
  const ghost = win(t, 0.4, cue(3) + 0.6, 0.8, 0.8);
  const itemAt = (i: number, k: number) => wordOf(i + 1, KEYS[i][k]) - 0.15;
  const imp = ramp(t, wordOf(0, 'impuls') - 0.2, wordOf(0, 'impuls') + 0.6);

  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', left: 0, right: 0, top: 96, textAlign: 'center', fontFamily: FONT.head, fontSize: 50, fontWeight: 700, color: C.ink, opacity: head, translate: `0px ${(1 - head) * 14}px`}}>
        Peta perjalanan: <span style={{color: C.spr}}>momentum</span> <span style={{opacity: 0.35 + 0.65 * imp}}>&amp;</span> <span style={{color: C.work, opacity: 0.35 + 0.65 * imp}}>impuls</span>
      </div>
      <Stage>
        <Motes x={960} y={520} rx={900} ry={340} n={36} color="spr" opacity={0.4} seed={11} />
        {/* keping samar di latar yang meluncur dan sesekali bersinggungan */}
        {[250, 520, 790].map((y, k) => {
          const L = 2000;
          const q1 = tri(k * 500 + 70 * t, L);
          const q2 = tri(k * 500 + 900 - 50 * t, L);
          return (
            <g key={k} opacity={0.35 * head}>
              {[q1, q2].map((q, j) => (
                <circle key={j} cx={-40 + q.u} cy={y + 18 * Math.sin(t * 0.4 + k + j)} r={9} fill="none" stroke="#bda6ff" strokeOpacity={0.5} strokeWidth={2} />
              ))}
            </g>
          );
        })}
        {PARTS.map((p, i) => (
          <rect
            key={`gh${i}`}
            x={CX[i] - CW / 2}
            y={TOP}
            width={CW}
            height={CH}
            rx={24}
            fill="none"
            stroke={p.color}
            strokeOpacity={0.35}
            strokeWidth={2}
            strokeDasharray="10 12"
            strokeDashoffset={-t * 24}
            opacity={ghost * (1 - Math.min(1, ps[i]))}
          />
        ))}
        {PARTS.map((p, i) => (
          <Glow key={`gl${i}`} x={CX[i]} y={TOP + CH / 2} r={420} color={p.hue} opacity={0.35 * act[i]} />
        ))}
        <path d={PTS_D} fill="none" stroke={C.line} strokeWidth={4} strokeDasharray="4 12" strokeLinecap="round" opacity={head} />
        <DrawPath d={PTS_D} p={pathP} stroke="spr" width={3} halo opacity={0.85} />
        <Spark x={lx} y={ly} r={7} color="spr" trail={lead} opacity={(1 - loop) * ramp(t, 0.6, 1.0)} />
        <Stream pts={PTS} color="spr" n={5} speed={0.12} r={5} jitter={2} opacity={loop} />
        {PARTS.map((p, i) => (
          <g key={i} opacity={Math.min(1, ps[i])}>
            <Ripple x={CX[i]} y={PY} p={ramp(t, cue(i + 1) - 0.1, cue(i + 1) + 1.4, (x) => x)} r={90} color={p.hue} />
            <circle cx={CX[i]} cy={PY} r={20 + 4 * Math.sin(t * 2.4 + i)} fill={`url(#soft-${p.hue})`} />
            <circle cx={CX[i]} cy={PY} r={11} fill={p.color} />
            <circle cx={CX[i]} cy={PY} r={4.5} fill="#fff" opacity={0.8} />
          </g>
        ))}
      </Stage>
      {PARTS.map((p, i) => {
        const q0 = Math.min(1, ps[i]);
        return (
          <div
            key={p.n}
            style={{
              position: 'absolute',
              left: CX[i] - CW / 2,
              top: TOP,
              width: CW,
              height: CH,
              borderRadius: 24,
              background: 'linear-gradient(160deg, rgba(22,34,72,0.94), rgba(10,16,36,0.94))',
              border: `1.5px solid ${p.color}55`,
              borderTop: `8px solid ${p.color}`,
              boxShadow: `0 20px 60px rgba(0,0,0,0.45), 0 0 ${40 + 40 * act[i]}px ${p.color}${Math.round(0x22 + 0x30 * act[i]).toString(16).padStart(2, '0')}`,
              opacity: Math.min(1, ps[i] * 1.3) * (0.35 + 0.65 * q0),
              translate: `0px ${(1 - q0) * 40 - 6 * act[i]}px`,
              scale: String(0.9 + 0.1 * ps[i]),
              fontFamily: FONT.head,
              color: C.ink,
              padding: '22px 34px',
              boxSizing: 'border-box',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                position: 'absolute',
                inset: 0,
                pointerEvents: 'none',
                background: `linear-gradient(105deg, transparent ${-40 + 150 * q0 - 16}%, rgba(220,240,255,0.12) ${-40 + 150 * q0}%, transparent ${-40 + 150 * q0 + 16}%)`,
              }}
            />
            <div style={{fontFamily: FONT.mono, fontSize: 22, color: p.color, letterSpacing: 4}}>BAGIAN {p.n}</div>
            <div style={{fontSize: 31, fontWeight: 700, marginTop: 4, letterSpacing: -0.5, whiteSpace: 'nowrap'}}>{p.title}</div>
            <div style={{height: 216}} />
            <div>
              {p.items.map((it, k) => {
                const q = ramp(t, itemAt(i, k), itemAt(i, k) + 0.6);
                return (
                  <div key={it} style={{fontSize: i === 0 ? 26 : 28, color: C.muted, lineHeight: i === 0 ? 1.46 : 1.7, opacity: q, translate: `${(1 - q) * 14}px 0px`, whiteSpace: 'nowrap'}}>
                    <span style={{color: p.color, marginRight: 8}}>—</span>
                    {it}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
      <Stage>
        {PARTS.map((_, i) => (
          <g key={i} opacity={Math.min(1, ps[i])}>
            <g transform={`translate(${CX[i]} ${ICON_Y}) scale(0.84) translate(${-CX[i]} ${-ICON_Y})`}>
              <Icon i={i} x={CX[i]} y={ICON_Y} t={t} act={act[i]} />
            </g>
          </g>
        ))}
      </Stage>
    </AbsoluteFill>
  );
};
