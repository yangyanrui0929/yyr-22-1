export type ElementType = 'doll' | 'electrode' | 'metal' | 'mechanism';

export type ChargePolarity = 'positive' | 'negative' | 'neutral';

export type DollMaterial = 'cotton' | 'silk' | 'wool' | 'nylon';

export type MechanismAction = 'rotate' | 'lift' | 'drop' | 'spark' | 'none';

export type EditorMode = 'edit' | 'perform';

export type PlaybackState = 'idle' | 'playing' | 'paused' | 'recording';

export interface StageElement {
  id: string;
  type: ElementType;
  name: string;
  material?: DollMaterial;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  mass: number;
  vx: number;
  vy: number;
  charge: {
    polarity: ChargePolarity;
    magnitude: number;
  };
  fixed: boolean;
  triggerAction?: MechanismAction;
  triggerDistance?: number;
}

export interface Keyframe {
  id: string;
  time: number;
  elementId: string;
  x: number;
  y: number;
  chargePolarity: ChargePolarity;
  chargeMagnitude: number;
}

export interface ActionSequence {
  id: string;
  name: string;
  duration: number;
  keyframes: Keyframe[];
}

export interface Review {
  id: string;
  rating: number;
  comment: string;
  createdAt: number;
}

export interface FailureReplay {
  id: string;
  reason: string;
  snapshot: StageElement[];
  recordedFrames: Array<{ time: number; elements: StageElement[] }>;
  createdAt: number;
}

export interface StageProject {
  id: string;
  name: string;
  elements: StageElement[];
  sequences: ActionSequence[];
  reviews: Review[];
  failureReplays: FailureReplay[];
  createdAt: number;
  updatedAt: number;
}

export interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export const DOLL_MATERIAL_PROPERTIES: Record<DollMaterial, { friction: number; conductivity: number; color: string; name: string }> = {
  cotton: { friction: 0.85, conductivity: 0.3, color: '#F5E6D3', name: '棉布' },
  silk: { friction: 0.6, conductivity: 0.7, color: '#E8D5B7', name: '丝绸' },
  wool: { friction: 0.92, conductivity: 0.2, color: '#8B6F47', name: '羊毛' },
  nylon: { friction: 0.75, conductivity: 0.5, color: '#4A6FA5', name: '尼龙' },
};

export const ELEMENT_COLORS: Record<ElementType, string> = {
  doll: '#E8B4A0',
  electrode: '#6B7280',
  metal: '#9CA3AF',
  mechanism: '#78716C',
};

export const CHARGE_COLORS: Record<ChargePolarity, string> = {
  positive: '#FF4D4D',
  negative: '#4D79FF',
  neutral: '#9CA3AF',
};
