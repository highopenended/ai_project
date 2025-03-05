/* global jest, describe, test, expect, beforeEach */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { setupTestSummary } from "../../../utils/test-summary";
import ImprovementDialog from '../../../../components/pages/shopgenerator/tabs/tab_aiassistant/improvementdialog/ImprovementDialog';

// Setup test summary
setupTestSummary();

// Mock functions for testing
const mockOnClose = jest.fn();
const mockOnConfirm = jest.fn();

// Mock data matching the actual component structure
const mockShopState = {
    name: "Test Shop",
    keeperName: "Test Keeper",
    type: "General Store",
    location: "Test Location",
    description: "Test Description",
    keeperDescription: "Test Keeper Description",
    gold: 5000,
    levelRange: { min: 1, max: 10 },
    itemBias: { x: 0.5, y: 0.5 },
    rarityDistribution: {
        Common: 40,
        Uncommon: 30,
        Rare: 20,
        Unique: 10
    }
};

const mockFilterMaps = {
    categories: new Map([['Weapons', 1], ['Armor', -1]]),
    subcategories: new Map(),
    traits: new Map()
};

describe('ImprovementDialog Component', () => {
    // Reset mocks before each test
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('renders with all fields unchecked initially', () => {
        render(
            <ImprovementDialog
                isOpen={true}
                onClose={mockOnClose}
                onConfirm={mockOnConfirm}
                shopState={mockShopState}
                filterMaps={mockFilterMaps}
            />
        );

        // Check that all checkboxes are initially unchecked
        const checkboxes = screen.getAllByRole('checkbox');
        checkboxes.forEach(checkbox => {
            expect(checkbox).not.toBeChecked();
        });
    });

    test('displays field values correctly when unchecked', () => {
        render(
            <ImprovementDialog
                isOpen={true}
                onClose={mockOnClose}
                onConfirm={mockOnConfirm}
                shopState={mockShopState}
                filterMaps={mockFilterMaps}
            />
        );

        // Check that original values are displayed
        expect(screen.getByText('5,000 gp')).toBeInTheDocument();
        expect(screen.getByText('1 - 10')).toBeInTheDocument();
        
        // Check for bias values using more specific selectors
        const biasValues = screen.getAllByText(/\d+%/);
        expect(biasValues[0].parentElement).toHaveTextContent('Variety: 50%');
        expect(biasValues[1].parentElement).toHaveTextContent('Cost: 50%');
    });

    test('displays "The Oracle will offer suggestions..." when field is checked', () => {
        render(
            <ImprovementDialog
                isOpen={true}
                onClose={mockOnClose}
                onConfirm={mockOnConfirm}
                shopState={mockShopState}
                filterMaps={mockFilterMaps}
            />
        );

        // Find and click the gold field
        const goldField = screen.getByText('Gold').closest('.field-item');
        fireEvent.click(goldField);

        // Check that the placeholder text appears
        expect(screen.getByText('The Oracle will offer suggestions...')).toBeInTheDocument();
    });

    test('clicking field item toggles checkbox state', () => {
        render(
            <ImprovementDialog
                isOpen={true}
                onClose={mockOnClose}
                onConfirm={mockOnConfirm}
                shopState={mockShopState}
                filterMaps={mockFilterMaps}
            />
        );

        // Find and click the gold field
        const goldField = screen.getByText('Gold').closest('.field-item');
        fireEvent.click(goldField);

        // Check that the checkbox is now checked
        const goldCheckbox = goldField.querySelector('input[type="checkbox"]');
        expect(goldCheckbox).toBeChecked();

        // Click the field again
        fireEvent.click(goldField);

        // Check that the checkbox is now unchecked
        expect(goldCheckbox).not.toBeChecked();
    });

    test('clicking Analyze button calls onConfirm with selected fields', () => {
        render(
            <ImprovementDialog
                isOpen={true}
                onClose={mockOnClose}
                onConfirm={mockOnConfirm}
                shopState={mockShopState}
                filterMaps={mockFilterMaps}
            />
        );

        // Select some fields
        const goldField = screen.getByText('Gold').closest('.field-item');
        const levelRangeField = screen.getByText('Level Range').closest('.field-item');
        
        fireEvent.click(goldField);
        fireEvent.click(levelRangeField);

        // Click the Analyze button
        const analyzeButton = screen.getByText('Analyze');
        fireEvent.click(analyzeButton);

        // Check that onConfirm was called with the correct fields
        expect(mockOnConfirm).toHaveBeenCalledWith(
            expect.objectContaining({
                gold: false,
                levelRange: false
            })
        );
    });

    test('clicking Cancel button calls onClose', () => {
        render(
            <ImprovementDialog
                isOpen={true}
                onClose={mockOnClose}
                onConfirm={mockOnConfirm}
                shopState={mockShopState}
                filterMaps={mockFilterMaps}
            />
        );

        // Click the Cancel button
        const cancelButton = screen.getByText('Cancel');
        fireEvent.click(cancelButton);

        // Check that onClose was called
        expect(mockOnClose).toHaveBeenCalled();
    });

    test('Select All and Deselect All buttons work for Basic Information section', () => {
        render(
            <ImprovementDialog
                isOpen={true}
                onClose={mockOnClose}
                onConfirm={mockOnConfirm}
                shopState={mockShopState}
                filterMaps={mockFilterMaps}
            />
        );

        // Find all checkboxes in the Basic Information section
        const basicFields = ['Shop Name', 'Keeper Name', 'Shop Type', 'Location', 'Description', 'Keeper Description'];
        const basicCheckboxes = basicFields.map(label => 
            screen.getByText(label).closest('.field-item').querySelector('input[type="checkbox"]')
        );

        // Click Select All in Basic Information section
        const basicSelectAll = screen.getAllByText('Select All')[0];
        fireEvent.click(basicSelectAll);

        // Verify all checkboxes are checked
        basicCheckboxes.forEach(checkbox => {
            expect(checkbox).toBeChecked();
        });

        // Click Deselect All in Basic Information section
        const basicDeselectAll = screen.getAllByText('Deselect All')[0];
        fireEvent.click(basicDeselectAll);

        // Verify all checkboxes are unchecked
        basicCheckboxes.forEach(checkbox => {
            expect(checkbox).not.toBeChecked();
        });
    });

    test('Select All and Deselect All buttons work for Parameters section', () => {
        render(
            <ImprovementDialog
                isOpen={true}
                onClose={mockOnClose}
                onConfirm={mockOnConfirm}
                shopState={mockShopState}
                filterMaps={mockFilterMaps}
            />
        );

        // Find all checkboxes in the Parameters section
        const parameterFields = ['Gold', 'Level Range', 'Item Bias', 'Rarity Distribution'];
        const parameterCheckboxes = parameterFields.map(label => 
            screen.getByText(label).closest('.field-item').querySelector('input[type="checkbox"]')
        );

        // Click Select All in Parameters section
        const parameterSelectAll = screen.getAllByText('Select All')[1];
        fireEvent.click(parameterSelectAll);

        // Verify all checkboxes are checked
        parameterCheckboxes.forEach(checkbox => {
            expect(checkbox).toBeChecked();
        });

        // Click Deselect All in Parameters section
        const parameterDeselectAll = screen.getAllByText('Deselect All')[1];
        fireEvent.click(parameterDeselectAll);

        // Verify all checkboxes are unchecked
        parameterCheckboxes.forEach(checkbox => {
            expect(checkbox).not.toBeChecked();
        });
    });

    test('Select All and Deselect All buttons work for Filters section', () => {
        render(
            <ImprovementDialog
                isOpen={true}
                onClose={mockOnClose}
                onConfirm={mockOnConfirm}
                shopState={mockShopState}
                filterMaps={mockFilterMaps}
            />
        );

        // Find checkbox in the Filters section
        const filterCheckbox = screen.getByText('Categories').closest('.field-item').querySelector('input[type="checkbox"]');

        // Click Select All in Filters section
        const filterSelectAll = screen.getAllByText('Select All')[2];
        fireEvent.click(filterSelectAll);

        // Verify checkbox is checked
        expect(filterCheckbox).toBeChecked();

        // Click Deselect All in Filters section
        const filterDeselectAll = screen.getAllByText('Deselect All')[2];
        fireEvent.click(filterDeselectAll);

        // Verify checkbox is unchecked
        expect(filterCheckbox).not.toBeChecked();
    });
}); 