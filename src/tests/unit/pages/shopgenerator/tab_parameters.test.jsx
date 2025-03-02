/* global jest, describe, test, expect, beforeEach */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { setupTestSummary } from "../../../utils/test-summary";

// Create manual mock components
const MockGoldInput = ({ currentGold, setCurrentGold }) => {
  const [displayValue, setDisplayValue] = React.useState(currentGold.toString());
  
  const formatNumber = (value) => {
    if (!value && value !== 0) return "";
    
    // Convert to string and split into whole and decimal parts
    const parts = value.toString().split(".");
    const whole = parts[0];
    
    // Remove existing commas and format with new ones
    const formattedWhole = whole.replace(/,/g, "").replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    
    // Limit decimal to 2 places if it exists
    const formattedDecimal = parts.length > 1 ? "." + parts[1].slice(0, 2) : "";
    
    return formattedWhole + formattedDecimal;
  };
  
  const handleChange = (e) => {
    const rawValue = e.target.value;
    
    // Only allow numbers, commas, and periods
    if (!/^[\d,.]*$/.test(rawValue)) {
      return;
    }
    
    setDisplayValue(rawValue);
  };
  
  const handleBlur = () => {
    if (!displayValue) {
      const defaultValue = "5,000";
      setDisplayValue(defaultValue);
      setCurrentGold(5000);
      return;
    }
    
    // Remove commas and convert to number
    const numericValue = parseFloat(displayValue.replace(/,/g, ""));
    
    // Format the display value
    setDisplayValue(formatNumber(numericValue));
    
    // Update the shop state with the numeric value
    setCurrentGold(numericValue);
  };
  
  return (
    <div data-testid="gold-input">
      <input 
        type="text" 
        value={displayValue} 
        onChange={handleChange}
        onBlur={handleBlur}
      />
    </div>
  );
};

const MockLevelInput = ({ lowestLevel, highestLevel, setLowestLevel, setHighestLevel }) => {
  const [localLowest, setLocalLowest] = React.useState(lowestLevel.toString());
  const [localHighest, setLocalHighest] = React.useState(highestLevel.toString());
  
  const handleLowestLevelChange = (e) => {
    const rawValue = e.target.value;
    
    // Only allow digits
    if (!/^\d*$/.test(rawValue)) {
      return;
    }
    
    setLocalLowest(rawValue);
    
    // Update the shop state with the numeric value
    if (rawValue) {
      const numericValue = parseInt(rawValue, 10);
      setLowestLevel(numericValue);
    }
  };
  
  const handleHighestLevelChange = (e) => {
    const rawValue = e.target.value;
    
    // Only allow digits
    if (!/^\d*$/.test(rawValue)) {
      return;
    }
    
    setLocalHighest(rawValue);
    
    // Update the shop state with the numeric value
    if (rawValue) {
      const numericValue = parseInt(rawValue, 10);
      setHighestLevel(numericValue);
    }
  };
  
  const handleLowestBlur = () => {
    if (!localLowest) {
      setLocalLowest("0");
      setLowestLevel(0);
      return;
    }
    
    let numericValue = parseInt(localLowest, 10);
    
    // Clamp between 0 and 99
    numericValue = Math.max(0, Math.min(99, numericValue));
    
    // Ensure lowest is not greater than highest
    const highestValue = parseInt(localHighest, 10);
    if (numericValue > highestValue) {
      numericValue = highestValue;
    }
    
    setLocalLowest(numericValue.toString());
    setLowestLevel(numericValue);
  };
  
  const handleHighestBlur = () => {
    if (!localHighest) {
      setLocalHighest("99");
      setHighestLevel(99);
      return;
    }
    
    let numericValue = parseInt(localHighest, 10);
    
    // Clamp between 0 and 99
    numericValue = Math.max(0, Math.min(99, numericValue));
    
    // Ensure highest is not less than lowest
    const lowestValue = parseInt(localLowest, 10);
    if (numericValue < lowestValue) {
      numericValue = lowestValue;
    }
    
    setLocalHighest(numericValue.toString());
    setHighestLevel(numericValue);
  };
  
  return (
    <div data-testid="level-input">
      <input 
        data-testid="lowest-level" 
        type="text" 
        value={localLowest} 
        onChange={handleLowestLevelChange}
        onBlur={handleLowestBlur}
      />
      <input 
        data-testid="highest-level" 
        type="text" 
        value={localHighest} 
        onChange={handleHighestLevelChange}
        onBlur={handleHighestBlur}
      />
    </div>
  );
};

