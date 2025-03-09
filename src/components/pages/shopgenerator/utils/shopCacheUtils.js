/**
 * Shop Cache Utilities
 * 
 * Provides utility functions for caching shop data in local storage.
 * Handles cache retrieval, storage, and management of refresh timestamps.
 */

// Cache keys
const SHOP_CACHE_KEY_PREFIX = 'shopCache';
const REFRESH_TIMESTAMP_KEY_PREFIX = 'shopRefreshTimestamp';

/**
 * Get the cache key for a specific user
 * @param {string} userId - The user ID
 * @returns {string} The cache key
 */
const getShopCacheKey = (userId) => `${SHOP_CACHE_KEY_PREFIX}_${userId}`;

/**
 * Get the refresh timestamp key for a specific user
 * @param {string} userId - The user ID
 * @returns {string} The refresh timestamp key
 */
const getRefreshTimestampKey = (userId) => `${REFRESH_TIMESTAMP_KEY_PREFIX}_${userId}`;

/**
 * Get cached shop data for a user
 * @param {string} userId - The user ID
 * @returns {Array|null} The cached shop data or null if not found
 */
export const getShopCache = (userId) => {
  if (!userId) return null;
  
  try {
    const cacheKey = getShopCacheKey(userId);
    const cachedData = localStorage.getItem(cacheKey);
    
    if (!cachedData) return null;
    
    const parsedData = JSON.parse(cachedData);
    return parsedData.shops || null;
  } catch (error) {
    console.error('Error retrieving shop cache:', error);
    return null;
  }
};

/**
 * Set cached shop data for a user
 * @param {string} userId - The user ID
 * @param {Array} shops - The shop data to cache
 */
export const setShopCache = (userId, shops) => {
  if (!userId) return;
  
  try {
    const cacheKey = getShopCacheKey(userId);
    const cacheData = {
      userId,
      shops,
      cacheVersion: 1, // For future schema changes
      timestamp: Date.now()
    };
    
    localStorage.setItem(cacheKey, JSON.stringify(cacheData));
  } catch (error) {
    console.error('Error setting shop cache:', error);
  }
};

/**
 * Clear cached shop data for a user
 * @param {string} userId - The user ID
 */
export const clearShopCache = (userId) => {
  if (!userId) return;
  
  try {
    const cacheKey = getShopCacheKey(userId);
    localStorage.removeItem(cacheKey);
  } catch (error) {
    console.error('Error clearing shop cache:', error);
  }
};

/**
 * Get the last refresh timestamp for a user
 * @param {string} userId - The user ID
 * @returns {number|null} The timestamp or null if not found
 */
export const getLastRefreshTimestamp = (userId) => {
  if (!userId) return null;
  
  try {
    const timestampKey = getRefreshTimestampKey(userId);
    const timestamp = localStorage.getItem(timestampKey);
    
    return timestamp ? parseInt(timestamp, 10) : null;
  } catch (error) {
    console.error('Error retrieving refresh timestamp:', error);
    return null;
  }
};

/**
 * Set the last refresh timestamp for a user
 * @param {string} userId - The user ID
 */
export const setLastRefreshTimestamp = (userId) => {
  if (!userId) return;
  
  try {
    const timestampKey = getRefreshTimestampKey(userId);
    localStorage.setItem(timestampKey, Date.now().toString());
  } catch (error) {
    console.error('Error setting refresh timestamp:', error);
  }
};

/**
 * Check if the cache should be refreshed based on cooldown
 * @param {string} userId - The user ID
 * @param {number} cooldownSeconds - Cooldown period in seconds
 * @returns {boolean} Whether the cache should be refreshed
 */
export const shouldRefreshCache = (userId, cooldownSeconds = 60) => {
  if (!userId) return true;
  
  try {
    const lastRefresh = getLastRefreshTimestamp(userId);
    
    // If no previous refresh, should refresh
    if (!lastRefresh) return true;
    
    // Check if cooldown period has passed
    const cooldownMs = cooldownSeconds * 1000;
    const timeSinceLastRefresh = Date.now() - lastRefresh;
    
    return timeSinceLastRefresh > cooldownMs;
  } catch (error) {
    console.error('Error checking refresh status:', error);
    return true; // Default to refresh on error
  }
};

/**
 * Update a specific shop in the cache
 * @param {string} userId - The user ID
 * @param {Object} shop - The shop to update
 * @returns {boolean} Whether the update was successful
 */
export const updateShopInCache = (userId, shop) => {
  if (!userId || !shop || !shop.id) return false;
  
  try {
    const shops = getShopCache(userId);
    
    if (!shops) return false;
    
    // Check if the shop exists in the cache
    const shopExists = shops.some(s => s.id === shop.id);
    if (!shopExists) return false;
    
    // Find and update the shop
    const updatedShops = shops.map(s => 
      s.id === shop.id ? shop : s
    );
    
    setShopCache(userId, updatedShops);
    return true;
  } catch (error) {
    console.error('Error updating shop in cache:', error);
    return false;
  }
};

/**
 * Remove a shop from the cache
 * @param {string} userId - The user ID
 * @param {string} shopId - The ID of the shop to remove
 * @returns {boolean} Whether the removal was successful
 */
export const removeShopFromCache = (userId, shopId) => {
  if (!userId || !shopId) return false;
  
  try {
    const shops = getShopCache(userId);
    
    if (!shops) return false;
    
    // Check if the shop exists in the cache
    const shopExists = shops.some(s => s.id === shopId);
    if (!shopExists) return false;
    
    // Filter out the shop to remove
    const updatedShops = shops.filter(s => s.id !== shopId);
    
    setShopCache(userId, updatedShops);
    return true;
  } catch (error) {
    console.error('Error removing shop from cache:', error);
    return false;
  }
};