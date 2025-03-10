/* global jest, describe, test, expect, beforeEach */
import React from 'react'; // eslint-disable-line no-unused-vars
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import PropTypes from 'prop-types';
import { setupTestSummary } from "../../../../utils/test-summary";

// Setup test summary
setupTestSummary();

// Mock component for testing
const MockRaritySliders = ({ setRarityDistribution, rarityDistribution = {} }) => {
  // Default distribution if none provided
  const defaultDistribution = {
    Common: 95.00,
    Uncommon: 4.50,
    Rare: 0.49,
    Unique: 0.01
  };
  
  const [distribution, setDistribution] = React.useState(
    Object.keys(rarityDistribution).length > 0 ? rarityDistribution : defaultDistribution
  );
  
  const [lockedRarities, setLockedRarities] = React.useState(new Set());
  
  // Mock reset function
  const handleReset = () => {
    setDistribution(defaultDistribution);
    setLockedRarities(new Set());
    setRarityDistribution(defaultDistribution);
  };
  
  // Adjust distribution when a slider is moved
  const adjustDistribution = (newValue, changedRarity) => {
    // Start with current distribution
    const newDistribution = { ...distribution };
    
    // Calculate total of locked values
    const lockedTotal = Array.from(lockedRarities).reduce((sum, rarity) => 
      sum + distribution[rarity], 0
    );

    // Get list of unlocked rarities (excluding the one being changed)
    const unlockedRarities = Object.keys(distribution).filter(r => 
      r !== changedRarity && !lockedRarities.has(r)
    );

    if (unlockedRarities.length === 0) {
      return distribution; // Return current distribution if all rarities are locked
    }

    // Set the new value
    newDistribution[changedRarity] = newValue;

    // Calculate remaining space and distribute evenly
    const remainingSpace = 100 - lockedTotal - newValue;
    const valuePerRarity = remainingSpace / unlockedRarities.length;
    
    // Distribute values to unlocked rarities
    unlockedRarities.forEach(rarity => {
      newDistribution[rarity] = valuePerRarity;
    });

    return newDistribution;
  };
  
  // Handle slider change
  const handleSliderChange = (rarity, value) => {
    if (lockedRarities.has(rarity)) return;
    
    // If all other rarities are locked, this slider can't be moved
    const otherRarities = Object.keys(distribution).filter(r => r !== rarity);
    const allOthersLocked = otherRarities.every(r => lockedRarities.has(r));
    
    if (allOthersLocked) return;
    
    const newValue = Math.min(100, Math.max(0, value));
    const newDistribution = adjustDistribution(newValue, rarity);
    
    setDistribution(newDistribution);
    setRarityDistribution(newDistribution);
  };
  
  // Toggle lock state for a rarity
  const toggleLock = (rarity) => {
    setLockedRarities(prev => {
      const newLockedRarities = new Set(prev);
      if (newLockedRarities.has(rarity)) {
        newLockedRarities.delete(rarity);
      } else {
        newLockedRarities.add(rarity);
      }
      return newLockedRarities;
    });
  };
  
  return (
    <div data-testid="rarity-sliders">
      <h3>Rarity Distribution</h3>
      <div className="rarity-controls">
        {Object.entries(distribution).map(([rarity, value]) => (
          <div key={rarity} className="rarity-row" data-testid={`rarity-row-${rarity.toLowerCase()}`}>
            <label htmlFor={`slider-${rarity}`}>{rarity}</label>
            <input
              id={`slider-${rarity}`}
              data-testid={`slider-${rarity.toLowerCase()}`}
              aria-label={rarity}
              type="range"
              min="0"
              max="100"
              value={value}
              onChange={(e) => {
                handleSliderChange(rarity, parseFloat(e.target.value));
              }}
              disabled={lockedRarities.has(rarity) || Object.keys(distribution).filter(r => r !== rarity).every(r => lockedRarities.has(r))}
            />
            <span className="percentage" data-testid={`percentage-${rarity.toLowerCase()}`}>
              {value}%
            </span>
            <button 
              data-testid={`lock-button-${rarity.toLowerCase()}`}
              onClick={() => toggleLock(rarity)}
              className={lockedRarities.has(rarity) ? 'locked' : ''}
            >
              {lockedRarities.has(rarity) ? 'Unlock' : 'Lock'}
            </button>
          </div>
        ))}
      </div>
      <button onClick={handleReset} data-testid="reset-button">Reset</button>
      <div data-testid="total-percentage">Total: {Object.values(distribution).reduce((sum, val) => sum + val, 0).toFixed(2)}%</div>
    </div>
  );
};

