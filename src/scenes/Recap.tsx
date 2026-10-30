import React from 'react';
import {AbsoluteFill} from 'remotion';
import {BACK, EASE_IN_OUT, cyc, ramp, rand, win} from '../anim';
import {Frac, Glow, Motes, Ripple, Stage, Stream, Sub, Twinkles, V} from '../components/primitives';
import {useScene} from '../SceneContext';
import {C, FONT, type Hue} from '../theme';

// Enam kartu rangkuman, masing-masing dengan animasi mini yang terus berulang:
// p = mv · impuls · Σp kekal · jenis tumbukan & e · momentum di kimia · penerapan; lalu pertanyaan kunci.
const SW = 444;
const SH = 64;

const hex2 = (v: number) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0');
const ph = (t: number, period: number, off = 0) => ((((t + off) / period) % 1) + 1) % 1;
const MONO = {fontFamily: FONT.mono, fontSize: 15, fill: C.muted} as const;

/** 01 · p = mv: truk lambat (m besar) vs peluru cepat (m kecil) — panah ungu ∝ p. */
const MiniP: React.FC<{t: number}> = ({t}) => {
  const a = ph(t, 5);
  const b = ph(t, 1.1);
  const xt = 14 + a * 160;
  const xb = 14 + b * 280;
  return (
    <g>
      <line x1={8} y1={40} x2={318} y2={40} stroke={C.faint} strokeWidth={2} />
      <g opacity={cyc(a) * 1.2}>
        <rect x={xt} y={14} width={46} height={22} rx={4} fill="#26305a" stroke="#9fb2e8" strokeWidth={1.5} />
        <rect x={xt + 46} y={20} width={16} height={16} rx={3} fill="#26305a" stroke="#9fb2e8" strokeWidth={1.5} />
        <circle cx={xt + 12} cy={38} r={4} fill="#9fb2e8" />
        <circle cx={xt + 50} cy={38} r={4} fill="#9fb2e8" />
        <line x1={xt + 30} y1={7} x2={xt + 100} y2={7} stroke={C.spr} strokeWidth={3} markerEnd="url(#arrow-spr)" />
      </g>
      <g opacity={cyc(b) * 1.2}>
        <path d={`M${xb},52 l10,0 q5,3 0,6 l-10,0 Z`} fill={C.gold} />
        <line x1={xb - 30} y1={55} x2={xb - 6} y2={55} stroke={C.gold} strokeWidth={1.5} opacity={0.5} />
        <line x1={xb + 2} y1={46} x2={xb + 14} y2={46} stroke={C.spr} strokeWidth={2.5} markerEnd="url(#arrow-spr)" />
      </g>
      <text x={326} y={18} {...MONO} dominantBaseline="central" fill={C.spr}>
        truk: besar
      </text>
      <text x={326} y={46} {...MONO} dominantBaseline="central">
        peluru kecil
      </text>
    </g>
  );
};

/** 02 · Impuls: kurva F–t berubah lebar, luas (= Δp) tetap. */
const MiniJ: React.FC<{t: number}> = ({t}) => {
  const u = 0.5 + 0.5 * Math.sin(t * 0.9);
  const w = 30 + 150 * u;
  const A = 840;
  const pts: string[] = [];
  for (let i = 0; i <= 30; i++) {
    const x = (w * i) / 30;
    const y = 60 - ((2 * A) / w) * Math.sin((Math.PI * i) / 30) ** 2;
    pts.push(`${(40 + x).toFixed(1)},${y.toFixed(1)}`);
  }
  const d = `M${pts.join(' L')}`;
  return (
    <g>
      <line x1={30} y1={60} x2={250} y2={60} stroke={C.muted} strokeWidth={1.5} />
      <line x1={30} y1={60} x2={30} y2={0} stroke={C.muted} strokeWidth={1.5} />
      <path d={`${d} L40,60 Z`} fill={C.work} opacity={0.4} />
      <path d={d} fill="none" stroke={C.force} strokeWidth={2.5} />
      <text x={34} y={4} {...MONO} dominantBaseline="central" fill={C.force} fontSize={13}>
        F
      </text>
      {/* bantal yang tertekan */}
      <rect x={262} y={60 - 26 * (0.4 + 0.6 * u)} width={50} height={26 * (0.4 + 0.6 * u)} rx={8} fill={C.work} opacity={0.25} stroke={C.work} strokeWidth={1.5} />
      <text x={326} y={18} {...MONO} dominantBaseline="central" fill={C.work}>
        luas tetap
      </text>
      <text x={326} y={42} {...MONO} dominantBaseline="central">
        Δt ↑ → F ↓
      </text>
    </g>
  );
};

