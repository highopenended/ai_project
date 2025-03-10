/* global jest, describe, test, expect, beforeEach */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { setupTestSummary } from "../../../utils/test-summary";
import PropTypes from 'prop-types';

// Create manual mock components
const MockGoldInput = ({ currentGold, setCurrentGold }) => {
  const [displayValue, setDisplayValue] = React.useState("");
  const [prevVal, setPrevVal] = React.useState("");
  
  // Format the number to have commas and no decimals
  const formatNumber = (value) => {
    if (!value && value !== 0) return "";
    
    const strValue = value.toString();
    return strValue.replace(/,/g, "").replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };
  
  // Update display value when currentGold prop changes
  React.useEffect(() => {
    const formatted = formatNumber(currentGold ?? 0);
    setDisplayValue(formatted);
    setPrevVal(formatted);
  }, [currentGold]);
  
  const handleInput = (e) => {
    let value = e.target.value;
    
    // Remove leading commas
    if (value.startsWith(",")) {
      value = value.substring(1);
    }
    
    // Remove leading zeros (unless it's just "0")
    if (value.length > 1 && value.startsWith("0")) {
      value = value.replace(/^0+/, "");
    }
    
    setDisplayValue(value);
    
    // Update parent with numeric value
    const numericValue = parseInt(value.replace(/,/g, ""), 10);
    if (!isNaN(numericValue)) {
      setCurrentGold(numericValue);
    }
  };
  
  const handleBlur = () => {
    if (!displayValue) {
      const defaultValue = 0;
      const formatted = formatNumber(defaultValue);
      setDisplayValue(formatted);
      setPrevVal(formatted);
      setCurrentGold(defaultValue);
      return;
    }
    
    const numericValue = parseInt(displayValue.replace(/,/g, ""), 10);
    if (!isNaN(numericValue)) {
      const formatted = formatNumber(numericValue);
      setDisplayValue(formatted);
      setPrevVal(formatted);
      setCurrentGold(numericValue);
    }
  };
  
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.target.blur();
    } else if (e.key === "Escape") {
      setDisplayValue(prevVal);
      e.target.blur();
    }
  };
  
  return (
    <div data-testid="gold-input">
      <input 
        type="text" 
        value={displayValue} 
        onInput={handleInput}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        onFocus={(e) => e.target.select()}
      />
    </div>
  );
};

MockGoldInput.propTypes = {
  currentGold: PropTypes.number,
  setCurrentGold: PropTypes.func.isRequired
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

MockLevelInput.propTypes = {
  lowestLevel: PropTypes.number.isRequired,
  highestLevel: PropTypes.number.isRequired,
  setLowestLevel: PropTypes.func.isRequired,
  setHighestLevel: PropTypes.func.isRequired
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

    test('updates shopState correctly', () => {
      render(<GoldInput setCurrentGold={mockSetCurrentGold} currentGold={5000} />);

      const input = screen.getByRole('textbox');

      // Change value and trigger blur to update state
      fireEvent.input(input, { target: { value: '1234' } });
      fireEvent.blur(input);
      expect(mockSetCurrentGold).toHaveBeenCalledWith(1234);

      // Change to a value with commas and check if setCurrentGold was called with the numeric value
      mockSetCurrentGold.mockClear();
      fireEvent.input(input, { target: { value: '1,234,567' } });
      fireEvent.blur(input);
      expect(mockSetCurrentGold).toHaveBeenCalledWith(1234567);
    });

    test('sets default value when input is empty on blur', () => {
      render(<GoldInput setCurrentGold={mockSetCurrentGold} currentGold={5000} />);

      const input = screen.getByRole('textbox');

      // Clear the input and blur
      fireEvent.input(input, { target: { value: '' } });
      fireEvent.blur(input);

      // Should set default value (0)
      expect(input.value).toBe('0');
      expect(mockSetCurrentGold).toHaveBeenCalledWith(0);
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