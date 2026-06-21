import { useRef, useEffect, useState, useCallback } from 'react';
import { useTheaterStore } from '@/store';
import type { StageElement, Particle, ElementType } from '@/types';
import { CHARGE_COLORS, DOLL_MATERIAL_PROPERTIES } from '@/types';
import { simulateStep, createElectricParticles, calculateForces, getChargeValue, checkMechanismTriggers, executeMechanismActions } from '@/utils/physics';

interface DragState {
  isDragging: boolean;
  elementId: string | null;
  startX: number;
  startY: number;
  offsetX: number;
  offsetY: number;
}

export default function StageCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const dragState = useRef<DragState>({ isDragging: false, elementId: null, startX: 0, startY: 0, offsetX: 0, offsetY: 0 });
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });

  const {
    project,
    editorMode,
    playbackState,
    selectedElementId,
    particles,
    mechanismEffects,
    showForceField,
    currentTime,
    isReplaying,
    setSelectedElement,
    moveElement,
    addElement,
    updateParticles,
    updateMechanismEffects,
    simulateTick,
    addRecordedFrame,
    replayNextFrame,
  } = useTheaterStore();

  const elements = project.elements;

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setCanvasSize({ width: rect.width, height: rect.height });
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const drawElement = useCallback((ctx: CanvasRenderingContext2D, elem: StageElement, isSelected: boolean) => {
    ctx.save();
    ctx.translate(elem.x, elem.y);
    ctx.rotate((elem.rotation * Math.PI) / 180);

    const chargeColor = CHARGE_COLORS[elem.charge.polarity];
    const glowIntensity = elem.charge.magnitude / 100;

    if (elem.charge.polarity !== 'neutral' && glowIntensity > 0.1) {
      ctx.shadowColor = chargeColor;
      ctx.shadowBlur = 15 + glowIntensity * 20;
    }

    const halfW = elem.width / 2;
    const halfH = elem.height / 2;

    switch (elem.type) {
      case 'doll':
        drawDoll(ctx, elem, halfW, halfH);
        break;
      case 'electrode':
        drawElectrode(ctx, elem, halfW, halfH);
        break;
      case 'metal':
        drawMetal(ctx, elem, halfW, halfH);
        break;
      case 'mechanism':
        drawMechanism(ctx, elem, halfW, halfH);
        break;
    }

    ctx.shadowBlur = 0;

    if (elem.charge.polarity !== 'neutral') {
      ctx.font = 'bold 18px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = chargeColor;
      const symbol = elem.charge.polarity === 'positive' ? '+' : '−';
      ctx.fillText(symbol, 0, -halfH - 14);

      if (glowIntensity > 0.5) {
        ctx.beginPath();
        ctx.arc(0, 0, Math.max(halfW, halfH) + 5, 0, Math.PI * 2);
        ctx.strokeStyle = `${chargeColor}33`;
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    }

    if (isSelected) {
      ctx.shadowColor = '#DAA520';
      ctx.shadowBlur = 10;
      ctx.strokeStyle = '#DAA520';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 3]);
      ctx.strokeRect(-halfW - 4, -halfH - 4, elem.width + 8, elem.height + 8);
      ctx.setLineDash([]);
    }

    if (elem.fixed && editorMode === 'edit') {
      ctx.fillStyle = '#B8860B';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🔒', halfW + 8, -halfH - 2);
    }

    ctx.restore();
  }, [editorMode]);

  const drawDoll = (ctx: CanvasRenderingContext2D, elem: StageElement, halfW: number, halfH: number) => {
    const matColor = elem.material ? DOLL_MATERIAL_PROPERTIES[elem.material].color : '#F5E6D3';

    ctx.fillStyle = matColor;
    ctx.strokeStyle = '#8B7355';
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.ellipse(0, halfH * 0.2, halfW * 0.8, halfH * 0.6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(0, -halfH * 0.4, halfW * 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#1A1210';
    ctx.beginPath();
    ctx.arc(-halfW * 0.18, -halfH * 0.45, 3, 0, Math.PI * 2);
    ctx.arc(halfW * 0.18, -halfH * 0.45, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#E57373';
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    ctx.arc(-halfW * 0.3, -halfH * 0.3, 4, 0, Math.PI * 2);
    ctx.arc(halfW * 0.3, -halfH * 0.3, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    ctx.fillStyle = '#1A1210';
    ctx.beginPath();
    ctx.arc(0, -halfH * 0.3, 2, 0, Math.PI);
    ctx.stroke();
  };

  const drawElectrode = (ctx: CanvasRenderingContext2D, elem: StageElement, halfW: number, halfH: number) => {
    const gradient = ctx.createLinearGradient(-halfW, -halfH, halfW, halfH);
    gradient.addColorStop(0, '#9CA3AF');
    gradient.addColorStop(0.5, '#D1D5DB');
    gradient.addColorStop(1, '#6B7280');

    ctx.fillStyle = gradient;
    ctx.strokeStyle = '#4B5563';
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.roundRect(-halfW, -halfH * 0.6, elem.width, elem.height * 0.8, 6);
    ctx.fill();
    ctx.stroke();

    const poleColor = CHARGE_COLORS[elem.charge.polarity];
    ctx.fillStyle = elem.charge.polarity === 'neutral' ? '#6B7280' : poleColor;
    ctx.beginPath();
    ctx.arc(0, -halfH * 0.8, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#1A1210';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = '#374151';
    ctx.fillRect(-halfW * 0.6, halfH * 0.2, elem.width * 0.3, halfH * 0.3);
    ctx.fillRect(halfW * 0.3, halfH * 0.2, elem.width * 0.3, halfH * 0.3);
  };

  const drawMetal = (ctx: CanvasRenderingContext2D, elem: StageElement, halfW: number, halfH: number) => {
    const gradient = ctx.createLinearGradient(-halfW, -halfH, halfW, halfH);
    gradient.addColorStop(0, '#9CA3AF');
    gradient.addColorStop(0.3, '#E5E7EB');
    gradient.addColorStop(0.7, '#6B7280');
    gradient.addColorStop(1, '#9CA3AF');

    ctx.fillStyle = gradient;
    ctx.strokeStyle = '#4B5563';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(-halfW, -halfH, elem.width, elem.height, 3);
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-halfW + 4, -halfH + 3);
    ctx.lineTo(halfW - 4, -halfH + 3);
    ctx.stroke();
  };

  const drawMechanism = (ctx: CanvasRenderingContext2D, elem: StageElement, halfW: number, halfH: number) => {
    ctx.fillStyle = '#5C3A1E';
    ctx.strokeStyle = '#3D2817';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(-halfW, -halfH, elem.width, elem.height, 8);
    ctx.fill();
    ctx.stroke();

    const gearColor = elem.triggerAction && elem.triggerAction !== 'none' ? '#DAA520' : '#6B5A3A';
    ctx.fillStyle = gearColor;
    ctx.strokeStyle = '#3D2817';
    ctx.lineWidth = 2;

    const cx = 0;
    const cy = 0;
    const r = halfW * 0.5;
    const teeth = 8;

    ctx.beginPath();
    for (let i = 0; i < teeth * 2; i++) {
      const angle = (i * Math.PI) / teeth;
      const radius = i % 2 === 0 ? r : r * 0.75;
      const x = cx + Math.cos(angle) * radius;
      const y = cy + Math.sin(angle) * radius;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#3D2817';
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.3, 0, Math.PI * 2);
    ctx.fill();

    if (elem.triggerDistance) {
      ctx.strokeStyle = 'rgba(218, 165, 32, 0.2)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.arc(0, 0, elem.triggerDistance, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  };

  const drawForceField = (ctx: CanvasRenderingContext2D, elems: StageElement[]) => {
    const charged = elems.filter(e => e.charge.polarity !== 'neutral');
    if (charged.length < 2) return;

    for (let i = 0; i < charged.length; i++) {
      for (let j = i + 1; j < charged.length; j++) {
        const a = charged[i];
        const b = charged[j];
        const isAttract = a.charge.polarity !== b.charge.polarity;

        ctx.strokeStyle = isAttract ? 'rgba(0, 212, 255, 0.2)' : 'rgba(255, 77, 77, 0.15)';
        ctx.lineWidth = 1;
        ctx.setLineDash(isAttract ? [] : [6, 4]);

        ctx.beginPath();
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const steps = 8;

        for (let s = 0; s <= steps; s++) {
          const t = s / steps;
          const x = a.x + dx * t + Math.sin(t * Math.PI * 2) * 5;
          const y = a.y + dy * t + Math.cos(t * Math.PI * 2) * 5;
          if (s === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }
  };

  const drawParticles = (ctx: CanvasRenderingContext2D, parts: Particle[]) => {
    for (const p of parts) {
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
      ctx.fill();

      ctx.globalAlpha = p.life * 0.3;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * p.life * 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = (time: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = time;
      const dt = Math.min((time - lastTimeRef.current) / 1000, 0.05);
      lastTimeRef.current = time;

      if (isReplaying) {
        replayNextFrame();
      } else if (playbackState === 'playing' || playbackState === 'recording') {
        simulateTick(dt, canvasSize, simulateStep);

        const triggered = checkMechanismTriggers(project.elements);
        if (triggered.length > 0 || mechanismEffects.length > 0) {
          const result = executeMechanismActions(
            project.elements,
            triggered,
            mechanismEffects,
            dt,
            currentTime
          );
          if (result.elements !== project.elements) {
            useTheaterStore.setState({
              project: { ...project, elements: result.elements, updatedAt: Date.now() },
            });
          }
          updateMechanismEffects(result.effects);
          if (result.particles.length > 0) {
            updateParticles([...particles, ...result.particles].slice(-200));
          }
        }

        const newParticles = createElectricParticles(project.elements, particles);
        updateParticles(newParticles);

        if (playbackState === 'recording') {
          addRecordedFrame(currentTime, project.elements);
        }
      }

      ctx.clearRect(0, 0, canvasSize.width, canvasSize.height);

      if (showForceField && editorMode === 'edit') {
        drawForceField(ctx, project.elements);
      }

      drawParticles(ctx, particles);

      for (const elem of project.elements) {
        drawElement(ctx, elem, elem.id === selectedElementId);
      }

      if (isReplaying) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(10, 10, 140, 30);
        ctx.fillStyle = '#FF4D4D';
        ctx.font = 'bold 14px sans-serif';
        ctx.fillText('⏯ 失败回放中...', 20, 30);
      }

      animationRef.current = requestAnimationFrame(render);
    };

    animationRef.current = requestAnimationFrame(render);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [project.elements, canvasSize, selectedElementId, playbackState, particles, mechanismEffects, showForceField, editorMode, currentTime, isReplaying, drawElement, simulateTick, updateParticles, updateMechanismEffects, addRecordedFrame, replayNextFrame]);

  const getCanvasCoords = (e: React.MouseEvent | React.DragEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const hitTest = (x: number, y: number): StageElement | null => {
    for (let i = elements.length - 1; i >= 0; i--) {
      const elem = elements[i];
      if (
        x >= elem.x - elem.width / 2 &&
        x <= elem.x + elem.width / 2 &&
        y >= elem.y - elem.height / 2 &&
        y <= elem.y + elem.height / 2
      ) {
        return elem;
      }
    }
    return null;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (editorMode !== 'edit') return;
    const { x, y } = getCanvasCoords(e);
    const hit = hitTest(x, y);

    if (hit) {
      setSelectedElement(hit.id);
      if (!hit.fixed) {
        dragState.current = {
          isDragging: true,
          elementId: hit.id,
          startX: x,
          startY: y,
          offsetX: x - hit.x,
          offsetY: y - hit.y,
        };
      }
    } else {
      setSelectedElement(null);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragState.current.isDragging || !dragState.current.elementId) return;
    const { x, y } = getCanvasCoords(e);
    const newX = Math.max(30, Math.min(canvasSize.width - 30, x - dragState.current.offsetX));
    const newY = Math.max(30, Math.min(canvasSize.height - 30, y - dragState.current.offsetY));
    moveElement(dragState.current.elementId, newX, newY);
  };

  const handleMouseUp = () => {
    dragState.current.isDragging = false;
    dragState.current.elementId = null;
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (editorMode !== 'edit') return;
    const elementType = e.dataTransfer.getData('elementType') as ElementType;
    if (!elementType) return;
    const { x, y } = getCanvasCoords(e);
    addElement(elementType, x, y);
  };

  return (
    <div ref={containerRef} className="flex-1 relative overflow-hidden wood-bg">
      <div className="absolute inset-0 stage-grid" />
      <div className="absolute inset-0 pointer-events-none border-8 border-theater-wood" style={{
        boxShadow: 'inset 0 0 80px rgba(0,0,0,0.6)'
      }} />

      <canvas
        ref={canvasRef}
        width={canvasSize.width}
        height={canvasSize.height}
        className="absolute inset-0 w-full h-full cursor-crosshair"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      />

      {elements.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <div className="text-6xl mb-4 opacity-20">🎭</div>
            <p className="text-theater-parchment/40 font-display text-lg">从左侧拖拽元素到舞台开始创作</p>
          </div>
        </div>
      )}

      <div className="absolute top-3 left-3 flex items-center gap-2 pointer-events-none">
        <span className="text-xs text-theater-parchment/50 font-mono">
          {canvasSize.width} × {canvasSize.height}
        </span>
      </div>
    </div>
  );
}
