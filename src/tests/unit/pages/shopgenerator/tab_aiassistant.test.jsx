/* global jest, describe, test, expect, beforeEach */
import { createShopSnapshot } from '../../../../components/pages/shopgenerator/tabs/tab_aiassistant/Tab_AiAssistant';
import { extractAvailableFilterOptions } from '../../../../components/pages/shopgenerator/utils/filterGroupUtils';

// Mock the filterGroupUtils
jest.mock('../../../../components/pages/shopgenerator/utils/filterGroupUtils', () => ({
    extractAvailableFilterOptions: jest.fn(() => ({
        categories: ['Weapons', 'Armor', 'Potions']
    }))
}));

// Mock data
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

const mockCategoryData = {
    categories: ['Weapons', 'Armor', 'Potions']
};

describe('createShopSnapshot', () => {
    beforeEach(() => {
        extractAvailableFilterOptions.mockClear();
    });

    test('excludes available filters when category filter is preserved', () => {
        const snapshot = createShopSnapshot(
            mockShopState,
            mockFilterMaps,
            mockCategoryData,
            { filterCategories: true }
        );

        // Verify that availableFilters is empty when filterCategories is preserved
        expect(snapshot.availableFilters).toEqual({});
        // Verify that extractAvailableFilterOptions was not called
        expect(extractAvailableFilterOptions).not.toHaveBeenCalled();
    });

    test('includes available filters when category filter is not preserved', () => {
        const snapshot = createShopSnapshot(
            mockShopState,
            mockFilterMaps,
            mockCategoryData,
            { filterCategories: false }
        );

        // Verify that availableFilters includes categories
        expect(snapshot.availableFilters).toEqual({
            categories: ['Weapons', 'Armor', 'Potions']
        });
        // Verify that extractAvailableFilterOptions was called
        expect(extractAvailableFilterOptions).toHaveBeenCalledWith(mockCategoryData, expect.any(Object));
    });

    test('handles null preservedFields parameter', () => {
        const snapshot = createShopSnapshot(
            mockShopState,
            mockFilterMaps,
            mockCategoryData,
            null
        );

        // Verify that availableFilters is empty when preservedFields is null
        expect(snapshot.availableFilters).toEqual({});
        // Verify that extractAvailableFilterOptions was not called
        expect(extractAvailableFilterOptions).not.toHaveBeenCalled();
    });

    test('correctly includes filter selections regardless of preservedFields', () => {
        const snapshot = createShopSnapshot(
            mockShopState,
            mockFilterMaps,
            mockCategoryData,
            { filterCategories: true }
        );

        // Verify that filterSelections are included correctly
        expect(snapshot.filterSelections).toEqual({
            categories: {
                included: ['Weapons'],
                excluded: ['Armor']
            }
        });
    });
}); 