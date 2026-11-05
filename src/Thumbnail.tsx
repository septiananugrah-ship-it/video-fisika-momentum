import React from 'react';
import {AbsoluteFill} from 'remotion';
import {BRAND} from './brand';
import {C, FONT} from './theme';

/** Panah lurus sederhana (garis + kepala segitiga). */
const Arrow: React.FC<{x1: number; y1: number; x2: number; y2: number; color: string; w?: number; head?: number}> = ({x1, y1, x2, y2, color, w = 12, head = 34}) => {
  const a = Math.atan2(y2 - y1, x2 - x1);
  const bx = x2 - Math.cos(a) * head;
  const by = y2 - Math.sin(a) * head;
  const px = Math.cos(a + Math.PI / 2) * head * 0.6;
  const py = Math.sin(a + Math.PI / 2) * head * 0.6;
  return (
    <g>
      <line x1={x1} y1={y1} x2={bx} y2={by} stroke={color} strokeWidth={w} strokeLinecap="round" />
      <polygon points={`${x2},${y2} ${bx + px},${by + py} ${bx - px},${by - py}`} fill={color} />
    </g>
  );
};

const mono = {fontFamily: FONT.mono, fontWeight: 600} as const;

// Tumbukan lenting 1D: m_A = 2, m_B = 1, u_A = 3, u_B = 0 → v_A = 1, v_B = 4.
// p: sebelum 6 + 0, sesudah 2 + 4 → Σp = 6 tetap. Panjang panah ∝ p (60 px per satuan).
const S = 60;
const Row: React.FC<{y: number; label: string; ax: number; bx: number; pa: number; pb: number}> = ({y, label, ax, bx, pa, pb}) => (
  <g>
    <text x={1600} y={y - 235} fill={C.muted} fontSize={40} letterSpacing={6} fontFamily={FONT.head} fontWeight={600}>{label}</text>
    <line x1={1600} y1={y + 105} x2={2450} y2={y + 105} stroke={C.line} strokeWidth={6} />
    {pa > 0 && [0, 1, 2].map((i) => <line key={i} x1={ax - 120 - i * 10} y1={y - 40 + i * 40} x2={ax - 200 - pa * 12 - i * 10} y2={y - 40 + i * 40} stroke={C.cyan} strokeOpacity={0.45} strokeWidth={6} strokeLinecap="round" />)}
    {pb > 0 && [0, 1].map((i) => <line key={i} x1={bx - 92} y1={y - 20 + i * 40} x2={bx - 150} y2={y - 20 + i * 40} stroke={C.cyan} strokeOpacity={0.45} strokeWidth={6} strokeLinecap="round" />)}
    <circle cx={ax} cy={y} r={100} fill={C.kin} stroke={C.ink} strokeWidth={6} />
    <text x={ax} y={y + 18} textAnchor="middle" fill={C.bg} fontSize={52} style={mono}>2m</text>
    <circle cx={bx} cy={y + 30} r={72} fill={C.cyan} stroke={C.ink} strokeWidth={6} />
    <text x={bx} y={y + 46} textAnchor="middle" fill={C.bg} fontSize={44} style={mono}>m</text>
    {pa > 0 && <Arrow x1={ax} y1={y - 140} x2={ax + pa * S} y2={y - 140} color={C.spr} />}
    <text x={ax} y={y - 165} fill={C.spr} fontSize={44} style={mono}>{`p = ${pa}`}</text>
    {pb > 0 && <Arrow x1={bx} y1={y - 80} x2={bx + pb * S} y2={y - 80} color={C.spr} />}
    <text x={bx + (pb > 0 ? 0 : -30)} y={y - 105} fill={C.spr} fontSize={44} style={mono}>{`p = ${pb}`}</text>
  </g>
);

const Visual: React.FC = () => (
  <g>
    <Row y={470} label="SEBELUM" ax={1760} bx={2140} pa={6} pb={0} />
    <Row y={930} label="SESUDAH" ax={1880} bx={2150} pa={2} pb={4} />
    <text x={2450} y={1140} textAnchor="end" fill={C.spr} fontSize={56} style={mono}>Σp: 6 + 0 = 2 + 4</text>
  </g>
);

/** Gambar mini 2K untuk YouTube/LMS. */
export const Thumbnail: React.FC = () => (
  <AbsoluteFill style={{background: `radial-gradient(ellipse 80% 70% at 30% 40%, #20305e 0%, ${C.bg} 70%)`, fontFamily: FONT.head}}>
    <div style={{position: 'absolute', left: 140, top: 180, color: C.gold, fontSize: 54, letterSpacing: 10, fontWeight: 600}}>{BRAND.series.toUpperCase()}</div>
    <div style={{position: 'absolute', left: 130, top: 270, color: C.ink, fontSize: 200, fontWeight: 700, lineHeight: 0.95, letterSpacing: -6, whiteSpace: 'nowrap'}}>
      Yang Tak
      <br />
      <span style={{color: C.spr}}>Pernah Hilang</span>
    </div>
    <div style={{position: 'absolute', left: 140, top: 760, color: C.muted, fontSize: 70, fontWeight: 500}}>{BRAND.subtitle}</div>
    <div style={{position: 'absolute', left: 140, bottom: 140, color: C.ink, fontSize: 44, letterSpacing: 8, fontWeight: 600}}>
      {BRAND.channel} <span style={{color: C.muted, letterSpacing: 2, fontWeight: 400}}>· {BRAND.tagline}</span>
    </div>
    <svg width={2560} height={1440} style={{position: 'absolute', inset: 0}}>
      <Visual />
    </svg>
  </AbsoluteFill>
);
