import React from 'react';
import {AbsoluteFill} from 'remotion';
import {BACK, EASE_IN_OUT, cyc, mix, ramp, rand} from '../anim';
import {EnergyBars, HeatShimmer} from '../components/physics';
import {Arrow, Formula, Frac, Glow, Label, Motes, Part, Ripple, Sqrt, Stage, TSub, Twinkles, V} from '../components/primitives';
import {useScene} from '../SceneContext';
import {C, FONT} from '../theme';

// Bandul balistik — dua hukum kekekalan, dipakai berurutan.
//  Skala: 800 px per meter (L = 0,5 m → 400 px; h = 5 cm → 40 px). Ayunan digerak-lambatkan 3,5×.
//  Peluru 0,010 kg × 201 m/s = 2,01 kg·m/s → balok + peluru 2,01 kg × 1,0 m/s = 2,01 kg·m/s (panah ungu sama panjang).
//  K: ½·0,010·201² ≈ 202 J → ½·2,01·1² ≈ 1,0 J (≈ 201 J jadi panas & bunyi saat peluru tertanam).
//  Tahap 2: ½(m+M)v′² = (m+M)gh → v′ = √(2·10·0,05) = 1,0 m/s. Tahap 1: v = (2,01/0,010)·1,0 = 201 m/s.

const PXM = 800;
const LPX = 400; // panjang tali (px)
const SLOW = 3.5;
const TV = 2 * Math.PI * Math.sqrt(0.5 / 10) * SLOW; // periode ayunan visual
const THMAX = Math.acos(1 - 0.05 / 0.5); // 25,8°
const PIV_Y = 200;
const P1X = 660;
const P2X = 780;
const BW = 160;
const BH = 100;
const BX = 720; // pusat balok saat diam
const BY = PIV_Y + LPX + BH / 2; // 650
const MUZZLE = 380;
const KP = 80; // px per kg·m/s
const M_TOT = 2.01;
const E_TOT = 0.5 * M_TOT * 1 * 1; // 1,005 J
const FLOOR = 840;

const cl = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const com = (s: string) => s.replace('.', ',');

/** Balok kayu dengan serat. (x, y) = pusat. */
const Block: React.FC<{x: number; y: number; t: number; hole: number; heat: number}> = ({x, y, hole, heat}) => (
  <g transform={`translate(${x.toFixed(1)} ${y.toFixed(1)})`}>
    <ellipse cx={0} cy={BH / 2 + 8} rx={BW * 0.55} ry={7} fill="#000" opacity={0.25} />
    <rect x={-BW / 2} y={-BH / 2} width={BW} height={BH} rx={8} fill="#6e4a32" stroke="#c99a6b" strokeWidth={3} />
    {[-28, -6, 18, 36].map((dy, i) => (
      <path key={i} d={`M${-BW / 2 + 8},${dy} q40,${-8 + i * 4} 76,0 t68,${2 - i}`} fill="none" stroke="#a0704a" strokeWidth={2} opacity={0.6} />
    ))}
    <ellipse cx={-BW / 2 + 52} cy={-10} rx={10} ry={6} fill="none" stroke="#a0704a" strokeWidth={2} opacity={0.6} />
    <rect x={-BW / 2 + 6} y={-BH / 2 + 6} width={BW - 12} height={8} rx={4} fill="#fff" opacity={0.08} />
    {[-60, 60].map((hx) => (
      <circle key={hx} cx={hx} cy={-BH / 2} r={6} fill="#c9d2ee" />
    ))}
    {hole > 0.01 ? (
      <g opacity={hole}>
        <ellipse cx={-BW / 2 + 2} cy={0} rx={4} ry={7} fill="#1a0f08" />
        {/* peluru di dalam balok (tampak tembus) */}
        <rect x={-BW / 2 + 18} y={-5} width={26} height={10} rx={5} fill="none" stroke={C.gold} strokeWidth={2} strokeDasharray="4 3" />
        <circle cx={-BW / 2 + 30} cy={0} r={22} fill="url(#soft-heat)" opacity={heat} />
      </g>
    ) : null}
  </g>
);

