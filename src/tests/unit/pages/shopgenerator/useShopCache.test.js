/* global jest, describe, beforeEach, test, expect */
import { renderHook, act } from '@testing-library/react';
import { useShopCache } from '../../../../components/pages/shopgenerator/hooks/useShopCache';
import * as shopCacheUtils from '../../../../components/pages/shopgenerator/utils/shopCacheUtils';
import { setupTestSummary } from "../../../utils/test-summary";

// Setup test summary
setupTestSummary();

// Mock the shopCacheUtils module
jest.mock('../../../../components/pages/shopgenerator/utils/shopCacheUtils', () => ({
  getShopCache: jest.fn(),
  setShopCache: jest.fn(),
  clearShopCache: jest.fn(),
  getLastRefreshTimestamp: jest.fn(),
  setLastRefreshTimestamp: jest.fn(),
  shouldRefreshCache: jest.fn(),
  updateShopInCache: jest.fn(),
  removeShopFromCache: jest.fn()
}));

describe('useShopCache Hook', () => {
  const testUserId = 'test-user-123';
  const testShops = [
    { id: 'shop1', name: 'Test Shop 1' },
    { id: 'shop2', name: 'Test Shop 2' }
  ];

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Default mock implementations
    shopCacheUtils.getShopCache.mockReturnValue(testShops);
    shopCacheUtils.updateShopInCache.mockReturnValue(true);
    shopCacheUtils.removeShopFromCache.mockReturnValue(true);
    shopCacheUtils.shouldRefreshCache.mockReturnValue(false);
    shopCacheUtils.getLastRefreshTimestamp.mockReturnValue(Date.now());
  });

  test('should initialize with null shops and loading state', () => {
    shopCacheUtils.getShopCache.mockReturnValueOnce(null);
    
    const { result } = renderHook(() => useShopCache(testUserId));
    
    expect(result.current.cachedShops).toBeNull();
    expect(result.current.isLoading).toBe(false); // Loading completes during initialization
    expect(result.current.error).toBeNull();
    expect(shopCacheUtils.getShopCache).toHaveBeenCalledWith(testUserId);
  });

  test('should load shops from cache on mount', () => {
    const { result } = renderHook(() => useShopCache(testUserId));
    
    expect(result.current.cachedShops).toEqual(testShops);
    expect(result.current.isLoading).toBe(false);
    expect(shopCacheUtils.getShopCache).toHaveBeenCalledWith(testUserId);
  });

  test('should handle error when loading from cache', () => {
    shopCacheUtils.getShopCache.mockImplementationOnce(() => {
      throw new Error('Test error');
    });
    
    const { result } = renderHook(() => useShopCache(testUserId));
    
    expect(result.current.cachedShops).toBeNull();
    expect(result.current.error).toBe('Failed to load shops from cache');
  });

  test('should update cache with new shops', () => {
    const { result } = renderHook(() => useShopCache(testUserId));
    
    const newShops = [...testShops, { id: 'shop3', name: 'Test Shop 3' }];
    
    act(() => {
      result.current.updateCache(newShops);
    });
    
    expect(shopCacheUtils.setShopCache).toHaveBeenCalledWith(testUserId, newShops);
  });

  test('should update a single shop in cache', () => {
    const { result } = renderHook(() => useShopCache(testUserId));
    
    const updatedShop = { id: 'shop1', name: 'Updated Shop 1' };
    
    act(() => {
      const success = result.current.updateShopCache(updatedShop);
      expect(success).toBe(true);
    });
    
    expect(shopCacheUtils.updateShopInCache).toHaveBeenCalledWith(testUserId, updatedShop);
  });

  test('should handle failure when updating a shop', () => {
    shopCacheUtils.updateShopInCache.mockReturnValueOnce(false);
    
    const { result } = renderHook(() => useShopCache(testUserId));
    
    act(() => {
      const success = result.current.updateShopCache({ id: 'non-existent', name: 'New Shop' });
      expect(success).toBe(false);
    });
  });

  test('should remove a shop from cache', () => {
    const { result } = renderHook(() => useShopCache(testUserId));
    
    act(() => {
      const success = result.current.removeFromCache('shop1');
      expect(success).toBe(true);
    });
    
    expect(shopCacheUtils.removeShopFromCache).toHaveBeenCalledWith(testUserId, 'shop1');
  });

  test('should handle failure when removing a shop', () => {
    shopCacheUtils.removeShopFromCache.mockReturnValueOnce(false);
    
    const { result } = renderHook(() => useShopCache(testUserId));
    
    act(() => {
      const success = result.current.removeFromCache('non-existent');
      expect(success).toBe(false);
    });
  });

  test('should clear the cache', () => {
    const { result } = renderHook(() => useShopCache(testUserId));
    
    act(() => {
      result.current.clearCache();
    });
    
    expect(shopCacheUtils.clearShopCache).toHaveBeenCalledWith(testUserId);
  });

  test('should check if refresh is needed', () => {
    const { result } = renderHook(() => useShopCache(testUserId));
    
    // Default mock returns false
    expect(result.current.isRefreshNeeded()).toBe(false);
    expect(shopCacheUtils.shouldRefreshCache).toHaveBeenCalledWith(testUserId, 60);
    
    // Change mock to return true
    shopCacheUtils.shouldRefreshCache.mockReturnValueOnce(true);
    expect(result.current.isRefreshNeeded(30)).toBe(true);
    expect(shopCacheUtils.shouldRefreshCache).toHaveBeenCalledWith(testUserId, 30);
  });

  test('should mark cache as refreshed', () => {
    const { result } = renderHook(() => useShopCache(testUserId));
    
    act(() => {
      result.current.markAsRefreshed();
    });
    
    expect(shopCacheUtils.setLastRefreshTimestamp).toHaveBeenCalledWith(testUserId);
  });

  test('should get last refresh timestamp', () => {
    const timestamp = Date.now();
    shopCacheUtils.getLastRefreshTimestamp.mockReturnValueOnce(timestamp);
    
    const { result } = renderHook(() => useShopCache(testUserId));
    
    expect(result.current.getLastRefresh()).toBe(timestamp);
    expect(shopCacheUtils.getLastRefreshTimestamp).toHaveBeenCalledWith(testUserId);
  });

  test('should handle null userId', () => {
    const { result } = renderHook(() => useShopCache(null));
    
    expect(result.current.cachedShops).toBeNull();
    
    // Test that operations don't fail with null userId
    act(() => {
      result.current.updateCache([]);
      result.current.updateShopCache({});
      result.current.removeFromCache('');
      result.current.clearCache();
      result.current.isRefreshNeeded();
      result.current.markAsRefreshed();
      result.current.getLastRefresh();
    });
    
    // None of these should throw errors
  });

  test('should update local state when updating shop cache', () => {
    const { result } = renderHook(() => useShopCache(testUserId));
    
    // Initial state
    expect(result.current.cachedShops).toEqual(testShops);
    
    // Update a shop
    const updatedShop = { id: 'shop1', name: 'Updated Shop 1' };
    
    act(() => {
      result.current.updateShopCache(updatedShop);
    });
    
    // Mock the updated cache that would be returned by getShopCache
    const updatedShops = [updatedShop, testShops[1]];
    shopCacheUtils.getShopCache.mockReturnValueOnce(updatedShops);
    
    // Reload from cache to verify state update
    act(() => {
      result.current.loadFromCache();
    });
    
    expect(result.current.cachedShops).toEqual(updatedShops);
  });

  test('should update local state when removing shop from cache', () => {
    const { result } = renderHook(() => useShopCache(testUserId));
    
    // Initial state
    expect(result.current.cachedShops).toEqual(testShops);
    
    // Remove a shop
    act(() => {
      result.current.removeFromCache('shop1');
    });
    
    // Mock the updated cache that would be returned by getShopCache
    const updatedShops = [testShops[1]];
    shopCacheUtils.getShopCache.mockReturnValueOnce(updatedShops);
    
    // Reload from cache to verify state update
    act(() => {
      result.current.loadFromCache();
    });
    
    expect(result.current.cachedShops).toEqual(updatedShops);
  });
}); 