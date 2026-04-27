import { useEffect, useRef, useState, useCallback } from 'react';

interface UseAutoSaveOptions<T> {
  data: T;
  key: string;
  delay?: number;
  onSave?: (data: T) => void | Promise<void>;
  onError?: (error: Error) => void;
}

interface UseAutoSaveReturn {
  status: 'idle' | 'saving' | 'saved' | 'error';
  lastSaved: Date | null;
  manualSave: () => Promise<void>;
  clearSaved: () => void;
}

export function useAutoSave<T>({
  data,
  key,
  delay = 500,
  onSave,
  onError,
}: UseAutoSaveOptions<T>): UseAutoSaveReturn {
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstRender = useRef(true);

  const saveToStorage = useCallback(async () => {
    try {
      setStatus('saving');
      
      // Save to localStorage
      const serialized = JSON.stringify(data);
      localStorage.setItem(key, serialized);
      localStorage.setItem(`${key}_timestamp`, new Date().toISOString());
      
      // Call custom save handler if provided
      if (onSave) {
        await onSave(data);
      }
      
      setStatus('saved');
      setLastSaved(new Date());
      
      // Reset to idle after 2 seconds
      setTimeout(() => setStatus('idle'), 2000);
    } catch (error) {
      console.error('Auto-save error:', error);
      setStatus('error');
      
      if (onError && error instanceof Error) {
        onError(error);
      }
      
      // Reset to idle after 3 seconds
      setTimeout(() => setStatus('idle'), 3000);
    }
  }, [data, key, onSave, onError]);

  const manualSave = useCallback(async () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    await saveToStorage();
  }, [saveToStorage]);

  const clearSaved = useCallback(() => {
    try {
      localStorage.removeItem(key);
      localStorage.removeItem(`${key}_timestamp`);
      setLastSaved(null);
      setStatus('idle');
    } catch (error) {
      console.error('Clear saved data error:', error);
    }
  }, [key]);

  // Auto-save effect
  useEffect(() => {
    // Skip first render to avoid saving initial/default data
    if (isFirstRender.current) {
      isFirstRender.current = false;
      
      // Load last saved timestamp
      try {
        const timestamp = localStorage.getItem(`${key}_timestamp`);
        if (timestamp) {
          setLastSaved(new Date(timestamp));
        }
      } catch (error) {
        console.error('Load timestamp error:', error);
      }
      
      return;
    }

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout for debounced save
    timeoutRef.current = setTimeout(() => {
      saveToStorage();
    }, delay);

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, delay, key, saveToStorage]);

  return {
    status,
    lastSaved,
    manualSave,
    clearSaved,
  };
}

// Helper function to load saved data
export function loadSavedData<T>(key: string, defaultValue: T): T {
  try {
    const saved = localStorage.getItem(key);
    if (saved) {
      return JSON.parse(saved) as T;
    }
  } catch (error) {
    console.error('Load saved data error:', error);
  }
  return defaultValue;
}
