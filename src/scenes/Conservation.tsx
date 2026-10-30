import React from 'react';
import {AbsoluteFill} from 'remotion';
import {BACK, EASE_IN_OUT, cyc, ramp, rand} from '../anim';
import {Car} from '../components/physics';
import {Arrow, Badge, Formula, Glow, Label, Motes, Ripple, Spark, Stage, Stream, Sub, TSub, Twinkles, V} from '../components/primitives';
import {useScene} from '../SceneContext';
import {C, FONT} from '../theme';

// Dua kereta luncur di rel udara (tanpa gesekan, tanpa gaya luar).
// m₁ = 2 kg, v₁ = 3 m/s; m₂ = 1 kg diam. Bumper pegas → kontak berdurasi Δt = 0,12 s (gaya setengah sinus).
// Selama kontak: v₁ = 3 − (μv/m₁)(1 − cos ωτ), v₂ = (μv/m₂)(1 − cos ωτ), μ = m₁m₂/(m₁+m₂) = 2/3 kg.
// Akhir kontak: v₁′ = 1 m/s, v₂′ = 4 m/s → p: 6 + 0 = 2 + 4 = 6 kg·m/s; J₂ = +4 N·s, J₁ = −4 N·s.
// Baris 0: tumbukan waktu nyata. Baris 1–4: tayangan ulang gerak lambat (waktu dilambatkan halus saat kontak).
// Baris 5: empat ubin montase, masing-masing simulasi kecil yang kekal momentumnya.

const S = 90; // px per meter
const M1 = 2;
const M2 = 1;
const V1 = 3;
const MU = (M1 * M2) / (M1 + M2);
const KJ = MU * V1; // = 2 → impuls total 2·KJ = 4 N·s
const TC = 0.12;
const OM = Math.PI / TC;
const WA = 200;
const HA = 120;
const WB = 150;
const HB = 100;
const GAP = 24; // panjang bumper pegas saat lepas
const TY = 590; // permukaan rel
const XB0 = 1080;
const XA0 = XB0 - WB / 2 - WA / 2 - GAP;
const PK = 40; // px per kg·m/s (satu skala untuk seluruh adegan)
const FMAX_PX = 170;

const sim = (tau: number) => {
  if (tau <= 0) return {xa: XA0 + V1 * S * tau, xb: XB0, va: V1, vb: 0, f: 0, j: 0};
  const tt = Math.min(tau, TC);
  const c = 1 - Math.cos(OM * tt);
  const va = V1 - (KJ / M1) * c;
  const vb = (KJ / M2) * c;
  const sm = tt - Math.sin(OM * tt) / OM;
  let xa = XA0 + S * (V1 * tt - (KJ / M1) * sm);
  let xb = XB0 + S * ((KJ / M2) * sm);
  if (tau > TC) {
    xa += S * va * (tau - TC);
    xb += S * vb * (tau - TC);
  }
  return {xa, xb, va, vb, f: tau < TC ? Math.sin(OM * tt) : 0, j: KJ * c};
};

// tayangan ulang: periode P, kontak dimulai di A_ dan berlangsung CS detik layar
const P = 7.2;
const A_ = 2.1;
const CS = 3.4;
const R_FAST = 0.42;
const R_SLOW = TC / CS;
const rate = (u: number) => {
  const d = u < A_ ? A_ - u : u > A_ + CS ? u - (A_ + CS) : 0;
  const k = Math.min(1, d / 0.6);
  const sm = k * k * (3 - 2 * k);
  return R_SLOW + (R_FAST - R_SLOW) * sm;
};
const warp = (s: number) => {
  // τ(s) = ∫_{A_}^{s} rate
  const n = 120;
  const a = Math.min(s, A_);
  const b = Math.max(s, A_);
  const h = (b - a) / n;
  let acc = 0;
  for (let i = 0; i < n; i++) acc += rate(a + (i + 0.5) * h) * h;
  return s < A_ ? -acc : acc;
};

const slot = (t: number, a: number, b: number) => Math.min(ramp(t, a, a + 0.5), 1 - ramp(t, b - 0.45, b - 0.05, EASE_IN_OUT));
const fr = (x: number) => ((x % 1) + 1) % 1;

