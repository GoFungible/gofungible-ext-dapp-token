import { useEffect, useState, useCallback } from 'react';
import { DebugEvents } from './DebugEvents';
import { eventBus } from '../../core/EventBus';

interface ModuleSnapshot {
  id: string;
  name: string;
  state: unknown;
}

interface UseDebugReturn {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
  snapshots: ModuleSnapshot[];
  collecting: boolean;
  collect: () => void;
}

export function useDebug(): UseDebugReturn {
  const [isOpen, setIsOpen] = useState(false);
  const [snapshots, setSnapshots] = useState<ModuleSnapshot[]>([]);
  const [collecting, setCollecting] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen(prev => !prev), []);

  useEffect(() => {
    const handler = (data: unknown) => {
      const d = data as { correlation?: string; name?: string; state?: unknown; id?: string };
      if (!d || typeof d !== 'object') return;
      setSnapshots(prev => [
        ...prev,
        { id: d.id || d.name || 'module', name: d.name || d.id || 'module', state: d.state ?? null },
      ]);
    };
    eventBus.on(DebugEvents.STATE, handler);
    return () => eventBus.off(DebugEvents.STATE, handler);
  }, []);

  const collect = useCallback(() => {
    setCollecting(true);
    setSnapshots([]);
    const correlation = `debug-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    eventBus.emit(DebugEvents.COLLECT, { correlation });
    window.setTimeout(() => {
      setCollecting(false);
    }, 600);
  }, []);

  useEffect(() => {
    if (isOpen) {
      collect();
    }
  }, [isOpen, collect]);

  return {
    isOpen,
    open,
    close,
    toggle,
    snapshots,
    collecting,
    collect,
  };
}