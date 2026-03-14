import { create } from 'zustand'

type ViewMode = 'grid' | 'list'

interface UiState {
  isAddBookModalOpen: boolean
  viewMode: ViewMode
  openAddBookModal: () => void
  closeAddBookModal: () => void
  setViewMode: (mode: ViewMode) => void
}

export const useUiStore = create<UiState>((set) => ({
  isAddBookModalOpen: false,
  viewMode: 'grid',
  openAddBookModal: () => set({ isAddBookModalOpen: true }),
  closeAddBookModal: () => set({ isAddBookModalOpen: false }),
  setViewMode: (mode) => set({ viewMode: mode }),
}))
