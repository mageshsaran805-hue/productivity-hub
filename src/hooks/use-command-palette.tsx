"use client";

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";

interface CommandPaletteContextValue {
  paletteOpen: boolean;
  newTaskOpen: boolean;
  openPalette: () => void;
  closePalette: () => void;
  togglePalette: () => void;
  openNewTask: () => void;
  closeNewTask: () => void;
}

const CommandPaletteContext = createContext<CommandPaletteContextValue | null>(null);

export function CommandPaletteProvider({ children }: { children: ReactNode }) {
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [newTaskOpen, setNewTaskOpen] = useState(false);

  const openPalette = useCallback(() => setPaletteOpen(true), []);
  const closePalette = useCallback(() => setPaletteOpen(false), []);
  const togglePalette = useCallback(() => setPaletteOpen((prev) => !prev), []);
  const openNewTask = useCallback(() => setNewTaskOpen(true), []);
  const closeNewTask = useCallback(() => setNewTaskOpen(false), []);

  // Global Cmd/Ctrl+K shortcut — lives here (not in the palette) so it works
  // even before the palette's lazy-loaded code has been downloaded.
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setPaletteOpen(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <CommandPaletteContext.Provider
      value={{ paletteOpen, newTaskOpen, openPalette, closePalette, togglePalette, openNewTask, closeNewTask }}
    >
      {children}
    </CommandPaletteContext.Provider>
  );
}

export function useCommandPaletteContext() {
  const ctx = useContext(CommandPaletteContext);
  if (!ctx) throw new Error("useCommandPaletteContext must be used within CommandPaletteProvider");
  return ctx;
}