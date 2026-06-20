import { create } from 'zustand';
import type {
  StageElement,
  StageProject,
  ActionSequence,
  Keyframe,
  Review,
  FailureReplay,
  Particle,
  EditorMode,
  PlaybackState,
  ElementType,
  ChargePolarity,
  DollMaterial,
  MechanismAction,
} from '@/types';
import { generateId, loadProjects, saveProject, deleteProject, loadCurrentProjectId, saveCurrentProjectId } from '@/utils/storage';

interface TheaterState {
  project: StageProject;
  allProjects: StageProject[];
  editorMode: EditorMode;
  playbackState: PlaybackState;
  currentTime: number;
  selectedElementId: string | null;
  particles: Particle[];
  showForceField: boolean;
  showReviewModal: boolean;
  showProjectManager: boolean;
  showFailureReplay: boolean;
  currentReplay: FailureReplay | null;
  recordedFrames: Array<{ time: number; elements: StageElement[] }>;

  setEditorMode: (mode: EditorMode) => void;
  setPlaybackState: (state: PlaybackState) => void;
  setCurrentTime: (time: number) => void;
  setSelectedElement: (id: string | null) => void;
  toggleForceField: () => void;
  setShowReviewModal: (show: boolean) => void;
  setShowProjectManager: (show: boolean) => void;
  setShowFailureReplay: (show: boolean, replay?: FailureReplay) => void;

  addElement: (type: ElementType, x: number, y: number) => void;
  removeElement: (id: string) => void;
  updateElement: (id: string, updates: Partial<StageElement>) => void;
  moveElement: (id: string, x: number, y: number) => void;
  setElementCharge: (id: string, polarity: ChargePolarity, magnitude?: number) => void;
  setElementMaterial: (id: string, material: DollMaterial) => void;
  setElementTriggerAction: (id: string, action: MechanismAction) => void;
  updateParticles: (particles: Particle[]) => void;
  simulateTick: (dt: number, bounds: { width: number; height: number }, simulateFn: (elements: StageElement[], dt: number, bounds: { width: number; height: number }) => StageElement[]) => void;

  addSequence: (name: string) => void;
  removeSequence: (id: string) => void;
  addKeyframe: (sequenceId: string, elementId: string, time: number) => void;
  removeKeyframe: (keyframeId: string) => void;
  addRecordedFrame: (time: number, elements: StageElement[]) => void;
  clearRecordedFrames: () => void;

  saveCurrentProject: () => void;
  loadProject: (id: string) => void;
  createNewProject: (name: string) => void;
  deleteCurrentProject: () => void;
  refreshProjects: () => void;

  addReview: (rating: number, comment: string) => void;
  addFailureReplay: (reason: string, snapshot: StageElement[]) => void;
}

function createDefaultElements(): StageElement[] {
  return [];
}

