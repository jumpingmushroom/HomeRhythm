import { create } from 'zustand';
import { Household, HouseholdMember, HouseholdInvite } from '../types';

interface HouseholdState {
  household: Household | null;
  members: HouseholdMember[];
  invites: HouseholdInvite[];
  loading: boolean;
  setHousehold: (household: Household | null) => void;
  setMembers: (members: HouseholdMember[]) => void;
  setInvites: (invites: HouseholdInvite[]) => void;
  addInvite: (invite: HouseholdInvite) => void;
  removeInvite: (inviteId: number) => void;
  setLoading: (loading: boolean) => void;
  clear: () => void;
}

export const useHouseholdStore = create<HouseholdState>((set) => ({
  household: null,
  members: [],
  invites: [],
  loading: false,

  setHousehold: (household) => set({ household }),

  setMembers: (members) => set({ members }),

  setInvites: (invites) => set({ invites }),

  addInvite: (invite) => set((state) => ({
    invites: [...state.invites, invite]
  })),

  removeInvite: (inviteId) => set((state) => ({
    invites: state.invites.filter(i => i.id !== inviteId)
  })),

  setLoading: (loading) => set({ loading }),

  clear: () => set({
    household: null,
    members: [],
    invites: [],
    loading: false
  }),
}));