/** Senapan di dudukan. */
const Gun: React.FC<{t: number; flash: number}> = ({t, flash}) => (
  <g>
    <line x1={250} y1={704} x2={250} y2={FLOOR} stroke="#5b6a9e" strokeWidth={10} />
    <rect x={190} y={FLOOR - 12} width={120} height={12} rx={4} fill="#5b6a9e" />
    <rect x={226} y={690} width={48} height={22} rx={5} fill="#3a4a7a" stroke="#8fa0d0" strokeWidth={2} />
    <path d="M118,668 L150,642 L260,640 L268,664 L246,700 L196,700 L182,680 L126,694 Z" fill="#2a3358" stroke="#8fa0d0" strokeWidth={3} strokeLinejoin="round" />
    <rect x={250} y={641} width={MUZZLE - 250} height={18} rx={4} fill="#3a4a7a" stroke="#8fa0d0" strokeWidth={2.5} />
    <rect x={200} y={618} width={90} height={16} rx={8} fill="#26305a" stroke="#8fa0d0" strokeWidth={2} />
    <line x1={222} y1={634} x2={222} y2={641} stroke="#8fa0d0" strokeWidth={3} />
    <line x1={268} y1={634} x2={268} y2={641} stroke="#8fa0d0" strokeWidth={3} />
    {/* sinar bidik */}
    <line x1={MUZZLE + 4} y1={650} x2={BX - BW / 2 - 4} y2={650} stroke={C.heat} strokeWidth={2} strokeDasharray="3 9" strokeDashoffset={-t * 30} opacity={0.35 * (1 - flash)} />
    {flash > 0.001 ? (
      <g opacity={flash}>
        <circle cx={MUZZLE + 14} cy={650} r={60} fill="url(#soft-gold)" />
        <path d={`M${MUZZLE},650 l26,-16 l-6,14 l34,2 l-34,4 l6,14 Z`} fill="#fff2c4" />
      </g>
    ) : null}
  </g>
);

/** Kronograf elektronik (dicoret): dua gerbang cahaya + layar. */
const Chrono: React.FC<{x: number; y: number; t: number; op: number; cross: number}> = ({x, y, t, op, cross}) => {
  if (op <= 0.001) return null;
  return (
    <g opacity={op}>
      <rect x={x - 170} y={y - 70} width={340} height={140} rx={16} fill="rgba(10,16,36,0.72)" stroke={C.line} strokeWidth={2} />
      {[-110, 10].map((gx) => (
        <g key={gx}>
          <path d={`M${x + gx},${y + 30} l0,-60 l50,0 l0,60`} fill="none" stroke="#8fa0d0" strokeWidth={5} strokeLinejoin="round" />
          <line x1={x + gx + 6} y1={y - 22} x2={x + gx + 44} y2={y - 22} stroke={C.heat} strokeWidth={2} opacity={0.5 + 0.4 * Math.sin(t * 5 + gx)} />
        </g>
      ))}
      <rect x={x + 82} y={y - 30} width={74} height={44} rx={6} fill="#0b1022" stroke="#5b6a9e" strokeWidth={2} />
      <text x={x + 119} y={y - 8} textAnchor="middle" dominantBaseline="central" fontFamily={FONT.mono} fontSize={20} fill={C.work} opacity={0.6 + 0.4 * Math.sin(t * 3)}>
        ----
      </text>
      <Label x={x} y={y + 50} size={20} color={C.muted}>
        kronograf elektronik
      </Label>
      <path d={`M${x - 150},${y - 56} L${x - 150 + 300 * cross},${y - 56 + 112 * cross}`} stroke={C.heat} strokeWidth={6} strokeLinecap="round" opacity={0.9} />
    </g>
  );
};

