/* global jest, describe, beforeEach, test, expect */
import { renderHook, act } from '@testing-library/react';
import { useShopOperations } from '../../../../components/pages/shopgenerator/hooks/useShopOperations';
import * as firebaseShopUtils from '../../../../components/pages/shopgenerator/utils/firebaseShopUtils';
import { useShopCache } from '../../../../components/pages/shopgenerator/hooks/useShopCache';
import { setupTestSummary } from "../../../utils/test-summary";

// Setup test summary
setupTestSummary();

// Mock window.alert
window.alert = jest.fn();

// Mock the firebaseShopUtils module
jest.mock('../../../../components/pages/shopgenerator/utils/firebaseShopUtils', () => {
  // Create a counter for Firebase calls
  let callCount = 0;
  
  return {
    loadShopData: jest.fn(() => {
      const originalCallCount = callCount;
      Object.defineProperty(this, 'callCount', {
        get: jest.fn().mockReturnValue(originalCallCount + 1)
      });
      return Promise.resolve([
        { id: 'shop1', name: 'Test Shop 1' },
        { id: 'shop2', name: 'Test Shop 2' }
      ]);
    }),
    saveOrUpdateShopData: jest.fn(() => {
      const originalCallCount = callCount;
      Object.defineProperty(this, 'callCount', {
        get: jest.fn().mockReturnValue(originalCallCount + 1)
      });
      return Promise.resolve('shop1');
    }),
    deleteShopData: jest.fn(() => {
      const originalCallCount = callCount;
      Object.defineProperty(this, 'callCount', {
        get: jest.fn().mockReturnValue(originalCallCount + 1)
      });
      return Promise.resolve();
    }),
    // Expose the call count for testing
    get callCount() {
      return callCount;
    },
    // Reset the call count
    resetCallCount() {
      callCount = 0;
    }
  };
});

// Mock the useShopCache hook
jest.mock('../../../../components/pages/shopgenerator/hooks/useShopCache', () => ({
  useShopCache: jest.fn()
}));

// Mock the takeShopSnapshot function
jest.mock('../../../../components/pages/shopgenerator/utils/shopStateUtils', () => ({
  takeShopSnapshot: jest.fn(data => data)
}));

// Mock the serializeShopData function
jest.mock('../../../../components/pages/shopgenerator/utils/serializationUtils', () => ({
  serializeShopData: jest.fn(data => data),
  deserializeAiConversations: jest.fn(data => data)
}));

