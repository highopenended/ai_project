import { useMemo } from 'react';
import { TAB_TYPE_IDENTIFIERS } from '../utils/tabConstants';

// Separate registries for each tab type to prevent cross-contamination of state
const useParametersRegistry = (props) => {
    const {
        shopState,
        handleGoldChange,
        handleLowestLevelChange,
        handleHighestLevelChange,
        handleRarityDistributionChange,
        handleBiasChange,
        categoryData,
        filterMaps,
        getFilterState,
        toggleCategory,
        toggleSubcategory,
        toggleTrait,
        clearCategorySelections,
        clearSubcategorySelections,
        clearTraitSelections
    } = props;

    return useMemo(() => ({
        currentGold: shopState.gold,
        setCurrentGold: handleGoldChange,
        lowestLevel: shopState.levelRange.min,
        setLowestLevel: handleLowestLevelChange,
        highestLevel: shopState.levelRange.max,
        setHighestLevel: handleHighestLevelChange,
        rarityDistribution: shopState.rarityDistribution,
        setRarityDistribution: handleRarityDistributionChange,
        itemBias: shopState.itemBias,
        setItemBias: handleBiasChange,
        categoryData: categoryData,
        categoryStates: filterMaps?.categories,
        subcategoryStates: filterMaps?.subcategories,
        traitStates: filterMaps?.traits,
        getFilterState,
        toggleCategory,
        toggleSubcategory,
        toggleTrait,
        clearCategorySelections,
        clearSubcategorySelections,
        clearTraitSelections
    }), [
        shopState.gold,
        shopState.levelRange.min,
        shopState.levelRange.max,
        shopState.rarityDistribution,
        shopState.itemBias,
        handleGoldChange,
        handleLowestLevelChange,
        handleHighestLevelChange,
        handleRarityDistributionChange,
        handleBiasChange,
        categoryData,
        filterMaps?.categories,
        filterMaps?.subcategories,
        filterMaps?.traits,
        getFilterState,
        toggleCategory,
        toggleSubcategory,
        toggleTrait,
        clearCategorySelections,
        clearSubcategorySelections,
        clearTraitSelections
    ]);
};

const useInventoryRegistry = (props) => {
    const {
        sortedItems,
        sortConfig,
        handleSort,
        shopState,
        generateInventory,
        isGenerating
    } = props;

    return useMemo(() => ({
        items: sortedItems,
        sortConfig,
        onSort: handleSort,
        currentShopName: shopState.name,
        handleGenerateClick: generateInventory,
        isGenerating
    }), [
        sortedItems,
        sortConfig,
        handleSort,
        shopState.name,
        generateInventory,
        isGenerating
    ]);
};

const useShopDetailsRegistry = (props) => {
    const {
        shopState,
        handleShopDetailsChange,
        handleSaveShop,
        handleCloneShop,
        handleDeleteShop,
        handleRevertChanges,
        savedShops,
        hasUnsavedChanges,
        getChangedFields,
        shopSnapshot,
        setFilterMaps,
        setInventory
    } = props;

    return useMemo(() => ({
        shopState,
        onShopDetailsChange: handleShopDetailsChange,
        onSaveShop: handleSaveShop,
        onCloneShop: handleCloneShop,
        onDeleteShop: handleDeleteShop,
        onRevertChanges: () => handleRevertChanges(shopSnapshot, setFilterMaps, setInventory),
        savedShops,
        hasUnsavedChanges,
        changes: getChangedFields()
    }), [
        shopState,
        handleShopDetailsChange,
        handleSaveShop,
        handleCloneShop,
        handleDeleteShop,
        handleRevertChanges,
        savedShops,
        hasUnsavedChanges,
        getChangedFields,
        shopSnapshot,
        setFilterMaps,
        setInventory
    ]);
};

const useChooseShopRegistry = (props) => {
    const {
        savedShops,
        handleLoadShop,
        handleNewShop,
        shopState,
        filterMaps,
        inventory
    } = props;

    return useMemo(() => ({
        savedShops,
        onLoadShop: handleLoadShop,
        onNewShop: handleNewShop,
        currentShopId: shopState.id,
        currentShopData: {
            ...shopState,
            currentStock: inventory,
            filterStorageObjects: {
                categories: Object.fromEntries(filterMaps.categories.entries()),
                subcategories: Object.fromEntries(filterMaps.subcategories.entries()),
                traits: Object.fromEntries(filterMaps.traits.entries()),
            }
        }
    }), [
        savedShops,
        handleLoadShop,
        handleNewShop,
        shopState,
        filterMaps,
        inventory
    ]);
};

const useAiAssistantRegistry = (props) => {
    const {
        shopState,
        filterMaps,
        inventory = []
    } = props || {};

    return useMemo(() => ({
        shopState: shopState || {},
        filterMaps: filterMaps || {
            categories: new Map(),
            subcategories: new Map(),
            traits: new Map()
        },
        inventory: inventory || []
    }), [
        shopState,
        filterMaps,
        inventory
    ]);
};

export const useTabRegistry = (props) => {
    // Create separate registries for each tab type
    const parametersProps = useParametersRegistry(props);
    const inventoryProps = useInventoryRegistry(props);
    const shopDetailsProps = useShopDetailsRegistry(props);
    const chooseShopProps = useChooseShopRegistry(props);
    const aiAssistantProps = useAiAssistantRegistry(props);

    // Return a stable reference to the registry mapping
    return useMemo(() => ({
        [TAB_TYPE_IDENTIFIERS.PARAMETERS]: {
            getProps: () => parametersProps
        },
        [TAB_TYPE_IDENTIFIERS.INVENTORY]: {
            getProps: () => inventoryProps
        },
        [TAB_TYPE_IDENTIFIERS.SHOP_DETAILS]: {
            getProps: () => shopDetailsProps
        },
        [TAB_TYPE_IDENTIFIERS.CHOOSE_SHOP]: {
            getProps: () => chooseShopProps
        },
        [TAB_TYPE_IDENTIFIERS.AI_ASSISTANT]: {
            getProps: () => aiAssistantProps
        }
    }), [parametersProps, inventoryProps, shopDetailsProps, chooseShopProps, aiAssistantProps]);
}; 