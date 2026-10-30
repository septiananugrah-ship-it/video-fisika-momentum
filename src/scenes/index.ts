import type React from 'react';
import {Ballistic} from './Ballistic';
import {CollisionTheory} from './CollisionTheory';
import {Collisions} from './Collisions';
import {Conservation} from './Conservation';
import {Crash} from './Crash';
import {Cushion} from './Cushion';
import {Elastic} from './Elastic';
import {GasPressure} from './GasPressure';
import {Hook} from './Hook';
import {Impulse} from './Impulse';
import {Inelastic} from './Inelastic';
import {MomentumScene} from './MomentumScene';
import {Outro} from './Outro';
import {Photon} from './Photon';
import {Recap} from './Recap';
import {Recoil} from './Recoil';
import {Restitution} from './Restitution';
import {Roadmap} from './Roadmap';
import {Rocket} from './Rocket';
import {Strategy} from './Strategy';
import {Title} from './Title';
import {TwoD} from './TwoD';

// Pemetaan id adegan di naskah → komponen visual.
export const SCENES: Record<string, React.FC> = {
  hook: Hook,
  title: Title,
  roadmap: Roadmap,
  momentum: MomentumScene,
  impulse: Impulse,
  cushion: Cushion,
  conservation: Conservation,
  recoil: Recoil,
  collisions: Collisions,
  inelastic: Inelastic,
  elastic: Elastic,
  restitution: Restitution,
  twod: TwoD,
  strategy: Strategy,
  gaspressure: GasPressure,
  collisiontheory: CollisionTheory,
  photon: Photon,
  crash: Crash,
  ballistic: Ballistic,
  rocket: Rocket,
  recap: Recap,
  outro: Outro,
};
