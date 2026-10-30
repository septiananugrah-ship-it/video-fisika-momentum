import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {EASE_IN_OUT, cyc, ramp, rand} from '../anim';
import {Glow, Motes, Spark, Stage, Twinkles} from '../components/primitives';
import {BRAND} from '../brand';
import {useScene} from '../SceneContext';
import {C, FONT, type Hue} from '../theme';

const REFS = [
  'R. A. Serway & J. W. Jewett, Physics for Scientists and Engineers (bab Momentum & Tumbukan)',
  'F. J. Bueche, Schaum’s Outline of College Physics',
  'A. G. Sarojo, Seri Fisika Dasar: Mekanika',
  'P. Atkins & J. de Paula, Physical Chemistry (teori kinetik gas, teori tumbukan)',
  'CODATA (tetapan Planck) · NIST (spektrum atom hidrogen)',
  'Modul Fisika Umum: Momentum & Impuls',
];

// butir yang mengorbit logo (warna = kode warna momentum: p, v, F, J, K, panas)
const ORBIT: {hue: Hue; ph: number}[] = [
  {hue: 'spr', ph: 0},
  {hue: 'cyan', ph: 1.05},
  {hue: 'force', ph: 2.09},
  {hue: 'work', ph: 3.14},
  {hue: 'kin', ph: 4.19},
  {hue: 'heat', ph: 5.24},
];
const OC = {x: 960, y: 188, rx: 190, ry: 48, tilt: -14, sp: 0.5};

const orbitPt = (a: number): [number, number] => {
  const c = Math.cos((OC.tilt * Math.PI) / 180);
  const s = Math.sin((OC.tilt * Math.PI) / 180);
  const ex = OC.rx * Math.cos(a);
  const ey = OC.ry * Math.sin(a);
  return [OC.x + ex * c - ey * s, OC.y + ex * s + ey * c];
};

/** Ayunan Newton kecil: n bola di ujung terayun, momentum (panah ungu) "menembus" bola tengah ke ujung seberang. */
const Cradle: React.FC<{x: number; y: number; t: number; out: number; phase: number; opacity: number}> = ({x, y, t, out, phase, opacity}) => {
  if (opacity <= 0.001) return null;
  const N = 5;
  const R = 17;
  const L = 120;
  const top = y - 196;
  const th0 = 0.5;
  const w = (2 * Math.PI) / 1.9;
  const s = Math.sin(w * t + phase);
  const c = Math.cos(w * t + phase);
  const A = th0 * s;
  const cx0 = x + 120 - ((N - 1) * R * 2) / 2;
  const balls = Array.from({length: N}, (_, i) => {
    const a = i < out ? Math.min(0, A) : i >= N - out ? Math.max(0, A) : 0;
    const px = cx0 + i * 2 * R;
    return {px, a, bx: px + L * Math.sin(a), by: top + L * Math.cos(a)};
  });
  // panah momentum bersilang-pudar di sekitar tumbukan (|A| kecil) — momentum berpindah lewat bola tengah
  const kR = Math.max(0, Math.min(1, 0.5 + A / (0.7 * th0)));
  const vLen = 46 * Math.abs(c);
  const dir = Math.sign(c) || 1;
  const hit = Math.exp(-((A / (0.12 * th0)) ** 2));
  const grp = (right: boolean) => {
    const idx = right ? N - 1 - (out - 1) / 2 : (out - 1) / 2;
    const lo = Math.floor(idx);
    const hi = Math.ceil(idx);
    const b = {bx: (balls[lo].bx + balls[hi].bx) / 2, by: (balls[lo].by + balls[hi].by) / 2};
    return b;
  };
  const gl = grp(false);
  const gr = grp(true);
  return (
    <g opacity={opacity}>
      <Glow x={x + 120} y={y - 90} r={150} color="spr" opacity={0.45} />
      <line x1={x + 4} y1={y} x2={x + 26} y2={top - 6} stroke="#5b6a9e" strokeWidth={5} strokeLinecap="round" />
      <line x1={x + 236} y1={y} x2={x + 214} y2={top - 6} stroke="#5b6a9e" strokeWidth={5} strokeLinecap="round" />
      <rect x={x + 16} y={top - 10} width={208} height={9} rx={4} fill="#8fa0d0" />
      <rect x={x - 6} y={y - 4} width={252} height={10} rx={4} fill="#26305a" stroke="#5b6a9e" strokeWidth={2} />
      {balls.map((b, i) => (
        <g key={i}>
          <line x1={b.px} y1={top} x2={b.bx} y2={b.by} stroke="#c9d2ee" strokeWidth={1.5} opacity={0.8} />
          <ellipse cx={b.bx} cy={y - 8} rx={R * 0.9} ry={3} fill="#000" opacity={0.3} />
          <circle cx={b.bx} cy={b.by} r={R} fill="url(#ball)" stroke="#dfe6fb" strokeOpacity={0.6} strokeWidth={1.5} />
          <circle cx={b.bx - R * 0.35} cy={b.by - R * 0.38} r={R * 0.24} fill="#fff" opacity={0.6} />
          {i >= out && i < N - out ? <circle cx={b.bx} cy={b.by} r={R * 1.5} fill="url(#soft-spr)" opacity={hit} /> : null}
        </g>
      ))}
      {vLen > 3 ? (
        <>
          <line x1={gl.bx} y1={gl.by - R - 16} x2={gl.bx + dir * vLen} y2={gl.by - R - 16} stroke={C.spr} strokeWidth={4} strokeLinecap="round" markerEnd="url(#arrow-spr)" opacity={1 - kR} />
          <line x1={gr.bx} y1={gr.by - R - 16} x2={gr.bx + dir * vLen} y2={gr.by - R - 16} stroke={C.spr} strokeWidth={4} strokeLinecap="round" markerEnd="url(#arrow-spr)" opacity={kR} />
        </>
      ) : null}
    </g>
  );
};

