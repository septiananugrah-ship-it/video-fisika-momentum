import React from 'react';
import {AbsoluteFill, interpolateColors} from 'remotion';
import {EASE_IN_OUT, cyc, ramp, rand} from '../anim';
import {Arrow, Formula, Frac, Glow, Label, Motes, Note, Part, Ripple, Stage, Sub, Twinkles, V} from '../components/primitives';
import {useScene} from '../SceneContext';
import {C, FONT} from '../theme';

// Roket di ruang hampa (kerangka acuan ikut roket):
//  baris 1: ruang hampa — roket mendorong gas buangnya sendiri (partikel gas keluar dari nosel).
//  baris 2: paket gas Δm keluar dengan Δp ke belakang; roket mendapat Δp sama besar ke depan (panah ungu sama panjang).
//  baris 3–4: F = u·Δm/Δt = 3000 m/s × 100 kg/s = 300 000 N (panah gaya kuning).
//  baris 5: bahan bakar habis perlahan, M turun, a = F/M naik; bintang makin cepat lewat.
// Contoh misi (hanya untuk penunjuk): M awal 30 t, bahan bakar 20 t, ṁ = 100 kg/s, u = 3000 m/s;
// kecepatan v = u ln(M₀/M) (Tsiolkovsky) dan jarak x(τ) analitik → geser bintang tanpa loncatan.

const RY = 470; // sumbu roket
const NOZ = 520; // ujung nosel
const U_VIS = 300; // px/dtk partikel gas (gerak lambat)
const M0 = 30000;
const MDOT = 100;
const U = 3000;
const F = U * MDOT; // 300 000 N
const FUEL = 20000;

const cl = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const fmtNum = (v: number, d = 0) => {
  const [i, f] = v.toFixed(d).split('.');
  return i.replace(/\B(?=(\d{3})+(?!\d))/g, '.') + (f ? ',' + f : '');
};
const xOf = (tau: number) => {
  const M = M0 - MDOT * tau;
  return U * (tau + (M / MDOT) * Math.log(M / M0));
};

/** Roket tampak samping dengan jendela tangki (bahan bakar mengendap ke belakang karena percepatan). */
const RocketBody: React.FC<{y: number; t: number; fuel: number; tankHi: number}> = ({y, t, fuel, tankHi}) => {
  const fx = 640 + 280 * fuel;
  const slosh = Array.from({length: 9}, (_, k) => {
    const yy = y - 38 + (76 * k) / 8;
    const xx = fx + 4 * Math.sin(t * 3 + k * 0.9) * Math.sin(t * 1.3);
    return `${k ? 'L' : 'M'}${xx.toFixed(1)},${yy.toFixed(1)}`;
  }).join(' ');
  return (
    <g>
      <defs>
        <linearGradient id="rk-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#eef3ff" />
          <stop offset="45%" stopColor="#b9c4e6" />
          <stop offset="100%" stopColor="#5b6a9e" />
        </linearGradient>
        <clipPath id="rk-tank">
          <rect x={640} y={y - 40} width={280} height={80} rx={14} />
        </clipPath>
      </defs>
      {/* sirip */}
      <path d={`M560,${y - 60} L640,${y - 60} L590,${y - 128} L540,${y - 128} Z`} fill={C.heat} opacity={0.85} stroke="#ffb0bb" strokeWidth={2} />
      <path d={`M560,${y + 60} L640,${y + 60} L590,${y + 128} L540,${y + 128} Z`} fill={C.heat} opacity={0.85} stroke="#ffb0bb" strokeWidth={2} />
      {/* nosel */}
      <path d={`M566,${y - 36} L${NOZ},${y - 54} L${NOZ},${y + 54} L566,${y + 36} Z`} fill="#3a4a7a" stroke="#8fa0d0" strokeWidth={3} strokeLinejoin="round" />
      {/* badan */}
      <rect x={560} y={y - 62} width={490} height={124} rx={14} fill="url(#rk-body)" stroke="#eef3ff" strokeWidth={2} />
      <path d={`M1046,${y - 62} Q1112,${y - 52} 1156,${y} Q1112,${y + 52} 1046,${y + 62} Z`} fill={C.heat} stroke="#ffb0bb" strokeWidth={2} />
      <rect x={566} y={y - 54} width={478} height={10} rx={5} fill="#fff" opacity={0.35} />
      {[700, 940].map((x) => (
        <line key={x} x1={x} y1={y - 62} x2={x} y2={y + 62} stroke="#5b6a9e" strokeWidth={2} opacity={0.6} />
      ))}
      <circle cx={990} cy={y - 8} r={20} fill="#0e1838" stroke="#eef3ff" strokeWidth={4} />
      <circle cx={984} cy={y - 14} r={6} fill={C.cyan} opacity={0.6} />
      {/* jendela tangki */}
      <rect x={640} y={y - 40} width={280} height={80} rx={14} fill="#0e1838" />
      <g clipPath="url(#rk-tank)">
        <path d={`${slosh} L630,${y + 40} L630,${y - 40} Z`} fill="#f0b76a" opacity={0.85} />
        {Array.from({length: 6}, (_, k) => {
          const q = (((t * 0.4 + k / 6) % 1) + 1) % 1;
          const bx = 640 + q * Math.max(0, fx - 650);
          return <circle key={k} cx={bx} cy={y - 24 + (k % 3) * 22 + 3 * Math.sin(t * 2 + k)} r={2.5} fill="#fff" opacity={cyc(q) * 0.5} />;
        })}
      </g>
      <rect x={640} y={y - 40} width={280} height={80} rx={14} fill="none" stroke={tankHi > 0.01 ? '#f0b76a' : '#8fa0d0'} strokeOpacity={0.6 + 0.4 * tankHi} strokeWidth={3 + 2 * tankHi} />
    </g>
  );
};

