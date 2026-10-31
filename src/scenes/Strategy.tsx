import React from 'react';
import {AbsoluteFill, interpolateColors} from 'remotion';
import {EASE_IN_OUT, ramp, win} from '../anim';
import {Arrow, Card, Formula, Glow, Label, Motes, Note, Ripple, Spark, Stage, Sub, Tint, TSub, Twinkles, V} from '../components/primitives';
import {useScene} from '../SceneContext';
import {C, FONT} from '../theme';

// Cara berpikir soal momentum: 5 langkah (daftar centang) + contoh mini yang menyala per langkah.
// Contoh: troli 1 (2 kg, +3 m/s) menabrak troli 2 (1 kg, −3 m/s), lenting sempurna.
// Σp = 2·3 + 1·(−3) = +3 kg·m/s.  e = 1: v₁′ − v₂′ = −(v₁ − v₂) = −6 → v₁′ = −1 m/s, v₂′ = +5 m/s.
// Cek: Σp′ = −2 + 5 = +3 ✓; K = ½·2·9 + ½·1·9 = 13,5 J → K′ = ½·2·1 + ½·1·25 = 13,5 J ✓ (lenting: K tetap).
// Jawaban keliru v₁′ = −2, v₂′ = +7: Σp = −4 + 7 = +3 (cocok!) tetapi K′ = 4 + 24,5 = 28,5 J > 13,5 J ✗.

const STEPS: React.ReactNode[] = [
  <>Tentukan sistem · gaya luar ≈ 0</>,
  <>
    Pilih arah <Tint c={C.cyan}>+</Tint>; berlawanan → tanda <Tint c={C.cyan}>−</Tint>
  </>,
  <>
    Σ<i>p</i> sebelum = Σ<i>p</i> sesudah
  </>,
  <>Lenting / e diketahui → persamaan kedua</>,
  <>
    Cek <Tint c={C.kin}><i>K</i></Tint>: boleh turun, tak boleh naik
  </>,
];
const ROW0 = 250;
const ROWH = 108;
const LIST_X = 130;
const RAIL_X = 100;

// ---------- contoh: rel & troli ----------
const RAIL_Y = 470; // dasar roda
const XC = 1420; // titik sentuh
const S = 40; // px per (m/s) dalam waktu simulasi
const W1 = 116;
const W2 = 92;
const H1 = 62;
const H2 = 52;
const PS = 30; // px per kg·m/s (satu skala untuk semua panah momentum)
const VSC = 26; // px per m/s (panah kecepatan)
const BX0 = 1330; // pangkal neraca Σp

/** Laju waktu simulasi (gerak lambat, cepat di sekitar tumbukan). */
const rate = (t: number, tcol: number) => 0.035 + 0.6 * win(t, tcol - 1.7, tcol + 0.5, 0.7, 0.9);
const simTime = (t: number, tcol: number) => {
  let s = 0;
  const dt = 1 / 30;
  for (let u = -1; u < t; u += dt) s += rate(Math.min(u + dt / 2, t), tcol) * Math.min(dt, t - u);
  return s;
};

const Cart: React.FC<{x: number; w: number; h: number; color: string; label: React.ReactNode; dist: number; op?: number}> = ({x, w, h, color, label, dist, op = 1}) => {
  const rw = 11;
  const by = RAIL_Y - 2 * rw;
  return (
    <g opacity={op}>
      <ellipse cx={x} cy={RAIL_Y + 6} rx={w * 0.55} ry={7} fill="#000" opacity={0.35} />
      <rect x={x - w / 2} y={by - h} width={w} height={h} rx={10} fill="url(#crate)" stroke={color} strokeWidth={3} />
      <rect x={x - w / 2 + 7} y={by - h + 6} width={w - 14} height={8} rx={4} fill="#fff" opacity={0.1} />
      <text x={x} y={by - h / 2 + 2} textAnchor="middle" dominantBaseline="central" fontFamily={FONT.head} fontWeight={600} fontSize={22} fill={C.ink}>
        {label}
      </text>
      {[-w * 0.3, w * 0.3].map((dx) => (
        <g key={dx} transform={`translate(${x + dx} ${RAIL_Y - rw}) rotate(${(dist / rw) * (180 / Math.PI)})`}>
          <circle r={rw} fill="#0b1022" stroke={C.muted} strokeWidth={3} />
          <line x1={-rw + 3} y1={0} x2={rw - 3} y2={0} stroke={C.muted} strokeWidth={2} />
        </g>
      ))}
    </g>
  );
};

