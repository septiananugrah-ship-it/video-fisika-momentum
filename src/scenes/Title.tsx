import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {BACK, EASE_IN_OUT, cyc, ramp, rand} from '../anim';
import {Arrow, Glow, Ripple, Stage, Twinkles} from '../components/primitives';
import {BRAND} from '../brand';
import {useScene} from '../SceneContext';
import {C, FONT} from '../theme';

// Judul bernuansa tumbukan: dua rel udara (atas & bawah) berisi keping bermassa sama yang bertumbukan
// lenting sempurna. Untuk massa sama, tumbukan lenting = bertukar kecepatan, sehingga posisinya tepat sama
// dengan "partikel hantu" bebas yang saling tembus (diurutkan) — dihitung analitik per frame.
// Panah momentum ungu berpindah dari keping ke keping; kilatan muncul di titik sentuh.
const CX = 960;
const CY = 470;
const fr = (v: number) => ((v % 1) + 1) % 1;

type Rail = {x0: number; x1: number; y: number; r: number; v: number[]; u0: number[]};
const RAILS: Rail[] = [
  {x0: 250, x1: 1670, y: 128, r: 15, v: [210, 0, 0, -90, 0], u0: [40, 300, 520, 800, 1050]},
  {x0: 180, x1: 1740, y: 866, r: 22, v: [260, 0, -120, 0, 0, 60], u0: [30, 340, 560, 820, 1020, 1200]},
];

/** Posisi & kecepatan keping (terurut) pada rel: hantu bebas memantul di ujung → diurutkan. */
const railAt = (rl: Rail, t: number) => {
  const n = rl.v.length;
  const L = rl.x1 - rl.x0 - 2 * rl.r * n; // panjang tereduksi
  const g = rl.v.map((v, i) => {
    const raw = rl.u0[i] * (L / 1200) + v * t;
    const m = ((raw % (2 * L)) + 2 * L) % (2 * L);
    return m <= L ? {u: m, v} : {u: 2 * L - m, v: -v};
  });
  g.sort((a, b) => a.u - b.u);
  return g.map((q, i) => ({x: rl.x0 + rl.r + 2 * rl.r * i + q.u, v: q.v, u: q.u, L}));
};

const RailView: React.FC<{rl: Rail; t: number; op: number; k: number}> = ({rl, t, op, k}) => {
  const ps = railAt(rl, t);
  const L = ps[0].L;
  return (
    <g opacity={op}>
      <rect x={rl.x0 - 14} y={rl.y + rl.r + 4} width={rl.x1 - rl.x0 + 28} height={10} rx={5} fill="#1a2550" stroke="#56628f" strokeWidth={1.5} />
      {Array.from({length: Math.floor((rl.x1 - rl.x0) / 46)}, (_, i) => (
        <circle key={i} cx={rl.x0 + 10 + i * 46} cy={rl.y + rl.r + 9} r={1.8} fill={C.cyan} opacity={0.25 + 0.2 * Math.sin(t * 5 + i + k)} />
      ))}
      {/* penyangga ujung */}
      {[rl.x0 - 8, rl.x1 + 8].map((x, i) => (
        <rect key={i} x={x - 5} y={rl.y - rl.r - 6} width={10} height={2 * rl.r + 20} rx={4} fill="#56628f" />
      ))}
      {/* kilatan di titik sentuh antar-keping & di penyangga */}
      {ps.slice(0, -1).map((p, i) => {
        const gap = ps[i + 1].u - p.u;
        const f = Math.max(0, 1 - gap / 34) ** 2;
        return f > 0.01 ? <circle key={`f${i}`} cx={p.x + rl.r} cy={rl.y} r={rl.r * 3.2} fill="url(#soft-spr)" opacity={f} /> : null;
      })}
      {[ps[0].u, L - ps[ps.length - 1].u].map((d, i) => {
        const f = Math.max(0, 1 - d / 30) ** 2;
        return f > 0.01 ? <circle key={`w${i}`} cx={i ? rl.x1 : rl.x0} cy={rl.y} r={rl.r * 2.6} fill="url(#soft-cyan)" opacity={f} /> : null;
      })}
      {ps.map((p, i) => (
        <g key={i}>
          <ellipse cx={p.x} cy={rl.y + rl.r + 3} rx={rl.r * 0.9} ry={3} fill="#000" opacity={0.35} />
          <circle cx={p.x} cy={rl.y} r={rl.r} fill="url(#ti-puck)" stroke="#e6ecff" strokeOpacity={0.55} strokeWidth={1.5} />
          <circle cx={p.x - rl.r * 0.35} cy={rl.y - rl.r * 0.38} r={rl.r * 0.24} fill="#fff" opacity={0.7} />
          {Math.abs(p.v) > 1 ? (
            <Arrow x1={p.x} y1={rl.y - rl.r - 16} x2={p.x + p.v * 0.42} y2={rl.y - rl.r - 16} color="spr" width={k ? 6 : 5} pulse={false} opacity={Math.min(1, Math.abs(p.v) / 40)} />
          ) : null}
          {/* garis gerak di belakang keping cepat */}
          {Math.abs(p.v) > 150
            ? [0, 1, 2].map((j) => (
                <line
                  key={j}
                  x1={p.x - Math.sign(p.v) * (rl.r + 8 + j * 4)}
                  y1={rl.y - 8 + j * 8}
                  x2={p.x - Math.sign(p.v) * (rl.r + 30 + j * 10)}
                  y2={rl.y - 8 + j * 8}
                  stroke="#cfe0ff"
                  strokeOpacity={0.35}
                  strokeWidth={2}
                  strokeLinecap="round"
                />
              ))
            : null}
        </g>
      ))}
    </g>
  );
};

