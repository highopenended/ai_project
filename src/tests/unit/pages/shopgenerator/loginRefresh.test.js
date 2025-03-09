/* global jest, describe, beforeEach, test, expect */
// eslint-disable-next-line no-unused-vars
import React from 'react';
import { render, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import ShopGenerator from '../../../../components/pages/shopgenerator/ShopGenerator';
import * as shopCacheUtils from '../../../../components/pages/shopgenerator/utils/shopCacheUtils';
import { useAuth } from '../../../../context/AuthContext';
import { setupTestSummary } from "../../../utils/test-summary";

// Setup test summary
setupTestSummary();

// Mock the AuthContext
jest.mock('../../../../context/AuthContext', () => ({
  useAuth: jest.fn()
}));

// Mock the ItemDataContext
jest.mock('../../../../context/itemData', () => ({
  useItemData: jest.fn(() => ({
    items: [],
    categoryData: { categories: [] },
    loading: false,
    error: null
  }))
}));

// Mock the shopCacheUtils
jest.mock('../../../../components/pages/shopgenerator/utils/shopCacheUtils', () => ({
  shouldRefreshCache: jest.fn(),
  setLastRefreshTimestamp: jest.fn(),
  clearShopCache: jest.fn(),
  getShopCache: jest.fn(),
  setShopCache: jest.fn()
}));

// Mock the useShopOperations hook
jest.mock('../../../../components/pages/shopgenerator/hooks/useShopOperations', () => {
  const mockHandleLoadShopList = jest.fn();
  
  return {
    useShopOperations: jest.fn(() => ({
      handleLoadShopList: mockHandleLoadShopList,
      handleLoadShop: jest.fn(),
      handleNewShop: jest.fn(),
      handleCloneShop: jest.fn(),
      handleSaveShop: jest.fn(),
      handleDeleteShop: jest.fn()
    })),
    // Expose the mock for testing
    getMockHandleLoadShopList: () => mockHandleLoadShopList
  };
});

// Mock other hooks
jest.mock('../../../../components/pages/shopgenerator/hooks/useShopState', () => ({
  useShopState: jest.fn(() => ({
    shopState: {},
    setShopState: jest.fn(),
    handleGoldChange: jest.fn(),
    handleLowestLevelChange: jest.fn(),
    handleHighestLevelChange: jest.fn(),
    handleBiasChange: jest.fn(),
    handleRarityDistributionChange: jest.fn(),
    handleShopDetailsChange: jest.fn(),
    handleRevertChanges: jest.fn()
  }))
}));

jest.mock('../../../../components/pages/shopgenerator/hooks/useShopFilters', () => ({
  useShopFilters: jest.fn(() => ({
    filterMaps: {},
    setFilterMaps: jest.fn(),
    getFilterState: jest.fn(),
    toggleCategory: jest.fn(),
    toggleSubcategory: jest.fn(),
    toggleTrait: jest.fn(),
    clearCategorySelections: jest.fn(),
    clearSubcategorySelections: jest.fn(),
    clearTraitSelections: jest.fn(),
    getFilteredArray: jest.fn()
  }))
}));

jest.mock('../../../../components/pages/shopgenerator/hooks/useShopSnapshot', () => ({
  useShopSnapshot: jest.fn(() => ({
    shopSnapshot: {},
    setShopSnapshot: jest.fn(),
    getChangedFields: jest.fn(),
    hasUnsavedChanges: false
  }))
}));

jest.mock('../../../../components/pages/shopgenerator/hooks/useInventoryGeneration', () => ({
  useInventoryGeneration: jest.fn(() => ({
    generateInventory: jest.fn(),
    isGenerating: false
  }))
}));

jest.mock('../../../../components/pages/shopgenerator/hooks/useTabManagement', () => ({
  useTabManagement: jest.fn(() => ({
    tabGroups: [[]],
    flexBasis: {},
    handleTabDragEnd: jest.fn(),
    handleTabClose: jest.fn(),
    handleTabAdd: jest.fn()
  }))
}));

jest.mock('../../../../components/pages/shopgenerator/hooks/useTabRegistry', () => ({
  useTabRegistry: jest.fn(() => ({}))
}));

// Mock the TabContainer component
jest.mock('../../../../components/pages/shopgenerator/shared/tab/TabContainer', () => ({
  __esModule: true,
  default: () => <div data-testid="tab-container">TabContainer</div>
}));

describe('ShopGenerator Login Refresh', () => {
  // Test data
  const testUser1 = { uid: 'test-user-1', email: 'user1@test.com' };
  const testUser2 = { uid: 'test-user-2', email: 'user2@test.com' };
  
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Default mock implementations
    shopCacheUtils.shouldRefreshCache.mockReturnValue(true);
    
    // Mock useAuth to return no user initially
    useAuth.mockReturnValue({
      currentUser: null,
      loading: false
    });
  });
  
  test('should refresh shop list on initial login', async () => {
    // First render with no user
    const { rerender } = render(<ShopGenerator />);
    
    // Get the handleLoadShopList mock
    const { getMockHandleLoadShopList } = require('../../../../components/pages/shopgenerator/hooks/useShopOperations');
    const mockHandleLoadShopList = getMockHandleLoadShopList();
    
    // Clear initial calls
    mockHandleLoadShopList.mockClear();
    
    // Mock shouldRefreshCache to return true (refresh needed)
    shopCacheUtils.shouldRefreshCache.mockReturnValue(true);
    
    // Simulate user login
    await act(async () => {
      useAuth.mockReturnValue({
        currentUser: testUser1,
        loading: false
      });
      rerender(<ShopGenerator />);
    });
    
    // Should check if refresh is needed
    expect(shopCacheUtils.shouldRefreshCache).toHaveBeenCalledWith(testUser1.uid, 60);
    
    // Should refresh shop list
    expect(mockHandleLoadShopList).toHaveBeenCalled();
    
    // Should update refresh timestamp
    expect(shopCacheUtils.setLastRefreshTimestamp).toHaveBeenCalledWith(testUser1.uid);
  });
  
  test('should not refresh when within cooldown period', async () => {
    // First render with no user
    const { rerender } = render(<ShopGenerator />);
    
    // Get the handleLoadShopList mock
    const { getMockHandleLoadShopList } = require('../../../../components/pages/shopgenerator/hooks/useShopOperations');
    const mockHandleLoadShopList = getMockHandleLoadShopList();
    
    // Clear initial calls
    mockHandleLoadShopList.mockClear();
    
    // Mock shouldRefreshCache to return false (within cooldown)
    shopCacheUtils.shouldRefreshCache.mockReturnValue(false);
    
    // Simulate user login
    await act(async () => {
      useAuth.mockReturnValue({
        currentUser: testUser1,
        loading: false
      });
      rerender(<ShopGenerator />);
    });
    
    // Should check if refresh is needed
    expect(shopCacheUtils.shouldRefreshCache).toHaveBeenCalledWith(testUser1.uid, 60);
    
    // Should not refresh shop list
    expect(mockHandleLoadShopList).not.toHaveBeenCalled();
    
    // Should not update refresh timestamp
    expect(shopCacheUtils.setLastRefreshTimestamp).not.toHaveBeenCalled();
  });
  
  test('should clear previous user cache when different user logs in', async () => {
    // First render with user1
    useAuth.mockReturnValue({
      currentUser: testUser1,
      loading: false
    });
    
    const { rerender } = render(<ShopGenerator />);
    
    // Clear initial calls
    jest.clearAllMocks();
    
    // Simulate different user login
    await act(async () => {
      useAuth.mockReturnValue({
        currentUser: testUser2,
        loading: false
      });
      rerender(<ShopGenerator />);
    });
    
    // Should clear previous user's cache
    expect(shopCacheUtils.clearShopCache).toHaveBeenCalledWith(testUser1.uid);
    
    // Should check if refresh is needed for new user
    expect(shopCacheUtils.shouldRefreshCache).toHaveBeenCalledWith(testUser2.uid, 60);
  });
  
  test('should not trigger refresh when auth is still loading', async () => {
    // First render with loading auth
    useAuth.mockReturnValue({
      currentUser: null,
      loading: true
    });
    
    const { rerender } = render(<ShopGenerator />);
    
    // Get the handleLoadShopList mock
    const { getMockHandleLoadShopList } = require('../../../../components/pages/shopgenerator/hooks/useShopOperations');
    const mockHandleLoadShopList = getMockHandleLoadShopList();
    
    // Clear initial calls
    mockHandleLoadShopList.mockClear();
    
    // Simulate auth still loading but with user
    await act(async () => {
      useAuth.mockReturnValue({
        currentUser: testUser1,
        loading: true
      });
      rerender(<ShopGenerator />);
    });
    
    // Should not check if refresh is needed
    expect(shopCacheUtils.shouldRefreshCache).not.toHaveBeenCalled();
    
    // Should not refresh shop list
    expect(mockHandleLoadShopList).not.toHaveBeenCalled();
  });
  
  test('should not trigger refresh for same user', async () => {
    // First render with user1
    useAuth.mockReturnValue({
      currentUser: testUser1,
      loading: false
    });
    
    const { rerender } = render(<ShopGenerator />);
    
    // Get the handleLoadShopList mock
    const { getMockHandleLoadShopList } = require('../../../../components/pages/shopgenerator/hooks/useShopOperations');
    const mockHandleLoadShopList = getMockHandleLoadShopList();
    
    // Clear initial calls
    mockHandleLoadShopList.mockClear();
    jest.clearAllMocks();
    
    // Simulate same user (component re-render)
    await act(async () => {
      useAuth.mockReturnValue({
        currentUser: testUser1,
        loading: false
      });
      rerender(<ShopGenerator />);
    });
    
    // Should not check if refresh is needed
    expect(shopCacheUtils.shouldRefreshCache).not.toHaveBeenCalled();
    
    // Should not refresh shop list
    expect(mockHandleLoadShopList).not.toHaveBeenCalled();
  });
}); 