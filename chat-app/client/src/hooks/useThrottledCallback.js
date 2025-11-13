import { useRef, useCallback } from 'react';

export const useThrottledCallback = (callback, delay) => {
  const lastExecuted = useRef(0);
  const timeoutRef = useRef();

  return useCallback((...args) => {
    const now = Date.now();
    const timeSinceLastExecution = now - lastExecuted.current;

    const execute = () => {
      lastExecuted.current = now;
      callback(...args);
    };

    if (timeSinceLastExecution >= delay) {
      execute();
    } else {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(execute, delay - timeSinceLastExecution);
    }
  }, [callback, delay]);
};