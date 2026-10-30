import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {EASE_IN_OUT, cyc, ramp, rand} from '../anim';
import {Pipe, Streamline} from '../components/flow';
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

// butir yang mengorbit logo (warna = kode warna fluida)
const ORBIT: {hue: Hue; ph: number}[] = [
  {hue: 'water', ph: 0},
  {hue: 'press', ph: 1.05},
  {hue: 'kin', ph: 2.09},
  {hue: 'force', ph: 3.14},
  {hue: 'spr', ph: 4.19},
  {hue: 'cyan', ph: 5.24},
];
const OC = {x: 960, y: 188, rx: 190, ry: 48, tilt: -14, sp: 0.5};

const orbitPt = (a: number): [number, number] => {
  const c = Math.cos((OC.tilt * Math.PI) / 180);
  const s = Math.sin((OC.tilt * Math.PI) / 180);
  const ex = OC.rx * Math.cos(a);
  const ey = OC.ry * Math.sin(a);
  return [OC.x + ex * c - ey * s, OC.y + ex * s + ey * c];
};

/** Motif venturi kecil: pipa menyempit dengan partikel (kontinuitas), kolom tekanan lebih rendah di bagian sempit, garis arus. */
const VenturiMotif: React.FC<{x: number; y: number; t: number; seed: number; opacity: number; flip?: boolean}> = ({x, y, t, seed, opacity, flip}) => {
  if (opacity <= 0.001) return null;
  const w = 240;
  const yc = y - 40;
  const knots: [number, number][] = [
    [x, 26],
    [x + 70, 26],
    [x + 110, 11],
    [x + 150, 11],
    [x + 200, 26],
    [x + w, 26],
  ];
  const wob = 3 * Math.sin(t * 1.7 + seed);
  const cols = [
    {cx: x + 40, h: 92 + wob},
    {cx: x + 130, h: 38 + wob * 0.6},
    {cx: x + 220, h: 86 + wob},
  ];
  return (
    <g opacity={opacity} transform={flip ? `translate(${2 * x + w} 0) scale(-1 1)` : undefined}>
      <Glow x={x + 130} y={yc} r={150} color="water" opacity={0.5} />
      {/* garis arus di atas & bawah pipa */}
      {[-70, 60].map((dy, i) => (
        <Streamline
          key={dy}
          pts={Array.from({length: 13}, (_, k) => [x - 30 + (k * (w + 60)) / 12, yc + dy - Math.sign(dy) * 10 * Math.exp(-(((k - 6) / 2.5) ** 2))] as [number, number])}
          speed={70}
          n={4}
          color={i ? C.cyan : '#cfeaff'}
          line={0.15}
          seed={seed + i}
        />
      ))}
      {cols.map((c) => (
        <g key={c.cx}>
          <rect x={c.cx - 6} y={yc - 26 - 104} width={12} height={104} fill="#0d1838" stroke="#bfe3ff" strokeOpacity={0.6} strokeWidth={2} />
          <rect x={c.cx - 4} y={yc - 26 - c.h} width={8} height={c.h} fill={C.press} opacity={0.75} />
        </g>
      ))}
      <Pipe x0={x} x1={x + w} yc={yc} knots={knots} v0={55} lanes={3} perLane={5} lines={0.35} seed={seed} />
    </g>
  );
};

/** Penutup: logo SCIENTIAN, tagline, nama penyusun, rujukan, dan seri berikutnya (motif aliran). */
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
        <Glow x={960} y={188} r={200} color="water" opacity={0.3 * logo} />
        <Motes x={960} y={300} rx={620} ry={260} n={40} color="cyan" opacity={0.45 * logo} seed={13} />
        {/* butir aliran yang hanyut pelan mengikuti garis arus bergelombang */}
        {Array.from({length: 24}, (_, k) => {
          const p = ((((t + rand(k * 3.1) * 14) / (10 + 5 * rand(k))) % 1) + 1) % 1;
          const x = -40 + p * 2000;
          const base = 140 + rand(k * 5.3) * 780;
          const y = base + 26 * Math.sin(x * 0.004 + k);
          const tail = 18 + 20 * rand(k * 1.7);
          const yb = base + 26 * Math.sin((x - tail) * 0.004 + k);
          return (
            <g key={k} opacity={cyc(p) * 0.4 * logo}>
              <line x1={x - tail} y1={yb} x2={x} y2={y} stroke="#cfeaff" strokeWidth={2} strokeLinecap="round" opacity={0.6} />
              <circle cx={x} cy={y} r={2.4} fill="#fff" />
            </g>
          );
        })}
        <path d={ellipseD} fill="none" stroke={C.cyan} strokeOpacity={0.18 * orbitOn} strokeWidth={1.5} strokeDasharray="4 10" strokeDashoffset={-t * 14} />
        {ring(false)}
        <VenturiMotif x={110} y={860} t={t} seed={0.4} opacity={0.55 * motif} />
        <VenturiMotif x={1570} y={860} t={t} seed={2.3} opacity={0.55 * motif} flip />
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
            border: `2px solid ${C.water}`,
            background: 'rgba(10,16,36,0.85)',
            boxShadow: `0 0 ${16 + 12 * (0.5 + 0.5 * Math.sin(t * 2))}px ${C.water}66`,
            translate: `0px ${(1 - next) * 14}px`,
          }}
        >
          <span style={{color: C.water}}>{BRAND.next}</span>
        </div>
      </AbsoluteFill>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'visible'}}>
        {ring(true)}
      </svg>
    </AbsoluteFill>
  );
};
