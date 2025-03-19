/* global jest, describe, test, expect, beforeEach */
// eslint-disable-next-line no-unused-vars
import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import { setupTestSummary } from '../../../../../../utils/test-summary';
import SavedShopsList from '../../../../../../../components/pages/shopgenerator/tabs/tab_chooseshop/savedshopslist/SavedShopsList';

// Setup test summary
setupTestSummary();

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor(callback) {
    this.callback = callback;
  }
  observe() {
    // Call the callback with empty entries to simulate initial size
    this.callback([{ contentRect: { width: 500 } }]);
  }
  unobserve() {}
  disconnect() {}
};

// Mock the Scrollbar component
jest.mock('../../../../../../../components/pages/shopgenerator/shared/scrollbar/Scrollbar', () => ({
  __esModule: true,
  default: ({ children, className }) => <div data-testid="mock-scrollbar" className={className}>{children}</div>
}));

// Create mock data for testing
const createMockShops = (count = 5) => {
  return Array.from({ length: count }).map((_, index) => ({
    id: `shop_${index}`,
    name: `Test Shop ${index}`,
    keeperName: `Shopkeeper ${index}`,
    type: index % 2 === 0 ? 'General Store' : 'Magic Shop',
    location: `Location ${index}`,
    description: `Description ${index}`,
    keeperDescription: `Keeper description ${index}`,
    dateCreated: new Date(2023, 0, index + 1),
    dateLastEdited: new Date(2023, 1, index + 1),
    gold: 1000 * (index + 1),
    levelRange: { min: 1, max: 10 },
    itemBias: { x: 0.5, y: 0.5 },
    rarityDistribution: {},
    currentStock: [],
    filterStorageObjects: {}
  }));
};