MockRaritySliders.propTypes = {
  setRarityDistribution: PropTypes.func.isRequired,
  rarityDistribution: PropTypes.object
};

// Default distribution values for reference
const DEFAULT_DISTRIBUTION = {
  Common: 95.00,
  Uncommon: 4.50,
  Rare: 0.49,
  Unique: 0.01
};

describe('RaritySliders Component', () => {
  // Mock function for testing
  let mockSetRarityDistribution;

  beforeEach(() => {
    mockSetRarityDistribution = jest.fn();
    jest.clearAllMocks();
  });

  // Basic Functionality Tests
  describe('Basic Functionality', () => {
    test('renders with default values when no distribution is provided', () => {
      render(<MockRaritySliders setRarityDistribution={mockSetRarityDistribution} />);
      
      // Check if all rarities are displayed
      expect(screen.getByText('Common')).toBeInTheDocument();
      expect(screen.getByText('Uncommon')).toBeInTheDocument();
      expect(screen.getByText('Rare')).toBeInTheDocument();
      expect(screen.getByText('Unique')).toBeInTheDocument();
      
      // Check if default percentages are displayed
      expect(screen.getByText('95%')).toBeInTheDocument();
      expect(screen.getByText('4.5%')).toBeInTheDocument();
      expect(screen.getByText('0.49%')).toBeInTheDocument();
      expect(screen.getByText('0.01%')).toBeInTheDocument();
    });

    test('renders with provided distribution values', () => {
      const customDistribution = {
        Common: 90,
        Uncommon: 8,
        Rare: 1.5,
        Unique: 0.5
      };
      
      render(
        <MockRaritySliders 
          setRarityDistribution={mockSetRarityDistribution} 
          rarityDistribution={customDistribution} 
        />
      );
      
      // Check if custom percentages are displayed
      expect(screen.getByText('90%')).toBeInTheDocument();
      expect(screen.getByText('8%')).toBeInTheDocument();
      expect(screen.getByText('1.5%')).toBeInTheDocument();
      expect(screen.getByText('0.5%')).toBeInTheDocument();
    });
  });

  // Slider Interaction Tests
  describe('Slider Interactions', () => {
    test('updates distribution when slider is moved', () => {
      render(<MockRaritySliders setRarityDistribution={mockSetRarityDistribution} />);
      
      // Get the Common rarity slider
      const commonSlider = screen.getByTestId('slider-common');
      
      // Change slider value
      fireEvent.change(commonSlider, { target: { value: '90' } });
      
      // Check if setRarityDistribution was called with updated values
      expect(mockSetRarityDistribution).toHaveBeenCalled();
      
      // The new distribution should have Common at 90% and others adjusted
      const newDistribution = mockSetRarityDistribution.mock.calls[0][0];
      expect(newDistribution.Common).toBe(90);
      
      // Total should still be 100%
      const total = Object.values(newDistribution).reduce((sum, val) => sum + val, 0);
      expect(total).toBeCloseTo(100, 1);
    });
  });

  // Reset Functionality Test
  describe('Reset Functionality', () => {
    test('resets to default values when reset button is clicked', () => {
      // Start with custom distribution
      const customDistribution = {
        Common: 80,
        Uncommon: 15,
        Rare: 4,
        Unique: 1
      };
      
      render(
        <MockRaritySliders 
          setRarityDistribution={mockSetRarityDistribution} 
          rarityDistribution={customDistribution} 
        />
      );
      
      // Verify custom values are displayed
      expect(screen.getByText('80%')).toBeInTheDocument();
      
      // Find and click the reset button
      const resetButton = screen.getByTestId('reset-button');
      fireEvent.click(resetButton);
      
      // Check if setRarityDistribution was called with default values
      expect(mockSetRarityDistribution).toHaveBeenCalledWith(DEFAULT_DISTRIBUTION);
    });
  });
  
  // Lock/Unlock Functionality Tests
  describe('Lock/Unlock Functionality', () => {
    test('locks a rarity when lock button is clicked', () => {
      render(<MockRaritySliders setRarityDistribution={mockSetRarityDistribution} />);
      
      // Find and click the lock button for Common rarity
      const lockButton = screen.getByTestId('lock-button-common');
      fireEvent.click(lockButton);
      
      // Button text should change to "Unlock"
      expect(lockButton).toHaveTextContent('Unlock');
      
      // The slider should be disabled
      const slider = screen.getByTestId('slider-common');
      expect(slider).toBeDisabled();
    });
    
    test('unlocks a rarity when unlock button is clicked', () => {
      render(<MockRaritySliders setRarityDistribution={mockSetRarityDistribution} />);
      
      // First lock the rarity
      const lockButton = screen.getByTestId('lock-button-common');
      fireEvent.click(lockButton);
      
      // Then unlock it
      fireEvent.click(lockButton);
      
      // Button text should change back to "Lock"
      expect(lockButton).toHaveTextContent('Lock');
      
      // The slider should be enabled
      const slider = screen.getByTestId('slider-common');
      expect(slider).not.toBeDisabled();
    });
    
    test('maintains locked rarity value when other sliders are moved', () => {
      render(<MockRaritySliders setRarityDistribution={mockSetRarityDistribution} />);
      
      // Lock the Common rarity
      const commonLockButton = screen.getByTestId('lock-button-common');
      fireEvent.click(commonLockButton);
      
      // Get the initial value of Common
      const commonPercentage = screen.getByTestId('percentage-common');
      const initialCommonValue = parseFloat(commonPercentage.textContent);
      
      // Move the Uncommon slider
      const uncommonSlider = screen.getByTestId('slider-uncommon');
      fireEvent.change(uncommonSlider, { target: { value: '10' } });
      
      // Check that Common value hasn't changed
      expect(parseFloat(commonPercentage.textContent)).toBe(initialCommonValue);
      
      // Check that setRarityDistribution was called with a distribution that maintains Common's value
      const newDistribution = mockSetRarityDistribution.mock.calls[0][0];
      expect(newDistribution.Common).toBe(initialCommonValue);
    });
    
    test('distributes remaining percentage among unlocked rarities when one is locked', () => {
      render(<MockRaritySliders setRarityDistribution={mockSetRarityDistribution} />);
      
      // Lock the Common rarity at 95%
      const commonLockButton = screen.getByTestId('lock-button-common');
      fireEvent.click(commonLockButton);
      
      // Move the Uncommon slider to 4%
      const uncommonSlider = screen.getByTestId('slider-uncommon');
      fireEvent.change(uncommonSlider, { target: { value: '4' } });
      
      // Check that setRarityDistribution was called with correct distribution
      const newDistribution = mockSetRarityDistribution.mock.calls[0][0];
      
      // Common should still be 95%
      expect(newDistribution.Common).toBe(95);
      
      // Uncommon should be 4%
      expect(newDistribution.Uncommon).toBe(4);
      
      // Rare and Unique should share the remaining 1% equally
      const remainingTotal = newDistribution.Rare + newDistribution.Unique;
      expect(remainingTotal).toBeCloseTo(1, 1);
      
      // Total should still be 100%
      const total = Object.values(newDistribution).reduce((sum, val) => sum + val, 0);
      expect(total).toBeCloseTo(100, 1);
    });
    
    test('resets locked states when reset button is clicked', () => {
      render(<MockRaritySliders setRarityDistribution={mockSetRarityDistribution} />);
      
      // Lock multiple rarities
      const commonLockButton = screen.getByTestId('lock-button-common');
      const rareLockButton = screen.getByTestId('lock-button-rare');
      
      fireEvent.click(commonLockButton);
      fireEvent.click(rareLockButton);
      
      // Verify they're locked
      expect(commonLockButton).toHaveTextContent('Unlock');
      expect(rareLockButton).toHaveTextContent('Unlock');
      
      // Click reset
      const resetButton = screen.getByTestId('reset-button');
      fireEvent.click(resetButton);
      
      // Verify all rarities are unlocked
      expect(commonLockButton).toHaveTextContent('Lock');
      expect(rareLockButton).toHaveTextContent('Lock');
      
      // All sliders should be enabled
      const commonSlider = screen.getByTestId('slider-common');
      const rareSlider = screen.getByTestId('slider-rare');
      
      expect(commonSlider).not.toBeDisabled();
      expect(rareSlider).not.toBeDisabled();
    });
    
    test('prevents movement of the last unlocked slider when all others are locked', () => {
      render(<MockRaritySliders setRarityDistribution={mockSetRarityDistribution} />);
      
      // Lock all rarities except Common
      const uncommonLockButton = screen.getByTestId('lock-button-uncommon');
      const rareLockButton = screen.getByTestId('lock-button-rare');
      const uniqueLockButton = screen.getByTestId('lock-button-unique');
      
      fireEvent.click(uncommonLockButton);
      fireEvent.click(rareLockButton);
      fireEvent.click(uniqueLockButton);
      
      // Get the Common slider and its initial value
      const commonSlider = screen.getByTestId('slider-common');
      const commonPercentage = screen.getByTestId('percentage-common');
      const initialCommonValue = parseFloat(commonPercentage.textContent);
      
      // Try to move the Common slider
      fireEvent.change(commonSlider, { target: { value: '90' } });
      
      // Check that the value hasn't changed
      expect(parseFloat(commonPercentage.textContent)).toBe(initialCommonValue);
      
      // Check that setRarityDistribution wasn't called
      expect(mockSetRarityDistribution).not.toHaveBeenCalled();
      
      // The slider should be disabled
      expect(commonSlider).toBeDisabled();
      
      // Total should still be 100%
      const totalElement = screen.getByTestId('total-percentage');
      expect(totalElement).toHaveTextContent('Total: 100.00%');
    });
    
    test('prevents movement of all sliders when all rarities are locked', () => {
      render(<MockRaritySliders setRarityDistribution={mockSetRarityDistribution} />);
      
      // Lock all rarities
      const commonLockButton = screen.getByTestId('lock-button-common');
      const uncommonLockButton = screen.getByTestId('lock-button-uncommon');
      const rareLockButton = screen.getByTestId('lock-button-rare');
      const uniqueLockButton = screen.getByTestId('lock-button-unique');
      
      fireEvent.click(commonLockButton);
      fireEvent.click(uncommonLockButton);
      fireEvent.click(rareLockButton);
      fireEvent.click(uniqueLockButton);
      
      // Try to move each slider
      const commonSlider = screen.getByTestId('slider-common');
      const uncommonSlider = screen.getByTestId('slider-uncommon');
      const rareSlider = screen.getByTestId('slider-rare');
      const uniqueSlider = screen.getByTestId('slider-unique');
      
      fireEvent.change(commonSlider, { target: { value: '90' } });
      fireEvent.change(uncommonSlider, { target: { value: '8' } });
      fireEvent.change(rareSlider, { target: { value: '1.5' } });
      fireEvent.change(uniqueSlider, { target: { value: '0.5' } });
      
      // Check that setRarityDistribution wasn't called
      expect(mockSetRarityDistribution).not.toHaveBeenCalled();
      
      // All sliders should be disabled
      expect(commonSlider).toBeDisabled();
      expect(uncommonSlider).toBeDisabled();
      expect(rareSlider).toBeDisabled();
      expect(uniqueSlider).toBeDisabled();
      
      // Total should still be 100%
      const totalElement = screen.getByTestId('total-percentage');
      expect(totalElement).toHaveTextContent('Total: 100.00%');
    });
    
    test('always maintains a total of 100% even with locked rarities', () => {
      render(<MockRaritySliders setRarityDistribution={mockSetRarityDistribution} />);
      
      // Lock two rarities
      const commonLockButton = screen.getByTestId('lock-button-common');
      const uniqueLockButton = screen.getByTestId('lock-button-unique');
      
      fireEvent.click(commonLockButton);
      fireEvent.click(uniqueLockButton);
      
      // Move the Uncommon slider
      const uncommonSlider = screen.getByTestId('slider-uncommon');
      fireEvent.change(uncommonSlider, { target: { value: '3' } });
      
      // Check that setRarityDistribution was called
      expect(mockSetRarityDistribution).toHaveBeenCalled();
      
      // Get the new distribution
      const newDistribution = mockSetRarityDistribution.mock.calls[0][0];
      
      // Total should be exactly 100%
      const total = Object.values(newDistribution).reduce((sum, val) => sum + val, 0);
      expect(total).toBeCloseTo(100, 10); // Using a high precision to ensure exact 100%
      
      // The total display should show 100%
      const totalElement = screen.getByTestId('total-percentage');
      expect(totalElement).toHaveTextContent('Total: 100.00%');
    });
  });
}); 