const Glider: React.FC<{x: number; w: number; h: number; color: string; label: string; opacity?: number; t: number; seed?: number}> = ({x, w, h, color, label, opacity = 1, t, seed = 0}) => {
  if (opacity <= 0.001) return null;
  const y = TY;
  return (
    <g opacity={opacity}>
      <ellipse cx={x} cy={y + 14} rx={w * 0.52} ry={8} fill="#000" opacity={0.35} />
      {[0, 1, 2, 3, 4].map((i) => {
        const ph = fr(t * 2.4 + i * 0.23 + seed);
        return <circle key={i} cx={x - w * 0.4 + i * w * 0.2 + 3 * Math.sin(t * 5 + i)} cy={y - 2 - ph * 9} r={2.2} fill={C.cyan} opacity={0.55 * cyc(ph)} />;
      })}
      <path d={`M${x - w / 2 + 4},${y - 3} L${x - w / 2 + 22},${y - 22} L${x + w / 2 - 22},${y - 22} L${x + w / 2 - 4},${y - 3} Z`} fill="#18224a" stroke={color} strokeOpacity={0.55} strokeWidth={2} />
      <rect x={x - w / 2} y={y - h} width={w} height={h - 22} rx={14} fill="url(#crate)" stroke={color} strokeWidth={3} />
      <rect x={x - w / 2 + 10} y={y - h + 8} width={w - 20} height={7} rx={3.5} fill="#fff" opacity={0.12} />
      <text x={x} y={y - h + 34} textAnchor="middle" dominantBaseline="central" fontFamily={FONT.head} fontWeight={600} fontSize={28} fill={C.ink}>
        {label}
      </text>
    </g>
  );
};

/** Ubin montase dengan bingkai, judul, dan klip. */
const Tile: React.FC<{cx: number; cy: number; p: number; title: string; idx: number; children: React.ReactNode; chip: string}> = ({cx, cy, p, title, idx, children, chip}) => {
  if (p <= 0.001) return null;
  const s = 1.12 * (0.9 + 0.1 * p);
  return (
    <g opacity={Math.min(1, p * 1.3)} transform={`translate(${cx} ${cy}) scale(${s})`}>
      <defs>
        <clipPath id={`cv-tile-${idx}`}>
          <rect x={-186} y={-136} width={372} height={262} rx={14} />
        </clipPath>
      </defs>
      <rect x={-190} y={-175} width={380} height={350} rx={20} fill="rgba(10,16,36,0.78)" stroke={C.spr} strokeOpacity={0.45} strokeWidth={2} />
      <rect x={-186} y={-136} width={372} height={262} rx={14} fill="rgba(20,30,64,0.5)" />
      <g clipPath={`url(#cv-tile-${idx})`}>{children}</g>
      <Label x={0} y={-155} size={26} weight={600} color={C.ink}>
        {title}
      </Label>
      <Label x={0} y={152} size={22} font="mono" weight={600} color={C.spr}>
        {chip}
      </Label>
    </g>
  );
};

