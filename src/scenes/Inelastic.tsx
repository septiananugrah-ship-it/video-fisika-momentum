import React from 'react';
import {AbsoluteFill} from 'remotion';
import {BACK, EASE_IN_OUT, cyc, ramp, rand, win} from '../anim';
import {HeatShimmer} from '../components/physics';
import {Arrow, Badge, Formula, Frac, Glow, Label, Motes, Ripple, Stage, Stream, Sup, Twinkles, V} from '../components/primitives';
import {useScene} from '../SceneContext';
import {C, FONT} from '../theme';

// Gerbong A 10 000 kg, 2 m/s menabrak gerbong B 10 000 kg yang diam → menyambung → 1 m/s.
// p: 20 000 = 20 000 kg·m/s. K: ½·10 000·2² = 20 kJ → ½·20 000·1² = 10 kJ (hilang 10 kJ).
// Koordinat dunia dalam meter, skala 40 px/m (gerbong digambar 7,5 m + kopel 0,3 m tiap ujung).
// Kamera diam sampai tumbukan, lalu mengikuti dengan kecepatan naik halus ke 1 m/s (bantalan rel ikut bergulir).
// Panah momentum 240 px = 20 000 kg·m/s (sebelum & sesudah sama panjang); kecepatan 50 px per m/s.

const S = 40;
const X0 = 1180; // layar x untuk posisi dunia 0 saat kamera 0
const RAIL = 640;
const D = 8.1; // jarak pusat saat kopel bersentuhan (m)
const PK = 240 / 20000;
const PV = 50;
const TCAM = 2.5;
const BARW = 460;

const camAt = (u: number) => {
  if (u <= 0) return 0;
  if (u >= TCAM) return TCAM / 2 + (u - TCAM);
  const x = u / TCAM;
  return TCAM * (x * x * x - (x * x * x * x) / 2);
};
const fr = (x: number) => ((x % 1) + 1) % 1;
const slot = (t: number, a: number, b: number) => Math.min(ramp(t, a, a + 0.5), 1 - ramp(t, b - 0.45, b - 0.05, EASE_IN_OUT));

const Wagon: React.FC<{x: number; dy: number; wheel: number; color: string; label: string; heatR?: number; heatL?: number}> = ({x, dy, wheel, color, label, heatR = 0, heatL = 0}) => (
  <g transform={`translate(${x} ${RAIL})`}>
    <ellipse cx={0} cy={6} rx={160} ry={8} fill="#000" opacity={0.35} />
    {[-95, 95].map((bx) => (
      <g key={bx}>
        <rect x={bx - 44} y={-34} width={88} height={14} rx={4} fill="#20294c" stroke={C.muted} strokeOpacity={0.6} strokeWidth={1.5} />
        {[-26, 26].map((wx) => (
          <g key={wx} transform={`translate(${bx + wx} -17) rotate(${wheel})`}>
            <circle r={17} fill="#0b1022" stroke={C.muted} strokeWidth={3} />
            <circle r={6} fill="#2a355e" />
            <line x1={-14} y1={0} x2={14} y2={0} stroke={C.muted} strokeWidth={2.5} />
            <line x1={0} y1={-14} x2={0} y2={14} stroke={C.muted} strokeWidth={2.5} />
          </g>
        ))}
      </g>
    ))}
    <g transform={`translate(0 ${dy})`}>
      <rect x={-142} y={-48} width={284} height={14} rx={3} fill="#1a2244" />
      <rect x={-162} y={-46} width={24} height={10} rx={3} fill="#5b6590" />
      <rect x={138} y={-46} width={24} height={10} rx={3} fill="#5b6590" />
      <rect x={-166} y={-50} width={8} height={18} rx={2} fill="#8a94bf" />
      <rect x={158} y={-50} width={8} height={18} rx={2} fill="#8a94bf" />
      <rect x={-150} y={-176} width={300} height={130} rx={8} fill="url(#crate)" stroke={color} strokeWidth={3} />
      <rect x={-156} y={-184} width={312} height={12} rx={4} fill="#2a3462" stroke={color} strokeOpacity={0.6} strokeWidth={2} />
      {[-100, -50, 50, 100].map((rx) => (
        <line key={rx} x1={rx} y1={-170} x2={rx} y2={-52} stroke={color} strokeOpacity={0.22} strokeWidth={3} />
      ))}
      <rect x={-138} y={-166} width={276} height={8} rx={4} fill="#fff" opacity={0.08} />
      <text x={0} y={-112} textAnchor="middle" dominantBaseline="central" fontFamily={FONT.head} fontWeight={700} fontSize={40} fill={C.ink}>
        {label}
      </text>
      {heatR > 0.01 ? <circle cx={156} cy={-42} r={46} fill="url(#soft-heat)" opacity={heatR} /> : null}
      {heatL > 0.01 ? <circle cx={-156} cy={-42} r={46} fill="url(#soft-heat)" opacity={heatL} /> : null}
    </g>
  </g>
);

