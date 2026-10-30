import React from 'react';
import {AbsoluteFill} from 'remotion';
import {EASE_IN, EASE_IN_OUT, mix, ramp} from '../anim';
import {Arrow, DrawPath, Formula, Glow, Label, Motes, Ripple, Stage, Sub, TSub, Twinkles, V} from '../components/primitives';
import {useScene} from '../SceneContext';
import {C, FONT} from '../theme';

// Tumbukan dua dimensi: meja biliar tampak atas.
// Bola 1 (putih) menyerempet bola 2 (biru, diam). Parameter tumbukan b = R → sin θ = b/2R = ½ → θ = 30°.
// Massa sama + lenting: bola 2 keluar sepanjang garis pusat (30° ke atas) dengan v·cos30°,
// bola 1 keluar tegak lurus (60° ke bawah) dengan v·sin30° → sudut pisah 90°.
// Σpₓ: 0,866·cos30 + 0,5·cos60 = 0,75 + 0,25 = 1 ✓ · Σp_y: 0,866·sin30 − 0,5·sin60 = 0 ✓

const R = 24;
const D2R = Math.PI / 180;
const COS30 = Math.cos(30 * D2R);
const SIN30 = 0.5;
// meja (kain) & bingkai
const FX0 = 140;
const FX1 = 1000;
const FY0 = 250;
const FY1 = 810;
// bola
const X0 = 250; // posisi awal bola 1
const Y0 = 560;
const TX = 600; // bola 2
const TY = Y0 - R; // b = R
const CX = TX - 2 * R * COS30; // posisi bola 1 saat bersentuhan
const CY = Y0;
const VS = 160; // px/s (kecepatan bola 1)
const TC = (CX - X0) / VS; // waktu sampai bersentuhan
const KD = 0.5; // peluruhan laju sesudah tumbukan (gesekan kain, sama untuk kedua bola)
const N2: [number, number] = [COS30, -SIN30]; // arah bola 2 sesudah (garis pusat)
const N1: [number, number] = [SIN30, COS30]; // arah bola 1 sesudah (tegak lurus)
const PERIOD = 9.5;
const PSCALE = 0.75; // panah momentum di meja: px per (px/s)

// diagram momentum (panel kanan) — satu skala: p₁ = 400 px
const OX = 1200;
const OY = 640;
const PL = 400;
const P2TIP: [number, number] = [OX + PL * COS30 * COS30, OY - PL * COS30 * SIN30];
const P1V: [number, number] = [PL * SIN30 * SIN30, PL * SIN30 * COS30]; // vektor p₁′ (60° ke bawah)

const slot = (t: number, a: number, b: number, fi = 0.5, fo = 0.45) => Math.min(ramp(t, a, a + fi), 1 - ramp(t, b - fo, b, EASE_IN_OUT));

type BallState = {x: number; y: number; dist: number; dir: [number, number]; speed: number};

/** Keadaan kedua bola pada waktu lokal τ (0 = stik memukul). */
const shot = (tau: number): {b1: BallState; b2: BallState; hit: number} => {
  if (tau < TC) {
    const s = Math.max(0, tau) * VS;
    return {
      b1: {x: X0 + s, y: Y0, dist: s, dir: [1, 0], speed: tau < 0 ? 0 : VS},
      b2: {x: TX, y: TY, dist: 0, dir: N2, speed: 0},
      hit: -1,
    };
  }
  const u = tau - TC;
  const f = (1 - Math.exp(-KD * u)) / KD;
  const dec = Math.exp(-KD * u);
  const v2 = VS * COS30;
  const v1 = VS * SIN30;
  return {
    b1: {x: CX + N1[0] * v1 * f, y: CY + N1[1] * v1 * f, dist: CX - X0 + v1 * f, dir: N1, speed: v1 * dec},
    b2: {x: TX + N2[0] * v2 * f, y: TY + N2[1] * v2 * f, dist: v2 * f, dir: N2, speed: v2 * dec},
    hit: u,
  };
};