/** 03 · Σp kekal: troli 2 kg (+1) menumbuk troli 1 kg (−1), lenting: −⅓ dan +⁵⁄₃; Σp tetap. */
const MiniCons: React.FC<{t: number}> = ({t}) => {
  const q = ph(t, 3.2);
  const s = q * 3.2 - 1.6;
  const k = 50;
  const v1 = s < 0 ? 1 : -1 / 3;
  const v2 = s < 0 ? -1 : 5 / 3;
  const x1 = 140 - 20 + k * v1 * s;
  const x2 = 140 + 13 + k * v2 * s;
  // panah bersilang-pudar selama tumbukan singkat (±0,08 dtk)
  const sm = Math.max(0, Math.min(1, (s + 0.08) / 0.16));
  const e = sm * sm * (3 - 2 * sm);
  const a1 = 1 + (-1 / 3 - 1) * e;
  const a2 = -1 + (5 / 3 + 1) * e;
  const P = 16;
  const op = cyc(q) * 1.15;
  const flash = Math.max(0, 1 - Math.abs(s) * 5);
  return (
    <g>
      <line x1={8} y1={50} x2={318} y2={50} stroke={C.faint} strokeWidth={2} />
      <g opacity={Math.min(1, op)}>
        <rect x={x1 - 20} y={26} width={40} height={22} rx={4} fill="#26305a" stroke={C.cyan} strokeWidth={1.5} />
        <rect x={x2 - 13} y={32} width={26} height={16} rx={4} fill="#26305a" stroke={C.kin} strokeWidth={1.5} />
        {Math.abs(2 * a1) > 0.05 ? <line x1={x1} y1={16} x2={x1 + P * 2 * a1} y2={16} stroke={C.spr} strokeWidth={3} markerEnd="url(#arrow-spr)" /> : null}
        {Math.abs(a2) > 0.05 ? <line x1={x2} y1={22} x2={x2 + P * a2} y2={22} stroke={C.spr} strokeWidth={3} markerEnd="url(#arrow-spr)" /> : null}
        <circle cx={140} cy={38} r={14 * flash} fill={C.white} opacity={flash * 0.6} />
      </g>
      {/* Σp tetap */}
      <line x1={110} y1={60} x2={110 + P * 1} y2={60} stroke={C.spr} strokeWidth={3} markerEnd="url(#arrow-spr)" />
      <text x={150} y={60} {...MONO} dominantBaseline="central" fill={C.spr} fontSize={13}>
        Σp
      </text>
      <text x={326} y={18} {...MONO} dominantBaseline="central" fill={C.spr}>
        Σp tetap
      </text>
      <text x={326} y={42} {...MONO} dominantBaseline="central">
        selalu
      </text>
    </g>
  );
};

