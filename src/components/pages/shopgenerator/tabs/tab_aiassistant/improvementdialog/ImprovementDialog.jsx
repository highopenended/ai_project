import { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import './ImprovementDialog.css';
import { DEFAULT_FIELD_VALUES } from '../../../utils/aiConstants';

/**
 * Dialog component that allows users to select which fields to preserve when requesting AI improvements
 */
const ImprovementDialog = ({ 
    isOpen, 
    onClose, 
    onConfirm, 
    shopState, 
    filterMaps
}) => {
    // State to track which fields should be preserved (not changed by AI)
    const [preservedFields, setPreservedFields] = useState({
        // Shop details
        name: true,
        type: true,
        keeperName: true,
        location: true,
        description: true,
        keeperDescription: true,
        
        // Shop parameters
        gold: true,
        levelRange: true, // Combined level range into a single field
        rarityDistribution: true, // Combined rarity distribution into a single field
        itemBias: true, // Combined item bias into a single field
        
        // Filter selections
        filterCategories: true,
        filterSubcategories: true,
        filterTraits: true
    });
    
    // State for "remember preferences" option
    const [rememberPreferences, setRememberPreferences] = useState(
        localStorage.getItem('aiImprovementPreferences') === 'true'
    );
    
    // Initialize preserved fields based on which fields have non-default values
    useEffect(() => {
        if (!isOpen) return;
        
        // Helper to check if a value is different from default
        const isCustomValue = (value, defaultValue) => {
            if (value === undefined || value === null) return false;
            if (typeof value === 'object' && typeof defaultValue === 'object') {
                return JSON.stringify(value) !== JSON.stringify(defaultValue);
            }
            return value !== defaultValue;
        };
        
        // Get saved preferences if available
        const savedPreferences = localStorage.getItem('aiImprovementPreferences') === 'true' 
            ? JSON.parse(localStorage.getItem('aiPreservedFields') || '{}')
            : null;
            
        if (savedPreferences) {
            setPreservedFields(savedPreferences);
            return;
        }
        
        // Otherwise, set based on custom vs default values
        setPreservedFields({
            // Shop details
            name: isCustomValue(shopState.name, DEFAULT_FIELD_VALUES.shopName),
            type: isCustomValue(shopState.type, DEFAULT_FIELD_VALUES.type),
            keeperName: isCustomValue(shopState.keeperName, DEFAULT_FIELD_VALUES.keeperName),
            location: isCustomValue(shopState.location, DEFAULT_FIELD_VALUES.location),
            description: isCustomValue(shopState.description, DEFAULT_FIELD_VALUES.description),
            keeperDescription: isCustomValue(shopState.keeperDescription, DEFAULT_FIELD_VALUES.keeperDescription),
            
            // Shop parameters
            gold: shopState.gold > 0,
            levelRange: shopState.levelRange?.min > 0 || shopState.levelRange?.max > 0,
            rarityDistribution: isCustomValue(shopState.rarityDistribution?.Common, DEFAULT_FIELD_VALUES.rarityDistribution.Common) ||
                isCustomValue(shopState.rarityDistribution?.Uncommon, DEFAULT_FIELD_VALUES.rarityDistribution.Uncommon) ||
                isCustomValue(shopState.rarityDistribution?.Rare, DEFAULT_FIELD_VALUES.rarityDistribution.Rare) ||
                isCustomValue(shopState.rarityDistribution?.Unique, DEFAULT_FIELD_VALUES.rarityDistribution.Unique),
            itemBias: isCustomValue(shopState.itemBias?.x, DEFAULT_FIELD_VALUES.itemBias.x) ||
                isCustomValue(shopState.itemBias?.y, DEFAULT_FIELD_VALUES.itemBias.y),
            
            // Filter selections
            filterCategories: filterMaps.categories.size > 0,
            filterSubcategories: filterMaps.subcategories.size > 0,
            filterTraits: filterMaps.traits.size > 0
        });
    }, [isOpen, shopState, filterMaps]);
    
    // Handle checkbox changes
    const handleCheckboxChange = (field) => {
        setPreservedFields(prev => ({
            ...prev,
            [field]: !prev[field]
        }));
    };
    
    // Handle section select/deselect all
    const handleSectionAction = (section, value) => {
        const newPreservedFields = { ...preservedFields };
        
        switch (section) {
            case 'details':
                newPreservedFields.name = value;
                newPreservedFields.type = value;
                newPreservedFields.keeperName = value;
                newPreservedFields.location = value;
                newPreservedFields.description = value;
                newPreservedFields.keeperDescription = value;
                break;
                
            case 'parameters':
                newPreservedFields.gold = value;
                newPreservedFields.levelRange = value;
                newPreservedFields.rarityDistribution = value;
                newPreservedFields.itemBias = value;
                break;
                
            case 'filters':
                newPreservedFields.filterCategories = value;
                newPreservedFields.filterSubcategories = value;
                newPreservedFields.filterTraits = value;
                break;
                
            case 'all':
                Object.keys(newPreservedFields).forEach(key => {
                    newPreservedFields[key] = value;
                });
                break;
                
            default:
                break;
        }
        
        setPreservedFields(newPreservedFields);
    };
    
    // Handle dialog confirmation
    const handleConfirm = useCallback(() => {
        // Save preferences if requested
        if (rememberPreferences) {
            localStorage.setItem('aiImprovementPreferences', 'true');
            localStorage.setItem('aiPreservedFields', JSON.stringify(preservedFields));
        } else {
            localStorage.removeItem('aiImprovementPreferences');
            localStorage.removeItem('aiPreservedFields');
        }
        
        // Create a compatibility object for the onConfirm callback
        // This ensures backward compatibility with code expecting the old field structure
        const compatibilityFields = {
            ...preservedFields,
            // Expand the combined fields back to individual fields
            levelRangeMin: preservedFields.levelRange,
            levelRangeMax: preservedFields.levelRange,
            itemBiasX: preservedFields.itemBias,
            itemBiasY: preservedFields.itemBias,
            rarityCommon: preservedFields.rarityDistribution,
            rarityUncommon: preservedFields.rarityDistribution,
            rarityRare: preservedFields.rarityDistribution,
            rarityUnique: preservedFields.rarityDistribution,
        };
        
        // Call the onConfirm callback with the compatibility fields
        onConfirm(compatibilityFields);
    }, [preservedFields, rememberPreferences, onConfirm]);
    
    // Helper to determine if a value is custom or default
    const isCustomValue = (value, defaultValue) => {
        if (value === undefined || value === null) return false;
        if (typeof value === 'object' && typeof defaultValue === 'object') {
            return JSON.stringify(value) !== JSON.stringify(defaultValue);
        }
        return value !== defaultValue;
    };
    
    // Format filter counts for display
    const getFilterCounts = (filterMap) => {
        const included = Array.from(filterMap.entries()).filter(([, state]) => state === 1).length;
        const excluded = Array.from(filterMap.entries()).filter(([, state]) => state === -1).length;
        return { included, excluded };
    };
    
    // If dialog is not open, don't render anything
    if (!isOpen) return null;
    
    // Get filter counts
    const categoryCounts = getFilterCounts(filterMaps.categories);
    const subcategoryCounts = getFilterCounts(filterMaps.subcategories);
    const traitCounts = getFilterCounts(filterMaps.traits);
    
    return (
        <div className="improvement-dialog-overlay" onClick={onClose}>
            <div className="improvement-dialog" onClick={e => e.stopPropagation()}>
                <div className="improvement-dialog-header">
                    <h2>Choose your Truths</h2>
                    <button className="improvement-dialog-close" onClick={onClose}>&times;</button>
                </div>
                
                <div className="improvement-dialog-description">
                    <p>Select which aspects of your shop you want to preserve. The oracle will treat checked items as fixed and only suggest improvements for unchecked items.</p>
                </div>
                
                <div className="improvement-dialog-content">
                    {/* Shop Details Section */}
                    <div className="field-section">
                        <div className="field-section-header">
                            <h3 className="field-section-title">Shop Details</h3>
                            <div className="field-section-actions">
                                <button onClick={() => handleSectionAction('details', true)}>Select All</button>
                                <button onClick={() => handleSectionAction('details', false)}>Deselect All</button>
                            </div>
                        </div>
                        
                        <div className="field-list">
                            <div className="field-item">
                                <input
                                    type="checkbox"
                                    id="field-name"
                                    className="field-checkbox"
                                    checked={preservedFields.name}
                                    onChange={() => handleCheckboxChange('name')}
                                />
                                <label htmlFor="field-name" className="field-label">
                                    Shop Name
                                    <span className={`field-value ${isCustomValue(shopState.name, DEFAULT_FIELD_VALUES.shopName) ? 'custom-value' : 'default-value'}`}>
                                        {shopState.name || DEFAULT_FIELD_VALUES.shopName}
                                    </span>
                                </label>
                            </div>
                            
                            <div className="field-item">
                                <input
                                    type="checkbox"
                                    id="field-type"
                                    className="field-checkbox"
                                    checked={preservedFields.type}
                                    onChange={() => handleCheckboxChange('type')}
                                />
                                <label htmlFor="field-type" className="field-label">
                                    Shop Type
                                    <span className={`field-value ${isCustomValue(shopState.type, DEFAULT_FIELD_VALUES.type) ? 'custom-value' : 'default-value'}`}>
                                        {shopState.type || DEFAULT_FIELD_VALUES.type}
                                    </span>
                                </label>
                            </div>
                            
                            <div className="field-item">
                                <input
                                    type="checkbox"
                                    id="field-keeper"
                                    className="field-checkbox"
                                    checked={preservedFields.keeperName}
                                    onChange={() => handleCheckboxChange('keeperName')}
                                />
                                <label htmlFor="field-keeper" className="field-label">
                                    Keeper Name
                                    <span className={`field-value ${isCustomValue(shopState.keeperName, DEFAULT_FIELD_VALUES.keeperName) ? 'custom-value' : 'default-value'}`}>
                                        {shopState.keeperName || DEFAULT_FIELD_VALUES.keeperName}
                                    </span>
                                </label>
                            </div>
                            
                            <div className="field-item">
                                <input
                                    type="checkbox"
                                    id="field-location"
                                    className="field-checkbox"
                                    checked={preservedFields.location}
                                    onChange={() => handleCheckboxChange('location')}
                                />
                                <label htmlFor="field-location" className="field-label">
                                    Location
                                    <span className={`field-value ${isCustomValue(shopState.location, DEFAULT_FIELD_VALUES.location) ? 'custom-value' : 'default-value'}`}>
                                        {shopState.location || DEFAULT_FIELD_VALUES.location}
                                    </span>
                                </label>
                            </div>
                            
                            <div className="field-item">
                                <input
                                    type="checkbox"
                                    id="field-description"
                                    className="field-checkbox"
                                    checked={preservedFields.description}
                                    onChange={() => handleCheckboxChange('description')}
                                />
                                <label htmlFor="field-description" className="field-label">
                                    Description
                                    <span className={`field-value ${isCustomValue(shopState.description, DEFAULT_FIELD_VALUES.description) ? 'custom-value' : 'default-value'}`}>
                                        {(shopState.description || DEFAULT_FIELD_VALUES.description).substring(0, 20)}...
                                    </span>
                                </label>
                            </div>
                            
                            <div className="field-item">
                                <input
                                    type="checkbox"
                                    id="field-keeper-description"
                                    className="field-checkbox"
                                    checked={preservedFields.keeperDescription}
                                    onChange={() => handleCheckboxChange('keeperDescription')}
                                />
                                <label htmlFor="field-keeper-description" className="field-label">
                                    Keeper Description
                                    <span className={`field-value ${isCustomValue(shopState.keeperDescription, DEFAULT_FIELD_VALUES.keeperDescription) ? 'custom-value' : 'default-value'}`}>
                                        {(shopState.keeperDescription || DEFAULT_FIELD_VALUES.keeperDescription).substring(0, 20)}...
                                    </span>
                                </label>
                            </div>
                        </div>
                    </div>
                    
                    {/* Shop Parameters Section */}
                    <div className="field-section">
                        <div className="field-section-header">
                            <h3 className="field-section-title">Shop Parameters</h3>
                            <div className="field-section-actions">
                                <button onClick={() => handleSectionAction('parameters', true)}>Select All</button>
                                <button onClick={() => handleSectionAction('parameters', false)}>Deselect All</button>
                            </div>
                        </div>
                        
                        <div className="field-list">
                            <div className="field-item">
                                <input
                                    type="checkbox"
                                    id="field-gold"
                                    className="field-checkbox"
                                    checked={preservedFields.gold}
                                    onChange={() => handleCheckboxChange('gold')}
                                />
                                <label htmlFor="field-gold" className="field-label">
                                    Gold Amount
                                    <span className={`field-value ${shopState.gold > 0 ? 'custom-value' : 'default-value'}`}>
                                        {shopState.gold || 0}
                                    </span>
                                </label>
                            </div>
                            
                            <div className="field-item">
                                <input
                                    type="checkbox"
                                    id="field-level-range"
                                    className="field-checkbox"
                                    checked={preservedFields.levelRange}
                                    onChange={() => handleCheckboxChange('levelRange')}
                                />
                                <label htmlFor="field-level-range" className="field-label">
                                    Level Range
                                    <span className={`field-value ${shopState.levelRange?.min > 0 || shopState.levelRange?.max > 0 ? 'custom-value' : 'default-value'}`}>
                                        {shopState.levelRange?.min || 0} - {shopState.levelRange?.max || 0}
                                    </span>
                                </label>
                            </div>
                            
                            <div className="field-item">
                                <input
                                    type="checkbox"
                                    id="field-rarity-distribution"
                                    className="field-checkbox"
                                    checked={preservedFields.rarityDistribution}
                                    onChange={() => handleCheckboxChange('rarityDistribution')}
                                />
                                <label htmlFor="field-rarity-distribution" className="field-label">
                                    Rarity Distribution
                                    <span className={`field-value ${
                                        isCustomValue(shopState.rarityDistribution?.Common, DEFAULT_FIELD_VALUES.rarityDistribution.Common) ||
                                        isCustomValue(shopState.rarityDistribution?.Uncommon, DEFAULT_FIELD_VALUES.rarityDistribution.Uncommon) ||
                                        isCustomValue(shopState.rarityDistribution?.Rare, DEFAULT_FIELD_VALUES.rarityDistribution.Rare) ||
                                        isCustomValue(shopState.rarityDistribution?.Unique, DEFAULT_FIELD_VALUES.rarityDistribution.Unique)
                                            ? 'custom-value' : 'default-value'
                                    }`}>
                                        Custom
                                    </span>
                                </label>
                            </div>
                            
                            <div className="field-item">
                                <input
                                    type="checkbox"
                                    id="field-item-bias"
                                    className="field-checkbox"
                                    checked={preservedFields.itemBias}
                                    onChange={() => handleCheckboxChange('itemBias')}
                                />
                                <label htmlFor="field-item-bias" className="field-label">
                                    Item Bias
                                    <span className={`field-value ${
                                        isCustomValue(shopState.itemBias?.x, DEFAULT_FIELD_VALUES.itemBias.x) ||
                                        isCustomValue(shopState.itemBias?.y, DEFAULT_FIELD_VALUES.itemBias.y)
                                            ? 'custom-value' : 'default-value'
                                    }`}>
                                        {shopState.itemBias?.x?.toFixed(2) || DEFAULT_FIELD_VALUES.itemBias.x}, 
                                        {shopState.itemBias?.y?.toFixed(2) || DEFAULT_FIELD_VALUES.itemBias.y}
                                    </span>
                                </label>
                            </div>
                        </div>
                    </div>
                    
                    {/* Filter Selections Section */}
                    <div className="field-section">
                        <div className="field-section-header">
                            <h3 className="field-section-title">Filter Selections</h3>
                            <div className="field-section-actions">
                                <button onClick={() => handleSectionAction('filters', true)}>Select All</button>
                                <button onClick={() => handleSectionAction('filters', false)}>Deselect All</button>
                            </div>
                        </div>
                        
                        <div className="field-list">
                            <div className="field-item">
                                <input
                                    type="checkbox"
                                    id="field-categories"
                                    className="field-checkbox"
                                    checked={preservedFields.filterCategories}
                                    onChange={() => handleCheckboxChange('filterCategories')}
                                />
                                <label htmlFor="field-categories" className="field-label">
                                    Categories
                                    <div className="filter-summary">
                                        <strong>{categoryCounts.included}</strong> included, 
                                        <strong> {categoryCounts.excluded}</strong> excluded
                                    </div>
                                </label>
                            </div>
                            
                            <div className="field-item">
                                <input
                                    type="checkbox"
                                    id="field-subcategories"
                                    className="field-checkbox"
                                    checked={preservedFields.filterSubcategories}
                                    onChange={() => handleCheckboxChange('filterSubcategories')}
                                />
                                <label htmlFor="field-subcategories" className="field-label">
                                    Subcategories
                                    <div className="filter-summary">
                                        <strong>{subcategoryCounts.included}</strong> included, 
                                        <strong> {subcategoryCounts.excluded}</strong> excluded
                                    </div>
                                </label>
                            </div>
                            
                            <div className="field-item">
                                <input
                                    type="checkbox"
                                    id="field-traits"
                                    className="field-checkbox"
                                    checked={preservedFields.filterTraits}
                                    onChange={() => handleCheckboxChange('filterTraits')}
                                />
                                <label htmlFor="field-traits" className="field-label">
                                    Traits
                                    <div className="filter-summary">
                                        <strong>{traitCounts.included}</strong> included, 
                                        <strong> {traitCounts.excluded}</strong> excluded
                                    </div>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div className="improvement-dialog-footer">
                    <div className="remember-preferences">
                        <input
                            type="checkbox"
                            id="remember-preferences"
                            className="field-checkbox"
                            checked={rememberPreferences}
                            onChange={() => setRememberPreferences(!rememberPreferences)}
                        />
                        <label htmlFor="remember-preferences" className="field-label">
                            Remember my preferences
                        </label>
                    </div>
                    
                    <div className="improvement-dialog-actions">
                        <button className="btn-cancel" onClick={onClose}>
                            Cancel
                        </button>
                        <button className="btn-confirm" onClick={handleConfirm}>
                            Confirm
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

ImprovementDialog.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    onConfirm: PropTypes.func.isRequired,
    shopState: PropTypes.object.isRequired,
    filterMaps: PropTypes.shape({
        categories: PropTypes.instanceOf(Map).isRequired,
        subcategories: PropTypes.instanceOf(Map).isRequired,
        traits: PropTypes.instanceOf(Map).isRequired
    }).isRequired
};

export default ImprovementDialog; 