/** Penutup: logo SCIENTIAN, tagline, nama penyusun, rujukan, dan pil penutup seri (motif tumbukan). */
export const Outro: React.FC = () => {
  const {t, dur} = useScene();
  const logo = ramp(t, 0.2, 1.6);
  const name = ramp(t, 1.4, 2.4);
  const by = ramp(t, 2.4, 3.4);
  const next = ramp(t, 6, 7);
  const motif = ramp(t, 1.0, 3.0);
  const out = 1 - ramp(t, dur - 1.6, dur - 0.1, EASE_IN_OUT);
  const orbitOn = ramp(t, 0.8, 2.2);
  const pts = ORBIT.map((o) => {
    const a = o.ph + t * OC.sp;
    const trail = [1, 2, 3, 4, 5].map((k) => orbitPt(a - k * 0.07));
    return {o, a, p: orbitPt(a), trail, front: Math.sin(a) > 0};
  });
  const ring = (front: boolean) =>
    pts
      .filter((q) => q.front === front)
      .map((q) => <Spark key={q.o.hue} x={q.p[0]} y={q.p[1]} r={5.25 + 1.25 * Math.sin(q.a)} color={q.o.hue} trail={q.trail} opacity={orbitOn * (0.8 + 0.2 * Math.sin(q.a))} />);
  const ellipseD = (() => {
    let d = '';
    for (let i = 0; i <= 48; i++) {
      const [x, y] = orbitPt((i / 48) * Math.PI * 2);
      d += `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`;
    }
    return d;
  })();
  return (
    <AbsoluteFill style={{opacity: out}}>
      <Stage>
        <Glow x={960} y={240} r={440} color="cyan" opacity={0.35 * logo} />
        <Glow x={960} y={188} r={200} color="spr" opacity={0.3 * logo} />
        <Motes x={960} y={300} rx={620} ry={260} n={40} color="cyan" opacity={0.45 * logo} seed={13} />
        {/* butir yang hanyut pelan (jejak gerak lurus beraturan) */}
        {Array.from({length: 24}, (_, k) => {
          const p = ((((t + rand(k * 3.1) * 14) / (10 + 5 * rand(k))) % 1) + 1) % 1;
          const x = -40 + p * 2000;
          const base = 140 + rand(k * 5.3) * 780;
          const y = base;
          const tail = 18 + 20 * rand(k * 1.7);
          const yb = base;
          return (
            <g key={k} opacity={cyc(p) * 0.4 * logo}>
              <line x1={x - tail} y1={yb} x2={x} y2={y} stroke="#e6d4ff" strokeWidth={2} strokeLinecap="round" opacity={0.6} />
              <circle cx={x} cy={y} r={2.4} fill="#fff" />
            </g>
          );
        })}
        <path d={ellipseD} fill="none" stroke={C.cyan} strokeOpacity={0.18 * orbitOn} strokeWidth={1.5} strokeDasharray="4 10" strokeDashoffset={-t * 14} />
        {ring(false)}
        <Cradle x={110} y={860} t={t} out={1} phase={0} opacity={0.8 * motif} />
        <Cradle x={1570} y={860} t={t} out={2} phase={1.6} opacity={0.8 * motif} />
        <Twinkles x={960} y={530} rx={360} ry={30} n={4} color="gold" opacity={by * 0.7} seed={17} />
      </Stage>
      <AbsoluteFill style={{alignItems: 'center', paddingTop: 70}}>
        <Img
          src={staticFile('scientian-logo.png')}
          style={{
            width: 230,
            height: 230,
            opacity: logo,
            scale: String((0.85 + 0.15 * logo) * (1 + 0.015 * Math.sin(t * 1.3))),
            rotate: `${(1 - logo) * -20}deg`,
          }}
        />
        <div style={{fontFamily: FONT.head, fontSize: 64, fontWeight: 700, letterSpacing: 16 + 6 * (1 - name), color: C.ink, marginTop: 4, opacity: name, textShadow: `0 0 ${18 + 8 * Math.sin(t * 1.6)}px ${C.cyan}55`}}>{BRAND.channel}</div>
        <div style={{fontFamily: FONT.head, fontSize: 28, color: C.muted, letterSpacing: 3, marginTop: 4, opacity: name}}>
          Explore <span style={{color: C.gold}}>Science</span> with Yayan
        </div>
        <div style={{marginTop: 34, fontFamily: FONT.sans, fontSize: 24, color: C.muted, opacity: by, letterSpacing: 2}}>DISUSUN OLEH</div>
        <div style={{fontFamily: FONT.head, fontSize: 46, fontWeight: 600, color: C.ink, opacity: by, marginTop: 2, translate: `0px ${(1 - by) * 12}px`}}>{BRAND.author}</div>
        <div style={{marginTop: 34, textAlign: 'center'}}>
          <div style={{fontFamily: FONT.mono, fontSize: 18, letterSpacing: 4, color: C.gold, marginBottom: 10, opacity: ramp(t, 3.4, 4.2)}}>RUJUKAN</div>
          {REFS.map((r, i) => {
            const o = ramp(t, 3.7 + i * 0.22, 4.6 + i * 0.22);
            return (
              <div key={r} style={{fontFamily: FONT.sans, fontSize: 21, color: C.muted, lineHeight: 1.55, opacity: o, translate: `0px ${(1 - o) * 10}px`}}>
                {r}
              </div>
            );
          })}
          <div style={{marginTop: 12, fontFamily: FONT.sans, fontSize: 19, color: C.muted, opacity: 0.85 * ramp(t, 5.2, 6.0)}}>
            Ilustrasi skematis · g = 10 m/s² · arah ke kanan positif · gesekan diabaikan kecuali disebut
          </div>
        </div>
        <div
          style={{
            position: 'absolute',
            bottom: 70,
            fontFamily: FONT.head,
            fontSize: 30,
            color: C.ink,
            opacity: next,
            padding: '10px 28px',
            borderRadius: 999,
            border: `2px solid ${C.spr}`,
            background: 'rgba(10,16,36,0.85)',
            boxShadow: `0 0 ${16 + 12 * (0.5 + 0.5 * Math.sin(t * 2))}px ${C.spr}66`,
            translate: `0px ${(1 - next) * 14}px`,
          }}
        >
          <span style={{color: C.ink}}>{BRAND.next}</span>
        </div>
      </AbsoluteFill>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'visible'}}>
        {ring(true)}
      </svg>
    </AbsoluteFill>
  );
};
