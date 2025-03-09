import { useState, useCallback, useEffect } from 'react';
import {
  getShopCache,
  setShopCache,
  clearShopCache,
  getLastRefreshTimestamp,
  setLastRefreshTimestamp,
  shouldRefreshCache,
  updateShopInCache,
  removeShopFromCache
} from '../utils/shopCacheUtils';

/**
 * Hook for managing shop data caching
 * 
 * Provides functionality for loading, updating, and managing cached shop data.
 * Handles cache retrieval, storage, and refresh logic.
 * 
 * @param {string} userId - The user ID
 * @returns {Object} Cache management functions and state
 */
export const useShopCache = (userId) => {
  const [cachedShops, setCachedShops] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Load shops from cache
   * @returns {Array|null} The cached shops or null if not found
   */
  const loadFromCache = useCallback(() => {
    if (!userId) {
      setCachedShops(null);
      setIsLoading(false);
      return null;
    }

    try {
      const shops = getShopCache(userId);
      setCachedShops(shops);
      setIsLoading(false);
      return shops;
    } catch (err) {
      console.error('Error loading from cache:', err);
      setError('Failed to load shops from cache');
      setIsLoading(false);
      return null;
    }
  }, [userId]);

  /**
   * Update the cache with new shop data
   * @param {Array} shops - The shop data to cache
   */
  const updateCache = useCallback((shops) => {
    if (!userId || !shops) return;

    try {
      setShopCache(userId, shops);
      setCachedShops(shops);
    } catch (err) {
      console.error('Error updating cache:', err);
      setError('Failed to update shop cache');
    }
  }, [userId]);

  /**
   * Update a single shop in the cache
   * @param {Object} shop - The shop to update
   * @returns {boolean} Whether the update was successful
   */
  const updateShopCache = useCallback((shop) => {
    if (!userId || !shop) return false;

    try {
      const success = updateShopInCache(userId, shop);
      
      if (success) {
        // Update the local state to reflect the change
        setCachedShops(prev => 
          prev ? prev.map(s => s.id === shop.id ? shop : s) : prev
        );
      }
      
      return success;
    } catch (err) {
      console.error('Error updating shop in cache:', err);
      setError('Failed to update shop in cache');
      return false;
    }
  }, [userId]);

  /**
   * Remove a shop from the cache
   * @param {string} shopId - The ID of the shop to remove
   * @returns {boolean} Whether the removal was successful
   */
  const removeFromCache = useCallback((shopId) => {
    if (!userId || !shopId) return false;

    try {
      const success = removeShopFromCache(userId, shopId);
      
      if (success) {
        // Update the local state to reflect the change
        setCachedShops(prev => 
          prev ? prev.filter(s => s.id !== shopId) : prev
        );
      }
      
      return success;
    } catch (err) {
      console.error('Error removing shop from cache:', err);
      setError('Failed to remove shop from cache');
      return false;
    }
  }, [userId]);

  /**
   * Clear the shop cache
   */
  const clearCache = useCallback(() => {
    if (!userId) return;

    try {
      clearShopCache(userId);
      setCachedShops(null);
    } catch (err) {
      console.error('Error clearing cache:', err);
      setError('Failed to clear shop cache');
    }
  }, [userId]);

  /**
   * Check if a refresh is needed based on cooldown
   * @param {number} cooldownSeconds - Cooldown period in seconds
   * @returns {boolean} Whether a refresh is needed
   */
  const isRefreshNeeded = useCallback((cooldownSeconds = 60) => {
    if (!userId) return true;
    return shouldRefreshCache(userId, cooldownSeconds);
  }, [userId]);

  /**
   * Mark the cache as refreshed
   */
  const markAsRefreshed = useCallback(() => {
    if (!userId) return;
    setLastRefreshTimestamp(userId);
  }, [userId]);

  /**
   * Get the last refresh timestamp
   * @returns {number|null} The timestamp or null if not found
   */
  const getLastRefresh = useCallback(() => {
    if (!userId) return null;
    return getLastRefreshTimestamp(userId);
  }, [userId]);

  // Load from cache on initial mount
  useEffect(() => {
    loadFromCache();
  }, [loadFromCache]);

  return {
    cachedShops,
    isLoading,
    error,
    loadFromCache,
    updateCache,
    updateShopCache,
    removeFromCache,
    clearCache,
    isRefreshNeeded,
    markAsRefreshed,
    getLastRefresh
  };
}; 