describe('SavedShopsList Component', () => {
  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Basic rendering tests
  describe('Basic Rendering', () => {
    test('renders correctly with empty shops list', () => {
      const mockLoadShop = jest.fn();
      const mockDeleteShops = jest.fn();
      const mockExportShops = jest.fn();
      
      render(
        <SavedShopsList 
          savedShops={[]} 
          loadShop={mockLoadShop}
          onDeleteShops={mockDeleteShops}
          onExportShops={mockExportShops}
        />
      );
      
      // Verify the empty state message is displayed
      expect(screen.getByText('No saved shops')).toBeInTheDocument();
      
      // Verify that the action buttons are disabled
      const exportButton = screen.getByText('Export');
      const deleteButton = screen.getByText('Delete');
      expect(exportButton).toBeDisabled();
      expect(deleteButton).toBeDisabled();
    });
    
    test('renders shops correctly', () => {
      const mockShops = createMockShops(3);
      const mockLoadShop = jest.fn();
      
      render(
        <SavedShopsList 
          savedShops={mockShops} 
          loadShop={mockLoadShop}
          currentShopId={null}
        />
      );
      
      // Check that all shops are rendered
      mockShops.forEach(shop => {
        expect(screen.getByText(shop.name)).toBeInTheDocument();
      });
      
      // Verify header is displayed correctly
      expect(screen.getByText('Saved Shops')).toBeInTheDocument();
    });
    
    test('highlights current shop', () => {
      const mockShops = createMockShops(3);
      const mockLoadShop = jest.fn();
      const currentShopId = 'shop_1';
      
      const { container } = render(
        <SavedShopsList 
          savedShops={mockShops} 
          loadShop={mockLoadShop}
          currentShopId={currentShopId}
        />
      );
      
      // Check that the current shop has the current class
      const currentShopRow = Array.from(container.querySelectorAll('.shop-row'))
        .find(row => row.textContent.includes('Test Shop 1'));
      
      expect(currentShopRow).toHaveClass('shop-row-current');
    });
  });

  // Shop selection tests
  describe('Shop Selection', () => {
    test('loads shop on click', () => {
      const mockShops = createMockShops(3);
      const mockLoadShop = jest.fn();
      
      render(
        <SavedShopsList 
          savedShops={mockShops} 
          loadShop={mockLoadShop}
          currentShopId={null}
        />
      );
      
      // Click on a shop
      fireEvent.click(screen.getByText('Test Shop 1'));
      
      // Verify that loadShop was called with the correct shop
      expect(mockLoadShop).toHaveBeenCalledWith(mockShops[1]);
    });
    
    test('selects multiple shops with shift+click', () => {
      const mockShops = createMockShops(5).reverse(); // Reverse to match order in component
      const mockLoadShop = jest.fn();
      
      const { container } = render(
        <SavedShopsList 
          savedShops={mockShops} 
          loadShop={mockLoadShop}
          currentShopId={null}
        />
      );
      
      // Get all shop rows
      const shopRows = container.querySelectorAll('.shop-row');
      
      // Click on first shop
      fireEvent.click(shopRows[0]);
      expect(mockLoadShop).toHaveBeenCalledWith(mockShops[0]);
      
      // Shift+click on third shop to select range
      fireEvent.click(shopRows[2], { shiftKey: true });
      
      // Check that the selection indicator is showing the correct count
      expect(screen.getByText('3 Selected')).toBeInTheDocument();
      
      // Verify visual selection
      expect(shopRows[0]).toHaveClass('shop-row-selected');
      expect(shopRows[1]).toHaveClass('shop-row-selected');
      expect(shopRows[2]).toHaveClass('shop-row-selected');
    });
    
    test('toggles selection with ctrl+click', () => {
      const mockShops = createMockShops(5);
      const mockLoadShop = jest.fn();
      
      const { container } = render(
        <SavedShopsList 
          savedShops={mockShops} 
          loadShop={mockLoadShop}
          currentShopId={'shop_0'}
        />
      );
      
      // Get all shop rows
      const shopRows = container.querySelectorAll('.shop-row');
      
      // First select the currentShop explicitly to ensure it's highlighted
      fireEvent.click(shopRows[4]); // shop_0 is now at the end due to sort
      
      // Ctrl+click on another shop to add to selection
      fireEvent.click(shopRows[2], { ctrlKey: true });
      
      // Another ctrl+click to select one more
      fireEvent.click(shopRows[1], { ctrlKey: true });
      expect(screen.getByText('3 Selected')).toBeInTheDocument();
      
      // Ctrl+click on an already selected shop to deselect it
      fireEvent.click(shopRows[2], { ctrlKey: true });
      expect(screen.getByText('2 Selected')).toBeInTheDocument();
    });
    
    test('normal click clears selection and loads shop', () => {
      const mockShops = createMockShops(5);
      const mockLoadShop = jest.fn();
      
      const { container } = render(
        <SavedShopsList 
          savedShops={mockShops} 
          loadShop={mockLoadShop}
          currentShopId={'shop_0'}
        />
      );
      
      // Get all shop rows
      const shopRows = container.querySelectorAll('.shop-row');
      
      // First select the currentShop explicitly to ensure it's highlighted
      fireEvent.click(shopRows[4]); // shop_0 is at the end due to sort
      
      // Select some shops
      fireEvent.click(shopRows[2], { ctrlKey: true });
      fireEvent.click(shopRows[1], { ctrlKey: true });
      
      // Reset mock to check the next call
      mockLoadShop.mockClear();
      
      // Now do a normal click on another shop
      fireEvent.click(shopRows[3]);
      
      // Should have loaded the shop (shop index will be different due to sorting)
      expect(mockLoadShop).toHaveBeenCalled();
      
      // Selection should be cleared
      expect(screen.queryByText(/Selected/)).not.toBeInTheDocument();
      expect(screen.getByText('Saved Shops')).toBeInTheDocument();
    });
  });

  // Export and Delete buttons tests
  describe('Export and Delete Functionality', () => {
    test('export button calls onExportShops with selected shops', () => {
      const mockShops = createMockShops(5);
      const mockLoadShop = jest.fn();
      const mockExportShops = jest.fn();
      
      const { container } = render(
        <SavedShopsList 
          savedShops={mockShops} 
          loadShop={mockLoadShop}
          onExportShops={mockExportShops}
          currentShopId={'shop_0'}
        />
      );
      
      // Get all shop rows
      const shopRows = container.querySelectorAll('.shop-row');
      
      // First select the currentShop explicitly to ensure it's selected
      fireEvent.click(shopRows[4]); // shop_0 is at the end due to sort
      
      // Select additional shops
      fireEvent.click(shopRows[1], { ctrlKey: true });
      fireEvent.click(shopRows[2], { ctrlKey: true });
      
      // Click export button
      fireEvent.click(screen.getByText('Export'));
      
      // Should have called onExportShops with selected shops
      expect(mockExportShops).toHaveBeenCalled();
      // Since we can't guarantee order, we'll just check that it was called with an array of 3 shops
      expect(mockExportShops.mock.calls[0][0].length).toBe(3);
    });
    
    test('delete button shows confirmation dialog', () => {
      const mockShops = createMockShops(5);
      const mockLoadShop = jest.fn();
      const mockDeleteShops = jest.fn();
      
      const { container } = render(
        <SavedShopsList 
          savedShops={mockShops} 
          loadShop={mockLoadShop}
          onDeleteShops={mockDeleteShops}
          currentShopId={'shop_0'}
        />
      );
      
      // Get all shop rows
      const shopRows = container.querySelectorAll('.shop-row');
      
      // First select the currentShop explicitly to ensure it's selected
      fireEvent.click(shopRows[4]); // shop_0 is at the end due to sort
      
      // Select additional shops
      fireEvent.click(shopRows[1], { ctrlKey: true });
      fireEvent.click(shopRows[2], { ctrlKey: true });
      
      // Click delete button
      fireEvent.click(screen.getByText('Delete'));
      
      // Check that confirmation dialog is shown
      expect(screen.getByText('Delete 3 Shops?')).toBeInTheDocument();
      expect(screen.getByText('Are you sure you want to delete these shops? This action cannot be undone.')).toBeInTheDocument();
    });
    
    test('confirming delete calls onDeleteShops with selected shops', () => {
      const mockShops = createMockShops(5);
      const mockLoadShop = jest.fn();
      const mockDeleteShops = jest.fn();
      
      const { container } = render(
        <SavedShopsList 
          savedShops={mockShops} 
          loadShop={mockLoadShop}
          onDeleteShops={mockDeleteShops}
          currentShopId={'shop_0'}
        />
      );
      
      // Get all shop rows
      const shopRows = container.querySelectorAll('.shop-row');
      
      // First select the currentShop explicitly to ensure it's selected
      fireEvent.click(shopRows[4]); // shop_0 is at the end due to sort
      
      // Select additional shops with ctrl+click
      fireEvent.click(shopRows[1], { ctrlKey: true });
      fireEvent.click(shopRows[2], { ctrlKey: true });
      
      // Click delete button
      fireEvent.click(screen.getByText('Delete'));
      
      // Find the dialog and click the Delete button within it
      const dialog = screen.getByText('Delete 3 Shops?').closest('.delete-confirm-dialogue');
      const confirmButton = within(dialog).getByText('Delete');
      fireEvent.click(confirmButton);
      
      // Should have called onDeleteShops with an array of selected shop IDs
      expect(mockDeleteShops).toHaveBeenCalled();
      expect(mockDeleteShops.mock.calls[0][0].length).toBe(3);
    });
    
    test('canceling delete does not call onDeleteShops', () => {
      const mockShops = createMockShops(5);
      const mockLoadShop = jest.fn();
      const mockDeleteShops = jest.fn();
      
      const { container } = render(
        <SavedShopsList 
          savedShops={mockShops} 
          loadShop={mockLoadShop}
          onDeleteShops={mockDeleteShops}
          currentShopId={'shop_0'}
        />
      );
      
      // Get all shop rows
      const shopRows = container.querySelectorAll('.shop-row');
      
      // First select the currentShop explicitly to ensure it's selected
      fireEvent.click(shopRows[4]); // shop_0 is at the end due to sort
      
      // Select additional shops
      fireEvent.click(shopRows[1], { ctrlKey: true });
      fireEvent.click(shopRows[2], { ctrlKey: true });
      
      // Click delete button
      fireEvent.click(screen.getByText('Delete'));
      
      // Click cancel in the dialog
      const dialog = screen.getByText('Delete 3 Shops?').closest('.delete-confirm-dialogue');
      const cancelButton = within(dialog).getByText('Cancel');
      fireEvent.click(cancelButton);
      
      // onDeleteShops should not have been called
      expect(mockDeleteShops).not.toHaveBeenCalled();
      
      // Dialog should be closed
      expect(screen.queryByText('Delete 3 Shops?')).not.toBeInTheDocument();
    });
  });

  // Sorting tests
  describe('Sorting Functionality', () => {
    test('sorts shops by name', () => {
      // Create shops with names in reverse order
      const mockShops = [
        { ...createMockShops(1)[0], id: 'shop_0', name: 'Z Shop' },
        { ...createMockShops(1)[0], id: 'shop_1', name: 'A Shop' },
        { ...createMockShops(1)[0], id: 'shop_2', name: 'M Shop' },
      ];
      
      const mockLoadShop = jest.fn();
      
      render(
        <SavedShopsList 
          savedShops={mockShops} 
          loadShop={mockLoadShop}
          currentShopId={null}
        />
      );
      
      // By default it sorts by date, so we need to click Name to sort by name first
      fireEvent.click(screen.getByText('Name'));
      
      // Get all shop name cells
      const shopNameCells = Array.from(document.querySelectorAll('.shop-col-name'))
        .filter(el => ['A Shop', 'M Shop', 'Z Shop'].includes(el.textContent));
      
      // Get the text content of each shop name cell
      const shopNames = shopNameCells.map(el => el.textContent);
      
      // Should be sorted alphabetically (ASC)
      expect(shopNames).toEqual(['A Shop', 'M Shop', 'Z Shop']);
      
      // Click again to reverse order
      fireEvent.click(screen.getByText('Name ↑'));
      
      // Get shop names after clicking again
      const reversedShopNameCells = Array.from(document.querySelectorAll('.shop-col-name'))
        .filter(el => ['A Shop', 'M Shop', 'Z Shop'].includes(el.textContent));
      const reversedShopNames = reversedShopNameCells.map(el => el.textContent);
      
      // Should be sorted in reverse alphabetical order (DESC)
      expect(reversedShopNames).toEqual(['Z Shop', 'M Shop', 'A Shop']);
    });
  });
}); 