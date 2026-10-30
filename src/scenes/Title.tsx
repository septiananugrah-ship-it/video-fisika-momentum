import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {BACK, EASE_IN_OUT, cyc, ramp, rand} from '../anim';
import {Streamline} from '../components/flow';
import {Water} from '../components/fluid';
import {Glow, Ripple, Stage, Twinkles} from '../components/primitives';
import {BRAND} from '../brand';
import {useScene} from '../SceneContext';
import {C, FONT} from '../theme';

// Judul bernuansa aliran: judul berperan sebagai "sayap" — garis arus di atasnya merapat dan
// partikelnya melaju lebih cepat, di bawahnya merenggang dan lebih lambat; air mengalir di dasar layar.
const CX = 960;
const CY = 470;
const fr = (v: number) => ((v % 1) + 1) % 1;
const bump = (x: number) => Math.exp(-(((x - CX) / 560) ** 2));

// garis arus atas (merapat → cepat) dan bawah (merenggang → lambat)
const UPPER = [118, 150, 182, 214, 246];
const LOWER = [752, 790, 828];
const lane = (y0: number, up: boolean) => {
  const pts: [number, number][] = [];
  const gain: number[] = [];
  for (let i = 0; i <= 48; i++) {
    const x = -60 + (2040 * i) / 48;
    const b = bump(x);
    if (up) {
      const k = 0.42 * b;
      pts.push([x, y0 - (y0 - 96) * k]);
      gain.push(1 / (1 - k)); // jarak antar-garis mengecil → laju naik (kontinuitas)
    } else {
      const k = 0.18 * b;
      pts.push([x, y0 + (y0 - 700) * k]);
      gain.push(1 / (1 + k));
    }
  }
  return {pts, gain};
};
const LANES = [...UPPER.map((y) => ({...lane(y, true), up: true, y})), ...LOWER.map((y) => ({...lane(y, false), up: false, y}))];