/** 04 · Jenis tumbukan: bola memantul dengan e = 0,8 (h → 0,64h → 0,41h). */
const MiniE: React.FC<{t: number}> = ({t}) => {
  const H = 50;
  const g = 400;
  const t0 = Math.sqrt((2 * H) / g);
  const segs = [t0, 2 * 0.8 * t0, 2 * 0.64 * t0, 2 * 0.512 * t0];
  const total = segs.reduce((a, b) => a + b, 0) + 0.4;
  const q = ph(t, total);
  let tt = q * total;
  let y = 58;
  let x = 20 + q * 240;
  if (tt < t0) y = 58 - (H - 0.5 * g * tt * tt);
  else {
    tt -= t0;
    let v = g * t0 * 0.8;
    for (let i = 1; i < segs.length; i++) {
      if (tt < segs[i]) {
        y = 58 - (v * tt - 0.5 * g * tt * tt);
        break;
      }
      tt -= segs[i];
      v *= 0.8;
      y = 58;
    }
  }
  x = Math.min(x, 270);
  return (
    <g>
      <line x1={8} y1={64} x2={300} y2={64} stroke={C.muted} strokeWidth={2} />
      {[1, 0.64, 0.41].map((f, i) => (
        <line key={f} x1={8} y1={58 - H * f} x2={300} y2={58 - H * f} stroke={C.kin} strokeWidth={1} strokeDasharray="3 5" opacity={0.45 - i * 0.1} />
      ))}
      <circle cx={x} cy={y} r={6} fill={C.kin} opacity={cyc(q) * 1.1} />
      <circle cx={x - 1.5} cy={y - 2} r={2} fill="#fff" opacity={0.7 * cyc(q)} />
      <text x={326} y={14} {...MONO} dominantBaseline="central" fill={C.kin}>
        e = 0,8
      </text>
      <text x={326} y={38} {...MONO} dominantBaseline="central">
        h′ = 0,64h
      </text>
    </g>
  );
};

/** 05 · Kimia: molekul gas memukul dinding (Δp = 2mv) + foton membawa p = h/λ. */
const MiniChem: React.FC<{t: number}> = ({t}) => {
  const tri = (u: number) => {
    const f = ((u % 2) + 2) % 2;
    return f < 1 ? f : 2 - f;
  };
  const mols = [0, 1, 2, 3].map((i) => {
    const px = tri(t * (0.7 + 0.25 * i) + rand(i) * 2);
    const py = tri(t * (0.45 + 0.2 * i) + rand(i + 7) * 2);
    return {x: 18 + px * 124, y: 12 + py * 42, hit: Math.max(0, 1 - Math.abs(px - 1) * 14)};
  });
  const wallHit = Math.max(...mols.map((m) => m.hit));
  const wave: string[] = [];
  const x0 = 186;
  const head = x0 + ph(t, 1.6) * 110;
  for (let i = 0; i <= 24; i++) {
    const x = head - 60 + (60 * i) / 24;
    wave.push(`${x.toFixed(1)},${(32 + 7 * Math.sin((x - t * 120) * 0.25)).toFixed(1)}`);
  }
  return (
    <g>
      <rect x={10} y={4} width={146} height={58} rx={6} fill="none" stroke="#bfe3ff" strokeOpacity={0.6} strokeWidth={1.5} />
      <line x1={156} y1={4} x2={156} y2={62} stroke={C.press} strokeWidth={4} opacity={0.3 + 0.7 * wallHit} />
      {mols.map((m, i) => (
        <circle key={i} cx={m.x} cy={m.y} r={5} fill="#cfeaff" stroke={C.press} strokeWidth={1} />
      ))}
      <g opacity={cyc(ph(t, 1.6)) * 1.1}>
        <polyline points={wave.join(' ')} fill="none" stroke={C.gold} strokeWidth={2.5} />
        <line x1={head - 4} y1={48} x2={head + 10} y2={48} stroke={C.spr} strokeWidth={2.5} markerEnd="url(#arrow-spr)" />
      </g>
      <text x={326} y={18} {...MONO} dominantBaseline="central" fill={C.press}>
        tekanan gas
      </text>
      <text x={326} y={42} {...MONO} dominantBaseline="central" fill={C.gold}>
        foton
      </text>
    </g>
  );
};

