import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Task } from '../QuestionsTypes';

export interface SaveQuizModalData {
  tasks: readonly Task[];
  sourceText: string;
  uploadedFileNames?: string[];
  onSaved?: () => void;
}

interface SaveQuizModalContextType {
  isOpen: boolean;
  modalData: SaveQuizModalData | null;
  openSaveQuizModal: (data: SaveQuizModalData) => void;
  closeSaveQuizModal: () => void;
}

const SaveQuizModalContext = createContext<SaveQuizModalContextType | null>(null);

export function SaveQuizModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [modalData, setModalData] = useState<SaveQuizModalData | null>(null);

  const openSaveQuizModal = useCallback((data: SaveQuizModalData) => {
    setModalData(data);
    setIsOpen(true);
  }, []);

  const closeSaveQuizModal = useCallback(() => {
    setIsOpen(false);
    // Clear data after a short delay to allow close animation
    setTimeout(() => setModalData(null), 200);
  }, []);

  return (
    <SaveQuizModalContext.Provider value={{ isOpen, modalData, openSaveQuizModal, closeSaveQuizModal }}>
      {children}
    </SaveQuizModalContext.Provider>
  );
}

export function useSaveQuizModal() {
  const context = useContext(SaveQuizModalContext);
  if (!context) {
    throw new Error('useSaveQuizModal must be used within a SaveQuizModalProvider');
  }
  return context;
}