export const Title: React.FC = () => {
  const {t, dur} = useScene();
  const a = ramp(t, 0.2, 1.4);
  const sub = ramp(t, 1.5, 2.5);
  const brand = ramp(t, 2.6, 3.6);
  const out = 1 - ramp(t, dur - 1.0, dur - 0.1, EASE_IN_OUT);
  const push = 1 + 0.035 * ramp(t, -0.8, dur, EASE_IN_OUT);
  const flow = ramp(t, 0.3, 2.0);
  // judul sedikit "terangkat" ketika aliran di atasnya makin deras
  const liftY = -10 * ramp(t, 3.4, 6.5, EASE_IN_OUT);
  const surge = ramp(t, 3.4, 4.6, EASE_IN_OUT);
  const title = BRAND.title;
  const split = title.indexOf('Pernah');

  return (
    <AbsoluteFill style={{opacity: out}}>
      <AbsoluteFill style={{transform: `scale(${push})`, transformOrigin: '50% 48%'}}>
        <Stage>
          <defs>
            <linearGradient id="ti-ray" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#bfe6ff" stopOpacity={0.16} />
              <stop offset="100%" stopColor="#bfe6ff" stopOpacity={0} />
            </linearGradient>
          </defs>
          <Glow x={CX} y={CY} r={720} color="water" opacity={0.42 * a} />
          <Glow x={CX} y={150} r={420} color="cyan" opacity={0.28 * flow + 0.18 * surge} />
          {/* berkas cahaya, bergoyang pelan */}
          {Array.from({length: 6}, (_, i) => {
            const x = 260 + i * 290 + 40 * Math.sin(t * 0.5 + i * 1.3);
            const w = 70 + 40 * rand(i * 2.7);
            const sk = 120 + 60 * Math.sin(t * 0.3 + i);
            return <path key={i} d={`M${x},0 L${x + w},0 L${x + w + sk},860 L${x + sk - w * 0.6},860 Z`} fill="url(#ti-ray)" opacity={a * (0.5 + 0.4 * Math.sin(t * 0.9 + i * 2))} />;
          })}
          {/* garis arus: rapat & cepat di atas judul, renggang & lambat di bawah */}
          {LANES.map((l, k) => (
            <Streamline
              key={k}
              pts={l.pts}
              gain={l.gain}
              speed={l.up ? 210 + 70 * surge : 210}
              n={l.up ? 9 : 7}
              color={l.up ? 'cyan' : '#dff3ff'}
              line={l.up ? 0.3 : 0.18}
              width={1.6}
              seed={k * 1.7}
              opacity={ramp(flow, k * 0.07, k * 0.07 + 0.5)}
            />
          ))}
          {/* kilau tipis yang merambat di garis arus atas (penegas "lebih cepat") */}
          {UPPER.map((y0, k) => {
            const ph = fr(t * 0.35 + k * 0.21);
            const x = -60 + ph * 2040;
            const b = bump(x);
            const y = y0 - (y0 - 96) * 0.42 * b;
            return <circle key={k} cx={x} cy={y} r={22} fill="url(#soft-cyan)" opacity={cyc(ph) * flow * 0.8} />;
          })}
          {/* partikel lepas yang terbawa arus di tepi */}
          {Array.from({length: 14}, (_, i) => {
            const ph = fr(t * (0.06 + rand(i) * 0.05) + rand(i * 3.3));
            const y = 300 + rand(i * 7.7) * 420;
            const x = -20 + ph * 1960;
            const side = Math.abs(x - CX) > 560 ? 1 : 0.25;
            return <circle key={i} cx={x} cy={y + 8 * Math.sin(t * 1.4 + i)} r={1.5 + rand(i * 2.1) * 2} fill="#cfeaff" opacity={0.45 * cyc(ph) * side * a} />;
          })}
          <Ripple x={CX} y={CY} p={(t - 0.8) / 2.2} r={760} color="water" rings={2} width={2} />
          {/* air mengalir di dasar layar */}
          <Water x={0} y={866} w={1920} h={214} amp={5} seed={2} opacity={ramp(t, -0.4, 1.0)} />
          {[900, 940, 990].map((y, k) => (
            <Streamline
              key={k}
              pts={[
                [-30, y],
                [1950, y],
              ]}
              speed={150 - k * 30}
              n={9}
              color="#dff3ff"
              line={0}
              seed={k * 5}
              opacity={0.7 * ramp(t, 0.2, 1.4)}
            />
          ))}
          <Twinkles x={CX} y={CY - 10} rx={620} ry={90} n={7} color="cyan" opacity={ramp(t, 2.2, 3.0)} seed={6} />
        </Stage>
        <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', paddingBottom: 150, translate: `0px ${liftY}px`}}>
          <div style={{fontFamily: FONT.head, fontSize: 28, letterSpacing: 12, color: C.cyan, fontWeight: 600, opacity: a}}>{BRAND.series.toUpperCase()}</div>
          <div style={{display: 'flex', marginTop: 18}}>
            {title.split('').map((ch, i) => {
              const p = ramp(t, 0.5 + i * 0.045, 1.4 + i * 0.045, BACK);
              const bob = 4 * Math.sin(t * 1.3 - i * 0.4) * ramp(t, 1.8, 2.8);
              const hot = i >= split;
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
                    color: hot ? C.water : C.ink,
                    opacity: Math.min(1, p),
                    translate: `0px ${(1 - p) * 60 + bob - (hot ? 6 * surge : 0)}px`,
                    textShadow: hot ? `0 0 ${40 + 14 * Math.sin(t * 2 + i * 0.4)}px rgba(58,168,255,0.6)` : '0 0 40px rgba(120,160,255,0.25)',
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
              border: '1.5px solid rgba(120,190,255,0.35)',
              background: 'rgba(10,24,56,0.55)',
              opacity: brand,
              translate: `0px ${(1 - brand) * 14}px`,
              boxShadow: `0 0 ${24 + 10 * Math.sin(t * 1.8)}px rgba(58,168,255,0.25)`,
            }}
          >
            <Img src={staticFile('scientian-logo.png')} style={{width: 46, height: 46, rotate: `${4 * Math.sin(t * 0.9)}deg`}} />
            <div style={{fontFamily: FONT.head, fontSize: 30, color: C.ink, fontWeight: 500, letterSpacing: 2}}>
              Explore <span style={{color: C.gold, fontWeight: 600}}>Science</span> with Yayan
            </div>
          </div>
          <div style={{fontFamily: FONT.mono, fontSize: 22, color: C.muted, marginTop: 40, opacity: ramp(t, 4.2, 5.2), letterSpacing: 3 + 2 * (1 - ramp(t, 4.2, 5.6))}}>
            makin <span style={{color: C.cyan}}>cepat</span> alirannya, makin <span style={{color: C.press}}>rendah</span> tekanannya
          </div>
        </AbsoluteFill>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
