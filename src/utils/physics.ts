import type { StageElement, Particle } from '@/types';
import { CHARGE_COLORS } from '@/types';
import { generateId } from './storage';

const COULOMB_CONSTANT = 5000;
const MIN_DISTANCE = 30;
const DAMPING = 0.92;
const MAX_VELOCITY = 12;
const FRICTION_BASE = 0.98;

export function getChargeValue(element: StageElement): number {
  if (element.charge.polarity === 'neutral') return 0;
  const sign = element.charge.polarity === 'positive' ? 1 : -1;
  return sign * element.charge.magnitude;
}

export function calculateForces(elements: StageElement[]): Map<string, { fx: number; fy: number }> {
  const forces = new Map<string, { fx: number; fy: number }>();

  elements.forEach(e => forces.set(e.id, { fx: 0, fy: 0 }));

  for (let i = 0; i < elements.length; i++) {
    for (let j = i + 1; j < elements.length; j++) {
      const a = elements[i];
      const b = elements[j];

      const q1 = getChargeValue(a);
      const q2 = getChargeValue(b);

      if (q1 === 0 || q2 === 0) continue;

      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const distSq = dx * dx + dy * dy;
      const dist = Math.sqrt(distSq);

      if (dist < MIN_DISTANCE) continue;

      const force = (COULOMB_CONSTANT * q1 * q2) / (distSq * 100);
      const fx = (force * dx) / dist;
      const fy = (force * dy) / dist;

      const forceA = forces.get(a.id)!;
      const forceB = forces.get(b.id)!;
      forceA.fx -= fx;
      forceA.fy -= fy;
      forceB.fx += fx;
      forceB.fy += fy;
    }
  }

  return forces;
}

export function simulateStep(
  elements: StageElement[],
  dt: number,
  bounds: { width: number; height: number }
): StageElement[] {
  const forces = calculateForces(elements);

  return elements.map(elem => {
    if (elem.fixed) return elem;

    const force = forces.get(elem.id) || { fx: 0, fy: 0 };
    const mass = Math.max(elem.mass, 0.1);

    let ax = force.fx / mass;
    let ay = force.fy / mass;

    let vx = (elem.vx + ax * dt) * DAMPING;
    let vy = (elem.vy + ay * dt) * DAMPING;

    const speed = Math.sqrt(vx * vx + vy * vy);
    if (speed > MAX_VELOCITY) {
      vx = (vx / speed) * MAX_VELOCITY;
      vy = (vy / speed) * MAX_VELOCITY;
    }

    vx *= FRICTION_BASE;
    vy *= FRICTION_BASE;

    let x = elem.x + vx * dt * 60;
    let y = elem.y + vy * dt * 60;

    const halfW = elem.width / 2;
    const halfH = elem.height / 2;

    if (x < halfW) {
      x = halfW;
      vx = -vx * 0.5;
    }
    if (x > bounds.width - halfW) {
      x = bounds.width - halfW;
      vx = -vx * 0.5;
    }
    if (y < halfH) {
      y = halfH;
      vy = -vy * 0.5;
    }
    if (y > bounds.height - halfH) {
      y = bounds.height - halfH;
      vy = -vy * 0.5;
    }

    return { ...elem, x, y, vx, vy };
  });
}

export function createElectricParticles(
  elements: StageElement[],
  particles: Particle[]
): Particle[] {
  const newParticles: Particle[] = [...particles];

  const chargedElements = elements.filter(e => e.charge.polarity !== 'neutral' && e.charge.magnitude > 10);

  for (let i = 0; i < chargedElements.length; i++) {
    for (let j = i + 1; j < chargedElements.length; j++) {
      const a = chargedElements[i];
      const b = chargedElements[j];

      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > 300) continue;

      const isAttract = a.charge.polarity !== b.charge.polarity;
      const particleCount = isAttract ? 2 : 1;

      for (let k = 0; k < particleCount; k++) {
        if (Math.random() > 0.15) continue;

        const t = Math.random();
        const source = isAttract ? (Math.random() > 0.5 ? a : b) : a;
        const targetColor = isAttract
          ? (a.charge.polarity === 'positive' ? CHARGE_COLORS.positive : CHARGE_COLORS.negative)
          : CHARGE_COLORS[a.charge.polarity];

        newParticles.push({
          id: generateId(),
          x: source.x + (Math.random() - 0.5) * 20,
          y: source.y + (Math.random() - 0.5) * 20,
          vx: (isAttract ? dx : -dx) / dist * (1 + Math.random() * 2),
          vy: (isAttract ? dy : -dy) / dist * (1 + Math.random() * 2),
          life: 1,
          maxLife: 30 + Math.random() * 20,
          color: targetColor,
          size: 1.5 + Math.random() * 2,
        });
      }
    }
  }

  return newParticles
    .map(p => ({
      ...p,
      x: p.x + p.vx,
      y: p.y + p.vy,
      vx: p.vx * 0.98,
      vy: p.vy * 0.98,
      life: p.life - 1 / p.maxLife,
    }))
    .filter(p => p.life > 0)
    .slice(-150);
}

