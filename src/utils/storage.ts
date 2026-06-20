import type { StageProject } from '@/types';

const STORAGE_KEY = 'electrostatic-theater-projects';
const CURRENT_PROJECT_KEY = 'electrostatic-theater-current';

export function generateId(): string {
  return Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
}

export function loadProjects(): StageProject[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export function saveProjects(projects: StageProject[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  } catch (e) {
    console.error('Failed to save projects:', e);
  }
}

export function loadCurrentProjectId(): string | null {
  return localStorage.getItem(CURRENT_PROJECT_KEY);
}

export function saveCurrentProjectId(id: string | null): void {
  if (id) {
    localStorage.setItem(CURRENT_PROJECT_KEY, id);
  } else {
    localStorage.removeItem(CURRENT_PROJECT_KEY);
  }
}

export function saveProject(project: StageProject): void {
  const projects = loadProjects();
  const index = projects.findIndex(p => p.id === project.id);
  if (index >= 0) {
    projects[index] = { ...project, updatedAt: Date.now() };
  } else {
    projects.push(project);
  }
  saveProjects(projects);
}

export function deleteProject(projectId: string): void {
  const projects = loadProjects();
  const filtered = projects.filter(p => p.id !== projectId);
  saveProjects(filtered);
  const current = loadCurrentProjectId();
  if (current === projectId) {
    saveCurrentProjectId(null);
  }
}

export function exportProject(project: StageProject): string {
  return JSON.stringify(project, null, 2);
}

export function importProject(json: string): StageProject | null {
  try {
    const project = JSON.parse(json) as StageProject;
    if (project && project.id && Array.isArray(project.elements)) {
      return project;
    }
    return null;
  } catch {
    return null;
  }
}
