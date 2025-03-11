import { useRef, useEffect, useCallback } from 'react';

/**
 * Custom hook to debounce function calls.
 * Prevents rapid-fire function execution by waiting for a pause in calls.
 * 
 * @param {Function} callback - The function to debounce
 * @param {number} delay - Delay in milliseconds before executing the function
 * @returns {Function} A debounced version of the callback
 */
function useDebounce(callback, delay) {
    const timeoutRef = useRef(null);

    useEffect(() => {
        // Cleanup on unmount
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    const debouncedCallback = useCallback((...args) => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
            callback(...args);
        }, delay);
    }, [callback, delay]);

    return debouncedCallback;
}

export default useDebounce; 