export function checkMechanismTriggers(elements: StageElement[]): string[] {
  const triggered: string[] = [];
  const mechanisms = elements.filter(e => e.type === 'mechanism');
  const dolls = elements.filter(e => e.type === 'doll');

  for (const mech of mechanisms) {
    for (const doll of dolls) {
      const dx = doll.x - mech.x;
      const dy = doll.y - mech.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const triggerDist = mech.triggerDistance || 60;

      if (dist < triggerDist && mech.triggerAction && mech.triggerAction !== 'none') {
        if (!triggered.includes(mech.id)) {
          triggered.push(mech.id);
        }
      }
    }
  }

  return triggered;
}

export interface MechanismEffect {
  type: 'rotate' | 'lift' | 'drop' | 'spark';
  mechId: string;
  startTime: number;
  duration: number;
  progress: number;
}

export function executeMechanismActions(
  elements: StageElement[],
  triggeredIds: string[],
  activeEffects: MechanismEffect[],
  dt: number,
  currentTime: number
): { elements: StageElement[]; effects: MechanismEffect[]; particles: Particle[] } {
  let newElements = [...elements];
  let newEffects = [...activeEffects];
  let newParticles: Particle[] = [];

  for (const mechId of triggeredIds) {
    const mech = newElements.find(e => e.id === mechId);
    if (!mech || !mech.triggerAction || mech.triggerAction === 'none') continue;

    const existing = newEffects.find(e => e.mechId === mechId && e.type === mech.triggerAction);
    if (!existing) {
      newEffects.push({
        type: mech.triggerAction,
        mechId,
        startTime: currentTime,
        duration: mech.triggerAction === 'spark' ? 1000 : 3000,
        progress: 0,
      });
    }
  }

  const updatedEffects: MechanismEffect[] = [];
  for (const effect of newEffects) {
    const elapsed = currentTime - effect.startTime;
    const progress = Math.min(1, elapsed / effect.duration);
    effect.progress = progress;

    if (progress < 1) {
      updatedEffects.push(effect);

      const mechIndex = newElements.findIndex(e => e.id === effect.mechId);
      if (mechIndex >= 0) {
        const mech = newElements[mechIndex];
        const centerX = mech.x;
        const centerY = mech.y;
        const radius = (mech.triggerDistance || 60) * 0.8;

        switch (effect.type) {
          case 'rotate': {
            const angle = progress * Math.PI * 2;
            newElements = newElements.map((elem, idx) => {
              if (idx === mechIndex) {
                return { ...elem, rotation: progress * 360 };
              }
              if (elem.type === 'doll' || elem.type === 'metal') {
                const dx = elem.x - centerX;
                const dy = elem.y - centerY;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < radius && !elem.fixed) {
                  const currentAngle = Math.atan2(dy, dx);
                  const newAngle = currentAngle + dt * 3;
                  return {
                    ...elem,
                    x: centerX + Math.cos(newAngle) * dist,
                    y: centerY + Math.sin(newAngle) * dist,
                    vx: -Math.sin(newAngle) * dist * 0.05,
                    vy: Math.cos(newAngle) * dist * 0.05,
                  };
                }
              }
              return elem;
            });
            break;
          }
          case 'lift': {
            const liftHeight = 100 * Math.sin(progress * Math.PI);
            newElements = newElements.map((elem, idx) => {
              if (idx === mechIndex) return elem;
              if (elem.type === 'doll' || elem.type === 'metal') {
                const dx = elem.x - centerX;
                const dy = elem.y - centerY;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < radius && !elem.fixed) {
                  return {
                    ...elem,
                    y: elem.y - liftHeight * (1 - dist / radius) * dt * 10,
                    vy: elem.vy - liftHeight * (1 - dist / radius) * 0.5,
                  };
                }
              }
              return elem;
            });
            break;
          }
          case 'drop': {
            if (progress > 0.2 && progress < 0.25) {
              newElements = newElements.map((elem, idx) => {
                if (idx === mechIndex) return elem;
                if (elem.type === 'doll' || elem.type === 'metal') {
                  const dx = elem.x - centerX;
                  const dy = elem.y - centerY;
                  const dist = Math.sqrt(dx * dx + dy * dy);
                  if (dist < radius && !elem.fixed) {
                    return {
                      ...elem,
                      vy: elem.vy + 15,
                      y: elem.y + 2,
                    };
                  }
                }
                return elem;
              });
            }
            break;
          }
          case 'spark': {
            for (let i = 0; i < 5; i++) {
              const angle = Math.random() * Math.PI * 2;
              const speed = 2 + Math.random() * 4;
              newParticles.push({
                id: generateId(),
                x: centerX + (Math.random() - 0.5) * 30,
                y: centerY + (Math.random() - 0.5) * 30,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 2,
                life: 1,
                maxLife: 20 + Math.random() * 15,
                color: Math.random() > 0.5 ? '#FFD700' : '#FF6B35',
                size: 2 + Math.random() * 2,
              });
            }
            newElements = newElements.map((elem, idx) => {
              if (idx === mechIndex) return { ...elem, charge: { ...elem.charge, magnitude: 100 } };
              return elem;
            });
            break;
          }
        }
      }
    }
  }

  return { elements: newElements, effects: updatedEffects, particles: newParticles };
}