/** Bola biliar tampak atas: bayangan, kilau, nomor yang ikut menggelinding. */
const PoolBall: React.FC<{b: BallState; fill: string; num?: string; op: number}> = ({b, fill, num, op}) => {
  if (op <= 0.001) return null;
  const ph = b.dist / R;
  const off = R * 0.55 * Math.sin(ph);
  const vis = Math.max(0, Math.min(1, Math.cos(ph) * 3));
  return (
    <g opacity={op}>
      <ellipse cx={b.x + 7} cy={b.y + 9} rx={R * 1.05} ry={R * 0.9} fill="#020610" opacity={0.45} />
      <circle cx={b.x} cy={b.y} r={R} fill={fill} stroke="#0b1022" strokeWidth={1.5} />
      {num ? (
        <g opacity={vis}>
          <circle cx={b.x + b.dir[0] * off} cy={b.y + b.dir[1] * off} r={R * 0.42} fill="#f4f7ff" />
          <text x={b.x + b.dir[0] * off} y={b.y + b.dir[1] * off + 1} textAnchor="middle" dominantBaseline="central" fontFamily={FONT.head} fontWeight={700} fontSize={15} fill="#0b1022">
            {num}
          </text>
        </g>
      ) : null}
      <circle cx={b.x - R * 0.32} cy={b.y - R * 0.36} r={R * 0.3} fill="#fff" opacity={0.55} />
      <circle cx={b.x - R * 0.42} cy={b.y - R * 0.44} r={R * 0.1} fill="#fff" opacity={0.9} />
    </g>
  );
};

/** Panah momentum di meja (mulai dari tepi bola). */
const BallArrow: React.FC<{b: BallState; op: number; label: React.ReactNode; side?: number}> = ({b, op, label, side = -1}) => {
  const L = b.speed * PSCALE;
  if (op <= 0.001 || L < 18) return null;
  const sx = b.x + b.dir[0] * (R + 4);
  const sy = b.y + b.dir[1] * (R + 4);
  const ex = sx + b.dir[0] * L;
  const ey = sy + b.dir[1] * L;
  const nx = -b.dir[1] * side;
  const ny = b.dir[0] * side;
  return (
    <g opacity={op * Math.min(1, (L - 18) / 20)}>
      <Arrow x1={sx} y1={sy} x2={ex} y2={ey} color="spr" width={5} />
      <Label x={(sx + ex) / 2 + nx * 30} y={(sy + ey) / 2 + ny * 30} size={26} color={C.spr} font="serif" italic weight={600}>
        {label}
      </Label>
    </g>
  );
};

/** Stik biliar: ujung pada jarak d di belakang bola 1. */
const CueStick: React.FC<{d: number; op: number}> = ({d, op}) => {
  if (op <= 0.001) return null;
  const tip = X0 - R - 3 - d;
  const len = 460;
  return (
    <g opacity={op}>
      <path d={`M${tip},${Y0 - 4} L${tip - len},${Y0 - 9} L${tip - len},${Y0 + 9} L${tip},${Y0 + 4} Z`} fill="#c99a5b" />
      <path d={`M${tip - len * 0.55},${Y0 - 7} L${tip - len},${Y0 - 9} L${tip - len},${Y0 + 9} L${tip - len * 0.55},${Y0 + 7} Z`} fill="#3a2516" />
      <rect x={tip - 10} y={Y0 - 4.5} width={10} height={9} fill="#e9eef8" />
      <rect x={tip - 3} y={Y0 - 4} width={4} height={8} rx={1} fill="#3b6fd8" />
      <path d={`M${tip - 12},${Y0 - 3.5} L${tip - len + 10},${Y0 - 7}`} stroke="#fff" strokeOpacity={0.25} strokeWidth={2} />
    </g>
  );
};

const RightMark: React.FC<{x: number; y: number; u: [number, number]; w: [number, number]; s?: number; op: number; color?: string}> = ({x, y, u, w, s = 24, op, color = C.gold}) =>
  op <= 0.001 ? null : (
    <path
      d={`M${x + u[0] * s},${y + u[1] * s} L${x + (u[0] + w[0]) * s},${y + (u[1] + w[1]) * s} L${x + w[0] * s},${y + w[1] * s}`}
      fill="none"
      stroke={color}
      strokeWidth={3.5}
      opacity={op}
      strokeLinejoin="round"
    />
  );

/** Busur sudut (derajat, a0 → a1 berlawanan jarum jam; y layar terbalik). */
const arcPath = (x: number, y: number, r: number, a0: number, a1: number) => {
  const p0 = [x + r * Math.cos(a0 * D2R), y - r * Math.sin(a0 * D2R)];
  const p1 = [x + r * Math.cos(a1 * D2R), y - r * Math.sin(a1 * D2R)];
  const large = Math.abs(a1 - a0) > 180 ? 1 : 0;
  const sweep = a1 > a0 ? 0 : 1;
  return `M${p0[0].toFixed(1)},${p0[1].toFixed(1)} A${r},${r} 0 ${large} ${sweep} ${p1[0].toFixed(1)},${p1[1].toFixed(1)}`;
};

