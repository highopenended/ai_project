/* global jest, describe, test, expect, beforeEach */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import GoldInput from '../../../../components/pages/shopgenerator/tabs/tab_parameters/goldinput/GoldInput';
import LevelInput from '../../../../components/pages/shopgenerator/tabs/tab_parameters/levelinput/LevelInput';
import { setupTestSummary } from "../../../utils/test-summary";

// Setup test summary
setupTestSummary();

// Mock the useShopSnapshot hook
jest.mock('../../../../components/pages/shopgenerator/hooks/useShopSnapshot', () => ({
  useShopSnapshot: jest.fn(() => ({
    shopSnapshot: { gold: 5000, levelRange: { min: 1, max: 10 } },
    setShopSnapshot: jest.fn(),
    hasUnsavedChanges: true,
    getChangedFields: jest.fn()
  }))
}));

describe('Shop Snapshot Behavior', () => {
  // Mock functions for testing
  const mockSetCurrentGold = jest.fn();
  const mockSetLowestLevel = jest.fn();
  const mockSetHighestLevel = jest.fn();
  const mockSetShopSnapshot = jest.fn();
  
  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GoldInput Component', () => {
    test('updates shopState but not shopSnapshot', () => {
      // Get the mock implementation
      const useShopSnapshotMock = require('../../../../components/pages/shopgenerator/hooks/useShopSnapshot').useShopSnapshot;
      
      // Override the mock implementation for this test
      useShopSnapshotMock.mockReturnValue({
        shopSnapshot: { gold: 5000 },
        setShopSnapshot: mockSetShopSnapshot,
        hasUnsavedChanges: false,
        getChangedFields: jest.fn()
      });
      
      render(<GoldInput setCurrentGold={mockSetCurrentGold} currentGold={5000} />);
      
      const input = screen.getByRole('textbox');
      
      // Change the gold value
      fireEvent.change(input, { target: { value: '10000' } });
      fireEvent.blur(input);
      
      // Verify shopState was updated
      expect(mockSetCurrentGold).toHaveBeenCalledWith(10000);
      
      // Verify shopSnapshot was NOT updated
      expect(mockSetShopSnapshot).not.toHaveBeenCalled();
    });
  });

  describe('LevelInput Component', () => {
    test('updates shopState but not shopSnapshot', () => {
      // Get the mock implementation
      const useShopSnapshotMock = require('../../../../components/pages/shopgenerator/hooks/useShopSnapshot').useShopSnapshot;
      
      // Override the mock implementation for this test
      useShopSnapshotMock.mockReturnValue({
        shopSnapshot: { levelRange: { min: 1, max: 10 } },
        setShopSnapshot: mockSetShopSnapshot,
        hasUnsavedChanges: false,
        getChangedFields: jest.fn()
      });
      
      render(
        <LevelInput 
          lowestLevel={1} 
          highestLevel={10} 
          setLowestLevel={mockSetLowestLevel} 
          setHighestLevel={mockSetHighestLevel} 
        />
      );
      
      const inputs = screen.getAllByRole('textbox');
      const lowestInput = inputs[0];
      const highestInput = inputs[1];
      
      // Change the level values
      fireEvent.change(lowestInput, { target: { value: '5' } });
      fireEvent.blur(lowestInput);
      
      fireEvent.change(highestInput, { target: { value: '15' } });
      fireEvent.blur(highestInput);
      
      // Verify shopState was updated
      expect(mockSetLowestLevel).toHaveBeenCalledWith(5);
      expect(mockSetHighestLevel).toHaveBeenCalledWith(15);
      
      // Verify shopSnapshot was NOT updated
      expect(mockSetShopSnapshot).not.toHaveBeenCalled();
    });
  });
}); 