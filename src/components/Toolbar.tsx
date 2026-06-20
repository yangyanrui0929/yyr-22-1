import { User, Zap, RectangleHorizontal, Settings2 } from 'lucide-react';
import type { ElementType } from '@/types';
import { useTheaterStore } from '@/store';
import { useState } from 'react';

interface ToolItem {
  type: ElementType;
  name: string;
  icon: typeof User;
  description: string;
}

const tools: ToolItem[] = [
  { type: 'doll', name: '布偶', icon: User, description: '可移动的表演角色' },
  { type: 'electrode', name: '电极', icon: Zap, description: '固定的正负极电源' },
  { type: 'metal', name: '金属片', icon: RectangleHorizontal, description: '可传导电荷的金属片' },
  { type: 'mechanism', name: '机关', icon: Settings2, description: '可被触发的舞台装置' },
];

export default function Toolbar() {
  const { addElement, editorMode } = useTheaterStore();
  const [hoveredTool, setHoveredTool] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, type: ElementType) => {
    e.dataTransfer.setData('elementType', type);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleClick = (type: ElementType) => {
    if (editorMode !== 'edit') return;
    addElement(type, 400, 300);
  };

  return (
    <aside className="w-48 panel-bg border-r flex flex-col h-full">
      <div className="p-3 border-b border-theater-wood-light">
        <h2 className="font-display text-theater-brass-light text-sm font-bold tracking-wider uppercase">
          元素库
        </h2>
        <p className="text-xs text-theater-parchment/50 mt-1">拖拽或点击添加</p>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin p-3 space-y-3">
        {tools.map((tool) => {
          const Icon = tool.icon;
          const isHovered = hoveredTool === tool.type;
          return (
            <div
              key={tool.type}
              draggable={editorMode === 'edit'}
              onDragStart={(e) => handleDragStart(e, tool.type)}
              onMouseEnter={() => setHoveredTool(tool.type)}
              onMouseLeave={() => setHoveredTool(null)}
              onClick={() => handleClick(tool.type)}
              className={`element-card p-3 rounded-lg border cursor-grab active:cursor-grabbing ${
                editorMode === 'edit'
                  ? 'border-theater-wood-light bg-theater-dark/60 hover:border-theater-brass/60'
                  : 'border-theater-wood-light/50 bg-theater-dark/30 opacity-50 cursor-not-allowed'
              } ${isHovered && editorMode === 'edit' ? 'active' : ''}`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-theater-wood to-theater-dark flex items-center justify-center brass-border">
                  <Icon className="w-5 h-5 text-theater-brass-light" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-theater-parchment">{tool.name}</div>
                </div>
              </div>
              {isHovered && (
                <p className="mt-2 text-xs text-theater-parchment/60 leading-relaxed">
                  {tool.description}
                </p>
              )}
            </div>
          );
        })}
      </div>

      <div className="p-3 border-t border-theater-wood-light">
        <div className="text-xs text-theater-parchment/50 text-center">
          编辑模式下可拖拽元素到舞台
        </div>
      </div>
    </aside>
  );
}