describe('useShopOperations Hook', () => {
  // Test data
  const testUserId = 'test-user-123';
  const testShops = [
    { id: 'shop1', name: 'Test Shop 1' },
    { id: 'shop2', name: 'Test Shop 2' }
  ];
  const mockShopState = { id: 'shop1', name: 'Test Shop 1' };
  const mockFilterMaps = { categories: new Map() };
  const mockInventory = [];
  
  // Mock functions
  const mockSetShopState = jest.fn();
  const mockSetInventory = jest.fn();
  const mockSetShopSnapshot = jest.fn();
  const mockSetSavedShops = jest.fn();
  const mockSetFilterMaps = jest.fn();
  
  // Mock useShopCache return values
  const mockCachedShops = [...testShops];
  const mockUpdateCache = jest.fn();
  const mockUpdateShopCache = jest.fn();
  const mockRemoveFromCache = jest.fn();
  const mockIsRefreshNeeded = jest.fn();
  const mockMarkAsRefreshed = jest.fn();
  
  // Firebase call counter for testing
  let firebaseCallCount = 0;
  
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    firebaseCallCount = 0;
    
    // Reset Firebase call count
    if (firebaseShopUtils.resetCallCount) {
      firebaseShopUtils.resetCallCount();
    }
    
    // Setup default mock implementations
    firebaseShopUtils.loadShopData.mockImplementation(() => {
      firebaseCallCount++;
      return Promise.resolve(testShops);
    });
    
    firebaseShopUtils.saveOrUpdateShopData.mockImplementation((userId, shopData) => {
      firebaseCallCount++;
      return Promise.resolve(shopData.id);
    });
    
    firebaseShopUtils.deleteShopData.mockImplementation(() => {
      firebaseCallCount++;
      return Promise.resolve();
    });
    
    // Setup useShopCache mock
    useShopCache.mockReturnValue({
      cachedShops: mockCachedShops,
      updateCache: mockUpdateCache,
      updateShopCache: mockUpdateShopCache,
      removeFromCache: mockRemoveFromCache,
      isRefreshNeeded: mockIsRefreshNeeded,
      markAsRefreshed: mockMarkAsRefreshed
    });
    
    // Setup shopCacheUtils mocks
    mockIsRefreshNeeded.mockReturnValue(false); // Default to not needing refresh
  });

  const renderUseShopOperationsHook = (overrides = {}) => {
    const defaultProps = {
      currentUser: { uid: testUserId },
      shopState: mockShopState,
      setShopState: mockSetShopState,
      filterMaps: mockFilterMaps,
      inventory: mockInventory,
      setInventory: mockSetInventory,
      setShopSnapshot: mockSetShopSnapshot,
      setSavedShops: mockSetSavedShops,
      setFilterMaps: mockSetFilterMaps,
      hasUnsavedChanges: false
    };
    
    return renderHook(() => useShopOperations({
      ...defaultProps,
      ...overrides
    }));
  };

  describe('handleLoadShopList', () => {
    test('should use cache when available and refresh not needed', async () => {
      // Setup mocks
      mockIsRefreshNeeded.mockReturnValue(false);
      
      const { result } = renderUseShopOperationsHook();
      
      await act(async () => {
        await result.current.handleLoadShopList();
      });
      
      // Should use cached shops
      expect(mockSetSavedShops).toHaveBeenCalledWith(mockCachedShops);
      
      // Should not call Firebase
      expect(firebaseShopUtils.loadShopData).not.toHaveBeenCalled();
      expect(firebaseCallCount).toBe(0);
    });
    
    test('should load from Firebase when refresh is needed', async () => {
      // Setup mocks
      mockIsRefreshNeeded.mockReturnValue(true);
      
      const { result } = renderUseShopOperationsHook();
      
      await act(async () => {
        await result.current.handleLoadShopList();
      });
      
      // Should call Firebase
      expect(firebaseShopUtils.loadShopData).toHaveBeenCalledWith(testUserId);
      expect(firebaseCallCount).toBe(1);
      
      // Should update cache
      expect(mockUpdateCache).toHaveBeenCalled();
      expect(mockMarkAsRefreshed).toHaveBeenCalled();
    });
    
    test('should use cache when Firebase fails', async () => {
      // Setup mocks
      mockIsRefreshNeeded.mockReturnValue(true);
      firebaseShopUtils.loadShopData.mockImplementationOnce(() => {
        firebaseCallCount++;
        return Promise.reject(new Error('Firebase error'));
      });
      
      const { result } = renderUseShopOperationsHook();
      
      await act(async () => {
        await result.current.handleLoadShopList();
      });
      
      // Should try to call Firebase
      expect(firebaseShopUtils.loadShopData).toHaveBeenCalledWith(testUserId);
      expect(firebaseCallCount).toBe(1);
      
      // Should fall back to cache
      expect(mockSetSavedShops).toHaveBeenCalledWith(mockCachedShops);
    });
    
    test('should do nothing when no user is logged in', async () => {
      const { result } = renderUseShopOperationsHook({ currentUser: null });
      
      await act(async () => {
        await result.current.handleLoadShopList();
      });
      
      // Should not call Firebase or update state
      expect(firebaseShopUtils.loadShopData).not.toHaveBeenCalled();
      expect(mockSetSavedShops).not.toHaveBeenCalled();
      expect(firebaseCallCount).toBe(0);
    });
  });
  
  describe('handleSaveShop', () => {
    test('should save to Firebase and update cache on success', async () => {
      const { result } = renderUseShopOperationsHook();
      
      await act(async () => {
        await result.current.handleSaveShop();
      });
      
      // Should call Firebase
      expect(firebaseShopUtils.saveOrUpdateShopData).toHaveBeenCalled();
      expect(firebaseCallCount).toBe(1);
      
      // Should update local state
      expect(mockSetShopState).toHaveBeenCalled();
      
      // Should update cache
      expect(mockUpdateShopCache).toHaveBeenCalled();
    });
    
    test('should add new shop to cache if it does not exist', async () => {
      // Setup a new shop that doesn't exist in cache
      const newShopState = { id: 'new-shop', name: 'New Shop' };
      
      const { result } = renderUseShopOperationsHook({
        shopState: newShopState
      });
      
      await act(async () => {
        await result.current.handleSaveShop();
      });
      
      // Should call Firebase
      expect(firebaseShopUtils.saveOrUpdateShopData).toHaveBeenCalled();
      expect(firebaseCallCount).toBe(1);
      
      // Should update cache with new shop
      expect(mockUpdateCache).toHaveBeenCalled();
    });
    
    test('should not save when user is not logged in', async () => {
      const { result } = renderUseShopOperationsHook({ currentUser: null });
      
      await act(async () => {
        await result.current.handleSaveShop();
      });
      
      // Should not call Firebase
      expect(firebaseShopUtils.saveOrUpdateShopData).not.toHaveBeenCalled();
      expect(firebaseCallCount).toBe(0);
    });
    
    test('should handle Firebase save error', async () => {
      // Setup Firebase to fail
      firebaseShopUtils.saveOrUpdateShopData.mockImplementationOnce(() => {
        firebaseCallCount++;
        return Promise.reject(new Error('Firebase error'));
      });
      
      const { result } = renderUseShopOperationsHook();
      
      await act(async () => {
        await result.current.handleSaveShop();
      });
      
      // Should call Firebase
      expect(firebaseShopUtils.saveOrUpdateShopData).toHaveBeenCalled();
      expect(firebaseCallCount).toBe(1);
      
      // Should not update cache
      expect(mockUpdateShopCache).not.toHaveBeenCalled();
      expect(mockUpdateCache).not.toHaveBeenCalled();
    });
  });
  
  describe('handleDeleteShop', () => {
    test('should delete from Firebase and update cache on success', async () => {
      const { result } = renderUseShopOperationsHook();
      
      await act(async () => {
        await result.current.handleDeleteShop();
      });
      
      // Should call Firebase
      expect(firebaseShopUtils.deleteShopData).toHaveBeenCalledWith(testUserId, mockShopState.id);
      expect(firebaseCallCount).toBe(1);
      
      // Should update cache
      expect(mockRemoveFromCache).toHaveBeenCalledWith(mockShopState.id);
    });
    
    test('should load first remaining shop after deletion', async () => {
      // Setup remaining shops after deletion
      mockRemoveFromCache.mockImplementationOnce(() => {
        // Update cached shops to simulate removal
        mockCachedShops.splice(0, 1);
        return true;
      });
      
      const { result } = renderUseShopOperationsHook();
      
      await act(async () => {
        await result.current.handleDeleteShop();
      });
      
      // Should call Firebase
      expect(firebaseShopUtils.deleteShopData).toHaveBeenCalled();
      expect(firebaseCallCount).toBe(1);
      
      // Should update savedShops state
      expect(mockSetSavedShops).toHaveBeenCalled();
      
      // Should load the first remaining shop
      expect(mockSetShopState).toHaveBeenCalled();
    });
    
    test('should create new shop when no shops remain after deletion', async () => {
      // Setup empty shops after deletion
      mockRemoveFromCache.mockImplementationOnce(() => {
        // Clear cached shops to simulate removal of last shop
        mockCachedShops.length = 0;
        return true;
      });
      
      const { result } = renderUseShopOperationsHook();
      
      await act(async () => {
        await result.current.handleDeleteShop();
      });
      
      // Should call Firebase
      expect(firebaseShopUtils.deleteShopData).toHaveBeenCalled();
      expect(firebaseCallCount).toBe(1);
      
      // Should create a new shop
      expect(mockSetShopState).toHaveBeenCalled();
      expect(mockSetFilterMaps).toHaveBeenCalled();
      expect(mockSetInventory).toHaveBeenCalled();
    });
    
    test('should not delete when user is not logged in', async () => {
      const { result } = renderUseShopOperationsHook({ currentUser: null });
      
      await act(async () => {
        await result.current.handleDeleteShop();
      });
      
      // Should not call Firebase
      expect(firebaseShopUtils.deleteShopData).not.toHaveBeenCalled();
      expect(firebaseCallCount).toBe(0);
    });
    
    test('should handle Firebase delete error', async () => {
      // Setup Firebase to fail
      firebaseShopUtils.deleteShopData.mockImplementationOnce(() => {
        firebaseCallCount++;
        return Promise.reject(new Error('Firebase error'));
      });
      
      const { result } = renderUseShopOperationsHook();
      
      await act(async () => {
        await result.current.handleDeleteShop();
      });
      
      // Should call Firebase
      expect(firebaseShopUtils.deleteShopData).toHaveBeenCalled();
      expect(firebaseCallCount).toBe(1);
      
      // Should not update cache
      expect(mockRemoveFromCache).not.toHaveBeenCalled();
    });
  });
  
  // Test Firebase call counting
  describe('Firebase Call Counting', () => {
    test('should make exactly one Firebase call for save operation', async () => {
      const { result } = renderUseShopOperationsHook();
      
      await act(async () => {
        await result.current.handleSaveShop();
      });
      
      expect(firebaseCallCount).toBe(1);
    });
    
    test('should make exactly one Firebase call for delete operation', async () => {
      const { result } = renderUseShopOperationsHook();
      
      await act(async () => {
        await result.current.handleDeleteShop();
      });
      
      expect(firebaseCallCount).toBe(1);
    });
    
    test('should make zero Firebase calls when using cache', async () => {
      // Setup to use cache
      mockIsRefreshNeeded.mockReturnValue(false);
      
      const { result } = renderUseShopOperationsHook();
      
      await act(async () => {
        await result.current.handleLoadShopList();
      });
      
      expect(firebaseCallCount).toBe(0);
    });
    
    test('should make one Firebase call when refresh is needed', async () => {
      // Setup to refresh from Firebase
      mockIsRefreshNeeded.mockReturnValue(true);
      
      const { result } = renderUseShopOperationsHook();
      
      await act(async () => {
        await result.current.handleLoadShopList();
      });
      
      expect(firebaseCallCount).toBe(1);
    });
  });
}); 