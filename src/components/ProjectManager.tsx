import { X, FolderOpen, Plus, Trash2, Download, Upload } from 'lucide-react';
import { useTheaterStore } from '@/store';
import type { StageProject } from '@/types';
import { exportProject, importProject, deleteProject as deleteProjectFromStorage, saveProject } from '@/utils/storage';

export default function ProjectManager() {
  const {
    allProjects,
    project,
    showProjectManager,
    setShowProjectManager,
    loadProject,
    createNewProject,
    deleteCurrentProject,
    refreshProjects,
  } = useTheaterStore();

  if (!showProjectManager) return null;

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleNewProject = () => {
    const name = prompt('请输入新剧场名称：', '新剧场');
    if (name?.trim()) {
      createNewProject(name.trim());
      setShowProjectManager(false);
    }
  };

  const handleDelete = (p: StageProject) => {
    if (confirm(`确定要删除 "${p.name}" 吗？此操作不可撤销。`)) {
      if (p.id === project.id) {
        deleteCurrentProject();
      } else {
        deleteProjectFromStorage(p.id);
        refreshProjects();
      }
    }
  };

  const handleExport = (p: StageProject) => {
    const data = exportProject(p);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${p.name}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const data = ev.target?.result as string;
        const imported = importProject(data);
        if (imported) {
          imported.id = Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
          imported.name = `${imported.name} (导入)`;
          saveProject(imported);
          refreshProjects();
          alert(`方案 "${imported.name}" 导入成功！`);
        } else {
          alert('导入失败：文件格式不正确');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={() => setShowProjectManager(false)}
    >
      <div
        className="w-[700px] max-h-[80vh] wood-bg brass-border rounded-xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-theater-wood-light">
          <div>
            <h3 className="font-display text-xl font-bold text-theater-brass-light flex items-center gap-2">
              <FolderOpen className="w-6 h-6" />
              舞台方案管理
            </h3>
            <p className="text-xs text-theater-parchment/50 mt-0.5">
              共 {allProjects.length} 个方案
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleImport}
              className="brass-btn px-3 py-1.5 rounded-md text-sm flex items-center gap-1.5"
            >
              <Upload className="w-4 h-4" />
              导入
            </button>
            <button
              onClick={handleNewProject}
              className="brass-btn px-3 py-1.5 rounded-md text-sm flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              新建
            </button>
            <button
              onClick={() => setShowProjectManager(false)}
              className="w-8 h-8 rounded-full flex items-center justify-center text-theater-parchment/60 hover:text-theater-parchment hover:bg-theater-wood-light/50 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin p-4">
          {allProjects.length === 0 ? (
            <div className="text-center py-16 text-theater-parchment/40">
              <div className="text-5xl mb-3 opacity-30">📁</div>
              <p>暂无保存的方案</p>
              <p className="text-sm mt-1">点击"新建"创建第一个剧场方案</p>
            </div>
          ) : (
            <div className="space-y-2">
              {[...allProjects].sort((a, b) => b.updatedAt - a.updatedAt).map((p) => (
                <div
                  key={p.id}
                  className={`p-4 rounded-lg border transition-all cursor-pointer ${
                    p.id === project.id
                      ? 'border-theater-brass bg-theater-brass/10'
                      : 'border-theater-wood-light bg-theater-dark/40 hover:border-theater-brass/50'
                  }`}
                  onClick={() => {
                    loadProject(p.id);
                    setShowProjectManager(false);
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-display text-lg text-theater-parchment">
                          {p.name}
                        </span>
                        {p.id === project.id && (
                          <span className="text-xs px-2 py-0.5 rounded bg-theater-brass/20 text-theater-brass-light">
                            当前
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-xs text-theater-parchment/50">
                        <span>{p.elements.length} 个元素</span>
                        <span>{p.sequences.length} 个序列</span>
                        <span>{p.reviews.length} 条评价</span>
                        <span>更新于 {formatDate(p.updatedAt)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleExport(p);
                        }}
                        className="w-8 h-8 rounded-md flex items-center justify-center text-theater-parchment/60 hover:text-theater-electric hover:bg-theater-electric/10 transition-colors"
                        title="导出方案"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(p);
                        }}
                        className="w-8 h-8 rounded-md flex items-center justify-center text-theater-parchment/60 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                        title="删除方案"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