export const Inelastic: React.FC = () => {
  const {t, cue, wordOf} = useScene();
  const stageIn = ramp(t, -0.4, 0.8);

  const tc = wordOf(0, 'menabrak') + 0.15;
  const u = t - tc;
  const cam = camAt(u);
  const xAw = u < 0 ? -D + 2 * u : -D + 1 * u;
  const xBw = u < 0 ? 0 : u;
  const sx = (xw: number) => X0 + S * (xw - cam);
  const xa = sx(xAw);
  const xb = sx(xBw);
  const cpl = (xa + xb) / 2;
  const vA = u < 0 ? 2 : 1;
  const vB = u < 0 ? 0 : 1;

  // getaran sambungan: meluruh, diperkuat lagi saat kata "getaran"
  const tg = wordOf(4, 'getaran');
  const shakeAmp = (u > 0 ? 3.2 * Math.exp(-1.4 * u) : 0) + 2.2 * win(t, tg - 0.2, tg + 1.4, 0.2, 0.8);
  const dyA = shakeAmp * Math.sin(2 * Math.PI * 8 * t);
  const dyB = -shakeAmp * Math.sin(2 * Math.PI * 8 * t + 0.6);

  // panas & bunyi
  const tb = wordOf(4, 'bunyi');
  const tpn = wordOf(4, 'panas');
  const heat = u > 0 ? Math.max(0.9 * Math.exp(-0.5 * u), 0.25) + 0.6 * win(t, tpn - 0.2, tpn + 2.0, 0.3, 0.8) : 0;
  const words = [
    {w: 'bunyi', tt: tb, dx: -150},
    {w: 'panas', tt: tpn, dx: 0},
    {w: 'getaran', tt: tg, dx: 160},
  ];

  // fase
  const arrA = 1 - ramp(t, tc, tc + 0.35, EASE_IN_OUT);
  const arrAB = ramp(t, tc + 0.1, tc + 0.5);
  const vArr = ramp(t, cue(0) + 0.3, cue(0) + 1.0) * (1 - ramp(t, cue(3) - 0.4, cue(3) + 0.1, EASE_IN_OUT));
  const chip20 = win(t, wordOf(1, 'ton') - 0.3, cue(3) - 0.3, 0.5, 0.5);
  const pPanel = ramp(t, cue(1) - 0.1, cue(1) + 0.6);
  const pRow2 = ramp(t, wordOf(1, 'sama') - 0.3, wordOf(1, 'sama') + 0.5);
  const kPanel = ramp(t, cue(3) - 0.1, cue(3) + 0.6);
  const kRow2 = ramp(t, wordOf(3, 'setelahnya') - 0.2, wordOf(3, 'setelahnya') + 0.6);
  const kRed = ramp(t, cue(4) - 0.1, cue(4) + 0.8);
  const k1 = slot(t, wordOf(1, 'ribu') - 0.4, cue(2));
  const k2 = slot(t, cue(2) - 0.1, cue(3));
  const k3a = slot(t, wordOf(3, 'kilojoule') - 0.6, wordOf(3, 'setelahnya') - 0.1);
  const k3b = slot(t, wordOf(3, 'setelahnya') - 0.1, cue(4));
  const badge = ramp(t, wordOf(4, 'Momentum') - 0.3, wordOf(4, 'Momentum') + 0.4, BACK);
  const flowOn = win(t, cue(4) + 0.2, cue(4) + 6.5, 0.6, 0.8);

  // lingkungan bergulir
  const sleepers: number[] = [];
  for (let k = Math.floor(cam - 32); k <= Math.ceil(cam + 22); k++) sleepers.push(k);
  const poles: number[] = [];
  for (let k = Math.floor((cam - 30) / 12); k <= Math.ceil((cam + 22) / 12); k++) poles.push(k * 12 + 3);
  const hillShift = -((((cam * S * 0.3) % 800) + 800) % 800);
  const hill = (() => {
    const pts: string[] = [];
    for (let i = 0; i <= 64; i++) {
      const x = -100 + i * 50;
      const y = 560 - 40 * Math.sin((x / 800) * 2 * Math.PI) - 22 * Math.sin((x / 400) * 2 * Math.PI + 1);
      pts.push(`${i ? 'L' : 'M'}${(x + hillShift).toFixed(1)},${y.toFixed(1)}`);
    }
    return `${pts.join(' ')} L${3100 + hillShift},${RAIL} L${-100 + hillShift},${RAIL} Z`;
  })();
  const wheelDeg = (xw: number) => (xw / 0.45) * (180 / Math.PI);

  return (
    <AbsoluteFill>
      <Stage>
        <defs>
          <clipPath id="in-view">
            <rect x={80} y={150} width={1760} height={540} />
          </clipPath>
        </defs>
        <g opacity={stageIn}>
          <g clipPath="url(#in-view)">
            <Glow x={960} y={520} r={700} color="pot" opacity={0.12} />
            <path d={hill} fill="#0f1c3e" opacity={0.85} />
            {/* awan */}
            {[0, 1, 2, 3].map((i) => {
              const x = ((((i * 520 + t * 12 - cam * S * 0.1) % 2200) + 2200) % 2200) - 140;
              return <ellipse key={i} cx={x} cy={200 + (i % 2) * 40} rx={110} ry={20} fill="#1a2a55" opacity={0.5} />;
            })}
            {/* tiang & kawat listrik */}
            <line x1={0} y1={330} x2={1920} y2={330} stroke={C.muted} strokeOpacity={0.35} strokeWidth={2} />
            {poles.map((pw) => {
              const x = sx(pw);
              return (
                <g key={pw}>
                  <rect x={x - 5} y={318} width={10} height={RAIL - 318} fill="#1c2750" />
                  <rect x={x - 40} y={318} width={80} height={8} rx={3} fill="#1c2750" />
                  <circle cx={x + 30} cy={340} r={4} fill={C.gold} opacity={0.4 + 0.4 * Math.sin(t * 2 + pw)} />
                </g>
              );
            })}
            {/* rel & bantalan */}
            <rect x={80} y={RAIL + 10} width={1760} height={30} fill="#141c3a" />
            {sleepers.map((k) => {
              const x = sx(k);
              return <rect key={k} x={x - 7} y={RAIL + 6} width={14} height={14} rx={2} fill="#3a2f2a" opacity={0.9} />;
            })}
            <rect x={80} y={RAIL} width={1760} height={7} fill="#8a94bf" />
            <rect x={80} y={RAIL} width={1760} height={2} fill="#fff" opacity={0.35} />
            {/* debu kerikil */}
            {Array.from({length: 10}, (_, i) => {
              const ph = fr(t * 0.2 + rand(i));
              return <circle key={i} cx={100 + 1700 * rand(i + 9)} cy={RAIL + 30 - 10 * ph} r={2} fill={C.muted} opacity={0.4 * cyc(ph)} />;
            })}

            <Wagon x={xb} dy={dyB} wheel={wheelDeg(xBw)} color={C.gold} label="10 t" heatL={heat} />
            <Wagon x={xa} dy={dyA} wheel={wheelDeg(xAw)} color={C.cyan} label="10 t" heatR={heat} />
            {/* garis gerak di belakang gerbong A sebelum tumbukan */}
            <g opacity={arrA}>
              {[0, 1, 2].map((i) => {
                const ph = fr(t * 1.4 + i / 3);
                return <line key={i} x1={xa - 170 - ph * 60} y1={RAIL - 140 + i * 40} x2={xa - 210 - ph * 60} y2={RAIL - 140 + i * 40} stroke={C.cyan} strokeWidth={3} strokeLinecap="round" opacity={0.5 * cyc(ph)} />;
              })}
            </g>
            {/* tumbukan: kilatan & bunyi */}
            <Ripple x={cpl} y={RAIL - 42} p={ramp(t, tc, tc + 1.2)} r={200} color="heat" rings={4} />
            <Ripple x={cpl} y={RAIL - 42} p={ramp(t, tb, tb + 1.3)} r={170} color="heat" />
            <Ripple x={cpl} y={RAIL - 42} p={ramp(t, tb + 0.5, tb + 1.8)} r={170} color="heat" />
            <HeatShimmer x1={cpl - 50} x2={cpl + 50} y={RAIL - 60} t={t} amount={Math.min(1, heat)} />
            {u > 0 ? <Motes x={cpl} y={RAIL - 60} rx={60} ry={40} n={10} color="heat" opacity={0.6 * Math.min(1, heat)} /> : null}

            {/* panah kecepatan */}
            <g opacity={vArr}>
              <Arrow x1={xa - 80} y1={418} x2={xa - 80 + vA * PV} y2={418} color="cyan" width={6} pulse={false} />
              <Label x={xa - 80 + vA * PV + 14} y={418} size={24} font="mono" color={C.cyan} weight={600} anchor="start">
                {`${vA} m/s`}
              </Label>
              {vB > 0 ? (
                <g opacity={ramp(t, tc, tc + 0.3)}>
                  <Arrow x1={xb - 80} y1={418} x2={xb - 80 + vB * PV} y2={418} color="cyan" width={6} pulse={false} />
                  <Label x={xb - 80 + vB * PV + 14} y={418} size={24} font="mono" color={C.cyan} weight={600} anchor="start">
                    1 m/s
                  </Label>
                </g>
              ) : (
                <Label x={xb} y={418} size={24} font="mono" color={C.cyan} weight={600}>
                  diam
                </Label>
              )}
            </g>
            {/* massa gabungan */}
            <g opacity={chip20}>
              <rect x={cpl - 52} y={426} width={104} height={36} rx={18} fill="rgba(10,16,36,0.9)" stroke={C.gold} strokeWidth={2} />
              <Label x={cpl} y={444} size={22} font="mono" color={C.gold} weight={600}>
                20 t
              </Label>
            </g>
            {/* kata-kata energi yang hilang */}
            {words.map((w) => (
              <Label key={w.w} x={cpl + w.dx} y={432 - 16 * ramp(t, w.tt, w.tt + 2.2)} size={28} color={C.heat} weight={600} opacity={win(t, w.tt - 0.15, w.tt + 2.0, 0.3, 0.6)}>
                {w.w}
              </Label>
            ))}

            {/* panah momentum */}
            <g opacity={arrA}>
              <Arrow x1={xa} y1={374} x2={xa + 20000 * PK} y2={374} color="spr" width={8} />
              <Label x={xa + 120} y={338} size={26} font="mono" color={C.spr} weight={600}>
                p = 20 000 kg·m/s
              </Label>
              <Label x={xb} y={374} size={26} font="mono" color={C.spr} weight={600}>
                p = 0
              </Label>
            </g>
            <g opacity={arrAB}>
              <Arrow x1={cpl} y1={374} x2={cpl + 20000 * PK} y2={374} color="spr" width={8} />
              <Label x={cpl + 120} y={338} size={26} font="mono" color={C.spr} weight={600}>
                p = 20 000 kg·m/s
              </Label>
            </g>
          </g>

          {/* panel momentum */}
          <g opacity={pPanel}>
            <rect x={120} y={698} width={790} height={172} rx={18} fill="rgba(10,16,36,0.8)" stroke={C.spr} strokeOpacity={0.5} strokeWidth={2} />
            <Label x={140} y={722} size={21} color={C.muted} anchor="start" weight={600} spacing={1}>
              momentum total (kg·m/s)
            </Label>
            <Label x={140} y={772} size={24} color={C.ink} anchor="start">
              sebelum
            </Label>
            <rect x={270} y={758} width={BARW} height={28} rx={7} fill={C.spr} />
            <Label x={744} y={772} size={24} font="mono" color={C.spr} weight={600} anchor="start">
              20 000
            </Label>
            <g opacity={pRow2}>
              <Label x={140} y={828} size={24} color={C.ink} anchor="start">
                sesudah
              </Label>
              <rect x={270} y={814} width={BARW * ramp(t, wordOf(1, 'sama') - 0.2, wordOf(1, 'sama') + 0.8)} height={28} rx={7} fill={C.spr} />
              <Label x={744} y={828} size={24} font="mono" color={C.spr} weight={600} anchor="start">
                20 000
              </Label>
              <Label x={870} y={800} size={30} color={C.work} weight={700}>
                ✓
              </Label>
            </g>
          </g>
          {/* panel energi kinetik */}
          <g opacity={kPanel}>
            <rect x={1010} y={698} width={790} height={172} rx={18} fill="rgba(10,16,36,0.8)" stroke={C.kin} strokeOpacity={0.5} strokeWidth={2} />
            <Label x={1030} y={722} size={21} color={C.muted} anchor="start" weight={600} spacing={1}>
              energi kinetik (kJ)
            </Label>
            <Label x={1030} y={772} size={24} color={C.ink} anchor="start">
              sebelum
            </Label>
            <rect x={1160} y={758} width={BARW} height={28} rx={7} fill={C.kin} />
            <Label x={1634} y={772} size={24} font="mono" color={C.kin} weight={600} anchor="start">
              20
            </Label>
            <g opacity={kRow2}>
              <Label x={1030} y={828} size={24} color={C.ink} anchor="start">
                sesudah
              </Label>
              <rect x={1160} y={814} width={BARW} height={28} rx={7} fill="none" stroke={C.heat} strokeWidth={2} strokeDasharray="7 6" strokeDashoffset={-t * 16} opacity={0.6} />
              <rect x={1160} y={814} width={(BARW / 2) * ramp(t, wordOf(3, 'setelahnya'), wordOf(3, 'setelahnya') + 0.8)} height={28} rx={7} fill={C.kin} />
              <rect x={1160 + BARW / 2} y={814} width={(BARW / 2) * kRed} height={28} rx={7} fill={C.heat} opacity={0.8 + 0.2 * Math.sin(t * 3)} />
              <Label x={1160 + BARW * 0.75} y={828} size={19} font="mono" color="#fff" weight={600} opacity={kRed}>
                10 hilang
              </Label>
              <Label x={1634} y={828} size={24} font="mono" color={C.kin} weight={600} anchor="start">
                10
              </Label>
              <Label x={1760} y={800} size={30} color={C.heat} weight={700}>
                ✗
              </Label>
            </g>
          </g>
          {/* energi hilang mengalir dari sambungan ke batang merah */}
          <Stream
            pts={[
              [cpl, RAIL - 50],
              [cpl + 220, 600],
              [1160 + BARW * 0.75, 814],
            ]}
            color="heat"
            n={10}
            speed={0.5}
            r={5}
            opacity={flowOn}
          />
          <Twinkles x={505} y={800} rx={300} ry={40} n={5} color="spr" opacity={badge} />
        </g>
      </Stage>

      <Formula x={960} y={214} p={k1} accent={C.spr} caption="momentum sebelum tumbukan">
        <V>p</V> = 10 000 · 2 = 20 000 kg·m/s
      </Formula>
      <Formula x={960} y={214} p={k2} accent={C.cyan} caption="massa 20 ton, momentum sama">
        <V>v</V>′ = <Frac n="20 000 kg·m/s" d="20 000 kg" /> = 1 m/s
      </Formula>
      <Formula x={960} y={214} p={k3a} accent={C.kin} caption="sebelum tumbukan">
        <V>K</V> = ½ · 10 000 · 2<Sup>2</Sup> = 20 kJ
      </Formula>
      <Formula x={960} y={214} p={k3b} accent={C.kin} caption="sesudah tumbukan">
        <V>K</V>′ = ½ · 20 000 · 1<Sup>2</Sup> = 10 kJ
      </Formula>
      <Badge x={960} y={214} text="Momentum kekal, energi kinetik tidak" color={C.spr} opacity={badge} scale={0.9 + 0.1 * badge} size={34} />
    </AbsoluteFill>
  );
};