export const Title: React.FC = () => {
  const {t, dur} = useScene();
  const a = ramp(t, 0.2, 1.4);
  const sub = ramp(t, 1.5, 2.5);
  const brand = ramp(t, 2.6, 3.6);
  const out = 1 - ramp(t, dur - 1.0, dur - 0.1, EASE_IN_OUT);
  const push = 1 + 0.035 * ramp(t, -0.8, dur, EASE_IN_OUT);
  const rails = ramp(t, 0.1, 1.4);
  // "tumbukan" judul: huruf bagian kedua menerima dorongan kecil saat denyut lewat
  const knock = ramp(t, 3.4, 4.0, EASE_IN_OUT) * (1 - ramp(t, 4.0, 5.2, EASE_IN_OUT));
  const title = BRAND.title;
  const split = title.indexOf('Pernah');
  // denyut momentum yang melintas di bawah judul (dari kiri ke kanan)
  const pulseP = ramp(t, 2.9, 4.6, EASE_IN_OUT);

  return (
    <AbsoluteFill style={{opacity: out}}>
      <AbsoluteFill style={{transform: `scale(${push})`, transformOrigin: '50% 48%'}}>
        <Stage>
          <defs>
            <linearGradient id="ti-ray" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#d9c2ff" stopOpacity={0.13} />
              <stop offset="100%" stopColor="#d9c2ff" stopOpacity={0} />
            </linearGradient>
            <radialGradient id="ti-puck" cx="35%" cy="30%" r="75%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="35%" stopColor="#c3b6f0" />
              <stop offset="75%" stopColor="#5a4f8f" />
              <stop offset="100%" stopColor="#1e1a45" />
            </radialGradient>
          </defs>
          <Glow x={CX} y={CY} r={720} color="spr" opacity={0.36 * a} />
          <Glow x={CX} y={150} r={420} color="cyan" opacity={0.18 * rails} />
          {/* berkas cahaya, bergoyang pelan */}
          {Array.from({length: 6}, (_, i) => {
            const x = 260 + i * 290 + 40 * Math.sin(t * 0.5 + i * 1.3);
            const w = 70 + 40 * rand(i * 2.7);
            const sk = 120 + 60 * Math.sin(t * 0.3 + i);
            return <path key={i} d={`M${x},0 L${x + w},0 L${x + w + sk},860 L${x + sk - w * 0.6},860 Z`} fill="url(#ti-ray)" opacity={a * (0.5 + 0.4 * Math.sin(t * 0.9 + i * 2))} />;
          })}
          {/* debu keping kecil yang melayang di meja udara (pinggir) */}
          {Array.from({length: 16}, (_, i) => {
            const ph = fr(t * (0.05 + rand(i) * 0.05) + rand(i * 3.3));
            const y = 260 + rand(i * 7.7) * 460;
            const dir = rand(i * 1.9) > 0.5 ? 1 : -1;
            const x = dir > 0 ? -20 + ph * 1960 : 1940 - ph * 1960;
            const side = Math.abs(x - CX) > 600 ? 1 : 0.2;
            return <circle key={i} cx={x} cy={y + 8 * Math.sin(t * 1.4 + i)} r={1.5 + rand(i * 2.1) * 2} fill="#e3d4ff" opacity={0.45 * cyc(ph) * side * a} />;
          })}
          {RAILS.map((rl, k) => (
            <RailView key={k} rl={rl} t={t} op={rails * (k ? 1 : 0.85)} k={k} />
          ))}
          <Ripple x={CX} y={CY} p={(t - 0.8) / 2.2} r={760} color="spr" rings={2} width={2} />
          {/* denyut momentum menembus judul */}
          {pulseP > 0 && pulseP < 1 ? (
            <g opacity={Math.sin(Math.PI * pulseP)}>
              <circle cx={300 + pulseP * 1320} cy={CY - 30} r={90} fill="url(#soft-spr)" />
            </g>
          ) : null}
          <Ripple x={1080} y={CY - 30} p={ramp(t, 3.6, 5.2, (x) => x)} r={520} color="spr" rings={2} width={2} />
          <Twinkles x={CX} y={CY - 10} rx={620} ry={90} n={7} color="spr" opacity={ramp(t, 2.2, 3.0)} seed={6} />
        </Stage>
        <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', paddingBottom: 150}}>
          <div style={{fontFamily: FONT.head, fontSize: 28, letterSpacing: 12, color: C.spr, fontWeight: 600, opacity: a}}>{BRAND.series.toUpperCase()}</div>
          <div style={{display: 'flex', marginTop: 18}}>
            {title.split('').map((ch, i) => {
              const p = ramp(t, 0.5 + i * 0.045, 1.4 + i * 0.045, BACK);
              const bob = 4 * Math.sin(t * 1.3 - i * 0.4) * ramp(t, 1.8, 2.8);
              const hot = i >= split;
              // dorongan kecil berurutan pada huruf bagian kedua (gelombang tumbukan)
              const kick = hot ? 10 * knock * Math.max(0, Math.sin(Math.PI * Math.min(1, Math.max(0, (t - 3.4 - (i - split) * 0.05) / 0.6)))) : 0;
              return (
                <span
                  key={i}
                  style={{
                    fontFamily: FONT.head,
                    fontWeight: 700,
                    fontSize: 142,
                    letterSpacing: -4,
                    whiteSpace: 'pre',
                    display: 'inline-block',
                    color: hot ? C.spr : C.ink,
                    opacity: Math.min(1, p),
                    translate: `${kick}px ${(1 - p) * 60 + bob}px`,
                    textShadow: hot ? `0 0 ${40 + 14 * Math.sin(t * 2 + i * 0.4)}px rgba(183,125,255,0.6)` : '0 0 40px rgba(160,140,255,0.25)',
                  }}
                >
                  {ch}
                </span>
              );
            })}
          </div>
          <div style={{fontFamily: FONT.head, fontSize: 50, color: C.ink, fontWeight: 500, marginTop: 8, opacity: sub, translate: `0px ${(1 - sub) * 16}px`}}>{BRAND.subtitle}</div>
          <div style={{fontFamily: FONT.sans, fontSize: 26, color: C.muted, marginTop: 14, opacity: ramp(t, 2.1, 3.1)}}>{BRAND.course}</div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              marginTop: 34,
              padding: '10px 26px 10px 14px',
              borderRadius: 999,
              border: '1.5px solid rgba(190,150,255,0.38)',
              background: 'rgba(22,16,56,0.55)',
              opacity: brand,
              translate: `0px ${(1 - brand) * 14}px`,
              boxShadow: `0 0 ${24 + 10 * Math.sin(t * 1.8)}px rgba(183,125,255,0.25)`,
            }}
          >
            <Img src={staticFile('scientian-logo.png')} style={{width: 46, height: 46, rotate: `${4 * Math.sin(t * 0.9)}deg`}} />
            <div style={{fontFamily: FONT.head, fontSize: 30, color: C.ink, fontWeight: 500, letterSpacing: 2}}>
              Explore <span style={{color: C.gold, fontWeight: 600}}>Science</span> with Yayan
            </div>
          </div>
          <div style={{fontFamily: FONT.mono, fontSize: 22, color: C.muted, marginTop: 40, opacity: ramp(t, 4.2, 5.2), letterSpacing: 3 + 2 * (1 - ramp(t, 4.2, 5.6))}}>
            momentum hanya <span style={{color: C.spr}}>berpindah</span>, tidak pernah <span style={{color: C.gold}}>hilang</span>
          </div>
        </AbsoluteFill>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