function createDefaultProject(): StageProject {
  return {
    id: generateId(),
    name: '未命名剧场',
    elements: createDefaultElements(),
    sequences: [],
    reviews: [],
    failureReplays: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

function getElementDefaults(type: ElementType): Partial<StageElement> {
  switch (type) {
    case 'doll':
      return {
        name: '布偶',
        width: 50,
        height: 70,
        mass: 2,
        material: 'cotton',
        fixed: false,
      };
    case 'electrode':
      return {
        name: '电极',
        width: 40,
        height: 40,
        mass: 999,
        fixed: true,
      };
    case 'metal':
      return {
        name: '金属片',
        width: 60,
        height: 20,
        mass: 3,
        fixed: false,
      };
    case 'mechanism':
      return {
        name: '机关',
        width: 50,
        height: 50,
        mass: 999,
        fixed: true,
        triggerAction: 'none',
        triggerDistance: 60,
      };
  }
}

export const useTheaterStore = create<TheaterState>((set, get) => ({
  project: createDefaultProject(),
  allProjects: loadProjects(),
  editorMode: 'edit',
  playbackState: 'idle',
  currentTime: 0,
  selectedElementId: null,
  particles: [],
  showForceField: true,
  showReviewModal: false,
  showProjectManager: false,
  showFailureReplay: false,
  currentReplay: null,
  recordedFrames: [],

  setEditorMode: (mode) => set({ editorMode: mode }),
  setPlaybackState: (state) => set({ playbackState: state }),
  setCurrentTime: (time) => set({ currentTime: time }),
  setSelectedElement: (id) => set({ selectedElementId: id }),
  toggleForceField: () => set((s) => ({ showForceField: !s.showForceField })),
  setShowReviewModal: (show) => set({ showReviewModal: show }),
  setShowProjectManager: (show) => set({ showProjectManager: show }),
  setShowFailureReplay: (show, replay) => set({ showFailureReplay: show, currentReplay: replay || null }),

  addElement: (type, x, y) => {
    const defaults = getElementDefaults(type);
    const newElement: StageElement = {
      id: generateId(),
      type,
      x,
      y,
      rotation: 0,
      vx: 0,
      vy: 0,
      charge: { polarity: 'neutral', magnitude: 50 },
      ...defaults,
    } as StageElement;
    set((s) => ({
      project: { ...s.project, elements: [...s.project.elements, newElement], updatedAt: Date.now() },
      selectedElementId: newElement.id,
    }));
  },

  removeElement: (id) => {
    set((s) => ({
      project: {
        ...s.project,
        elements: s.project.elements.filter((e) => e.id !== id),
        updatedAt: Date.now(),
      },
      selectedElementId: s.selectedElementId === id ? null : s.selectedElementId,
    }));
  },

  updateElement: (id, updates) => {
    set((s) => ({
      project: {
        ...s.project,
        elements: s.project.elements.map((e) => (e.id === id ? { ...e, ...updates } : e)),
        updatedAt: Date.now(),
      },
    }));
  },

  moveElement: (id, x, y) => {
    get().updateElement(id, { x, y, vx: 0, vy: 0 });
  },

  setElementCharge: (id, polarity, magnitude) => {
    get().updateElement(id, {
      charge: {
        polarity,
        magnitude: magnitude ?? get().project.elements.find((e) => e.id === id)?.charge.magnitude ?? 50,
      },
    });
  },

  setElementMaterial: (id, material) => {
    get().updateElement(id, { material });
  },

  setElementTriggerAction: (id, action) => {
    get().updateElement(id, { triggerAction: action });
  },

  updateParticles: (particles) => set({ particles }),

  simulateTick: (dt, bounds, simulateFn) => {
    set((s) => {
      if (s.playbackState !== 'playing' && s.playbackState !== 'recording') return s;
      const newElements = simulateFn(s.project.elements, dt, bounds);
      return {
        project: { ...s.project, elements: newElements, updatedAt: Date.now() },
        currentTime: s.currentTime + dt * 1000,
      };
    });
  },

  addSequence: (name) => {
    const newSeq: ActionSequence = {
      id: generateId(),
      name,
      duration: 10000,
      keyframes: [],
    };
    set((s) => ({
      project: { ...s.project, sequences: [...s.project.sequences, newSeq], updatedAt: Date.now() },
    }));
  },

  removeSequence: (id) => {
    set((s) => ({
      project: {
        ...s.project,
        sequences: s.project.sequences.filter((seq) => seq.id !== id),
        updatedAt: Date.now(),
      },
    }));
  },

  addKeyframe: (sequenceId, elementId, time) => {
    const element = get().project.elements.find((e) => e.id === elementId);
    if (!element) return;
    const kf: Keyframe = {
      id: generateId(),
      time,
      elementId,
      x: element.x,
      y: element.y,
      chargePolarity: element.charge.polarity,
      chargeMagnitude: element.charge.magnitude,
    };
    set((s) => ({
      project: {
        ...s.project,
        sequences: s.project.sequences.map((seq) =>
          seq.id === sequenceId ? { ...seq, keyframes: [...seq.keyframes, kf].sort((a, b) => a.time - b.time) } : seq
        ),
        updatedAt: Date.now(),
      },
    }));
  },

  removeKeyframe: (keyframeId) => {
    set((s) => ({
      project: {
        ...s.project,
        sequences: s.project.sequences.map((seq) => ({
          ...seq,
          keyframes: seq.keyframes.filter((kf) => kf.id !== keyframeId),
        })),
        updatedAt: Date.now(),
      },
    }));
  },

  addRecordedFrame: (time, elements) => {
    set((s) => ({
      recordedFrames: [...s.recordedFrames, { time, elements: JSON.parse(JSON.stringify(elements)) }],
    }));
  },

  clearRecordedFrames: () => set({ recordedFrames: [], currentTime: 0 }),

  saveCurrentProject: () => {
    const { project } = get();
    saveProject(project);
    get().refreshProjects();
  },

  loadProject: (id) => {
    const projects = loadProjects();
    const project = projects.find((p) => p.id === id);
    if (project) {
      saveCurrentProjectId(id);
      set({
        project: JSON.parse(JSON.stringify(project)),
        selectedElementId: null,
        playbackState: 'idle',
        currentTime: 0,
        recordedFrames: [],
      });
    }
  },

  createNewProject: (name) => {
    const newProject: StageProject = {
      ...createDefaultProject(),
      name,
    };
    saveProject(newProject);
    saveCurrentProjectId(newProject.id);
    set({
      project: newProject,
      allProjects: loadProjects(),
      selectedElementId: null,
      playbackState: 'idle',
      currentTime: 0,
      recordedFrames: [],
    });
  },

  deleteCurrentProject: () => {
    const { project } = get();
    deleteProject(project.id);
    const remaining = loadProjects();
    if (remaining.length > 0) {
      get().loadProject(remaining[0].id);
    } else {
      const newProj = createDefaultProject();
      saveProject(newProj);
      set({ project: newProj, allProjects: [newProj] });
    }
  },

  refreshProjects: () => set({ allProjects: loadProjects() }),

  addReview: (rating, comment) => {
    const review: Review = {
      id: generateId(),
      rating,
      comment,
      createdAt: Date.now(),
    };
    set((s) => ({
      project: {
        ...s.project,
        reviews: [...s.project.reviews, review],
        updatedAt: Date.now(),
      },
    }));
    get().saveCurrentProject();
  },

  addFailureReplay: (reason, snapshot) => {
    const replay: FailureReplay = {
      id: generateId(),
      reason,
      snapshot: JSON.parse(JSON.stringify(snapshot)),
      recordedFrames: JSON.parse(JSON.stringify(get().recordedFrames)),
      createdAt: Date.now(),
    };
    set((s) => ({
      project: {
        ...s.project,
        failureReplays: [...s.project.failureReplays, replay],
        updatedAt: Date.now(),
      },
    }));
    get().saveCurrentProject();
  },
}));

const savedId = loadCurrentProjectId();
if (savedId) {
  const projects = loadProjects();
  const found = projects.find((p) => p.id === savedId);
  if (found) {
    useTheaterStore.setState({ project: JSON.parse(JSON.stringify(found)) });
  }
}
