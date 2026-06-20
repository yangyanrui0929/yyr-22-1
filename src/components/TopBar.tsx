import { Sparkles, Save, FolderOpen, Plus, Edit3, Theater } from 'lucide-react';
import { useTheaterStore } from '@/store';
import { cn } from '@/lib/utils';

export default function TopBar() {
  const {
    project,
    editorMode,
    setEditorMode,
    saveCurrentProject,
    setShowProjectManager,
    createNewProject,
  } = useTheaterStore();

  const handleNewProject = () => {
    const name = prompt('请输入新剧场名称：', '新剧场');
    if (name?.trim()) {
      createNewProject(name.trim());
    }
  };

  return (
    <header className="wood-bg h-14 flex items-center justify-between px-4 brass-border border-t-0 border-l-0 border-r-0 relative z-20">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Theater className="w-7 h-7 text-theater-brass-light" strokeWidth={1.5} />
          <h1 className="font-display text-xl font-bold text-theater-brass-light tracking-wide">
            静电玩偶剧场
          </h1>
        </div>
        <div className="w-px h-6 bg-theater-wood-light mx-2" />
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={project.name}
            onChange={(e) => useTheaterStore.setState({ project: { ...project, name: e.target.value } })}
            className="bg-transparent text-theater-parchment/90 border-b border-theater-brass/30 focus:border-theater-brass outline-none px-1 py-0.5 text-sm w-36 font-display"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1 bg-theater-dark/50 rounded-lg p-1 brass-border">
          <button
            onClick={() => setEditorMode('edit')}
            className={cn(
              'px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-1.5 transition-all',
              editorMode === 'edit'
                ? 'bg-gradient-to-br from-theater-brass-light to-theater-brass text-theater-dark shadow-glow-gold'
                : 'text-theater-parchment/70 hover:text-theater-parchment'
            )}
          >
            <Edit3 className="w-4 h-4" />
            编辑
          </button>
          <button
            onClick={() => setEditorMode('perform')}
            className={cn(
              'px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-1.5 transition-all',
              editorMode === 'perform'
                ? 'bg-gradient-to-br from-theater-brass-light to-theater-brass text-theater-dark shadow-glow-gold'
                : 'text-theater-parchment/70 hover:text-theater-parchment'
            )}
          >
            <Sparkles className="w-4 h-4" />
            表演
          </button>
        </div>

        <div className="w-px h-6 bg-theater-wood-light" />

        <button
          onClick={handleNewProject}
          className="brass-btn px-3 py-1.5 rounded-md text-sm flex items-center gap-1.5"
          title="新建剧场"
        >
          <Plus className="w-4 h-4" />
        </button>
        <button
          onClick={() => setShowProjectManager(true)}
          className="brass-btn px-3 py-1.5 rounded-md text-sm flex items-center gap-1.5"
          title="打开方案"
        >
          <FolderOpen className="w-4 h-4" />
        </button>
        <button
          onClick={saveCurrentProject}
          className="brass-btn px-3 py-1.5 rounded-md text-sm flex items-center gap-1.5"
          title="保存方案"
        >
          <Save className="w-4 h-4" />
          保存
        </button>
      </div>
    </header>
  );
}