/** 06 · Penerapan: roket (gas buang ke belakang) dan bandul balistik yang berayun. */
const MiniApps: React.FC<{t: number}> = ({t}) => {
  const th = 0.45 * Math.sin(t * 2.2);
  const bx = 236 + 44 * Math.sin(th);
  const by = 2 + 44 * Math.cos(th);
  return (
    <g>
      {Array.from({length: 8}, (_, k) => {
        const q = ph(t, 0.8, k / 8);
        return <circle key={k} cx={56 - q * 50} cy={30 + (rand(k) - 0.5) * 18 * q} r={2 + q * 2} fill="#ffd27a" opacity={cyc(q)} />;
      })}
      <path d="M60,22 L120,22 Q140,24 150,30 Q140,36 120,38 L60,38 Z" fill="#b9c4e6" stroke="#eef3ff" strokeWidth={1} />
      <path d="M60,22 L72,22 L62,12 L54,12 Z M60,38 L72,38 L62,48 L54,48 Z" fill={C.heat} />
      <line x1={90} y1={54} x2={120} y2={54} stroke={C.spr} strokeWidth={2.5} markerEnd="url(#arrow-spr)" />
      <line x1={50} y1={54} x2={24} y2={54} stroke={C.spr} strokeWidth={2.5} markerEnd="url(#arrow-spr)" />
      <line x1={206} y1={2} x2={266} y2={2} stroke="#8fa0d0" strokeWidth={3} />
      <line x1={226} y1={2} x2={bx - 10} y2={by} stroke="#c9d2ee" strokeWidth={1.5} />
      <line x1={246} y1={2} x2={bx + 10} y2={by} stroke="#c9d2ee" strokeWidth={1.5} />
      <rect x={bx - 16} y={by} width={32} height={18} rx={3} fill="#6e4a32" stroke="#c99a6b" strokeWidth={1.5} />
      <text x={326} y={18} {...MONO} dominantBaseline="central">
        roket·bandul
      </text>
      <text x={326} y={42} {...MONO} dominantBaseline="central">
        helm·airbag
      </text>
    </g>
  );
};

const ITEMS: {title: string; color: string; hue: Hue; body: React.ReactNode; size?: number; Mini: React.FC<{t: number}>}[] = [
  {
    title: 'Momentum',
    color: C.spr,
    hue: 'spr',
    body: (
      <span>
        <V color={C.spr}>p</V> = <V>m</V> <V color={C.cyan}>v</V>
        <span style={{fontFamily: FONT.sans, fontSize: 22, color: C.muted}}> &nbsp;(vektor)</span>
      </span>
    ),
    Mini: MiniP,
  },
  {
    title: 'Impuls',
    color: C.work,
    hue: 'work',
    body: (
      <span>
        <V color={C.work}>J</V> = <V color={C.force}>F</V>
        <V>Δt</V> = <V color={C.spr}>Δp</V>
      </span>
    ),
    Mini: MiniJ,
  },
  {
    title: 'Kekekalan momentum',
    color: C.cyan,
    hue: 'cyan',
    size: 32,
    body: (
      <span>
        Σ<V color={C.spr}>p</V>
        <Sub>sebelum</Sub> = Σ<V color={C.spr}>p</V>
        <Sub>sesudah</Sub>
      </span>
    ),
    Mini: MiniCons,
  },
  {
    title: 'Jenis tumbukan',
    color: C.kin,
    hue: 'kin',
    size: 32,
    body: (
      <span>
        <V color={C.kin}>K</V> kekal hanya bila <V>e</V> = 1
      </span>
    ),
    Mini: MiniE,
  },
  {
    title: 'Momentum di kimia',
    color: C.press,
    hue: 'press',
    size: 34,
    body: (
      <span>
        <V color={C.spr}>Δp</V> = 2<V>mv</V> &nbsp;·&nbsp; <V color={C.spr}>p</V> = <Frac n={<V>h</V>} d={<V>λ</V>} />
      </span>
    ),
    Mini: MiniChem,
  },
  {
    title: 'Penerapan',
    color: C.force,
    hue: 'force',
    size: 27,
    body: <span style={{fontFamily: FONT.head}}>keselamatan · bandul · roket</span>,
    Mini: MiniApps,
  },
];