export const Ballistic: React.FC = () => {
  const {t, cue, wordOf} = useScene();
  const appear = ramp(t, -0.4, 0.8, EASE_IN_OUT);

  /* ---------- waktu ---------- */
  const tHit = Math.max(cue(1) + 2.4, wordOf(1, 'tertanam') - 0.1);
  const tFire = Math.max(wordOf(1, 'ditembakkan'), tHit - 2.2);
  const flight = tHit - tFire;
  const slowFlight = flight / (((BX - BW / 2 - MUZZLE) / PXM) / 201); // faktor gerak lambat saat peluru terbang
  const tau = t - tHit;
  const ph = tau > 0 ? (2 * Math.PI * tau) / TV : 0;
  const sway = tau > 0 ? 0 : 0.6 * Math.sin(t * 1.3) * (1 - ramp(t, tFire - 1.5, tFire - 0.3));
  const th = tau > 0 ? THMAX * Math.sin(ph) : (sway * Math.PI) / 180;
  const vPhys = tau > 0 ? Math.cos(ph) : 0; // m/s (1,0 m/s di titik terendah)
  const bx = BX + LPX * Math.sin(th);
  const by = BY - LPX * (1 - Math.cos(th));
  const hPhys = 0.5 * (1 - Math.cos(th));
  const Ug = M_TOT * 10 * hPhys;
  const K = tau > 0 ? Math.max(0, E_TOT - Ug) : 0;

  // peluru
  const bulletX = t < tFire ? MUZZLE - 22 : t < tHit ? mix(MUZZLE - 22, BX - BW / 2 - 13, (t - tFire) / flight) : BX - BW / 2 - 13;
  const bulletOp = ramp(t, wordOf(1, 'Peluru') - 0.3, wordOf(1, 'Peluru') + 0.3) * (1 - ramp(t, tHit, tHit + 0.06));
  const flash = tFire < t ? Math.max(0, 1 - (t - tFire) * 4) : 0;
  const pBulletOp = ramp(t, tFire, tFire + 0.3) * (1 - ramp(t, tHit, tHit + 0.3));
  const pBlockOp = ramp(t, tHit, tHit + 0.3);
  const hole = ramp(t, tHit, tHit + 0.1);
  const heat = ramp(t, tHit, tHit + 0.2) * (1 - 0.7 * ramp(t, tHit + 0.5, tHit + 5));

  // label & kartu
  const lblM = ramp(t, wordOf(1, 'sepuluh') - 0.2, wordOf(1, 'sepuluh') + 0.5);
  const lblMM = ramp(t, wordOf(1, 'dua') - 0.2, wordOf(1, 'dua') + 0.5);
  const lblBandul = ramp(t, wordOf(0, 'bandul') - 0.2, wordOf(0, 'bandul') + 0.6, BACK);
  const tLima = wordOf(2, 'lima');
  const hLbl = ramp(t, tLima - 0.3, tLima + 0.5);
  const hOut = 1 - ramp(t, cue(4) - 0.4, cue(4) + 0.2, EASE_IN_OUT);
  const ghost = ramp(t, cue(2) + 0.2, cue(2) + 1.0);
  const qCard = ramp(t, 0.4, 1.2) * (1 - ramp(t, tHit - 0.2, tHit + 0.3, EASE_IN_OUT));
  const chrono = ramp(t, wordOf(0, 'tanpa') - 0.3, wordOf(0, 'tanpa') + 0.4) * (1 - ramp(t, tHit - 0.4, tHit + 0.1, EASE_IN_OUT));
  const cross = ramp(t, wordOf(0, 'elektronik') - 0.1, wordOf(0, 'elektronik') + 0.5);
  const panel = ramp(t, tHit + 0.3, tHit + 1.0) * (1 - ramp(t, cue(3) - 0.6, cue(3) - 0.1, EASE_IN_OUT));
  const heatBar = ramp(t, tHit + 0.5, tHit + 1.5);
  const bars = ramp(t, cue(2) - 0.2, cue(2) + 0.5) * (1 - ramp(t, cue(4) - 0.4, cue(4) + 0.1, EASE_IN_OUT));
  const f2 = ramp(t, cue(3) - 0.1, cue(3) + 0.6) * (1 - ramp(t, cue(4) - 0.5, cue(4) - 0.05, EASE_IN_OUT));
  const f2b = ramp(t, wordOf(3, 'yaitu') - 0.2, wordOf(3, 'yaitu') + 0.5);
  const f1 = ramp(t, cue(4) - 0.05, cue(4) + 0.6) * (1 - ramp(t, cue(5) - 0.5, cue(5) - 0.05, EASE_IN_OUT));
  const f1b = ramp(t, wordOf(4, 'dikali') - 0.2, wordOf(4, 'dikali') + 0.5);
  const fr = ramp(t, cue(5) - 0.05, cue(5) + 0.7, BACK);
  const tDua = wordOf(5, 'dua', 1);
  const mom = ramp(t, cue(4) + 0.2, cue(4) + 0.9) * (1 - ramp(t, tDua - 0.5, tDua, EASE_IN_OUT));
  const chips = ramp(t, tDua - 0.1, tDua + 0.6);
  const stage2 = ramp(t, cue(3), cue(3) + 0.8) * (1 - ramp(t, cue(4) - 0.4, cue(4) + 0.2));
  const stage1 = ramp(t, cue(4), cue(4) + 0.8) * (1 - ramp(t, cue(5) - 0.4, cue(5) + 0.2));
  const both = chips;
  const slowA = ramp(t, tFire - 0.3, tFire + 0.2) * (1 - ramp(t, tHit + 0.1, tHit + 0.4, EASE_IN_OUT));
  const slowB = ramp(t, tHit + 0.45, tHit + 0.85);

  // tali & lintasan
  const dx = LPX * Math.sin(th);
  const dy = LPX * Math.cos(th);
  const arcD = (() => {
    let d = '';
    for (let i = 0; i <= 40; i++) {
      const a = -THMAX * 1.05 + (2.1 * THMAX * i) / 40;
      const x = BX + LPX * Math.sin(a);
      const y = BY - LPX * (1 - Math.cos(a));
      d += `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`;
    }
    return d;
  })();
  const gx = BX + LPX * Math.sin(THMAX);
  const gy = BY - LPX * (1 - Math.cos(THMAX));
  const trail: [number, number][] = tau > 0.05 ? [1, 2, 3, 4, 5, 6].map((k) => {
    const a = THMAX * Math.sin((2 * Math.PI * Math.max(0, tau - k * 0.07)) / TV);
    return [BX + LPX * Math.sin(a), BY - LPX * (1 - Math.cos(a))];
  }) : [];

  // panah momentum balok (searah kecepatan, menyinggung busur)
  const pBlock = M_TOT * vPhys;
  const dir = Math.sign(pBlock);
  const ax = bx;
  const ay = by - BH / 2 - 34;
  const pL = KP * Math.abs(pBlock);
  const tx = Math.cos(th) * dir;
  const ty = -Math.sin(th) * dir;

  return (
    <AbsoluteFill>
      <Stage>
        <g opacity={appear}>
          <Motes x={720} y={480} rx={460} ry={260} n={26} color="gold" opacity={0.35} seed={4} />
          <Glow x={bx} y={by} r={260} color="kin" opacity={0.25 + 0.25 * heat} />
          {/* rangka */}
          <line x1={500} y1={PIV_Y - 10} x2={500} y2={FLOOR} stroke="#3a4a7a" strokeWidth={10} opacity={0.7} />
          <line x1={1020} y1={PIV_Y - 10} x2={1020} y2={FLOOR} stroke="#3a4a7a" strokeWidth={10} opacity={0.7} />
          <rect x={480} y={PIV_Y - 26} width={560} height={22} rx={6} fill="#26305a" stroke="#8fa0d0" strokeWidth={3} />
          {Array.from({length: 14}, (_, k) => (
            <line key={k} x1={492 + k * 40} y1={PIV_Y - 22} x2={510 + k * 40} y2={PIV_Y - 8} stroke="#3a4a7a" strokeWidth={2} />
          ))}
          <rect x={100} y={FLOOR} width={1000} height={34} fill="url(#ground)" />
          <line x1={100} y1={FLOOR} x2={1100} y2={FLOOR} stroke="#3a4a7a" strokeWidth={3} />
          {/* lintasan busur & bayangan puncak */}
          <path d={arcD} fill="none" stroke={C.pot} strokeWidth={2.5} strokeDasharray="6 9" strokeDashoffset={-t * 20} opacity={0.35 + 0.4 * stage2} />
          <path d={arcD} fill="none" stroke={C.pot} strokeOpacity={0.25 * stage2} strokeWidth={22} />
          <g opacity={ghost * 0.6}>
            <rect x={gx - BW / 2} y={gy - BH / 2} width={BW} height={BH} rx={8} fill="none" stroke={C.pot} strokeWidth={2.5} strokeDasharray="8 7" strokeDashoffset={-t * 16} />
            <line x1={P1X} y1={PIV_Y} x2={P1X + LPX * Math.sin(THMAX)} y2={PIV_Y + LPX * Math.cos(THMAX)} stroke={C.pot} strokeWidth={1.5} strokeDasharray="5 7" />
            <line x1={P2X} y1={PIV_Y} x2={P2X + LPX * Math.sin(THMAX)} y2={PIV_Y + LPX * Math.cos(THMAX)} stroke={C.pot} strokeWidth={1.5} strokeDasharray="5 7" />
          </g>
          {/* tinggi h */}
          <g opacity={hLbl * hOut}>
            <line x1={BX + BW / 2 + 10} y1={BY + BH / 2} x2={1080} y2={BY + BH / 2} stroke={C.muted} strokeWidth={2} strokeDasharray="6 6" />
            <line x1={gx + BW / 2 + 6} y1={gy + BH / 2} x2={1080} y2={gy + BH / 2} stroke={C.pot} strokeWidth={2} strokeDasharray="6 6" />
            <line x1={1066} y1={gy + BH / 2} x2={1066} y2={BY + BH / 2} stroke={C.pot} strokeWidth={3} markerStart="url(#arrow-pot)" markerEnd="url(#arrow-pot)" />
            <Label x={1086} y={(gy + BY) / 2 + BH / 2} size={28} color={C.pot} anchor="start" weight={700}>
              h = 5 cm
            </Label>
          </g>
          {/* mistar */}
          {Array.from({length: 11}, (_, k) => (
            <line key={k} x1={1040} y1={BY + BH / 2 - k * 8} x2={k % 5 === 0 ? 1056 : 1050} y2={BY + BH / 2 - k * 8} stroke={C.muted} strokeWidth={2} opacity={0.6 * hLbl * hOut} />
          ))}
          <Gun t={t} flash={flash} />
          {/* tali (jajar genjang: balok tetap datar) */}
          <line x1={P1X} y1={PIV_Y} x2={P1X + dx} y2={PIV_Y + dy} stroke="#c9d2ee" strokeWidth={3} />
          <line x1={P2X} y1={PIV_Y} x2={P2X + dx} y2={PIV_Y + dy} stroke="#c9d2ee" strokeWidth={3} />
          <circle cx={P1X} cy={PIV_Y} r={7} fill="#8fa0d0" />
          <circle cx={P2X} cy={PIV_Y} r={7} fill="#8fa0d0" />
          {trail.map(([x, y], i) => (
            <rect key={i} x={x - BW / 2} y={y - BH / 2} width={BW} height={BH} rx={8} fill="none" stroke="#c99a6b" strokeWidth={2} opacity={0.12 * (1 - i / 6) * Math.min(1, Math.abs(vPhys) * 2)} />
          ))}
          <Block x={bx} y={by} t={t} hole={hole} heat={heat} />
          <HeatShimmer x1={bx - BW / 2} x2={bx - BW / 2 + 70} y={by - BH / 2} t={t} amount={heat * 0.9} />
          {/* peluru */}
          {bulletOp > 0.001 ? (
            <g opacity={bulletOp}>
              {t > tFire
                ? [1, 2, 3, 4].map((k) => <line key={k} x1={bulletX - 8 * k * 4} y1={650} x2={bulletX - 8 * k * 4 - 22} y2={650} stroke={C.gold} strokeWidth={4 - k * 0.6} strokeLinecap="round" opacity={0.5 - k * 0.1} />)
                : null}
              <path d={`M${bulletX},644 L${bulletX + 18},644 Q${bulletX + 30},650 ${bulletX + 18},656 L${bulletX},656 Z`} fill={C.gold} stroke="#fff2c4" strokeWidth={1.5} />
              <line x1={bulletX + 4} y1={644} x2={bulletX + 4} y2={656} stroke="#8a6a2a" strokeWidth={2} />
              {t > tFire ? <path d={`M${bulletX + 34},636 q8,14 0,28 M${bulletX + 44},630 q12,20 0,40`} fill="none" stroke="#cfeaff" strokeWidth={2} opacity={0.35} /> : null}
            </g>
          ) : null}
          {/* panah momentum */}
          {pBulletOp > 0.001 ? (
            <g opacity={pBulletOp}>
              <Arrow x1={bulletX} y1={606} x2={bulletX + KP * 2.01} y2={606} color="spr" width={6} />
              <Label x={bulletX + KP * 1.0} y={578} size={24} color={C.spr} font="serif" italic>
                p = 2,01 kg·m/s
              </Label>
            </g>
          ) : null}
          {pBlockOp > 0.001 && pL > 4 ? <Arrow x1={ax} y1={ay} x2={ax + tx * pL} y2={ay + ty * pL} color="spr" width={6} opacity={pBlockOp} /> : null}
          <Label x={ax + tx * pL + tx * 22} y={ay + ty * pL - 22} size={26} color={C.spr} font="serif" italic opacity={pBlockOp * cl(pL / 40)}>
            p
          </Label>
          <Ripple x={BX - BW / 2} y={650} p={tau / 1.1} r={150} color="heat" rings={3} />
          {/* serpihan kayu */}
          {tau > 0 && tau < 1.5
            ? Array.from({length: 9}, (_, k) => {
                const a = Math.PI * (0.7 + 0.6 * rand(k));
                const sp = 120 + 140 * rand(k * 2);
                const x = BX - BW / 2 + Math.cos(a) * sp * tau;
                const y = 650 - Math.sin(a) * sp * tau * 0.6 + 300 * tau * tau;
                return <rect key={k} x={x - 4} y={y - 1.5} width={8} height={3} fill="#c99a6b" opacity={1 - tau / 1.5} transform={`rotate(${(tau * 500 + k * 60) % 360} ${x} ${y})`} />;
              })
            : null}
          {/* label benda */}
          <Label x={MUZZLE - 6} y={696} size={24} color={C.gold} weight={600} opacity={lblM * (1 - ramp(t, tFire - 0.1, tFire + 0.3))}>
            m = 10 g
          </Label>
          <Label x={bx} y={by + 4} size={26} color="#fff2e0" weight={700} opacity={lblMM}>
            M = 2 kg
          </Label>
          <Label x={760} y={784} size={34} color={C.gold} weight={700} opacity={lblBandul}>
            bandul balistik
          </Label>
          {/* penanda tahap pada alat */}
          <g opacity={Math.max(stage1, both)}>
            <circle cx={BX - BW / 2 - 40} cy={560} r={20} fill="rgba(10,16,36,0.9)" stroke={C.spr} strokeWidth={3} />
            <Label x={BX - BW / 2 - 40} y={560} size={22} color={C.spr} weight={700}>
              1
            </Label>
            <Glow x={BX - BW / 2} y={650} r={90} color="spr" opacity={0.6 * stage1} />
          </g>
          <g opacity={Math.max(stage2, both)}>
            <circle cx={985} cy={500} r={20} fill="rgba(10,16,36,0.9)" stroke={C.pot} strokeWidth={3} />
            <Label x={985} y={500} size={22} color={C.pot} weight={700}>
              2
            </Label>
          </g>
        </g>

        {/* data diketahui (kiri atas) */}
        <g opacity={ramp(t, wordOf(1, 'Peluru') - 0.4, wordOf(1, 'Peluru') + 0.4)}>
          <rect x={90} y={200} width={330} height={190} rx={16} fill="rgba(10,16,36,0.72)" stroke={C.line} strokeWidth={2} />
          <Label x={112} y={228} size={20} color={C.muted} anchor="start" weight={600} spacing={2}>
            DIKETAHUI
          </Label>
          <Label x={112} y={268} size={24} color={C.gold} anchor="start" font="mono" opacity={lblM}>
            m = 0,010 kg
          </Label>
          <Label x={112} y={304} size={24} color="#e8c9a8" anchor="start" font="mono" opacity={lblMM}>
            M = 2,00 kg
          </Label>
          <Label x={112} y={340} size={24} color={C.pot} anchor="start" font="mono" opacity={hLbl}>
            h = 0,05 m
          </Label>
          <Label x={112} y={374} size={22} color={C.muted} anchor="start" font="mono" opacity={hLbl}>
            g = 10 m/s²
          </Label>
        </g>

        <Chrono x={1475} y={700} t={t} op={chrono} cross={cross} />

        {/* panel: saat tumbukan */}
        {panel > 0.001 ? (
          <g opacity={panel}>
            <rect x={1130} y={196} width={700} height={344} rx={18} fill="rgba(10,16,36,0.78)" stroke={C.line} strokeWidth={2} />
            <Label x={1156} y={226} size={20} color={C.muted} anchor="start" weight={600} spacing={2}>
              SAAT PELURU TERTANAM
            </Label>
            <Label x={1156} y={266} size={26} color={C.spr} anchor="start" weight={600}>
              momentum
            </Label>
            {[0, 1].map((r) => (
              <g key={r}>
                <Label x={1156} y={302 + r * 36} size={20} color={C.muted} anchor="start">
                  {r ? 'sesudah' : 'sebelum'}
                </Label>
                <rect x={1270} y={294 + r * 36} width={KP * 2.01 * ramp(t, tHit + 0.5 + r * 0.2, tHit + 1.1 + r * 0.2)} height={16} rx={5} fill={C.spr} opacity={0.9} />
                <Label x={1450} y={302 + r * 36} size={20} color={C.spr} anchor="start" font="mono">
                  2,01 kg·m/s
                </Label>
              </g>
            ))}
            <Label x={1806} y={320} size={24} color={C.work} anchor="end" weight={700}>
              tetap ✓
            </Label>
            <Label x={1156} y={392} size={26} color={C.kin} anchor="start" weight={600}>
              energi kinetik
            </Label>
            <Label x={1156} y={428} size={20} color={C.muted} anchor="start">
              sebelum
            </Label>
            <rect x={1270} y={420} width={420 * ramp(t, tHit + 0.6, tHit + 1.3)} height={16} rx={5} fill={C.kin} />
            <Label x={1700} y={428} size={20} color={C.kin} anchor="start" font="mono">
              202 J
            </Label>
            <Label x={1156} y={464} size={20} color={C.muted} anchor="start">
              sesudah
            </Label>
            <rect x={1270} y={456} width={3} height={16} fill={C.kin} />
            <rect x={1274} y={456} width={416 * heatBar} height={16} rx={5} fill={C.heat} opacity={0.75} />
            {Array.from({length: 5}, (_, k) => {
              const q = (((t * 0.5 + k / 5) % 1) + 1) % 1;
              return <circle key={k} cx={1290 + q * 390 * heatBar} cy={464 + 3 * Math.sin(t * 4 + k)} r={2.5} fill="#ffd0d6" opacity={cyc(q) * heatBar} />;
            })}
            <Label x={1480} y={464} size={18} color="#fff" weight={600} opacity={heatBar}>
              ≈ 201 J → panas & bunyi
            </Label>
            <Label x={1700} y={464} size={20} color={C.kin} anchor="start" font="mono">
              K ≈ 1 J
            </Label>
            <Label x={1480} y={512} size={22} color={C.ink} opacity={heatBar}>
              energi kinetik tidak kekal — momentum yang terbawa utuh
            </Label>
          </g>
        ) : null}

        {/* batang energi saat berayun */}
        <EnergyBars
          x={1340}
          y={800}
          bars={[
            {key: 'K', label: 'K', value: K, color: 'kin'},
            {key: 'U', label: (<>U<TSub>g</TSub></>), value: Ug, color: 'pot'},
          ]}
          max={1.25}
          height={170}
          barW={70}
          gap={34}
          opacity={bars}
          showValues={false}
          unit=""
          title="ENERGI SAAT BERAYUN"
        />
        <Label x={1486} y={866} size={20} color={C.muted} font="mono" opacity={bars}>
          satuan J · total ≈ 1,0 J
        </Label>

        {/* perbandingan momentum (baris 4) */}
        {mom > 0.001 ? (
          <g opacity={mom}>
            <rect x={1130} y={606} width={700} height={250} rx={18} fill="rgba(10,16,36,0.78)" stroke={C.line} strokeWidth={2} />
            <Label x={1156} y={636} size={20} color={C.muted} anchor="start" weight={600} spacing={2}>
              Σp SEBELUM = Σp SESUDAH
            </Label>
            <Label x={1156} y={680} size={22} color={C.ink} anchor="start">
              peluru: m·v
            </Label>
            <Arrow x1={1160} y1={716} x2={1160 + KP * 2.01 * ramp(t, cue(4) + 0.5, cue(4) + 1.2)} y2={716} color="spr" width={7} />
            <Label x={1360} y={716} size={20} color={C.muted} anchor="start" font="mono">
              0,010 kg × 201 m/s = 2,01
            </Label>
            <Label x={1156} y={770} size={22} color={C.ink} anchor="start">
              balok + peluru: (m + M)·v′
            </Label>
            <Arrow x1={1160} y1={806} x2={1160 + KP * 2.01 * ramp(t, cue(4) + 0.8, cue(4) + 1.5)} y2={806} color="spr" width={7} />
            <Label x={1360} y={806} size={20} color={C.muted} anchor="start" font="mono">
              2,01 kg × 1,0 m/s = 2,01
            </Label>
          </g>
        ) : null}

        <g opacity={fr}>
          <Glow x={1475} y={380} r={300} color="gold" opacity={0.5} />
          <Twinkles x={1475} y={380} rx={300} ry={110} n={7} color="gold" seed={5} />
        </g>
        <g opacity={slowA}>
          <circle cx={104} cy={868} r={8} fill={C.heat} opacity={0.5 + 0.5 * Math.sin(t * 4)} />
          <Label x={122} y={868} size={22} color={C.muted} anchor="start" font="mono">
            {`gerak lambat ≈ ${com(String(Math.round(slowFlight / 100) * 100)).replace(/\B(?=(\d{3})+(?!\d))/g, '.')}×`}
          </Label>
        </g>
        <g opacity={slowB}>
          <circle cx={104} cy={868} r={8} fill={C.pot} opacity={0.5 + 0.5 * Math.sin(t * 4)} />
          <Label x={122} y={868} size={22} color={C.muted} anchor="start" font="mono">
            gerak lambat 3,5×
          </Label>
        </g>
      </Stage>

      {/* kartu */}
      <Formula x={1475} y={420} p={qCard} accent={C.gold} size={64} caption="kecepatan peluru — tanpa alat elektronik?">
        <V color={C.cyan}>v</V> = ?
      </Formula>
      <Formula x={1475} y={385} p={f2} accent={C.pot} size={56} caption="tahap 2 · kekekalan energi (saat berayun)">
        <div>
          <V color={C.cyan}>v′</V> = <Sqrt>2<V>gh</V></Sqrt>
        </div>
        <div style={{fontSize: 48}}>
          <Part p={f2b}>
            = <Sqrt>2 · 10 · 0,05</Sqrt> = <span style={{color: C.cyan}}>1,0 m/s</span>
          </Part>
        </div>
      </Formula>
      <Formula x={1475} y={385} p={f1} accent={C.spr} size={56} caption="tahap 1 · kekekalan momentum (saat tumbukan)">
        <div>
          <V color={C.cyan}>v</V> = <Frac n={<span><V>m</V> + <V>M</V></span>} d={<V>m</V>} /> · <V color={C.cyan}>v′</V>
        </div>
        <div style={{fontSize: 48}}>
          <Part p={f1b}>
            = <Frac n="2,01 kg" d="0,010 kg" /> · 1,0 m/s
          </Part>
        </div>
      </Formula>
      <Formula x={1475} y={380} p={fr} accent={C.gold} size={76} caption="kecepatan peluru">
        <V color={C.cyan}>v</V> = <span style={{color: C.gold}}>201 m/s</span>
      </Formula>
      {/* dua tahap berurutan */}
      {chips > 0.001
        ? [
            {n: '1', c: C.spr, a: 'kekekalan momentum', b: 'saat peluru tertanam', y: 680},
            {n: '2', c: C.pot, a: 'kekekalan energi', b: 'saat balok berayun', y: 800},
          ].map((r, i) => {
            const o = ramp(t, tDua - 0.1 + i * 0.35, tDua + 0.6 + i * 0.35);
            return (
              <div
                key={r.n}
                style={{
                  position: 'absolute',
                  left: 1475,
                  top: r.y,
                  transform: `translate(-50%, -50%) scale(${0.94 + 0.06 * o})`,
                  opacity: o,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 18,
                  padding: '12px 26px',
                  borderRadius: 999,
                  background: 'rgba(10,16,36,0.9)',
                  border: `2px solid ${r.c}`,
                  boxShadow: `0 0 ${18 + 8 * Math.sin(t * 2 + i)}px ${r.c}55`,
                  whiteSpace: 'nowrap',
                }}
              >
                <span style={{fontFamily: FONT.mono, fontWeight: 600, fontSize: 26, color: r.c, border: `2px solid ${r.c}`, borderRadius: 999, width: 40, height: 40, display: 'inline-flex', alignItems: 'center', justifyContent: 'center'}}>{r.n}</span>
                <span style={{fontFamily: FONT.head, fontSize: 30, fontWeight: 600, color: C.ink}}>{r.a}</span>
                <span style={{fontFamily: FONT.sans, fontSize: 22, color: C.muted}}>{r.b}</span>
              </div>
            );
          })
        : null}
      {chips > 0.001 ? (
        <div style={{position: 'absolute', left: 1475, top: 740, transform: 'translate(-50%, -50%)', fontSize: 30, color: C.muted, opacity: ramp(t, tDua + 0.3, tDua + 0.8), translate: `0px ${3 * Math.sin(t * 3)}px`}}>↓</div>
      ) : null}
    </AbsoluteFill>
  );
};