export const Conservation: React.FC = () => {
  const {t, cue, wordOf, dur} = useScene();

  const stageIn = ramp(t, -0.4, 0.8);
  // ---- waktu nyata (baris 0) ----
  const tcLive = wordOf(0, 'bertumbukan') + 0.15;
  const liveOp = 1 - ramp(t, cue(1) - 0.5, cue(1) + 0.05, EASE_IN_OUT);
  const live = sim(t - tcLive);
  // ---- tayangan ulang (baris 1–4) ----
  const R0 = cue(1) + 0.1;
  const replayOn = ramp(t, R0, R0 + 0.3) * (1 - ramp(t, cue(5) - 0.5, cue(5) + 0.1, EASE_IN_OUT));
  const sLoop = Math.max(0, t - R0) % P;
  const env = Math.min(1, sLoop / 0.4) * Math.min(1, (P - sLoop) / 0.5);
  const rp = sim(warp(sLoop));
  const mainOut = 1 - ramp(t, cue(5) - 0.5, cue(5) + 0.1, EASE_IN_OUT);

  // fase penjelasan
  const fOn = ramp(t, wordOf(1, 'gaya') - 0.3, wordOf(1, 'gaya') + 0.3);
  const timerOn = ramp(t, cue(1) + 0.3, cue(1) + 0.9);
  const jOn = ramp(t, cue(2) - 0.1, cue(2) + 0.6);
  const pOn = ramp(t, cue(3) - 0.2, cue(3) + 0.5);
  const flowHi = Math.min(ramp(t, cue(3), cue(3) + 0.6), 1 - ramp(t, cue(4) + 0.5, cue(4) + 1.2, EASE_IN_OUT));
  const sysOn = ramp(t, wordOf(4, 'gaya') - 0.3, wordOf(4, 'gaya') + 0.4);
  const badge = ramp(t, wordOf(4, 'hukum') - 0.3, wordOf(4, 'hukum') + 0.4, BACK) * (1 - ramp(t, cue(5) - 0.4, cue(5) + 0.1, EASE_IN_OUT));
  const totalHi = ramp(t, wordOf(4, 'total') - 0.3, wordOf(4, 'total') + 0.4);

  // kartu rumus (satu per momen)
  const k1 = slot(t, wordOf(1, 'sama') - 0.2, cue(2));
  const k2 = slot(t, wordOf(2, 'impulsnya') - 0.3, cue(3));
  const k3 = slot(t, wordOf(3, 'tepat') - 0.3, cue(4));
  const k4 = Math.min(ramp(t, wordOf(4, 'momentum') - 0.3, wordOf(4, 'momentum') + 0.3), 1 - ramp(t, dur - 1.0, dur - 0.3, EASE_IN_OUT));

  // montase
  const tile = (w: string) => ramp(t, wordOf(5, w) - 0.35, wordOf(5, w) + 0.35, BACK);
  const tl = [tile('mobil'), tile('ledakan'), tile('molekul'), tile('subatom')];

  // keadaan yang digambar: waktu nyata atau tayangan ulang
  const drawSet = (st: ReturnType<typeof sim>, op: number, replay: boolean, sl: number) => {
    if (op <= 0.001) return null;
    const {xa, xb, va, vb, f, j} = st;
    const aFront = xa + WA / 2;
    const bBack = xb - WB / 2;
    const contactX = (aFront + bBack) / 2;
    const p1 = M1 * va;
    const p2 = M2 * vb;
    const fl = FMAX_PX * f;
    const ripP = replay ? ramp(sl, A_, A_ + 1.4) : ramp(t, tcLive, tcLive + 0.9);
    const springEnd = Math.min(aFront + GAP, bBack);
    const fOp = replay ? fOn : 0;
    return (
      <g opacity={op}>
        <Glow x={contactX} y={TY - 60} r={150} color="force" opacity={0.6 * f + 0.15} />
        {/* bumper pegas */}
        <line x1={aFront} y1={TY - 62} x2={springEnd} y2={TY - 62} stroke={C.muted} strokeWidth={3} opacity={0.4} />
        <path
          d={Array.from({length: 9}, (_, i) => {
            const x = aFront + ((springEnd - aFront) * i) / 8;
            const y = TY - 62 + (i === 0 || i === 8 ? 0 : i % 2 ? -12 : 12);
            return `${i ? 'L' : 'M'}${x.toFixed(1)},${y}`;
          }).join(' ')}
          fill="none"
          stroke={C.gold}
          strokeWidth={4}
          strokeLinejoin="round"
        />
        <Glider x={xb} w={WB} h={HB} color={C.gold} label="1 kg" t={t} seed={0.5} />
        <Glider x={xa} w={WA} h={HA} color={C.cyan} label="2 kg" t={t} />
        <Ripple x={contactX} y={TY - 62} p={ripP} r={120} color="force" />
        {/* gaya aksi–reaksi (hukum III Newton) */}
        <g opacity={fOp}>
          <Arrow x1={bBack + 4} y1={TY - 52} x2={bBack + 4 + fl} y2={TY - 52} color="force" width={7} pulse={false} />
          <Arrow x1={aFront - 4} y1={TY - 52} x2={aFront - 4 - fl} y2={TY - 52} color="force" width={7} pulse={false} />
          <Label x={xb + WB / 2 + 34} y={TY - 52} size={30} font="serif" italic color={C.force} weight={600} anchor="start" opacity={0.35 + 0.65 * Math.min(1, f * 3)}>
            F<TSub>12</TSub>
          </Label>
          <Label x={xa - WA / 2 - 34} y={TY - 52} size={30} font="serif" italic color={C.force} weight={600} anchor="end" opacity={0.35 + 0.65 * Math.min(1, f * 3)}>
            F<TSub>21</TSub>
          </Label>
        </g>
        {/* panah momentum (skala sama) */}
        <Arrow x1={xa} y1={404} x2={xa + p1 * PK} y2={404} color="spr" width={7} />
        <Label x={xa - 16} y={404} size={30} font="serif" italic color={C.spr} weight={600} anchor="end">
          p<TSub>1</TSub>
        </Label>
        <Label x={xa + p1 * PK + 22} y={404} size={22} font="mono" color={C.spr} weight={600} anchor="start">
          {`${p1.toFixed(1).replace('.', ',')}`}
        </Label>
        <g opacity={Math.min(1, Math.abs(p2) * 2)}>
          <Arrow x1={xb} y1={448} x2={xb + p2 * PK} y2={448} color="spr" width={7} />
          <Label x={xb + p2 * PK + 22} y={448} size={22} font="mono" color={C.spr} weight={600} anchor="start">
            {`${p2.toFixed(1).replace('.', ',')}`}
          </Label>
        </g>
        <Label x={xb - 16} y={448} size={30} font="serif" italic color={C.spr} weight={600} anchor="end" opacity={replay ? 1 : 0.9}>
          p<TSub>2</TSub>
        </Label>
        {/* momentum mengalir dari benda 1 ke benda 2 selama kontak */}
        <Stream
          pts={[
            [xa + 20, 404],
            [contactX, 430],
            [xb + 20, 448],
          ]}
          color="spr"
          n={8}
          speed={1.2}
          r={6}
          opacity={Math.min(1, f * 2.5) * (0.35 + 0.65 * flowHi) * (replay ? pOn : 0)}
        />
        {j > 0.05 && f > 0.02 ? <Motes x={contactX} y={TY - 60} rx={70} ry={50} n={12} color="force" opacity={0.6 * f} /> : null}
      </g>
    );
  };

  // ----- impuls: grafik F–t cermin -----
  const tauR = warp(sLoop);
  const cp = Math.max(0, Math.min(1, tauR / TC));
  const GX0 = 190;
  const GX1 = 540;
  const GY = 785;
  const GA = 62;
  const hump = (sgn: number, upto: number) => {
    const pts: string[] = [];
    const n = 40;
    for (let i = 0; i <= n; i++) {
      const u = (i / n) * upto;
      pts.push(`${i ? 'L' : 'M'}${(GX0 + (GX1 - GX0) * u).toFixed(1)},${(GY - sgn * GA * Math.sin(Math.PI * u)).toFixed(1)}`);
    }
    return pts.join(' ');
  };
  const area = (sgn: number, upto: number) => (upto <= 0.001 ? '' : `${hump(sgn, upto)} L${(GX0 + (GX1 - GX0) * upto).toFixed(1)},${GY} L${GX0},${GY} Z`);
  const jNow = rp.j;

  // ----- momentum total -----
  const MX = 1090;
  const MW = 6 * 80;
  const p1n = M1 * rp.va;
  const split = MX + p1n * 80;

  // ----- montase: waktu tiap ubin -----
  const tm = (k: number) => fr((t - wordOf(5, ['mobil', 'ledakan', 'molekul', 'subatom'][k]) + 0.3) / 4.2) * 4.2;

  return (
    <AbsoluteFill>
      <Stage>
        <g opacity={stageIn * mainOut}>
          {/* rel udara */}
          <Glow x={960} y={TY} r={620} color="cyan" opacity={0.12} />
          <rect x={110} y={TY} width={1700} height={20} rx={6} fill="#1a2752" stroke={C.muted} strokeOpacity={0.6} strokeWidth={2} />
          {Array.from({length: 56}, (_, i) => (
            <circle key={i} cx={130 + i * 30} cy={TY + 10} r={2.4} fill="#0a1026" opacity={0.9} />
          ))}
          <rect x={110} y={TY + 20} width={1700} height={44} fill="url(#ground)" opacity={0.8} />
          <Label x={130} y={TY + 46} size={20} color={C.muted} anchor="start" font="mono">
            rel udara · tanpa gesekan
          </Label>

          {drawSet(live, liveOp, false, 0)}
          {drawSet(rp, replayOn * env, true, sLoop)}

          {/* badge tayangan ulang */}
          <g opacity={replayOn}>
            <circle cx={1546} cy={346} r={9} fill={C.heat} opacity={0.6 + 0.4 * Math.sin(t * 4)} />
            <Label x={1564} y={346} size={22} color={C.muted} anchor="start" font="mono">
              {'gerak lambat'}
            </Label>
          </g>

          {/* pewaktu kontak bersama */}
          <g opacity={timerOn * replayOn}>
            {(() => {
              const cx = XA0 + WA / 2 + GAP / 2;
              const w = 150;
              return (
                <g>
                  <rect x={cx - w / 2} y={TY + 30} width={w} height={14} rx={7} fill="none" stroke={C.ink} strokeOpacity={0.5} strokeWidth={2} />
                  <rect x={cx - w / 2 + 2} y={TY + 32} width={(w - 4) * cp * env} height={10} rx={5} fill={C.ink} opacity={0.85} />
                  <Label x={cx + w / 2 + 14} y={TY + 37} size={24} font="serif" italic color={C.ink} anchor="start">
                    Δt
                  </Label>
                  <Label x={cx - w / 2 - 14} y={TY + 37} size={18} font="mono" color={C.muted} anchor="end">
                    kontak
                  </Label>
                </g>
              );
            })()}
          </g>

          {/* sistem: tanpa gaya luar */}
          <g opacity={sysOn * replayOn}>
            <rect x={560} y={360} width={1060} height={250} rx={24} fill="none" stroke={C.work} strokeWidth={3} strokeDasharray="14 10" strokeDashoffset={-t * 26} opacity={0.75} />
            <Label x={1600} y={630} size={22} color={C.work} anchor="end" weight={600}>
              sistem · tanpa gaya luar
            </Label>
          </g>

          {/* panel impuls */}
          <g opacity={jOn * replayOn}>
            <rect x={130} y={680} width={760} height={190} rx={18} fill="rgba(10,16,36,0.78)" stroke={C.work} strokeOpacity={0.5} strokeWidth={2} />
            <Label x={150} y={706} size={22} color={C.muted} anchor="start" weight={600} spacing={1}>
              impuls = luas di bawah kurva F–t
            </Label>
            <line x1={GX0} y1={GY} x2={GX1 + 20} y2={GY} stroke={C.muted} strokeWidth={2} />
            <Label x={GX1 + 30} y={GY} size={20} font="serif" italic color={C.muted} anchor="start">
              t
            </Label>
            <g opacity={env}>
              <path d={area(1, cp)} fill={C.work} opacity={0.35} />
              <path d={area(-1, cp)} fill={C.work} opacity={0.35} />
              <path d={hump(1, 1)} fill="none" stroke={C.force} strokeOpacity={0.25} strokeWidth={2} strokeDasharray="5 6" />
              <path d={hump(-1, 1)} fill="none" stroke={C.force} strokeOpacity={0.25} strokeWidth={2} strokeDasharray="5 6" />
              {cp > 0.001 ? <path d={hump(1, cp)} fill="none" stroke={C.force} strokeWidth={4} /> : null}
              {cp > 0.001 ? <path d={hump(-1, cp)} fill="none" stroke={C.force} strokeWidth={4} /> : null}
              <Label x={GX0 - 14} y={GY - 40} size={22} font="serif" italic color={C.force} anchor="end">
                F<TSub>12</TSub>
              </Label>
              <Label x={GX0 - 14} y={GY + 40} size={22} font="serif" italic color={C.force} anchor="end">
                F<TSub>21</TSub>
              </Label>
              <Label x={612} y={GY - 32} size={26} font="mono" color={C.work} weight={600} anchor="start">
                {`J₂ = +${jNow.toFixed(1).replace('.', ',')} N·s`}
              </Label>
              <Label x={612} y={GY + 32} size={26} font="mono" color={C.work} weight={600} anchor="start">
                {`J₁ = −${jNow.toFixed(1).replace('.', ',')} N·s`}
              </Label>
            </g>
          </g>

          {/* panel momentum total */}
          <g opacity={pOn * replayOn}>
            <rect x={1030} y={680} width={760} height={190} rx={18} fill="rgba(10,16,36,0.78)" stroke={C.spr} strokeOpacity={0.5 + 0.4 * totalHi} strokeWidth={2 + 2 * totalHi} />
            <Label x={1050} y={706} size={22} color={C.muted} anchor="start" weight={600} spacing={1}>
              momentum total sistem
            </Label>
            <rect x={MX - 4} y={752} width={MW + 8} height={46} rx={10} fill="none" stroke={C.ink} strokeWidth={2.5} strokeDasharray="10 7" strokeDashoffset={-t * 20} opacity={0.7} />
            <rect x={MX} y={756} width={MW} height={38} rx={7} fill={C.spr} opacity={0.35} />
            <g opacity={env}>
              <rect x={MX} y={756} width={Math.max(0, split - MX)} height={38} rx={7} fill={C.spr} />
              <rect x={split} y={756} width={Math.max(0, MX + MW - split)} height={38} rx={7} fill="#d9b8ff" />
              <line x1={split} y1={750} x2={split} y2={800} stroke="#fff" strokeWidth={2} opacity={0.8} />
              <Label x={(MX + split) / 2} y={830} size={24} font="serif" italic color={C.spr} weight={600} opacity={Math.min(1, (split - MX) / 60)}>
                p<TSub>1</TSub>
              </Label>
              <Label x={(split + MX + MW) / 2} y={830} size={24} font="serif" italic color="#d9b8ff" weight={600} opacity={Math.min(1, (MX + MW - split) / 60)}>
                p<TSub>2</TSub>
              </Label>
            </g>
            <Label x={MX + MW + 26} y={775} size={30} font="mono" color={C.ink} weight={600} anchor="start">
              6 kg·m/s
            </Label>
            <Label x={MX + MW + 26} y={830} size={20} color={C.muted} anchor="start">
              selalu tetap
            </Label>
            <Twinkles x={MX + MW / 2} y={775} rx={MW / 2} ry={30} n={5} color="spr" opacity={totalHi} />
          </g>
        </g>

        {/* ----- montase baris 5 ----- */}
        <Tile cx={292} cy={575} p={tl[0]} title="tabrakan mobil" idx={0} chip="Σp tetap">
          {(() => {
            const tau = tm(0);
            const e = cyc(tau / 4.2) > 0 ? Math.min(1, tau / 0.3) * Math.min(1, (4.2 - tau) / 0.5) : 0;
            const tc = 1.4;
            const sc = 55;
            const xa = tau < tc ? -50 + 2 * sc * (tau - tc) : -50 + 0.5 * sc * (tau - tc);
            const xb = tau < tc ? 50 - 1 * sc * (tau - tc) : 50 + 0.5 * sc * (tau - tc);
            const after = ramp(tau, tc, tc + 0.15);
            const wheelA = (xa / 12) * 57;
            return (
              <g opacity={e}>
                <line x1={-200} y1={40} x2={200} y2={40} stroke={C.muted} strokeWidth={3} />
                {Array.from({length: 9}, (_, i) => (
                  <line key={i} x1={-180 + i * 45} y1={58} x2={-160 + i * 45} y2={58} stroke={C.faint} strokeWidth={3} />
                ))}
                <Car x={xa} y={40} scale={0.42} color={C.cyan} wheel={wheelA} />
                <g transform="scale(-1 1)">
                  <Car x={-xb} y={40} scale={0.42} color={C.gold} wheel={xb * 4} />
                </g>
                <Ripple x={0} y={0} p={ramp(tau, tc, tc + 1.0)} r={80} color="heat" />
                <g opacity={1 - after}>
                  <Arrow x1={xa} y1={-50} x2={xa + 80} y2={-50} color="spr" width={5} pulse={false} />
                  <Arrow x1={xb} y1={-50} x2={xb - 40} y2={-50} color="spr" width={5} pulse={false} />
                </g>
                <g opacity={after}>
                  <Arrow x1={(xa + xb) / 2} y1={-50} x2={(xa + xb) / 2 + 40} y2={-50} color="spr" width={5} pulse={false} />
                </g>
                <Arrow x1={-20} y1={100} x2={20} y2={100} color="spr" width={6} pulse={false} />
                <Label x={-34} y={100} size={20} font="serif" italic color={C.spr} anchor="end">
                  Σp
                </Label>
              </g>
            );
          })()}
        </Tile>
        <Tile cx={732} cy={575} p={tl[1]} title="ledakan" idx={1} chip="Σp = 0, tetap 0">
          {(() => {
            const tau = tm(1);
            const e = Math.min(1, tau / 0.3) * Math.min(1, (4.2 - tau) / 0.5);
            const tb = 1.2;
            const d = Math.max(0, tau - tb) * 46;
            const pre = 1 - ramp(tau, tb - 0.05, tb + 0.1);
            const angs = [-90, 30, 150];
            return (
              <g opacity={e}>
                <g opacity={pre}>
                  <circle cx={0} cy={0} r={24 + 2 * Math.sin(tau * 18) * ramp(tau, 0.4, tb)} fill="#3b466e" stroke={C.kin} strokeWidth={3} />
                  <circle cx={0} cy={0} r={60} fill="url(#soft-kin)" opacity={ramp(tau, 0.3, tb)} />
                </g>
                <Ripple x={0} y={0} p={ramp(tau, tb, tb + 1.0)} r={120} color="kin" />
                {angs.map((a, k) => {
                  const r = (a * Math.PI) / 180;
                  const x = Math.cos(r) * d;
                  const y = Math.sin(r) * d;
                  const op = ramp(tau, tb - 0.02, tb + 0.08);
                  return (
                    <g key={k} opacity={op}>
                      <g transform={`translate(${x} ${y}) rotate(${a + tau * 140})`}>
                        <path d="M-14,-10 L14,-6 L10,12 L-12,8 Z" fill="#4a5585" stroke={C.kin} strokeWidth={2} />
                      </g>
                      <Arrow x1={x} y1={y} x2={x + Math.cos(r) * 52} y2={y + Math.sin(r) * 52} color="spr" width={5} pulse={false} />
                    </g>
                  );
                })}
                {/* panah disambung ujung ke pangkal → tertutup (jumlah nol) */}
                <g opacity={ramp(tau, tb + 0.8, tb + 1.3)} transform="translate(118 92)">
                  {angs.map((a, k) => {
                    const pts: [number, number][] = [
                      [0, 0],
                      [0, 0],
                    ];
                    let x = -18;
                    let y = 14;
                    for (let i = 0; i < k; i++) {
                      x += Math.cos((angs[i] * Math.PI) / 180) * 36;
                      y += Math.sin((angs[i] * Math.PI) / 180) * 36;
                    }
                    pts[0] = [x, y];
                    pts[1] = [x + Math.cos((a * Math.PI) / 180) * 36, y + Math.sin((a * Math.PI) / 180) * 36];
                    return <Arrow key={k} x1={pts[0][0]} y1={pts[0][1]} x2={pts[1][0]} y2={pts[1][1]} color="spr" width={3.5} pulse={false} />;
                  })}
                </g>
              </g>
            );
          })()}
        </Tile>
        <Tile cx={1172} cy={575} p={tl[2]} title="molekul gas" idx={2} chip="Σp tetap (ke tiap arah)">
          {(() => {
            const tau = tm(2);
            const e = Math.min(1, tau / 0.3) * Math.min(1, (4.2 - tau) / 0.5);
            const tc = 1.4;
            const al = (35 * Math.PI) / 180;
            const v = 105;
            const r = 17;
            const ax0 = -2 * r * Math.cos(al);
            const ay0 = -2 * r * Math.sin(al);
            let ax = ax0 + v * (tau - tc);
            let ay = ay0;
            let bx = 0;
            let by = 0;
            if (tau > tc) {
              const dt = tau - tc;
              ax = ax0 + v * Math.sin(al) * Math.sin(al) * dt;
              ay = ay0 - v * Math.sin(al) * Math.cos(al) * dt;
              bx = v * Math.cos(al) * Math.cos(al) * dt;
              by = v * Math.cos(al) * Math.sin(al) * dt;
            }
            const vaX = tau < tc ? v : v * Math.sin(al) ** 2;
            const vaY = tau < tc ? 0 : -v * Math.sin(al) * Math.cos(al);
            const vbX = tau < tc ? 0 : v * Math.cos(al) ** 2;
            const vbY = tau < tc ? 0 : v * Math.cos(al) * Math.sin(al);
            const K = 0.55;
            return (
              <g>
                {Array.from({length: 8}, (_, i) => {
                  const ph = fr(t * (0.08 + rand(i) * 0.06) + rand(i + 3));
                  const x = -190 + 380 * fr(rand(i + 7) + t * 0.05 * (rand(i + 1) - 0.5) * 2);
                  const y = -130 + 250 * ph;
                  return <circle key={i} cx={x} cy={y} r={7} fill={C.pot} opacity={0.22 * cyc(ph)} />;
                })}
                <g opacity={e}>
                  <circle cx={ax} cy={ay} r={r} fill={C.pot} stroke="#cfe6ff" strokeWidth={2} />
                  <circle cx={bx} cy={by} r={r} fill={C.press} stroke="#ffd6ea" strokeWidth={2} />
                  <Ripple x={(ax0 + 0) / 2} y={ay0 / 2} p={ramp(tau, tc, tc + 0.8)} r={60} color="cyan" />
                  <Arrow x1={ax} y1={ay} x2={ax + vaX * K} y2={ay + vaY * K} color="spr" width={4.5} pulse={false} />
                  {tau > tc ? <Arrow x1={bx} y1={by} x2={bx + vbX * K} y2={by + vbY * K} color="spr" width={4.5} pulse={false} opacity={ramp(tau, tc, tc + 0.1)} /> : null}
                </g>
              </g>
            );
          })()}
        </Tile>
        <Tile cx={1612} cy={575} p={tl[3]} title="partikel subatom" idx={3} chip="Σp = 0, tetap 0">
          {(() => {
            const tau = tm(3);
            const e = Math.min(1, tau / 0.3) * Math.min(1, (4.2 - tau) / 0.5);
            const tb = 1.1;
            const dt = Math.max(0, tau - tb);
            const xh = -30 * dt;
            const xl = 90 * dt;
            const on = ramp(tau, tb - 0.02, tb + 0.08);
            return (
              <g>
                {Array.from({length: 14}, (_, i) => {
                  const ph = fr(t * 0.12 + rand(i + 20));
                  return <circle key={i} cx={-180 + 360 * rand(i + 40)} cy={-120 + 240 * rand(i + 60)} r={2 + 3 * ph} fill="none" stroke={C.muted} strokeWidth={1} opacity={0.35 * cyc(ph)} />;
                })}
                <g opacity={e}>
                  <g opacity={1 - on}>
                    <circle cx={0} cy={0} r={10} fill={C.gold} />
                    <circle cx={0} cy={0} r={34} fill="url(#soft-gold)" opacity={0.6 + 0.4 * Math.sin(tau * 9)} />
                  </g>
                  <Ripple x={0} y={0} p={ramp(tau, tb, tb + 0.9)} r={70} color="gold" />
                  <g opacity={on}>
                    {Array.from({length: Math.floor(Math.abs(xh) / 9)}, (_, i) => (
                      <circle key={`h${i}`} cx={-i * 9} cy={0} r={2.6} fill={C.kin} opacity={0.7} />
                    ))}
                    {Array.from({length: Math.floor(xl / 9)}, (_, i) => (
                      <circle key={`l${i}`} cx={i * 9} cy={0} r={2} fill={C.cyan} opacity={0.7} />
                    ))}
                    <Spark x={xh} y={0} r={9} color="kin" />
                    <Spark x={xl} y={0} r={5} color="cyan" />
                    <Arrow x1={xh} y1={-34} x2={xh - 60} y2={-34} color="spr" width={5} pulse={false} />
                    <Arrow x1={xl} y1={34} x2={xl + 60} y2={34} color="spr" width={5} pulse={false} />
                  </g>
                </g>
              </g>
            );
          })()}
        </Tile>
      </Stage>

      {/* kartu rumus: satu per momen */}
      <Formula x={960} y={240} p={k1} accent={C.force} caption="hukum III Newton: aksi = −reaksi">
        <V>F</V>
        <Sub>12</Sub> = −<V>F</V>
        <Sub>21</Sub>
      </Formula>
      <Formula x={960} y={240} p={k2} accent={C.work} caption="Δt sama untuk keduanya">
        <V>J</V>
        <Sub>2</Sub> = <V>F</V>
        <Sub>12</Sub>Δ<V>t</V> = −<V>J</V>
        <Sub>1</Sub>
      </Formula>
      <Formula x={960} y={240} p={k3} accent={C.spr} caption="yang hilang dari benda 1 = yang diterima benda 2">
        Δ<V>p</V>
        <Sub>2</Sub> = −Δ<V>p</V>
        <Sub>1</Sub>
      </Formula>
      <Formula x={960} y={240} p={k4} accent={C.spr} caption="Σp sebelum = Σp sesudah">
        <V>p</V>
        <Sub>1</Sub> + <V>p</V>
        <Sub>2</Sub> = <V>p</V>
        <Sub>1</Sub>′ + <V>p</V>
        <Sub>2</Sub>′
      </Formula>
      <Badge x={1500} y={240} text="HUKUM KEKEKALAN MOMENTUM" color={C.spr} opacity={badge} scale={0.9 + 0.1 * badge} size={28} />
    </AbsoluteFill>
  );
};