const COLS = [400, 960, 1520];
const ROWS = [326, 596];
const CH = 244;

export const Recap: React.FC = () => {
  const {t, cue, wordOf} = useScene();
  const starts = [cue(1), cue(2), cue(3), Math.max(cue(3) + 1.6, wordOf(3, 'Energi') - 0.3), cue(4), Math.max(cue(4) + 1.4, wordOf(4, 'roket') - 0.3)];
  const nextOf = (i: number) => (i < 5 ? starts[i + 1] : cue(5));
  const head = ramp(t, 0, 0.8);
  const q = ramp(t, cue(5) + 0.2, cue(5) + 1.2);
  const dim = 1 - 0.6 * ramp(t, cue(5), cue(5) + 1.0, EASE_IN_OUT);
  const hlMom = ramp(t, wordOf(5, 'momentumnya') - 0.2, wordOf(5, 'momentumnya') + 0.4);
  const hlEn = ramp(t, wordOf(5, 'energinya') - 0.2, wordOf(5, 'energinya') + 0.4);
  return (
    <AbsoluteFill>
      <Stage>
        <Motes x={960} y={470} rx={900} ry={330} n={40} color="spr" opacity={0.3} seed={5} />
        {/* lintasan latar: pasangan butir yang bertumbukan pelan lalu berpisah */}
        {Array.from({length: 6}, (_, k) => {
          const y = 210 + k * 120;
          const P = 9 + 3 * rand(k);
          const u = ph(t, P, rand(k * 3.1) * P);
          const s = (u - 0.5) * P;
          const xc = 300 + rand(k * 5) * 1320;
          const xa = xc - 22 + (s < 0 ? 60 * s : -30 * s);
          const xb = xc + 22 + (s < 0 ? -60 * s : 30 * s);
          const o = cyc(u) * 0.3;
          return (
            <g key={k} opacity={o}>
              <line x1={xa - 160} y1={y} x2={xb + 160} y2={y} stroke={C.spr} strokeWidth={1} opacity={0.3} />
              <circle cx={xa} cy={y} r={4} fill="#e6d4ff" />
              <circle cx={xb} cy={y} r={4} fill="#e6d4ff" />
            </g>
          );
        })}
        {ITEMS.map((it, i) => {
          const x = COLS[i % 3];
          const y = ROWS[Math.floor(i / 3)];
          const o = ramp(t, 0.2 + i * 0.12, 0.9 + i * 0.12) * (1 - ramp(t, starts[i] - 0.2, starts[i] + 0.4));
          const pulse = 0.5 + 0.5 * Math.sin(t * 2.2 - i * 0.9);
          return o > 0.01 ? (
            <rect key={it.title} x={x - 250} y={y - CH / 2} width={500} height={CH} rx={20} fill={it.color} fillOpacity={0.03 + 0.03 * pulse} stroke={it.color} strokeOpacity={0.25 + 0.25 * pulse} strokeWidth={2} strokeDasharray="10 9" strokeDashoffset={-t * 16} opacity={o} />
          ) : null;
        })}
        {ITEMS.map((it, i) => {
          const x = COLS[i % 3];
          const y = ROWS[Math.floor(i / 3)];
          const act = win(t, starts[i], nextOf(i), 0.5, 0.6) * dim;
          return (
            <g key={it.title}>
              <Glow x={x} y={y} r={300} color={it.hue} opacity={0.35 * act} />
              <Ripple x={x} y={y} p={(t - starts[i] - 0.1) / 1.3} r={300} color={it.hue} rings={2} width={2} />
            </g>
          );
        })}
        <g opacity={q}>
          <Stream
            pts={[
              [90, 800],
              [140, 800],
              [190, 800],
            ]}
            color="spr"
            n={6}
            speed={0.6}
            r={6}
            jitter={4}
          />
          <Stream
            pts={[
              [1830, 800],
              [1780, 800],
              [1730, 800],
            ]}
            color="kin"
            n={6}
            speed={0.6}
            r={6}
            jitter={4}
          />
          <Twinkles x={960} y={800} rx={620} ry={40} n={7} color="gold" seed={7} />
        </g>
      </Stage>
      <div style={{position: 'absolute', left: 0, right: 0, top: 150, textAlign: 'center', fontFamily: FONT.head, fontSize: 30, letterSpacing: 8 + 2 * (1 - head), color: C.gold, fontWeight: 600, opacity: head}}>
        RANGKUMAN
      </div>
      {ITEMS.map((it, i) => {
        const p = ramp(t, starts[i] - 0.1, starts[i] + 0.7, BACK);
        const x = COLS[i % 3];
        const y = ROWS[Math.floor(i / 3)];
        const act = win(t, starts[i], nextOf(i), 0.5, 0.6);
        const mini = ramp(t, starts[i] + 0.4, starts[i] + 1.2);
        const bob = 3 * Math.sin(t * 1.1 + i * 1.3);
        const Mini = it.Mini;
        return (
          <div
            key={it.title}
            style={{
              position: 'absolute',
              left: x - 250,
              top: y - CH / 2,
              width: 500,
              height: CH,
              boxSizing: 'border-box',
              borderRadius: 20,
              background: 'linear-gradient(160deg, rgba(22,34,72,0.95), rgba(10,16,36,0.95))',
              border: `1.5px solid ${it.color}${hex2(0x55 + 0x44 * act)}`,
              borderLeft: `8px solid ${it.color}`,
              boxShadow: `0 16px 44px rgba(0,0,0,0.45), 0 0 ${30 + 30 * act}px ${it.color}${hex2(0x22 + 0x22 * act)}`,
              padding: '18px 28px 0',
              opacity: Math.min(1, p) * dim,
              scale: String(0.9 + 0.1 * p + 0.02 * act),
              translate: `0px ${bob - 6 * act}px`,
              color: C.ink,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: `linear-gradient(105deg, transparent ${-40 + p * 150 - 16}%, rgba(255,245,220,0.12) ${-40 + p * 150}%, transparent ${-40 + p * 150 + 16}%)`,
                pointerEvents: 'none',
              }}
            />
            <div style={{fontFamily: FONT.head, fontSize: 26, color: it.color, fontWeight: 600, letterSpacing: 1}}>
              {String(i + 1).padStart(2, '0')} · {it.title}
            </div>
            <div style={{fontFamily: FONT.serif, fontSize: it.size ?? 38, marginTop: 10, whiteSpace: 'nowrap', textAlign: 'center', height: 82, lineHeight: '82px'}}>{it.body}</div>
            <svg width={SW} height={SH} viewBox={`0 0 ${SW} ${SH}`} style={{display: 'block', marginTop: 2, opacity: mini, overflow: 'visible'}}>
              <Mini t={t + rand(i) * 3} />
            </svg>
          </div>
        );
      })}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 770,
          textAlign: 'center',
          fontFamily: FONT.head,
          fontSize: 46,
          fontWeight: 700,
          color: C.ink,
          opacity: q,
          translate: `0px ${(1 - q) * 20}px`,
          whiteSpace: 'nowrap',
        }}
      >
        Ke mana <span style={{color: C.spr, textShadow: `0 0 ${24 * hlMom}px ${C.spr}88`}}>momentumnya berpindah</span>, dan ke mana{' '}
        <span style={{color: C.kin, textShadow: `0 0 ${24 * hlEn}px ${C.kin}88`}}>energinya pergi</span>?
      </div>
    </AbsoluteFill>
  );
};