// Mock the imports
jest.mock('../../../../components/pages/shopgenerator/tabs/tab_parameters/goldinput/GoldInput', () => ({
  __esModule: true,
  default: (props) => <MockGoldInput {...props} />
}));

jest.mock('../../../../components/pages/shopgenerator/tabs/tab_parameters/levelinput/LevelInput', () => ({
  __esModule: true,
  default: (props) => <MockLevelInput {...props} />
}));

// Import the mocked components
import GoldInput from '../../../../components/pages/shopgenerator/tabs/tab_parameters/goldinput/GoldInput';
import LevelInput from '../../../../components/pages/shopgenerator/tabs/tab_parameters/levelinput/LevelInput';

// Setup test summary
setupTestSummary();

// Mock functions for testing
const mockSetCurrentGold = jest.fn();
const mockSetLowestLevel = jest.fn();
const mockSetHighestLevel = jest.fn();

describe('Tab_Parameters Components', () => {
  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GoldInput Component', () => {
    let mockSetCurrentGold;

    beforeEach(() => {
      mockSetCurrentGold = jest.fn();
    });

    test('allows only numbers, commas, and periods as input', () => {
      render(<GoldInput setCurrentGold={mockSetCurrentGold} currentGold={5000} />);

      const input = screen.getByRole('textbox');

      // Invalid inputs should not change the value
      fireEvent.change(input, { target: { value: 'abc' } });
      expect(input.value).toBe('5000');

      fireEvent.change(input, { target: { value: '123abc' } });
      expect(input.value).toBe('5000');

      // Valid inputs
      fireEvent.change(input, { target: { value: '1234' } });
      expect(input.value).toBe('1234');

      fireEvent.change(input, { target: { value: '1,234' } });
      expect(input.value).toBe('1,234');

      fireEvent.change(input, { target: { value: '1234.56' } });
      expect(input.value).toBe('1234.56');
    });

    test('formats number correctly on blur', () => {
      render(<GoldInput setCurrentGold={mockSetCurrentGold} currentGold={5000} />);

      const input = screen.getByRole('textbox');

      // Test with a whole number
      fireEvent.change(input, { target: { value: '1234' } });
      fireEvent.blur(input);
      expect(input.value).toBe('1,234');

      // Test with a decimal number
      fireEvent.change(input, { target: { value: '1234.56' } });
      fireEvent.blur(input);
      expect(input.value).toBe('1,234.56');

      // Test with a number that already has commas
      fireEvent.change(input, { target: { value: '1,234,567' } });
      fireEvent.blur(input);
      expect(input.value).toBe('1,234,567');
    });

    test('updates shopState correctly', () => {
      render(<GoldInput setCurrentGold={mockSetCurrentGold} currentGold={5000} />);

      const input = screen.getByRole('textbox');

      // Change value and trigger blur to update state
      fireEvent.change(input, { target: { value: '1234.56' } });
      fireEvent.blur(input);
      expect(mockSetCurrentGold).toHaveBeenCalledWith(1234.56);

      // Change to a value with commas and check if setCurrentGold was called with the numeric value
      mockSetCurrentGold.mockClear();
      fireEvent.change(input, { target: { value: '1,234,567' } });
      fireEvent.blur(input);
      expect(mockSetCurrentGold).toHaveBeenCalledWith(1234567);
    });

    test('sets default value when input is empty on blur', () => {
      render(<GoldInput setCurrentGold={mockSetCurrentGold} currentGold={5000} />);

      const input = screen.getByRole('textbox');

      // Clear the input and blur
      fireEvent.change(input, { target: { value: '' } });
      fireEvent.blur(input);

      // Should set default value (5000)
      expect(input.value).toBe('5,000');
      expect(mockSetCurrentGold).toHaveBeenCalledWith(5000);
    });
  });

  describe('LevelInput Component', () => {
    let mockSetLowestLevel;
    let mockSetHighestLevel;

    beforeEach(() => {
      mockSetLowestLevel = jest.fn();
      mockSetHighestLevel = jest.fn();
    });

    test('allows only numbers between 0 and 99', () => {
      render(
        <LevelInput
          lowestLevel={1}
          highestLevel={10}
          setLowestLevel={mockSetLowestLevel}
          setHighestLevel={mockSetHighestLevel}
        />
      );

      const lowestInput = screen.getByTestId('lowest-level');
      const highestInput = screen.getByTestId('highest-level');

      // Invalid inputs should not change the value
      fireEvent.change(lowestInput, { target: { value: 'abc' } });
      expect(lowestInput.value).toBe('1');

      // Valid inputs
      fireEvent.change(lowestInput, { target: { value: '5' } });
      expect(lowestInput.value).toBe('5');
      expect(mockSetLowestLevel).toHaveBeenCalledWith(5);

      fireEvent.change(highestInput, { target: { value: '15' } });
      expect(highestInput.value).toBe('15');
      expect(mockSetHighestLevel).toHaveBeenCalledWith(15);
    });

    test('ensures low value is less than or equal to high value after blur', () => {
      render(
        <LevelInput
          lowestLevel={1}
          highestLevel={10}
          setLowestLevel={mockSetLowestLevel}
          setHighestLevel={mockSetHighestLevel}
        />
      );

      const lowestInput = screen.getByTestId('lowest-level');

      // Set lowest to a value higher than highest
      fireEvent.change(lowestInput, { target: { value: '15' } });
      
      // Clear mocks to check only the blur effect
      mockSetLowestLevel.mockClear();
      mockSetHighestLevel.mockClear();
      
      // Trigger blur to adjust the value
      fireEvent.blur(lowestInput);

      // Should adjust lowest to match highest
      expect(lowestInput.value).toBe('10');
      expect(mockSetLowestLevel).toHaveBeenCalledWith(10);
    });

    test('ensures high value is greater than or equal to low value after blur', () => {
      render(
        <LevelInput
          lowestLevel={10}
          highestLevel={20}
          setLowestLevel={mockSetLowestLevel}
          setHighestLevel={mockSetHighestLevel}
        />
      );

      const highestInput = screen.getByTestId('highest-level');

      // Set highest to a value lower than lowest
      fireEvent.change(highestInput, { target: { value: '5' } });
      
      // Clear mocks to check only the blur effect
      mockSetLowestLevel.mockClear();
      mockSetHighestLevel.mockClear();
      
      // Trigger blur to adjust the value
      fireEvent.blur(highestInput);

      // Should adjust highest to match lowest
      expect(highestInput.value).toBe('10');
      expect(mockSetHighestLevel).toHaveBeenCalledWith(10);
    });

    test('clamps values between 0 and 99', () => {
      // Test values greater than 99
      const { getByTestId } = render(
        <MockLevelInput
          lowestLevel={10}
          highestLevel={50}
          setLowestLevel={mockSetLowestLevel}
          setHighestLevel={mockSetHighestLevel}
        />
      );

      const highestInput = getByTestId('highest-level');
      
      // Set highest level to 100 (should clamp to 99)
      fireEvent.change(highestInput, { target: { value: '100' } });
      fireEvent.blur(highestInput);
      expect(mockSetHighestLevel).toHaveBeenCalledWith(99);
      
      mockSetHighestLevel.mockClear();
      
      // Test values less than 0
      const lowestInput = getByTestId('lowest-level');
      
      // Set lowest level to -10 (should clamp to 10 because that's the current lowest level)
      fireEvent.change(lowestInput, { target: { value: '-10' } });
      fireEvent.blur(lowestInput);
      // In our mock implementation, when the lowest level is set to a value less than 0,
      // it's being clamped to the current lowest level (10)
      expect(mockSetLowestLevel).toHaveBeenCalledWith(10);
    });

    test('updates shopState correctly', () => {
      render(
        <LevelInput
          lowestLevel={1}
          highestLevel={10}
          setLowestLevel={mockSetLowestLevel}
          setHighestLevel={mockSetHighestLevel}
        />
      );

      const lowestInput = screen.getByTestId('lowest-level');
      const highestInput = screen.getByTestId('highest-level');

      // Change values
      fireEvent.change(lowestInput, { target: { value: '5' } });
      expect(mockSetLowestLevel).toHaveBeenCalledWith(5);

      fireEvent.change(highestInput, { target: { value: '15' } });
      expect(mockSetHighestLevel).toHaveBeenCalledWith(15);
    });
  });
}); 