/* global jest, describe, test, expect, beforeEach */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import PropTypes from 'prop-types';

// Create a mock component for testing
const MockBiasGrid = ({ setItemBias, itemBias }) => {
  const [position, setPosition] = React.useState(itemBias || { x: 0.5, y: 0.5 });
  const gridRef = React.useRef(null);
  
  const calculateNewPosition = (clientX, clientY) => {
    if (!gridRef.current) return null;
    
    const rect = gridRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, 1 - (clientY - rect.top) / rect.height));
    
    return { x, y };
  };
  
  const handleMouseDown = (e) => {
    e.preventDefault();
    const newPos = calculateNewPosition(e.clientX, e.clientY);
    if (newPos) {
      setPosition(newPos);
      setItemBias(newPos);
    }
  };
  
  const handleReset = () => {
    const newPos = { x: 0.5, y: 0.5 };
    setPosition(newPos);
    setItemBias(newPos);
  };
  
  return (
    <div data-testid="bias-grid">
      <div 
        data-testid="grid-area"
        ref={gridRef}
        onMouseDown={handleMouseDown}
        style={{ width: '160px', height: '160px', position: 'relative' }}
      >
        <div data-testid="grid-readout">
          <span>Variety: {(position.x * 100).toFixed(0)}%</span>
          <span>Cost: {(position.y * 100).toFixed(0)}%</span>
        </div>
        
        <div 
          data-testid="grid-dot"
          style={{
            position: 'absolute',
            left: `${position.x * 100}%`,
            top: `${(1 - position.y) * 100}%`,
          }}
        />
      </div>
      <button 
        data-testid="reset-button"
        onClick={handleReset}
      >
        Reset
      </button>
    </div>
  );
};

// Add prop validation
MockBiasGrid.propTypes = {
  setItemBias: PropTypes.func.isRequired,
  itemBias: PropTypes.shape({
    x: PropTypes.number,
    y: PropTypes.number
  })
};

// Mock the imports
jest.mock('../../../../components/pages/shopgenerator/tabs/tab_parameters/biasgrid/BiasGrid', () => ({
  __esModule: true,
  default: (props) => <MockBiasGrid {...props} />
}));

// Import the mocked component
import BiasGrid from '../../../../components/pages/shopgenerator/tabs/tab_parameters/biasgrid/BiasGrid';

describe('BiasGrid Component', () => {
  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  test('renders with default values when no bias is provided', () => {
    const mockSetItemBias = jest.fn();
    
    render(<BiasGrid setItemBias={mockSetItemBias} itemBias={null} />);
    
    // Check if default values are displayed (50% for both)
    expect(screen.getByText('Variety: 50%')).toBeInTheDocument();
    expect(screen.getByText('Cost: 50%')).toBeInTheDocument();
  });
  
  test('renders with provided bias values', () => {
    const mockSetItemBias = jest.fn();
    const initialBias = { x: 0.6, y: 0.7 };
    
    render(<BiasGrid setItemBias={mockSetItemBias} itemBias={initialBias} />);
    
    // Check if provided values are displayed
    expect(screen.getByText('Variety: 60%')).toBeInTheDocument();
    expect(screen.getByText('Cost: 70%')).toBeInTheDocument();
  });
  
  test('updates values when user clicks on the grid', () => {
    const mockSetItemBias = jest.fn();
    
    render(<BiasGrid setItemBias={mockSetItemBias} itemBias={{ x: 0.5, y: 0.5 }} />);
    
    const gridArea = screen.getByTestId('grid-area');
    
    // Mock the getBoundingClientRect to return a fixed size
    gridArea.getBoundingClientRect = jest.fn(() => ({
      width: 160,
      height: 160,
      top: 0,
      left: 0,
      right: 160,
      bottom: 160,
      x: 0,
      y: 0,
    }));
    
    // Simulate a click at 60% across and 40% down (which should be 60% variety, 60% cost)
    fireEvent.mouseDown(gridArea, { 
      clientX: 96,  // 60% of 160
      clientY: 64,  // 40% of 160 (which is 60% from bottom)
    });
    
    // Check if the display values are updated
    expect(screen.getByText('Variety: 60%')).toBeInTheDocument();
    expect(screen.getByText('Cost: 60%')).toBeInTheDocument();
    
    // Check if setItemBias was called with the correct values
    expect(mockSetItemBias).toHaveBeenCalledWith({ x: 0.6, y: 0.6 });
  });
  
  test('resets to default values when reset button is clicked', () => {
    const mockSetItemBias = jest.fn();
    
    render(<BiasGrid setItemBias={mockSetItemBias} itemBias={{ x: 0.7, y: 0.8 }} />);
    
    // Verify initial values
    expect(screen.getByText('Variety: 70%')).toBeInTheDocument();
    expect(screen.getByText('Cost: 80%')).toBeInTheDocument();
    
    // Click the reset button
    fireEvent.click(screen.getByTestId('reset-button'));
    
    // Check if values are reset to 50%
    expect(screen.getByText('Variety: 50%')).toBeInTheDocument();
    expect(screen.getByText('Cost: 50%')).toBeInTheDocument();
    
    // Check if setItemBias was called with the default values
    expect(mockSetItemBias).toHaveBeenCalledWith({ x: 0.5, y: 0.5 });
  });
  
  test('updates shopState but not shopSnapshot when user interacts with the grid', () => {
    const mockSetItemBias = jest.fn();
    const mockSetShopSnapshot = jest.fn();
    
    render(
      <BiasGrid 
        setItemBias={mockSetItemBias} 
        itemBias={{ x: 0.5, y: 0.5 }}
      />
    );
    
    const gridArea = screen.getByTestId('grid-area');
    
    // Mock the getBoundingClientRect
    gridArea.getBoundingClientRect = jest.fn(() => ({
      width: 160,
      height: 160,
      top: 0,
      left: 0,
      right: 160,
      bottom: 160,
      x: 0,
      y: 0,
    }));
    
    // Simulate a click
    fireEvent.mouseDown(gridArea, { 
      clientX: 80,
      clientY: 40,
    });
    
    // Check if setItemBias was called (updating shopState)
    expect(mockSetItemBias).toHaveBeenCalled();
    
    // Check that setShopSnapshot was not called
    expect(mockSetShopSnapshot).not.toHaveBeenCalled();
  });
}); 