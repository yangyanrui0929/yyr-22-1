import { Trash2, Zap, Plus, Minus, CircleDot } from 'lucide-react';
import { useTheaterStore } from '@/store';
import { DOLL_MATERIAL_PROPERTIES, CHARGE_COLORS } from '@/types';
import type { ChargePolarity, DollMaterial, MechanismAction } from '@/types';
import { cn } from '@/lib/utils';

const MECHANISM_ACTIONS: { value: MechanismAction; label: string }[] = [
  { value: 'none', label: '无动作' },
  { value: 'rotate', label: '旋转舞台' },
  { value: 'lift', label: '升降平台' },
  { value: 'drop', label: '下落陷阱' },
  { value: 'spark', label: '火花效果' },
];

export default function PropertyPanel() {
  const {
    project,
    selectedElementId,
    editorMode,
    showForceField,
    toggleForceField,
    updateElement,
    removeElement,
    setElementCharge,
    setElementMaterial,
    setElementTriggerAction,
  } = useTheaterStore();

  const selectedElement = project.elements.find(e => e.id === selectedElementId);

  if (!selectedElement) {
    return (
      <aside className="w-64 panel-bg border-l flex flex-col h-full">
        <div className="p-3 border-b border-theater-wood-light">
          <h2 className="font-display text-theater-brass-light text-sm font-bold tracking-wider uppercase">
            属性面板
          </h2>
        </div>
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center">
            <div className="text-4xl mb-3 opacity-20">🎯</div>
            <p className="text-theater-parchment/40 text-sm">选择舞台上的元素<br/>查看和编辑属性</p>
          </div>
        </div>
        <div className="p-3 border-t border-theater-wood-light space-y-3">
          <button
            onClick={toggleForceField}
            className={cn(
              'w-full py-2 px-3 rounded-md text-sm flex items-center justify-center gap-2 transition-all',
              showForceField
                ? 'bg-theater-electric/20 text-theater-electric border border-theater-electric/40'
                : 'bg-theater-dark/50 text-theater-parchment/60 border border-theater-wood-light'
            )}
          >
            <Zap className="w-4 h-4" />
            {showForceField ? '力场预览开启' : '力场预览关闭'}
          </button>
        </div>
      </aside>
    );
  }

  const isEditable = editorMode === 'edit';

  return (
    <aside className="w-64 panel-bg border-l flex flex-col h-full">
      <div className="p-3 border-b border-theater-wood-light">
        <h2 className="font-display text-theater-brass-light text-sm font-bold tracking-wider uppercase">
          属性面板
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin p-3 space-y-4">
        <div>
          <label className="text-xs text-theater-parchment/60 uppercase tracking-wide mb-1 block">
            名称
          </label>
          <input
            type="text"
            value={selectedElement.name}
            onChange={(e) => updateElement(selectedElement.id, { name: e.target.value })}
            disabled={!isEditable}
            className="w-full bg-theater-dark/60 border border-theater-wood-light rounded-md px-3 py-1.5 text-sm text-theater-parchment focus:border-theater-brass outline-none disabled:opacity-50"
          />
        </div>

        <div>
          <label className="text-xs text-theater-parchment/60 uppercase tracking-wide mb-2 block">
            电荷极性
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(['positive', 'negative', 'neutral'] as ChargePolarity[]).map((polarity) => {
              const isActive = selectedElement.charge.polarity === polarity;
              const color = CHARGE_COLORS[polarity];
              const icons = {
                positive: Plus,
                negative: Minus,
                neutral: CircleDot,
              };
              const labels = {
                positive: '正电荷',
                negative: '负电荷',
                neutral: '不带电',
              };
              const Icon = icons[polarity];

              return (
                <button
                  key={polarity}
                  onClick={() => setElementCharge(selectedElement.id, polarity)}
                  disabled={!isEditable}
                  className={cn(
                    'py-2 px-2 rounded-md text-xs flex flex-col items-center gap-1 transition-all border',
                    isActive
                      ? 'border-2'
                      : 'border-theater-wood-light bg-theater-dark/40 hover:border-theater-brass/50',
                    !isEditable && 'opacity-50 cursor-not-allowed'
                  )}
                  style={isActive ? { borderColor: color, backgroundColor: `${color}20` } : {}}
                >
                  <Icon
                    className="w-5 h-5"
                    style={{ color: isActive ? color : undefined }}
                  />
                  <span style={{ color: isActive ? color : undefined }}>
                    {labels[polarity]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="text-xs text-theater-parchment/60 uppercase tracking-wide mb-1 flex justify-between">
            <span>电荷强度</span>
            <span className="text-theater-brass-light">{selectedElement.charge.magnitude}</span>
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={selectedElement.charge.magnitude}
            onChange={(e) => setElementCharge(selectedElement.id, selectedElement.charge.polarity, parseInt(e.target.value))}
            disabled={!isEditable}
            className="w-full accent-theater-brass-light"
          />
          <div className="flex justify-between text-xs text-theater-parchment/40 mt-0.5">
            <span>弱</span>
            <span>强</span>
          </div>
        </div>

        {selectedElement.type === 'doll' && selectedElement.material && (
          <div>
            <label className="text-xs text-theater-parchment/60 uppercase tracking-wide mb-2 block">
              玩偶材质
            </label>
            <div className="space-y-2">
              {(Object.entries(DOLL_MATERIAL_PROPERTIES) as [DollMaterial, typeof DOLL_MATERIAL_PROPERTIES[DollMaterial]][]).map(([mat, props]) => (
                <button
                  key={mat}
                  onClick={() => setElementMaterial(selectedElement.id, mat)}
                  disabled={!isEditable}
                  className={cn(
                    'w-full p-2 rounded-md text-left flex items-center gap-3 transition-all border',
                    selectedElement.material === mat
                      ? 'border-theater-brass bg-theater-brass/10'
                      : 'border-theater-wood-light bg-theater-dark/40 hover:border-theater-brass/40',
                    !isEditable && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  <div
                    className="w-8 h-8 rounded-md border border-theater-wood-light"
                    style={{ backgroundColor: props.color }}
                  />
                  <div className="flex-1">
                    <div className="text-sm text-theater-parchment">{props.name}</div>
                    <div className="text-xs text-theater-parchment/50">
                      摩擦 {props.friction} · 导电 {props.conductivity}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {selectedElement.type === 'mechanism' && (
          <div>
            <label className="text-xs text-theater-parchment/60 uppercase tracking-wide mb-2 block">
              触发动作
            </label>
            <div className="space-y-1.5">
              {MECHANISM_ACTIONS.map((action) => (
                <button
                  key={action.value}
                  onClick={() => setElementTriggerAction(selectedElement.id, action.value)}
                  disabled={!isEditable}
                  className={cn(
                    'w-full py-1.5 px-3 rounded-md text-sm text-left transition-all border',
                    selectedElement.triggerAction === action.value
                      ? 'border-theater-brass bg-theater-brass/10 text-theater-brass-light'
                      : 'border-theater-wood-light bg-theater-dark/40 text-theater-parchment/80 hover:border-theater-brass/40',
                    !isEditable && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  {action.label}
                </button>
              ))}
            </div>

            <div className="mt-3">
              <label className="text-xs text-theater-parchment/60 uppercase tracking-wide mb-1 flex justify-between">
                <span>触发范围</span>
                <span className="text-theater-brass-light">{selectedElement.triggerDistance || 60}px</span>
              </label>
              <input
                type="range"
                min="30"
                max="150"
                value={selectedElement.triggerDistance || 60}
                onChange={(e) => updateElement(selectedElement.id, { triggerDistance: parseInt(e.target.value) })}
                disabled={!isEditable}
                className="w-full accent-theater-brass-light"
              />
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-theater-parchment/60 uppercase tracking-wide mb-1 block">
              位置 X
            </label>
            <input
              type="number"
              value={Math.round(selectedElement.x)}
              onChange={(e) => updateElement(selectedElement.id, { x: parseFloat(e.target.value) || 0 })}
              disabled={!isEditable}
              className="w-full bg-theater-dark/60 border border-theater-wood-light rounded-md px-2 py-1 text-sm text-theater-parchment text-center focus:border-theater-brass outline-none disabled:opacity-50"
            />
          </div>
          <div>
            <label className="text-xs text-theater-parchment/60 uppercase tracking-wide mb-1 block">
              位置 Y
            </label>
            <input
              type="number"
              value={Math.round(selectedElement.y)}
              onChange={(e) => updateElement(selectedElement.id, { y: parseFloat(e.target.value) || 0 })}
              disabled={!isEditable}
              className="w-full bg-theater-dark/60 border border-theater-wood-light rounded-md px-2 py-1 text-sm text-theater-parchment text-center focus:border-theater-brass outline-none disabled:opacity-50"
            />
          </div>
        </div>

        {!selectedElement.fixed && (
          <div>
            <label className="text-xs text-theater-parchment/60 uppercase tracking-wide mb-1 flex justify-between">
              <span>质量</span>
              <span className="text-theater-brass-light">{selectedElement.mass.toFixed(1)}</span>
            </label>
            <input
              type="range"
              min="0.5"
              max="10"
              step="0.5"
              value={selectedElement.mass}
              onChange={(e) => updateElement(selectedElement.id, { mass: parseFloat(e.target.value) })}
              disabled={!isEditable}
              className="w-full accent-theater-brass-light"
            />
          </div>
        )}

        <div className="pt-2 border-t border-theater-wood-light">
          <div className="text-xs text-theater-parchment/40 space-y-1">
            <div className="flex justify-between">
              <span>类型</span>
              <span className="text-theater-parchment/60">
                {selectedElement.type === 'doll' && '布偶'}
                {selectedElement.type === 'electrode' && '电极'}
                {selectedElement.type === 'metal' && '金属片'}
                {selectedElement.type === 'mechanism' && '机关'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>尺寸</span>
              <span className="text-theater-parchment/60">
                {selectedElement.width} × {selectedElement.height}
              </span>
            </div>
            <div className="flex justify-between">
              <span>状态</span>
              <span className={selectedElement.fixed ? 'text-theater-brass' : 'text-theater-electric'}>
                {selectedElement.fixed ? '固定' : '可移动'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {isEditable && (
        <div className="p-3 border-t border-theater-wood-light">
          <button
            onClick={() => removeElement(selectedElement.id)}
            className="w-full py-2 px-3 rounded-md text-sm bg-red-900/30 border border-red-700/40 text-red-400 hover:bg-red-900/50 transition-all flex items-center justify-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            删除元素
          </button>
        </div>
      )}
    </aside>
  );
}
