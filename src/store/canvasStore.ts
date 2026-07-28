import { create } from "zustand";
import { Tool, Stroke, LaserPoint } from "@/types/drawing";
import { User } from "@/types/user";

interface CanvasStore {
  roomId: string | null;
  tool: Tool;
  color: string;
  size: number;
  strokes: Stroke[];
  history: Stroke[][];
  historyIndex: number;

  // Laser Trails State (userId -> LaserPoint[])
  laserTrails: Record<string, LaserPoint[]>;

  // Collaborative Presence State
  currentUser: User | null;
  users: User[];
  cursors: Record<string, { x: number; y: number; name: string; color: string }>;

  setRoomId: (roomId: string) => void;
  setTool: (tool: Tool) => void;
  setColor: (color: string) => void;
  setSize: (size: number) => void;
  setStrokes: (strokes: Stroke[]) => void;
  addStroke: (stroke: Stroke) => void;
  clearCanvas: () => void;
  undo: () => void;
  redo: () => void;

  // Laser Trail Actions
  addLaserPoints: (userId: string, points: LaserPoint[]) => void;
  setLaserPoints: (userId: string, points: LaserPoint[]) => void;
  clearLaserTrail: (userId: string) => void;

  // Collaborative Presence Actions
  setCurrentUser: (user: User) => void;
  setUsers: (users: User[]) => void;
  updateCursor: (userId: string, cursor: { x: number; y: number; name: string; color: string }) => void;
  removeCursor: (userId: string) => void;
  
  // Collaborative Sync Actions (do not affect local undo/redo history)
  addRemoteStroke: (stroke: Stroke) => void;
  removeRemoteStroke: (strokeId: string) => void;
  clearRemoteCanvas: () => void;

}

export const useCanvasStore = create<CanvasStore>((set) => ({
  roomId: null,
  tool: "pen",
  color: "#d2bbff", // default neon violet
  size: 4,
  strokes: [],
  history: [[]],
  historyIndex: 0,

  laserTrails: {},

  currentUser: null,
  users: [],
  cursors: {},
  setRoomId: (roomId) => set({ roomId }),
  setTool: (tool) => set({ tool }),
  setColor: (color) => set({ color }),
  setSize: (size) => set({ size }),
  
  addLaserPoints: (userId, points) => set((state) => {
    const existing = state.laserTrails[userId] || [];
    return {
      laserTrails: {
        ...state.laserTrails,
        [userId]: [...existing, ...points],
      },
    };
  }),

  setLaserPoints: (userId, points) => set((state) => ({
    laserTrails: {
      ...state.laserTrails,
      [userId]: points,
    },
  })),

  clearLaserTrail: (userId) => set((state) => {
    const newTrails = { ...state.laserTrails };
    delete newTrails[userId];
    return { laserTrails: newTrails };
  }),

  
  setStrokes: (strokes) => set((state) => {
    const newHistory = state.history.slice(0, state.historyIndex + 1);
    return {
      strokes,
      history: [...newHistory, strokes],
      historyIndex: newHistory.length,
    };
  }),

  addStroke: (stroke) => set((state) => {
    const newStrokes = [...state.strokes, stroke];
    const newHistory = state.history.slice(0, state.historyIndex + 1);
    return {
      strokes: newStrokes,
      history: [...newHistory, newStrokes],
      historyIndex: newHistory.length,
    };
  }),

  clearCanvas: () => set((state) => {
    if (state.strokes.length === 0) return {};
    const newHistory = state.history.slice(0, state.historyIndex + 1);
    return {
      strokes: [],
      history: [...newHistory, []],
      historyIndex: newHistory.length,
    };
  }),

  undo: () => set((state) => {
    if (state.historyIndex > 0) {
      const prevIndex = state.historyIndex - 1;
      return {
        historyIndex: prevIndex,
        strokes: state.history[prevIndex],
      };
    }
    return {};
  }),

  redo: () => set((state) => {
    if (state.historyIndex < state.history.length - 1) {
      const nextIndex = state.historyIndex + 1;
      return {
        historyIndex: nextIndex,
        strokes: state.history[nextIndex],
      };
    }
    return {};
  }),

  // Presence Setters
  setCurrentUser: (user) => set({ currentUser: user }),
  setUsers: (users) => set({ users }),
  
  updateCursor: (userId, cursor) => set((state) => ({
    cursors: {
      ...state.cursors,
      [userId]: cursor,
    },
  })),

  removeCursor: (userId) => set((state) => {
    const newCursors = { ...state.cursors };
    delete newCursors[userId];
    return { cursors: newCursors };
  }),

  // Remote updates (do not alter local undo/redo stacks)
  addRemoteStroke: (stroke) => set((state) => ({
    strokes: [...state.strokes, stroke],
  })),

  removeRemoteStroke: (strokeId) => set((state) => ({
    strokes: state.strokes.filter((s) => s.id !== strokeId),
  })),

  clearRemoteCanvas: () => set({
    strokes: [],
  }),

}));