export const Rocket: React.FC = () => {
  const {t, cue, wordOf} = useScene();
  const appear = ramp(t, -0.5, 0.9, EASE_IN_OUT);

  /* ---------- waktu misi (penunjuk, dipercepat) ---------- */
  const c5 = cue(5);
  const tau = Math.min(190, 2.6 * Math.max(0, t) + 10 * Math.max(0, t - c5) * ramp(t, c5, c5 + 2));
  const M = M0 - MDOT * tau;
  const fuel = (FUEL - MDOT * tau) / FUEL;
  const acc = F / M;
  const vR = U * Math.log(M0 / M);
  const starOff = 34 * t + 0.031 * xOf(tau);
  const starSpeed = 34 + 0.031 * vR * (2.6 + 10 * ramp(t, c5, c5 + 2));

  /* ---------- isyarat narasi ---------- */
  const vac = ramp(t, cue(1) - 0.1, cue(1) + 0.6) * (1 - ramp(t, cue(2) - 0.5, cue(2) - 0.05, EASE_IN_OUT));
  const gasHi = ramp(t, wordOf(1, 'gas') - 0.3, wordOf(1, 'gas') + 0.5);
  const momOp = ramp(t, cue(2) - 0.1, cue(2) + 0.6) * (1 - 0.45 * ramp(t, cue(3) + 0.6, cue(3) + 1.2, EASE_IN_OUT));
  const sameLbl = ramp(t, cue(2) + 0.4, cue(2) + 1.0) * (1 - ramp(t, cue(3) + 0.6, cue(3) + 1.2, EASE_IN_OUT));
  const f2 = ramp(t, wordOf(2, 'maka') - 0.3, wordOf(2, 'maka') + 0.4) * (1 - ramp(t, cue(3) - 0.5, cue(3) - 0.05, EASE_IN_OUT));
  const tGaya = wordOf(3, 'Gaya');
  const fArrow = ramp(t, tGaya - 0.2, tGaya + 0.8);
  const uOp = ramp(t, wordOf(3, 'kecepatan') - 0.2, wordOf(3, 'kecepatan') + 0.5);
  const gateOp = ramp(t, wordOf(3, 'massa') - 0.2, wordOf(3, 'massa') + 0.5);
  const f3 = ramp(t, tGaya - 0.1, tGaya + 0.6) * (1 - ramp(t, cue(4) - 0.5, cue(4) - 0.05, EASE_IN_OUT));
  const f4 = ramp(t, cue(4) - 0.05, cue(4) + 0.6);
  const pU = ramp(t, wordOf(4, 'ribu') - 0.3, wordOf(4, 'ribu') + 0.4);
  const pM = ramp(t, wordOf(4, 'seratus') - 0.3, wordOf(4, 'seratus') + 0.4);
  const pF = ramp(t, wordOf(4, 'newton') - 0.6, wordOf(4, 'newton') + 0.2);
  const panel = ramp(t, cue(1) + 0.4, cue(1) + 1.2);
  const accRow = ramp(t, c5 - 0.2, c5 + 0.6);
  const ringan = ramp(t, wordOf(5, 'ringan') - 0.3, wordOf(5, 'ringan') + 0.4);
  const tankHi = ramp(t, wordOf(5, 'bahan') - 0.3, wordOf(5, 'bahan') + 0.4);
  const accHi = ramp(t, wordOf(5, 'percepatannya') - 0.3, wordOf(5, 'percepatannya') + 0.4);

  const bob = 3 * Math.sin(t * 1.1) + 0.8 * Math.sin(t * 23);
  const y = RY + bob;

  /* ---------- bintang (3 lapis paralaks) ---------- */
  const stars: React.ReactNode[] = [];
  [0.25, 0.55, 1].forEach((f, layer) => {
    for (let k = 0; k < 24; k++) {
      const seed = layer * 100 + k;
      const x0 = rand(seed) * 2300;
      const x = ((((x0 - starOff * f) % 2300) + 2300) % 2300) - 190;
      const sy = 170 + rand(seed * 1.7) * 720;
      const len = Math.min(140, starSpeed * f * 0.09);
      const r = 0.8 + layer * 0.6 + rand(seed * 3) * 0.6;
      const tw = 0.55 + 0.45 * Math.sin(t * (1 + rand(seed)) + k);
      stars.push(
        <g key={seed} opacity={(0.25 + 0.25 * layer) * tw}>
          {len > 2 ? <line x1={x} y1={sy} x2={x + len} y2={sy} stroke="#cfe0ff" strokeWidth={r * 1.2} strokeLinecap="round" opacity={0.6} /> : null}
          <circle cx={x} cy={sy} r={r} fill="#fff" />
        </g>,
      );
    }
  });

  /* ---------- gas buang ---------- */
  const LIFE = 1.4;
  const gas: React.ReactNode[] = [];
  for (let i = 0; i < 90; i++) {
    const r1 = rand(i * 1.3);
    const ph = (((t / (LIFE * (0.8 + 0.4 * r1)) + i / 90) % 1) + 1) % 1;
    const age = ph * LIFE;
    const gx = NOZ - 6 - U_VIS * age * (0.85 + 0.3 * rand(i * 2.1));
    const spread = 14 + age * 120;
    const gy = y + (rand(i * 3.7) - 0.5) * 2 * spread + 6 * Math.sin(t * 4 + i);
    const col = interpolateColors(ph, [0, 0.3, 0.7], ['#fff2c4', '#ffd27a', '#ff8a3d']);
    gas.push(<circle key={i} cx={gx} cy={gy} r={3.5 + age * 6} fill={col} opacity={cyc(ph) * (0.75 - 0.4 * ph) * (0.6 + 0.4 * gasHi)} />);
  }
  const flick = 1 + 0.08 * Math.sin(t * 31) + 0.05 * Math.sin(t * 17);

  /* ---------- paket gas (baris 2) ---------- */
  const P = 2.6;
  const q = (((t - cue(2)) / P) % 1 + 1) % 1;
  const wq = cl(q / 0.42); // paket terlihat ±1,1 dtk lalu memudar sebelum keluar layar
  const grow = cl(wq / 0.3);
  const packOp = (q < 0.42 ? cyc(wq) : 0) * momOp;
  const packX = NOZ - 10 - U_VIS * q * P;
  const LA = 200;

  return (
    <AbsoluteFill>
      <Stage>
        <g opacity={appear}>
          {stars}
          <Glow x={NOZ - 60} y={RY} r={260} color="kin" opacity={0.45} />
          <Glow x={840} y={RY} r={420} color="cyan" opacity={0.18} />
          <Motes x={820} y={RY} rx={500} ry={220} n={20} color="cyan" opacity={0.3} seed={8} />
          {gas}
          {/* nyala nosel */}
          <path d={`M${NOZ},${y - 46} Q${NOZ - 120 * flick},${y - 30} ${NOZ - 210 * flick},${y} Q${NOZ - 120 * flick},${y + 30} ${NOZ},${y + 46} Z`} fill="#ff8a3d" opacity={0.45} />
          <path d={`M${NOZ},${y - 30} Q${NOZ - 70 * flick},${y - 18} ${NOZ - 130 * flick},${y} Q${NOZ - 70 * flick},${y + 18} ${NOZ},${y + 30} Z`} fill="#ffd27a" opacity={0.8} />
          <path d={`M${NOZ},${y - 14} Q${NOZ - 30},${y - 8} ${NOZ - 60 * flick},${y} Q${NOZ - 30},${y + 8} ${NOZ},${y + 14} Z`} fill="#fff6dc" />
          <RocketBody y={y} t={t} fuel={fuel} tankHi={tankHi} />
          <Label x={780} y={y - 88} size={24} color="#f0b76a" weight={600} opacity={tankHi}>
            bahan bakar
          </Label>

          {/* ruang hampa */}
          <g opacity={vac}>
            <Label x={300} y={700} size={26} color={C.muted} font="mono">
              ruang hampa
            </Label>
            {Array.from({length: 7}, (_, k) => {
              const x = 170 + k * 46;
              const yy = 740 + 14 * Math.sin(k * 1.7 + t);
              return <circle key={k} cx={x} cy={yy} r={7} fill="none" stroke={C.water} strokeWidth={2} strokeDasharray="3 4" opacity={0.6} />;
            })}
            <line x1={150} y1={758} x2={470} y2={722} stroke={C.heat} strokeWidth={4} strokeLinecap="round" />
            <Label x={300} y={786} size={22} color={C.heat}>
              tak ada udara
            </Label>
          </g>
          <Label x={260} y={RY + 110} size={26} color="#ffd27a" weight={600} opacity={gasHi * (1 - momOp)}>
            gas buang
          </Label>

          {/* paket gas & momentum (baris 2) */}
          {momOp > 0.001 ? (
            <g>
              <g opacity={packOp}>
                <circle cx={packX} cy={y} r={46} fill="url(#soft-spr)" />
                {Array.from({length: 7}, (_, k) => {
                  const a = (k / 7) * Math.PI * 2 + t;
                  return <circle key={k} cx={packX + 18 * Math.cos(a) * (k ? 1 : 0)} cy={y + 18 * Math.sin(a) * (k ? 1 : 0)} r={6} fill="#fff2c4" stroke={C.spr} strokeWidth={2} />;
                })}
                <Arrow x1={packX} y1={y - 80} x2={packX - LA * grow} y2={y - 80} color="spr" width={7} />
                <Label x={packX - (LA * grow) / 2} y={y - 116} size={26} color={C.spr} font="serif" italic>
                  Δp gas
                </Label>
                <Label x={packX} y={y + 64} size={20} color={C.muted} font="mono">
                  Δm
                </Label>
              </g>
              <g opacity={packOp}>
                <Arrow x1={760} y1={y + 106} x2={760 + LA * grow} y2={y + 106} color="spr" width={7} />
                <Label x={760 + (LA * grow) / 2} y={y + 144} size={26} color={C.spr} font="serif" italic>
                  Δp roket
                </Label>
              </g>
              <g opacity={sameLbl}>
                <Label x={640} y={y + 200} size={28} color={C.ink} weight={600}>
                  sama besar, arah berlawanan
                </Label>
                <Ripple x={NOZ} y={y} p={q / 0.5} r={110} color="spr" rings={2} width={2} />
              </g>
            </g>
          ) : null}

          {/* u dan gerbang Δm/Δt */}
          <g opacity={uOp}>
            <Arrow x1={NOZ - 30} y1={y - 120} x2={NOZ - 330} y2={y - 120} color="cyan" width={6} />
            <Label x={NOZ - 180} y={y - 156} size={26} color={C.cyan} font="serif" italic>
              u
            </Label>
            <Label x={NOZ - 180} y={y - 196} size={24} color={C.cyan} font="mono" opacity={pU}>
              3000 m/s
            </Label>
          </g>
          <g opacity={gateOp}>
            <line x1={NOZ - 70} y1={y - 80} x2={NOZ - 70} y2={y + 80} stroke={C.ink} strokeWidth={2} strokeDasharray="6 6" strokeDashoffset={-t * 20} />
            <Label x={NOZ - 70} y={y + 104} size={22} color={C.ink} font="mono">
              Δm tiap Δt
            </Label>
            <Label x={NOZ - 70} y={y + 136} size={24} color={C.ink} font="mono" opacity={pM}>
              100 kg/s
            </Label>
          </g>
          {/* gaya dorong */}
          {fArrow > 0.001 ? (
            <g opacity={fArrow}>
              <Arrow x1={720} y1={y - 150} x2={720 + 300 * fArrow} y2={y - 150} color="force" width={9} />
              <Label x={720 + 150} y={y - 188} size={28} color={C.force} weight={600}>
                <tspan fontFamily={FONT.serif} fontStyle="italic">F</tspan> dorong
              </Label>
              <Label x={720 + 150} y={y - 224} size={24} color={C.force} font="mono" opacity={pF}>
                300 000 N
              </Label>
              <Twinkles x={1040} y={y - 150} rx={50} ry={40} n={4} color="force" opacity={pF} seed={3} />
            </g>
          ) : null}
        </g>

        {/* panel penunjuk misi */}
        {panel > 0.001 ? (
          <g opacity={panel}>
            <rect x={1190} y={584} width={640} height={282} rx={18} fill="rgba(10,16,36,0.78)" stroke={C.line} strokeWidth={2} />
            <Label x={1212} y={614} size={20} color={C.muted} anchor="start" weight={600} spacing={2}>
              CONTOH · M AWAL 30 t
            </Label>
            <Label x={1808} y={614} size={20} color={C.muted} anchor="end" font="mono">
              {`t = ${fmtNum(tau)} s`}
            </Label>
            <Label x={1212} y={656} size={22} color={C.ink} anchor="start">
              bahan bakar
            </Label>
            <rect x={1212} y={676} width={596} height={18} rx={6} fill="#f0b76a" opacity={0.12} />
            <rect x={1212} y={676} width={596 * fuel} height={18} rx={6} fill="#f0b76a" opacity={0.6 + 0.4 * tankHi} />
            <Label x={1808} y={656} size={22} color="#f0b76a" anchor="end" font="mono">
              {`${fmtNum(fuel * 100)} %`}
            </Label>
            <Label x={1212} y={730} size={22} color={C.ink} anchor="start" weight={600} opacity={0.8 + 0.2 * ringan}>
              massa roket M
            </Label>
            <Label x={1808} y={730} size={30} color={C.ink} anchor="end" font="mono" weight={600}>
              {`${fmtNum(M / 1000, 1)} t`}
            </Label>
            <rect x={1206} y={712} width={608} height={36} rx={8} fill="none" stroke={C.ink} strokeOpacity={0.5 * ringan * (0.6 + 0.4 * Math.sin(t * 4))} strokeWidth={2} />
            <g opacity={accRow}>
              <Label x={1212} y={786} size={22} color={C.ink} anchor="start" weight={600}>
                percepatan a = F/M
              </Label>
              <Label x={1808} y={786} size={30} color={C.work} anchor="end" font="mono" weight={600}>
                {`${fmtNum(acc, 1)} m/s²`}
              </Label>
              <Arrow x1={1214} y1={830} x2={1214 + acc * 19} y2={830} color="work" width={7} />
              <rect x={1206} y={768} width={608} height={36} rx={8} fill="none" stroke={C.work} strokeOpacity={0.6 * accHi * (0.6 + 0.4 * Math.sin(t * 4))} strokeWidth={2} />
            </g>
          </g>
        ) : null}
      </Stage>

      {/* kartu */}
      <Note x={1480} y={300} p={vac} color={C.water} size={30}>
        tidak ada udara untuk didorong —
        <br />
        yang didorong: <span style={{color: '#ffd27a'}}>gas buangnya sendiri</span>
      </Note>
      <Formula x={1500} y={320} p={f2} accent={C.spr} caption="Σp roket + gas tetap">
        <V color={C.spr}>Δp</V>
        <Sub>roket</Sub> = − <V color={C.spr}>Δp</V>
        <Sub>gas</Sub>
      </Formula>
      <Formula x={1500} y={320} p={f3} accent={C.force} caption="u = kecepatan gas buang">
        <V color={C.force}>F</V> = <V color={C.cyan}>u</V> · <Frac n={<V>Δm</V>} d={<V>Δt</V>} />
      </Formula>
      <Formula x={1480} y={320} p={f4} accent={C.force} caption="gaya dorong roket">
        <div style={{fontSize: 46}}>
          <V color={C.force}>F</V> = <Part p={pU} color={C.cyan}>3000 m/s</Part> <Part p={pM}>× 100 kg/s</Part>
        </div>
        <div>
          <Part p={pF}>
            = <span style={{color: C.force}}>300 000 N</span>
          </Part>
        </div>
      </Formula>
    </AbsoluteFill>
  );
};