export const TwoD: React.FC = () => {
  const {t, cue, cueEnd, wordOf} = useScene();

  // ---------- jadwal pukulan ----------
  const c1 = wordOf(1, 'menyerempet') + 0.45; // tumbukan pertama tepat saat "menyerempet"
  const S1 = c1 - TC;
  const kNow = Math.floor((t - S1 + 1.2) / PERIOD);
  const cycles = [kNow - 1, kNow].filter((k) => k >= 0);
  if (cycles.length === 0) cycles.push(0);

  // ---------- fase narasi ----------
  const tableIn = ramp(t, -0.4, 0.6);
  const vecDemo = Math.min(ramp(t, cue(0) + 0.2, cue(0) + 1.0), 1 - ramp(t, cue(1) + 0.1, cue(1) + 0.9, EASE_IN_OUT));
  const comps = ramp(t, wordOf(0, 'arah') - 0.3, wordOf(0, 'arah') + 0.5);
  const diag = ramp(t, cue(1) + 0.5, cue(1) + 1.3);
  const after = ramp(t, c1, c1 + 0.7);
  const xs = ramp(t, wordOf(2, 'mendatar') - 0.3, wordOf(2, 'mendatar') + 0.5);
  const ys = ramp(t, wordOf(2, 'tegak') - 0.3, wordOf(2, 'tegak') + 0.5);
  const compOut = 1 - ramp(t, cue(3) + 0.2, cue(3) + 1.0, EASE_IN_OUT);
  const slide = ramp(t, wordOf(3, 'menyambung') - 0.2, wordOf(3, 'menyambung') + 1.6, EASE_IN_OUT);
  const same = ramp(t, wordOf(3, 'tepat') - 0.2, wordOf(3, 'tepat') + 0.6);
  const sameP = ramp(t, wordOf(3, 'tepat') - 0.1, wordOf(3, 'tepat') + 1.5, (q) => q);
  const right = ramp(t, wordOf(4, 'siku') - 0.4, wordOf(4, 'siku') + 0.5);
  const angles = ramp(t, cue(4) + 0.4, cue(4) + 1.2);
  const thales = ramp(t, wordOf(4, 'siku') + 0.2, wordOf(4, 'siku') + 1.4);
  const rightP = ramp(t, wordOf(4, 'siku') - 0.1, wordOf(4, 'siku') + 1.4, (q) => q);

  // ---------- jejak lintasan pukulan pertama ----------
  const first = shot(t - S1);
  const inPath = Math.min(1, Math.max(0, t - S1) * VS / (CX - X0));
  const pathOp = 0.5 * ramp(t, S1, S1 + 0.4);
  const d2max = (VS * COS30) / KD;
  const d1max = (VS * SIN30) / KD;
  const p2Path = first.hit > 0 ? (2 * R + first.b2.dist) / (2 * R + d2max) : 0;
  const p1Path = first.hit > 0 ? (first.b1.dist - (CX - X0)) / d1max : 0;

  // ---------- panel: vektor berputar (baris 0) ----------
  const phi = (38 + 22 * Math.sin(t * 0.7)) * D2R;
  const VCX = 1330;
  const VCY = 640;
  const VL = 250;
  const vx = VCX + VL * Math.cos(phi);
  const vy = VCY - VL * Math.sin(phi);

  // panel: p₁′ bergeser ke ujung p₂′
  const p1sx = mix(OX, P2TIP[0], slide);
  const p1sy = mix(OY, P2TIP[1], slide);
  const grow = ramp(t, c1 + 0.1, c1 + 0.9);

  return (
    <AbsoluteFill>
      <Stage>
        {/* ===================== meja biliar ===================== */}
        <g opacity={tableIn}>
          <rect x={FX0 - 40} y={FY0 - 40} width={FX1 - FX0 + 80} height={FY1 - FY0 + 80} rx={34} fill="#3a2414" stroke="#6b4527" strokeWidth={3} />
          <rect x={FX0 - 40} y={FY0 - 40} width={FX1 - FX0 + 80} height={14} rx={7} fill="#fff" opacity={0.06} />
          <rect x={FX0 - 10} y={FY0 - 10} width={FX1 - FX0 + 20} height={FY1 - FY0 + 20} rx={10} fill="#0e4a3f" />
          <rect x={FX0} y={FY0} width={FX1 - FX0} height={FY1 - FY0} rx={4} fill="#0f5a4b" />
          <ellipse cx={(FX0 + FX1) / 2} cy={(FY0 + FY1) / 2} rx={420} ry={260} fill="#1d7a64" opacity={0.35} />
          {/* titik bidik di bingkai */}
          {[1, 2, 3, 5, 6, 7].map((i) => (
            <g key={i}>
              <circle cx={FX0 + ((FX1 - FX0) * i) / 8} cy={FY0 - 25} r={4} fill="#e8d7b0" opacity={0.8} />
              <circle cx={FX0 + ((FX1 - FX0) * i) / 8} cy={FY1 + 25} r={4} fill="#e8d7b0" opacity={0.8} />
            </g>
          ))}
          {[1, 2, 3].map((i) => (
            <g key={i}>
              <circle cx={FX0 - 25} cy={FY0 + ((FY1 - FY0) * i) / 4} r={4} fill="#e8d7b0" opacity={0.8} />
              <circle cx={FX1 + 25} cy={FY0 + ((FY1 - FY0) * i) / 4} r={4} fill="#e8d7b0" opacity={0.8} />
            </g>
          ))}
          {/* lubang */}
          {[
            [FX0, FY0],
            [(FX0 + FX1) / 2, FY0 - 6],
            [FX1, FY0],
            [FX0, FY1],
            [(FX0 + FX1) / 2, FY1 + 6],
            [FX1, FY1],
          ].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r={22} fill="#05070e" stroke="#2a1a0e" strokeWidth={4} />
          ))}
          <line x1={FX0 + (FX1 - FX0) * 0.22} y1={FY0} x2={FX0 + (FX1 - FX0) * 0.22} y2={FY1} stroke="#fff" strokeOpacity={0.07} strokeWidth={2} />
          {/* kompas sumbu */}
          <g opacity={0.55 + 0.45 * Math.max(comps * vecDemo, Math.max(xs, ys) * compOut)}>
            <line x1={190} y1={760} x2={262} y2={760} stroke={C.ink} strokeWidth={3} markerEnd="url(#arrow-ink)" />
            <line x1={190} y1={760} x2={190} y2={688} stroke={C.ink} strokeWidth={3} markerEnd="url(#arrow-ink)" />
            <Label x={282} y={760} size={22} color={C.ink} font="serif" italic>
              x
            </Label>
            <Label x={190} y={668} size={22} color={C.ink} font="serif" italic>
              y
            </Label>
          </g>
          <Motes x={570} y={530} rx={400} ry={250} n={16} color="cyan" opacity={0.3} seed={4} />
        </g>

        {/* jejak lintasan (pukulan pertama, bertahan) */}
        <g opacity={pathOp}>
          <DrawPath d={`M${X0},${Y0} L${CX},${CY}`} p={inPath} stroke={C.ink} width={2.5} dash="9 9" />
          {p2Path > 0 ? <line x1={CX} y1={CY} x2={CX + N2[0] * (2 * R + d2max) * p2Path} y2={CY + N2[1] * (2 * R + d2max) * p2Path} stroke="#7fa6ff" strokeWidth={2.5} strokeDasharray="9 9" /> : null}
          {p1Path > 0 ? <line x1={CX} y1={CY} x2={CX + N1[0] * d1max * p1Path} y2={CY + N1[1] * d1max * p1Path} stroke={C.ink} strokeWidth={2.5} strokeDasharray="9 9" /> : null}
        </g>
        {/* perpanjangan arah datang + siku-siku di meja */}
        <g opacity={angles}>
          <line x1={CX} y1={CY} x2={CX + 230} y2={CY} stroke={C.muted} strokeWidth={2} strokeDasharray="4 8" />
        </g>
        <RightMark x={CX} y={CY} u={N2} w={N1} s={26} op={right} />
        <g opacity={right}>
          <Label x={CX + 92} y={CY + 34} size={26} color={C.gold} weight={700}>
            90°
          </Label>
        </g>
        <Ripple x={CX + 50} y={CY + 10} p={rightP} r={110} color="gold" rings={2} />

        {/* bola (dua siklus terakhir bersilang-pudar) */}
        {cycles.map((k) => {
          const tau = t - (S1 + k * PERIOD);
          const fadeIn = k === 0 ? 1 : ramp(tau, -0.9, -0.2);
          const fadeOut = 1 - ramp(tau, PERIOD - 1.6, PERIOD - 0.8, EASE_IN_OUT);
          const op = fadeIn * fadeOut * tableIn;
          if (op <= 0.001) return null;
          const s = shot(tau);
          // stik
          let d: number;
          if (tau < -0.7) d = 36 + 14 * Math.sin(t * 2.1);
          else if (tau < -0.18) d = mix(36 + 14 * Math.sin(t * 2.1), 86, ramp(tau, -0.7, -0.18, EASE_IN_OUT));
          else if (tau < 0) d = mix(86, -2, ramp(tau, -0.18, 0, EASE_IN));
          else d = -2 - 26 * ramp(tau, 0, 0.25);
          const stickOp = (k === 0 ? ramp(t, -0.2, 0.6) : ramp(tau, -1.6, -1.0)) * (1 - ramp(tau, 0.25, 0.9, EASE_IN_OUT)) * tableIn;
          const motion = (b: BallState, n: number) =>
            b.speed > 30
              ? Array.from({length: n}, (_, i) => (
                  <circle key={i} cx={b.x - b.dir[0] * (i + 1) * 0.06 * b.speed} cy={b.y - b.dir[1] * (i + 1) * 0.06 * b.speed} r={R * (0.85 - i * 0.18)} fill="#dfe7ff" opacity={0.1 * (1 - i / n) * Math.min(1, (b.speed - 30) / 40)} />
                ))
              : null;
          const hitP = ramp(tau, TC - 0.02, TC + 1.0, (q) => q);
          return (
            <g key={k} opacity={op}>
              <CueStick d={d} op={Math.min(1, stickOp / Math.max(op, 0.001))} />
              {motion(s.b1, 3)}
              {motion(s.b2, 3)}
              <Glow x={s.b2.x} y={s.b2.y} r={70} color="pot" opacity={0.35} />
              <PoolBall b={s.b2} fill="#2f5fe0" num="2" op={1} />
              <PoolBall b={s.b1} fill="#f3f1ea" op={1} />
              <Ripple x={CX + R * COS30} y={CY - R * SIN30} p={hitP} r={120} color="gold" />
              <BallArrow b={{...s.b1, dir: [1, 0], speed: tau > 0 ? VS : 0}} op={1 - ramp(tau, TC - 0.04, TC + 0.16, EASE_IN_OUT)} label={<>p<TSub>1</TSub></>} side={1} />
              {s.hit >= 0 ? <BallArrow b={s.b1} op={ramp(tau, TC, TC + 0.25)} label={<>p<TSub>1</TSub>′</>} side={1} /> : null}
              <BallArrow b={s.b2} op={1} label={<>p<TSub>2</TSub>′</>} side={-1} />
              {k === 0 ? (
                <g opacity={1 - ramp(tau, TC - 0.4, TC, EASE_IN_OUT)}>
                  <Label x={TX} y={TY - 52} size={24} color={C.muted}>
                    diam
                  </Label>
                </g>
              ) : null}
            </g>
          );
        })}

        {/* ===================== panel diagram momentum ===================== */}
        <g opacity={tableIn}>
          <rect x={1100} y={200} width={740} height={672} rx={22} fill="rgba(10,16,36,0.72)" stroke={C.line} strokeWidth={2} />
          <Label x={1470} y={232} size={22} color={C.muted} weight={600} spacing={3}>
            DIAGRAM MOMENTUM
          </Label>
        </g>

        {/* baris 0: vektor berputar & komponennya */}
        <g opacity={vecDemo}>
          <line x1={1150} y1={VCY} x2={1790} y2={VCY} stroke={C.faint} strokeWidth={2.5} markerEnd="url(#arrow-muted)" />
          <line x1={VCX} y1={850} x2={VCX} y2={400} stroke={C.faint} strokeWidth={2.5} markerEnd="url(#arrow-muted)" />
          <Label x={1806} y={VCY + 28} size={24} color={C.muted} font="serif" italic>
            x
          </Label>
          <Label x={VCX - 26} y={400} size={24} color={C.muted} font="serif" italic>
            y
          </Label>
          <g opacity={comps}>
            <line x1={vx} y1={vy} x2={vx} y2={VCY} stroke={C.spr} strokeOpacity={0.6} strokeWidth={2} strokeDasharray="6 7" />
            <line x1={vx} y1={vy} x2={VCX} y2={vy} stroke={C.spr} strokeOpacity={0.6} strokeWidth={2} strokeDasharray="6 7" />
            <line x1={VCX} y1={VCY + 1} x2={vx} y2={VCY + 1} stroke="#d9c2ff" strokeWidth={7} strokeLinecap="round" opacity={0.8} />
            <line x1={VCX - 1} y1={VCY} x2={VCX - 1} y2={vy} stroke="#d9c2ff" strokeWidth={7} strokeLinecap="round" opacity={0.8} />
            <Label x={(VCX + vx) / 2} y={VCY + 34} size={28} color="#d9c2ff" font="serif" italic weight={600}>
              p<TSub>x</TSub>
            </Label>
            <Label x={VCX - 44} y={(VCY + vy) / 2} size={28} color="#d9c2ff" font="serif" italic weight={600}>
              p<TSub>y</TSub>
            </Label>
          </g>
          <Arrow x1={VCX} y1={VCY} x2={vx} y2={vy} color="spr" width={7} />
          <Label x={vx + 30 * Math.cos(phi) + 14} y={vy - 30 * Math.sin(phi)} size={32} color={C.spr} font="serif" italic weight={700}>
            p
          </Label>
          <Motes x={VCX + 120} y={VCY - 100} rx={260} ry={200} n={12} color="spr" opacity={0.35} seed={7} />
        </g>

        {/* diagram sebelum/sesudah */}
        <g opacity={diag}>
          <line x1={1150} y1={OY} x2={1780} y2={OY} stroke={C.faint} strokeWidth={2} />
          {/* lingkaran Thales (diameter = p₁) */}
          <g opacity={0.6 * thales}>
            <circle cx={OX + PL / 2} cy={OY} r={PL / 2} fill="none" stroke={C.gold} strokeWidth={2} strokeDasharray="5 9" />
          </g>
          {/* komponen (baris 2) */}
          <g opacity={compOut * after}>
            <g opacity={xs}>
              <line x1={P2TIP[0]} y1={P2TIP[1]} x2={P2TIP[0]} y2={OY} stroke={C.spr} strokeOpacity={0.6} strokeWidth={2} strokeDasharray="6 7" />
              <line x1={OX + P1V[0]} y1={OY + P1V[1]} x2={OX + P1V[0]} y2={OY} stroke={C.spr} strokeOpacity={0.6} strokeWidth={2} strokeDasharray="6 7" />
              <line x1={OX} y1={OY - 14} x2={P2TIP[0]} y2={OY - 14} stroke="#d9c2ff" strokeWidth={8} strokeLinecap="round" />
              <line x1={P2TIP[0] + 4} y1={OY - 14} x2={P2TIP[0] + P1V[0]} y2={OY - 14} stroke="#a77bff" strokeWidth={8} strokeLinecap="round" />
              <Label x={OX + PL} y={OY - 46} size={24} color="#d9c2ff" weight={600}>
                Σpₓ = p₁
              </Label>
            </g>
            <g opacity={ys}>
              <line x1={1720} y1={OY} x2={1720} y2={P2TIP[1]} stroke="#d9c2ff" strokeWidth={7} strokeLinecap="round" markerEnd="url(#arrow-spr)" />
              <line x1={1720} y1={OY} x2={1720} y2={OY + P1V[1]} stroke="#a77bff" strokeWidth={7} strokeLinecap="round" markerEnd="url(#arrow-spr)" />
              <Label x={1752} y={(OY + P2TIP[1]) / 2} size={24} color="#d9c2ff" anchor="start" font="serif" italic>
                +
              </Label>
              <Label x={1752} y={OY + P1V[1] / 2} size={24} color="#a77bff" anchor="start" font="serif" italic>
                −
              </Label>
              <Label x={1720} y={OY + P1V[1] + 40} size={24} color={C.ink} weight={600}>
                Σp<TSub>y</TSub> = 0
              </Label>
            </g>
          </g>
          {/* p₁ semula */}
          <Arrow x1={OX} y1={OY} x2={OX + PL} y2={OY} color="spr" width={7} opacity={0.55 + 0.45 * Math.max(1 - after, same)} />
          <Glow x={OX + PL} y={OY} r={110} color="spr" opacity={0.8 * same} />
          <Label x={OX + PL * 0.62} y={OY + 30} size={30} color={C.spr} font="serif" italic weight={700}>
            p<TSub>1</TSub>
          </Label>
          <Label x={OX + 4} y={OY + 30} size={22} color={C.muted}>
            O
          </Label>
          {/* sesudah */}
          {grow > 0.01 ? (
            <g opacity={after}>
              <Arrow x1={OX} y1={OY} x2={mix(OX, P2TIP[0], grow)} y2={mix(OY, P2TIP[1], grow)} color="spr" width={6} />
              <Label x={(OX + P2TIP[0]) / 2 - 18} y={(OY + P2TIP[1]) / 2 - 30} size={28} color="#cfa8ff" font="serif" italic weight={700}>
                p<TSub>2</TSub>′
              </Label>
              <Arrow x1={p1sx} y1={p1sy} x2={p1sx + P1V[0] * grow} y2={p1sy + P1V[1] * grow} color="spr" width={6} />
              <Label x={p1sx + P1V[0] / 2 + 40} y={p1sy + P1V[1] / 2 + 6} size={28} color="#cfa8ff" font="serif" italic weight={700}>
                p<TSub>1</TSub>′
              </Label>
              {/* bayangan posisi awal p₁′ saat bergeser */}
              <g opacity={0.35 * Math.sin(Math.PI * slide)}>
                <line x1={OX} y1={OY} x2={OX + P1V[0]} y2={OY + P1V[1]} stroke={C.spr} strokeWidth={3} strokeDasharray="6 8" />
              </g>
            </g>
          ) : null}
          <Ripple x={OX + PL} y={OY} p={sameP} r={140} color="spr" />
          <Twinkles x={OX + PL} y={OY} rx={60} ry={40} n={4} color="spr" opacity={same * (1 - right * 0.6)} seed={3} />
          {/* sudut (baris 4) */}
          <g opacity={angles}>
            <path d={arcPath(OX, OY, 70, 0, 30)} fill="none" stroke={C.gold} strokeWidth={3} />
            <Label x={OX + 96} y={OY - 24} size={22} color={C.gold} weight={600}>
              30°
            </Label>
            <path d={arcPath(OX + PL, OY, 60, 180, 120)} fill="none" stroke={C.gold} strokeWidth={3} />
            <Label x={OX + PL - 70} y={OY - 66} size={22} color={C.gold} weight={600}>
              60°
            </Label>
          </g>
          <RightMark x={P2TIP[0]} y={P2TIP[1]} u={[-COS30, SIN30]} w={N1} s={26} op={right} />
          <g opacity={right}>
            <Label x={P2TIP[0] - 8} y={P2TIP[1] + 62} size={26} color={C.gold} weight={700}>
              90°
            </Label>
          </g>
          <Ripple x={P2TIP[0]} y={P2TIP[1]} p={rightP} r={120} color="gold" rings={2} />
        </g>
      </Stage>

      {/* ===================== kartu rumus (satu per momen) ===================== */}
      <Formula x={1470} y={322} p={slot(t, cue(0) + 0.6, cue(1) + 0.4)} accent={C.spr} size={56} caption="vektor: punya besar dan arah">
        <V color={C.spr}>p</V> = (<V color="#d9c2ff">p</V>
        <Sub>x</Sub>, <V color="#d9c2ff">p</V>
        <Sub>y</Sub>)
      </Formula>
      <Formula x={1470} y={322} p={slot(t, cue(2), cue(3) + 0.1)} accent={C.spr} size={56}>
        Σ<V>p</V>
        <Sub>x</Sub> tetap · Σ<V>p</V>
        <Sub>y</Sub> = 0
      </Formula>
      <Formula x={1470} y={322} p={slot(t, wordOf(3, 'jumlahkan'), cue(4) + 0.1)} accent={C.spr} size={56} caption="sambung ujung ke pangkal">
        <V color="#cfa8ff">p</V>
        <Sub>1</Sub>′ + <V color="#cfa8ff">p</V>
        <Sub>2</Sub>′ = <V color={C.spr}>p</V>
        <Sub>1</Sub>
      </Formula>
      <Formula x={1470} y={322} p={slot(t, cue(4) + 0.3, cueEnd(4) + 5)} accent={C.gold} size={56} caption="massa sama · lenting · sasaran diam">
        <V>θ</V>
        <Sub>1</Sub>′ + <V>θ</V>
        <Sub>2</Sub>′ = 90°
      </Formula>
    </AbsoluteFill>
  );
};
