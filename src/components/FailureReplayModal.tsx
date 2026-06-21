import { useEffect, useRef, useCallback } from 'react';
import { X, Play, Pause, Square, SkipBack } from 'lucide-react';
import { useTheaterStore } from '@/store';
import { cn } from '@/lib/utils';

function formatTime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  const remainingMs = Math.floor((ms % 1000) / 10);
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}.${remainingMs.toString().padStart(2, '0')}`;
}

export default function FailureReplayModal() {
  const {
    showFailureReplay,
    currentReplay,
    isReplaying,
    currentTime,
    replayFrameIndex,
    setShowFailureReplay,
    startReplay,
    stopReplay,
  } = useTheaterStore();

  const containerRef = useRef<HTMLDivElement>(null);

  const handleClose = useCallback(() => {
    stopReplay();
    setShowFailureReplay(false);
  }, [stopReplay, setShowFailureReplay]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showFailureReplay) {
        handleClose();
      }
      if (e.key === ' ' && showFailureReplay && currentReplay) {
        e.preventDefault();
        if (isReplaying) {
          stopReplay();
        } else {
          startReplay();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showFailureReplay, currentReplay, isReplaying, handleClose, startReplay, stopReplay]);

  useEffect(() => {
    if (showFailureReplay && currentReplay) {
      useTheaterStore.setState({
        project: {
          ...useTheaterStore.getState().project,
          elements: JSON.parse(JSON.stringify(currentReplay.snapshot)),
        },
        replayFrameIndex: 0,
        currentTime: 0,
      });
    }
  }, [showFailureReplay, currentReplay]);

  if (!showFailureReplay || !currentReplay) return null;

  const totalFrames = currentReplay.recordedFrames.length;
  const totalDuration = totalFrames > 0 ? currentReplay.recordedFrames[totalFrames - 1].time : 0;
  const progress = totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={handleClose}
    >
      <div
        ref={containerRef}
        className="w-[900px] max-h-[85vh] wood-bg brass-border rounded-xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-theater-wood-light">
          <div>
            <h3 className="font-display text-xl font-bold text-red-400 flex items-center gap-2">
              <Square className="w-5 h-5 fill-red-400" />
              失败回放
            </h3>
            <p className="text-xs text-theater-parchment/50 mt-0.5">
              {currentReplay.reason}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-sm text-theater-parchment/60">
              {totalFrames} 帧 · {formatTime(totalDuration)}
            </div>
            <button
              onClick={handleClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-theater-parchment/60 hover:text-theater-parchment hover:bg-theater-wood-light/50 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 p-4 min-h-0">
          <div className="w-full h-full bg-theater-dark rounded-lg border border-theater-wood-light overflow-hidden relative">
            <div
              className="absolute inset-0 stage-grid"
              style={{
                boxShadow: 'inset 0 0 60px rgba(0,0,0,0.6)',
              }}
            />
            <canvas
              ref={(canvas) => {
                if (!canvas) return;
                const ctx = canvas.getContext('2d');
                if (!ctx) return;

                const dpr = window.devicePixelRatio || 1;
                const rect = canvas.getBoundingClientRect();
                canvas.width = rect.width * dpr;
                canvas.height = rect.height * dpr;
                ctx.scale(dpr, dpr);

                const { project } = useTheaterStore.getState();
                const elements = project.elements;

                ctx.clearRect(0, 0, rect.width, rect.height);

                for (const elem of elements) {
                  ctx.save();
                  ctx.translate(elem.x * (rect.width / 800), elem.y * (rect.height / 600));
                  ctx.rotate((elem.rotation * Math.PI) / 180);

                  const scaleX = rect.width / 800;
                  const scaleY = rect.height / 600;
                  ctx.scale(Math.min(scaleX, scaleY), Math.min(scaleX, scaleY));

                  const chargeColor = elem.charge.polarity === 'positive' ? '#FF4D4D' : elem.charge.polarity === 'negative' ? '#4D79FF' : '#9CA3AF';
                  if (elem.charge.polarity !== 'neutral' && elem.charge.magnitude > 10) {
                    ctx.shadowColor = chargeColor;
                    ctx.shadowBlur = 10 + (elem.charge.magnitude / 100) * 15;
                  }

                  const halfW = elem.width / 2;
                  const halfH = elem.height / 2;

                  if (elem.type === 'doll') {
                    ctx.fillStyle = '#F5E6D3';
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
                    ctx.arc(-halfW * 0.18, -halfH * 0.45, 2, 0, Math.PI * 2);
                    ctx.arc(halfW * 0.18, -halfH * 0.45, 2, 0, Math.PI * 2);
                    ctx.fill();
                  } else if (elem.type === 'electrode') {
                    const gradient = ctx.createLinearGradient(-halfW, -halfH, halfW, halfH);
                    gradient.addColorStop(0, '#9CA3AF');
                    gradient.addColorStop(0.5, '#D1D5DB');
                    gradient.addColorStop(1, '#6B7280');
                    ctx.fillStyle = gradient;
                    ctx.strokeStyle = '#4B5563';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.roundRect(-halfW, -halfH * 0.6, elem.width, elem.height * 0.8, 4);
                    ctx.fill();
                    ctx.stroke();
                    ctx.fillStyle = elem.charge.polarity === 'neutral' ? '#6B7280' : chargeColor;
                    ctx.beginPath();
                    ctx.arc(0, -halfH * 0.8, 6, 0, Math.PI * 2);
                    ctx.fill();
                  } else if (elem.type === 'metal') {
                    const gradient = ctx.createLinearGradient(-halfW, -halfH, halfW, halfH);
                    gradient.addColorStop(0, '#9CA3AF');
                    gradient.addColorStop(0.3, '#E5E7EB');
                    gradient.addColorStop(0.7, '#6B7280');
                    gradient.addColorStop(1, '#9CA3AF');
                    ctx.fillStyle = gradient;
                    ctx.strokeStyle = '#4B5563';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.roundRect(-halfW, -halfH, elem.width, elem.height, 2);
                    ctx.fill();
                    ctx.stroke();
                  } else if (elem.type === 'mechanism') {
                    ctx.fillStyle = '#5C3A1E';
                    ctx.strokeStyle = '#3D2817';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.roundRect(-halfW, -halfH, elem.width, elem.height, 6);
                    ctx.fill();
                    ctx.stroke();
                    const gearColor = elem.triggerAction && elem.triggerAction !== 'none' ? '#DAA520' : '#6B5A3A';
                    ctx.fillStyle = gearColor;
                    ctx.strokeStyle = '#3D2817';
                    const cx = 0, cy = 0, r = halfW * 0.5, teeth = 8;
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
                  }

                  if (elem.charge.polarity !== 'neutral') {
                    ctx.font = 'bold 14px serif';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillStyle = chargeColor;
                    ctx.fillText(elem.charge.polarity === 'positive' ? '+' : '−', 0, -halfH - 12);
                  }

                  ctx.restore();
                }
              }}
              className="w-full h-full"
              style={{ minHeight: '400px' }}
            />

            {isReplaying && (
              <div className="absolute top-3 left-3 flex items-center gap-2">
                <div className="recording-dot" />
                <span className="text-xs text-red-400 font-medium">回放中</span>
              </div>
            )}
          </div>
        </div>

        <div className="p-4 border-t border-theater-wood-light">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  stopReplay();
                  useTheaterStore.setState({
                    project: {
                      ...useTheaterStore.getState().project,
                      elements: JSON.parse(JSON.stringify(currentReplay.snapshot)),
                    },
                    replayFrameIndex: 0,
                    currentTime: 0,
                  });
                }}
                className="w-10 h-10 rounded-full flex items-center justify-center brass-btn"
                title="重置"
              >
                <SkipBack className="w-4 h-4" />
              </button>
              <button
                onClick={isReplaying ? stopReplay : startReplay}
                className={cn(
                  'w-12 h-12 rounded-full flex items-center justify-center transition-all',
                  isReplaying
                    ? 'bg-gradient-to-br from-theater-electric to-blue-600 text-white'
                    : 'brass-btn'
                )}
                title={isReplaying ? '暂停' : '播放'}
              >
                {isReplaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
              </button>
              <button
                onClick={handleClose}
                className="w-10 h-10 rounded-full flex items-center justify-center brass-btn"
                title="停止"
              >
                <Square className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 flex flex-col justify-center">
              <div className="flex items-center gap-3 mb-1">
                <span className="text-xs text-theater-parchment/60 w-20 text-right font-mono">
                  {formatTime(currentTime)}
                </span>
                <div className="flex-1 h-2 bg-theater-dark/60 rounded-full overflow-hidden border border-theater-wood-light">
                  <div
                    className="h-full bg-gradient-to-r from-red-600 to-red-400 transition-all duration-100"
                    style={{ width: `${Math.min(100, progress)}%` }}
                  />
                </div>
                <span className="text-xs text-theater-parchment/60 w-20 font-mono">
                  {formatTime(totalDuration)}
                </span>
              </div>
              <div className="text-center text-xs text-theater-parchment/40">
                帧 {replayFrameIndex} / {totalFrames} · 空格键 播放/暂停 · ESC 关闭
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
