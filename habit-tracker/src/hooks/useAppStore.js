import { useState, useEffect, useCallback, useRef } from 'react';
import { loadData, saveData } from '../services/storage';

const DEFAULT_STATE = {
  habits: [],
  completions: {},
  timeBlocks: {},
  settings: {
    onboardingDone: false,
    notificationsEnabled: false,
    autostartEnabled: false,
  },
};

/**
 * Single source of truth persisted to data.json (Tauri) or localStorage (web).
 * API mirrors useState setters for drop-in use in App.jsx.
 */
export function useAppStore() {
  const [state, setState] = useState(DEFAULT_STATE);
  const [ready, setReady] = useState(false);
  const saveTimer = useRef(null);
  const skipFirstSave = useRef(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await loadData();
        if (!cancelled && data && typeof data === 'object') {
          setState({
            habits: Array.isArray(data.habits) ? data.habits : [],
            completions: data.completions && typeof data.completions === 'object' ? data.completions : {},
            timeBlocks: data.timeBlocks && typeof data.timeBlocks === 'object' ? data.timeBlocks : {},
            settings: {
              ...DEFAULT_STATE.settings,
              ...(data.settings && typeof data.settings === 'object' ? data.settings : {}),
            },
          });
        }
      } catch (e) {
        console.error('[Pulse] loadData error', e);
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Debounced persist
  useEffect(() => {
    if (!ready) return;
    if (skipFirstSave.current) {
      skipFirstSave.current = false;
      return;
    }
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveData(state).catch((e) => console.error('[Pulse] saveData', e));
    }, 300);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [state, ready]);

  const setHabits = useCallback((updater) => {
    setState((s) => ({
      ...s,
      habits: typeof updater === 'function' ? updater(s.habits) : updater,
    }));
  }, []);

  const setCompletions = useCallback((updater) => {
    setState((s) => ({
      ...s,
      completions: typeof updater === 'function' ? updater(s.completions) : updater,
    }));
  }, []);

  const setTimeBlocks = useCallback((updater) => {
    setState((s) => ({
      ...s,
      timeBlocks: typeof updater === 'function' ? updater(s.timeBlocks) : updater,
    }));
  }, []);

  const setSettings = useCallback((updater) => {
    setState((s) => ({
      ...s,
      settings: typeof updater === 'function' ? updater(s.settings) : updater,
    }));
  }, []);

  /** Replace entire store (import) */
  const replaceAll = useCallback((data) => {
    setState({
      habits: Array.isArray(data.habits) ? data.habits : [],
      completions: data.completions && typeof data.completions === 'object' ? data.completions : {},
      timeBlocks: data.timeBlocks && typeof data.timeBlocks === 'object' ? data.timeBlocks : {},
      settings: {
        ...DEFAULT_STATE.settings,
        ...(data.settings && typeof data.settings === 'object' ? data.settings : {}),
      },
    });
  }, []);

  return {
    ready,
    habits: state.habits,
    completions: state.completions,
    timeBlocks: state.timeBlocks,
    settings: state.settings,
    setHabits,
    setCompletions,
    setTimeBlocks,
    setSettings,
    replaceAll,
    getSnapshot: () => state,
  };
}
