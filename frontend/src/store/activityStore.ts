import { create } from 'zustand';
import { Activity } from '../types';

interface ActivityState {
  activities: Activity[];
  loading: boolean;
  setActivities: (activities: Activity[]) => void;
  addActivity: (activity: Activity) => void;
  setLoading: (loading: boolean) => void;
  clear: () => void;
}

export const useActivityStore = create<ActivityState>((set) => ({
  activities: [],
  loading: false,

  setActivities: (activities) => set({ activities }),

  addActivity: (activity) => set((state) => ({
    activities: [activity, ...state.activities].slice(0, 50) // Keep only latest 50
  })),

  setLoading: (loading) => set({ loading }),

  clear: () => set({ activities: [], loading: false }),
}));