const slot = (t: number, a: number, b: number, fi = 0.5, fo = 0.45) => Math.min(ramp(t, a, a + fi), 1 - ramp(t, b - fo, b, EASE_IN_OUT));

export const Strategy: React.FC = () => {
  const {t, cue, cueEnd, wordOf} = useScene();

  // ---------- daftar langkah ----------
  const starts = [1, 2, 3, 4, 5].map((i) => cue(i));
  const ends = [1, 2, 3, 4, 5].map((i) => cueEnd(i));
  const head = ramp(t, cue(0) + 0.2, cue(0) + 1.0);
  const rows = STEPS.map((_, i) => ({
    p: ramp(t, starts[i] - 0.15, starts[i] + 0.55),
    tick: ramp(t, ends[i] - 0.4, ends[i] + 0.3),
    act: win(t, starts[i] - 0.1, ends[i] + 0.4, 0.4, 0.6),
    y: ROW0 + i * ROWH + 40,
  }));
  const railAt = (tt: number) => [1, 2, 3, 4].reduce((s, i) => s + ramp(tt, starts[i] - 0.3, starts[i] + 0.5, EASE_IN_OUT), 0);
  const railPos = railAt(t);
  const railVel = Math.min(1, (railPos - railAt(t - 0.05)) / 0.05 / 1.5);
  const railY = ROW0 + 40 + railPos * ROWH;

  // ---------- contoh: waktu simulasi ----------
  const tcol = cueEnd(4) + 0.35;
  const sig = simTime(t, tcol);
  const sigC = simTime(tcol, tcol);
  const ds = sig - sigC; // < 0 sebelum tumbukan
  const pre = ds < 0;
  const x1front = pre ? XC + S * 3 * ds : XC - S * 1 * ds;
  const x2back = pre ? XC - S * 3 * ds : XC + S * 5 * ds;
  const x1 = x1front - W1 / 2;
  const x2 = x2back + W2 / 2;
  const d1 = x1 - (XC - W1 / 2);
  const d2 = x2 - (XC + W2 / 2);
  const col = ramp(t, tcol - 0.05, tcol + 0.35); // silang-pudar sebelum → sesudah
  const colP = ramp(t, tcol - 0.05, tcol + 1.3, (q) => q);
  const ex = ramp(t, cue(0) + 0.3, cue(0) + 1.2);

  // ---------- fase per langkah ----------
  const sys = win(t, cue(1) + 0.3, cueEnd(1) + 0.4, 0.6, 0.6);
  const sysF = ramp(t, wordOf(1, 'gaya') - 0.2, wordOf(1, 'gaya') + 0.5);
  const axis = ramp(t, wordOf(2, 'positif') - 0.3, wordOf(2, 'positif') + 0.5);
  const vel = ramp(t, wordOf(2, 'kecepatan') - 0.2, wordOf(2, 'kecepatan') + 0.6);
  const neg = win(t, wordOf(2, 'negatif') - 0.2, cueEnd(2) + 0.6, 0.4, 0.6);
  const mom = ramp(t, wordOf(3, 'momentum') - 0.2, wordOf(3, 'momentum') + 0.6);
  const eq2 = ramp(t, wordOf(4, 'persamaan') - 0.3, wordOf(4, 'persamaan') + 0.5);
  const sol = ramp(t, cueEnd(4) - 0.2, cueEnd(4) + 0.6);
  const kIn = ramp(t, cue(5) + 0.2, cue(5) + 1.0);
  const kAfter = ramp(t, wordOf(5, 'berkurang') - 0.3, wordOf(5, 'berkurang') + 0.6);
  const kBad = ramp(t, wordOf(5, 'tidak') - 0.3, wordOf(5, 'tidak') + 0.5);
  const kX = ramp(t, wordOf(5, 'bertambah') - 0.1, wordOf(5, 'bertambah') + 0.5);
  const kXp = ramp(t, wordOf(5, 'bertambah'), wordOf(5, 'bertambah') + 1.3, (q) => q);
  const slotOut = 1 - ramp(t, cue(5) - 0.2, cue(5) + 0.4, EASE_IN_OUT);

  // panah kecepatan (silang-pudar sebelum ↔ sesudah)
  const velBox = (cx: number, v: number, y: number, txt: React.ReactNode, op: number) => {
    if (op <= 0.001) return null;
    const L = v * VSC;
    return (
      <g opacity={op}>
        <Arrow x1={cx - L / 2} y1={y} x2={cx + L / 2} y2={y} color="cyan" width={5} pulse={false} />
        <Label x={cx} y={y - 30} size={24} color={C.cyan} font="serif" italic weight={600}>
          {txt}
        </Label>
      </g>
    );
  };

  // neraca Σp: dua panah ujung-ke-pangkal + resultan
  const sumBar = (pa: number, pb: number, op: number, la: React.ReactNode, lb: React.ReactNode) => {
    if (op <= 0.001) return null;
    const xa = BX0 + pa * PS;
    const xb = xa + pb * PS;
    return (
      <g opacity={op}>
        <Arrow x1={BX0} y1={528} x2={xa} y2={528} color="spr" width={5} pulse={false} />
        <Label x={(BX0 + xa) / 2} y={505} size={20} color="#d9c2ff" font="serif" italic>
          {la}
        </Label>
        <Arrow x1={xa} y1={556} x2={xb} y2={556} color="spr" width={5} pulse={false} />
        <Label x={(xa + xb) / 2} y={580} size={20} color="#d9c2ff" font="serif" italic>
          {lb}
        </Label>
      </g>
    );
  };

  // batang K
  const kRow = (y: number, label: React.ReactNode, val: number, color: string, op: number, grow: number) => {
    if (op <= 0.001) return null;
    const L = (val / 28.5) * 470 * grow;
    return (
      <g opacity={op}>
        <Label x={1000} y={y} size={24} color={C.muted} anchor="start">
          {label}
        </Label>
        <rect x={1200} y={y - 16} width={540} height={32} rx={8} fill={color} opacity={0.07} />
        <rect x={1200} y={y - 16} width={Math.max(0.1, L)} height={32} rx={8} fill={color} opacity={0.88} />
        <rect x={1200} y={y - 16} width={Math.max(0.1, L)} height={10} rx={5} fill="#fff" opacity={0.15} />
        <circle cx={1200 + L * (0.5 + 0.45 * Math.sin(t * 1.3 + y))} cy={y - 3} r={3} fill="#fff" opacity={0.35 * grow} />
        <Label x={1200 + L + 14} y={y} size={24} color={color} anchor="start" font="mono" weight={600}>
          {`${val.toFixed(1).replace('.', ',')} J`}
        </Label>
      </g>
    );
  };

  const sysX0 = x1 - W1 / 2 - 24;
  const sysX1 = x2 + W2 / 2 + 24;

  return (
    <AbsoluteFill>
      {/* ===================== contoh (kanan) ===================== */}
      <AbsoluteFill style={{opacity: ex}}>
        <Stage>
          <rect x={970} y={196} width={880} height={676} rx={22} fill="rgba(10,16,36,0.6)" stroke={C.line} strokeWidth={2} />
          {/* sumbu + / − */}
          <g opacity={axis}>
            <line x1={1010} y1={318} x2={1800} y2={318} stroke={C.cyan} strokeOpacity={0.75} strokeWidth={3} markerEnd="url(#arrow-cyan)" />
            <Label x={1780} y={292} size={30} color={C.cyan} weight={700}>
              +
            </Label>
            <Label x={1030} y={292} size={30} color={C.cyan} weight={700}>
              −
            </Label>
            <Glow x={1780} y={318} r={60} color="cyan" opacity={0.5 * win(t, wordOf(2, 'positif') - 0.2, wordOf(2, 'positif') + 1.2)} />
          </g>
          {/* rel */}
          <line x1={1000} y1={RAIL_Y + 1} x2={1820} y2={RAIL_Y + 1} stroke={C.ink} strokeOpacity={0.8} strokeWidth={3} />
          {Array.from({length: 21}, (_, i) => (
            <line key={i} x1={1004 + i * 40} y1={RAIL_Y + 4} x2={990 + i * 40} y2={RAIL_Y + 20} stroke={C.faint} strokeWidth={2} />
          ))}
          <rect x={994} y={RAIL_Y - 34} width={10} height={36} rx={3} fill="#9fb0d8" />
          <rect x={1816} y={RAIL_Y - 34} width={10} height={36} rx={3} fill="#9fb0d8" />
          <Label x={1006} y={RAIL_Y + 40} size={18} color={C.muted} anchor="start">
            rel licin · gerak lambat
          </Label>

          {/* sistem (langkah 1) */}
          <g opacity={sys}>
            <rect x={sysX0} y={RAIL_Y - 120} width={sysX1 - sysX0} height={136} rx={18} fill={C.gold} fillOpacity={0.05} stroke={C.gold} strokeWidth={3} strokeDasharray="12 9" strokeDashoffset={-t * 18} />
            <Label x={sysX0 + 12} y={RAIL_Y - 142} size={22} color={C.gold} anchor="start" weight={600}>
              sistem
            </Label>
          </g>
          <g opacity={sys * sysF}>
            {[
              [x1, H1],
              [x2, H2],
            ].map(([x, h]) => (
              <g key={x}>
                <Arrow x1={x} y1={RAIL_Y - 22 - h} x2={x} y2={RAIL_Y - 22 - h - 36} color="force" width={4} pulse={false} />
                <Arrow x1={x} y1={RAIL_Y + 6} x2={x} y2={RAIL_Y + 44} color="force" width={4} pulse={false} />
              </g>
            ))}
            <Label x={x1 + 22} y={RAIL_Y - 22 - H1 - 26} size={20} color={C.force} anchor="start" font="serif" italic>
              N
            </Label>
            <Label x={x1 + 22} y={RAIL_Y + 34} size={20} color={C.force} anchor="start" font="serif" italic>
              W
            </Label>
          </g>

          {/* troli */}
          <Glow x={x1} y={RAIL_Y - 50} r={90} color="cyan" opacity={0.25} />
          <Glow x={x2} y={RAIL_Y - 45} r={80} color="press" opacity={0.25} />
          <Cart x={x1} w={W1} h={H1} color="#8fb3ff" label="2 kg" dist={d1} />
          <Cart x={x2} w={W2} h={H2} color="#9fe6d0" label="1 kg" dist={d2} />
          <Label x={x1} y={RAIL_Y - 22 - H1 - 18} size={20} color="#8fb3ff" opacity={(1 - sys * sysF) * (1 - vel)}>
            troli 1
          </Label>
          <Label x={x2} y={RAIL_Y - 22 - H2 - 18} size={20} color="#9fe6d0" opacity={(1 - sys * sysF) * (1 - vel)}>
            troli 2
          </Label>
          <Ripple x={XC} y={RAIL_Y - 50} p={colP} r={110} color="gold" />
          {/* kecepatan */}
          <g opacity={vel}>
            {velBox(x1, 3, 368, <>v<TSub>1</TSub> = +3</>, 1 - col)}
            {velBox(x2, -3, 368, <tspan fill={interpolateColors(neg, [0, 1], [C.cyan, C.gold])}>v<TSub>2</TSub> = −3</tspan>, 1 - col)}
            {velBox(x1, -1, 368, <>v<TSub>1</TSub>′ = −1</>, col * sol)}
            {velBox(x2, 5, 368, <>v<TSub>2</TSub>′ = +5</>, col * sol)}
          </g>
          {/* neraca Σp (langkah 3) */}
          <g opacity={mom}>
            {sumBar(6, -3, 1 - col, <>p₁ = +6</>, <>p₂ = −3</>)}
            {sumBar(-2, 5, col * sol, <>p₁′ = −2</>, <>p₂′ = +5</>)}
            <Arrow x1={BX0} y1={612} x2={BX0 + 3 * PS} y2={612} color="spr" width={7} pulse={false} />
            <Label x={BX0 - 16} y={612} size={22} color={C.spr} anchor="end" weight={600}>
              Σp = +3 kg·m/s
            </Label>
            <line x1={BX0} y1={496} x2={BX0} y2={626} stroke={C.muted} strokeOpacity={0.5} strokeWidth={2} strokeDasharray="4 5" />
          </g>

          {/* batang K (langkah 5) */}
          <g opacity={kIn}>
            <Label x={1000} y={645} size={22} color={C.kin} anchor="start" weight={600} spacing={2}>
              ENERGI KINETIK K = ½mv²
            </Label>
            {kRow(690, 'sebelum', 13.5, C.kin, 1, ramp(t, cue(5) + 0.3, cue(5) + 1.3))}
            {kRow(755, 'sesudah', 13.5, C.kin, kAfter, kAfter)}
            {kRow(820, 'jika K naik', 28.5, C.heat, kBad, kBad)}
            <g opacity={kAfter}>
              <path d={`M${1200 + 223 + 118},753 l9,10 l18,-22`} fill="none" stroke={C.work} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" pathLength={100} strokeDasharray="100 100" strokeDashoffset={100 * (1 - kAfter)} />
            </g>
            <g opacity={kBad}>
              <line x1={1196} y1={834} x2={1196 + 478 * kX} y2={806} stroke="#fff" strokeOpacity={0.8} strokeWidth={3} />
              <Label x={1435} y={852} size={18} color={C.muted}>
                (v₁′ = −2, v₂′ = +7: Σp cocok, tetapi mustahil)
              </Label>
            </g>
            <g opacity={kX} transform={`translate(1800 820) scale(${0.8 + 0.2 * kX})`}>
              <path d="M-14,-14 L14,14 M14,-14 L-14,14" stroke={C.heat} strokeWidth={7} strokeLinecap="round" />
            </g>
            <Ripple x={1800} y={820} p={kXp} r={80} color="heat" rings={2} />
            <Glow x={1800} y={820} r={70} color="heat" opacity={0.6 * kX} />
          </g>
          <Twinkles x={BX0 + 45} y={612} rx={70} ry={20} n={3} color="spr" opacity={mom * col * sol * (1 - kIn * 0.7)} seed={2} />
          <Motes x={1410} y={420} rx={380} ry={150} n={14} color="cyan" opacity={0.3} seed={6} />
        </Stage>
        <Card x={1410} y={244} opacity={ex} accent={C.cyan} style={{padding: '10px 26px'}}>
          <div style={{fontFamily: FONT.head, fontSize: 24, lineHeight: 1.45, textAlign: 'center'}}>
            <span style={{color: '#8fb3ff'}}>
              <V>m</V>
              <Sub>1</Sub> = 2 kg, 3 m/s →
            </span>
            {'   ·   '}
            <span style={{color: '#9fe6d0'}}>
              <V>m</V>
              <Sub>2</Sub> = 1 kg, 3 m/s ←
            </span>
            <div style={{fontSize: 21, color: C.muted}}>
              lenting sempurna · <Tint c={C.gold}><V>v</V><Sub>1</Sub>′, <V>v</V><Sub>2</Sub>′ = ?</Tint>
            </div>
          </div>
        </Card>
        {/* slot kartu per langkah */}
        <div style={{opacity: slotOut}}>
          <Note x={1410} y={730} p={slot(t, cue(1) + 0.6, cue(2) + 0.1)} color={C.gold} size={28}>
            Sistem = troli 1 + troli 2 · <Tint c={C.force}>N</Tint> dan <Tint c={C.force}>W</Tint> saling meniadakan
          </Note>
          <Formula x={1410} y={736} p={slot(t, wordOf(2, 'kecepatan'), cue(3) + 0.1)} accent={C.cyan} size={56}>
            <Tint c={C.cyan}>
              <V>v</V>
              <Sub>1</Sub> = +3
            </Tint>{' '}
            ·{' '}
            <Tint c={C.cyan}>
              <V>v</V>
              <Sub>2</Sub> = <span style={{color: interpolateColors(neg, [0, 1], [C.cyan, C.gold])}}>−</span>3
            </Tint>{' '}
            <span style={{fontSize: 34, color: C.muted}}>m/s</span>
          </Formula>
          <Formula x={1410} y={742} p={slot(t, cue(3) + 0.4, cue(4) + 0.1)} accent={C.spr} size={56} caption="Σp sebelum = Σp sesudah = +3 kg·m/s">
            2(+3) + 1(−3) = 2<V>v</V>
            <Sub>1</Sub>′ + <V>v</V>
            <Sub>2</Sub>′
          </Formula>
          <Card x={1410} y={752} opacity={slot(t, cue(4) + 0.4, cue(5) + 0.2)} scale={0.95 + 0.05 * eq2} accent={C.gold} style={{padding: '18px 36px'}}>
            <div style={{fontFamily: FONT.serif, fontSize: 56, lineHeight: 1.3, textAlign: 'center', whiteSpace: 'nowrap'}}>
              <div style={{fontSize: 26, fontFamily: FONT.head, color: C.muted}}>lenting (e = 1):</div>
              <span style={{opacity: 0.35 + 0.65 * eq2}}>
                <V>v</V>
                <Sub>1</Sub>′ − <V>v</V>
                <Sub>2</Sub>′ = −(<V>v</V>
                <Sub>1</Sub> − <V>v</V>
                <Sub>2</Sub>)
              </span>
              <div style={{fontSize: 40, opacity: sol, color: C.cyan, maxHeight: sol * 60, overflow: 'hidden'}}>
                → <V>v</V>
                <Sub>1</Sub>′ = −1 m/s, <V>v</V>
                <Sub>2</Sub>′ = +5 m/s
              </div>
            </div>
          </Card>
        </div>
      </AbsoluteFill>

      {/* ===================== daftar langkah (kiri) ===================== */}
      <AbsoluteFill>
        <Stage>
          <g opacity={rows[0].p}>
            <line x1={RAIL_X} y1={ROW0 + 40} x2={RAIL_X} y2={ROW0 + 40 + 4 * ROWH} stroke={C.line} strokeWidth={4} strokeLinecap="round" />
            <line x1={RAIL_X} y1={ROW0 + 40} x2={RAIL_X} y2={railY} stroke={C.cyan} strokeOpacity={0.7} strokeWidth={4} strokeLinecap="round" />
            {rows.map((r, i) => (
              <g key={i} opacity={Math.max(0.3, r.p)}>
                <circle cx={RAIL_X} cy={r.y} r={11} fill={C.bg} stroke={C.cyan} strokeWidth={3} />
                <circle cx={RAIL_X} cy={r.y} r={6 * r.tick} fill={C.cyan} />
                <Ripple x={LIST_X + 54} y={r.y} p={ramp(t, ends[i] - 0.1, ends[i] + 1.1, (q) => q)} r={70} color="cyan" rings={2} />
              </g>
            ))}
            <Spark x={RAIL_X} y={railY} r={7} color="cyan" trail={[1, 2, 3, 4, 5].map((k) => [RAIL_X, railY - k * 9 * railVel] as [number, number])} />
          </g>
          <Motes x={520} y={520} rx={420} ry={300} n={10} color="cyan" opacity={0.25} seed={12} />
        </Stage>
        <div style={{position: 'absolute', left: LIST_X + 20, top: 196, opacity: head, fontFamily: FONT.head, fontSize: 24, letterSpacing: 6, color: C.cyan, fontWeight: 600}}>
          URUTAN BERPIKIR · SOAL MOMENTUM
        </div>
        {STEPS.map((s, i) => {
          const {p, tick, act} = rows[i];
          const warn = i === 4 ? kX : 0;
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: LIST_X,
                top: ROW0 + i * ROWH,
                width: 800,
                height: 80,
                boxSizing: 'border-box',
                display: 'flex',
                alignItems: 'center',
                gap: 22,
                opacity: Math.max(p, 0.22 * head),
                translate: `${(1 - p) * 30}px 0px`,
                scale: String(1 + 0.015 * act),
                fontFamily: FONT.head,
                fontSize: 30,
                fontWeight: 500,
                color: C.ink,
                padding: '0 22px',
                borderRadius: 16,
                background: `linear-gradient(90deg, rgba(20,34,72,${0.85 + 0.1 * act}), rgba(14,22,50,0.85))`,
                border: `1.5px solid ${interpolateColors(act, [0, 1], [C.line, C.cyan])}`,
                boxShadow: `0 0 ${28 * act}px rgba(79,214,255,${0.28 * act})${warn > 0 ? `, 0 0 ${24 * warn}px rgba(255,79,100,${0.3 * warn})` : ''}`,
                whiteSpace: 'nowrap',
              }}
            >
              <div
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: 12,
                  border: `2.5px solid ${C.cyan}`,
                  background: `rgba(79,214,255,${0.15 * tick})`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: FONT.mono,
                  fontSize: 23,
                  color: C.cyan,
                  flexShrink: 0,
                  position: 'relative',
                }}
              >
                <span style={{opacity: 1 - tick}}>{i + 1}</span>
                <svg width={46} height={46} viewBox="0 0 46 46" style={{position: 'absolute', left: -2.5, top: -2.5}}>
                  <path d="M11,24 L20,33 L35,14" fill="none" stroke={C.cyan} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" pathLength={100} strokeDasharray="100 100" strokeDashoffset={100 * (1 - tick)} />
                </svg>
              </div>
              <span>{s}</span>
            </div>
          );
        })}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
