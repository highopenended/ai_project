import { useState, useEffect, useCallback } from "react";
import PropTypes from "prop-types";
import "./ImprovementDialog.css";
import defaultShopData from "../../../utils/shopData";

/**
 * Dialog component for selecting which fields to preserve when requesting AI improvements
 */
const ImprovementDialog = ({ 
    isOpen, 
    onClose, 
    shopState, 
    filterMaps, 
    onConfirm
}) => {
    // State for tracking which fields to preserve
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
        levelRange: true,
        itemBias: true,
        rarityDistribution: true,
        
        // Filter selections
        filterCategories: true,
        filterSubcategories: true,
        filterTraits: true
    });
    
    // Initialize preserved fields based on saved preferences or default values
    useEffect(() => {
        if (isOpen) {
            // Auto-check fields that have non-default values
            setPreservedFields({
                name: shopState?.name !== defaultShopData.name,
                type: shopState?.type !== defaultShopData.type,
                keeperName: shopState?.keeperName !== defaultShopData.keeperName,
                location: shopState?.location !== defaultShopData.location,
                description: shopState?.description !== defaultShopData.description,
                keeperDescription: shopState?.keeperDescription !== defaultShopData.keeperDescription,
                
                gold: shopState?.gold > 0 && shopState?.gold !== defaultShopData.gold,
                levelRange: (shopState?.levelRange?.min !== defaultShopData.levelRange.min || 
                            shopState?.levelRange?.max !== defaultShopData.levelRange.max),
                
                itemBias: shopState?.itemBias?.x !== defaultShopData.itemBias.x || 
                          shopState?.itemBias?.y !== defaultShopData.itemBias.y,
                
                rarityDistribution: shopState?.rarityDistribution?.Common !== defaultShopData.rarityDistribution.Common ||
                                   shopState?.rarityDistribution?.Uncommon !== defaultShopData.rarityDistribution.Uncommon ||
                                   shopState?.rarityDistribution?.Rare !== defaultShopData.rarityDistribution.Rare ||
                                   shopState?.rarityDistribution?.Unique !== defaultShopData.rarityDistribution.Unique,
                
                filterCategories: filterMaps?.categories.size > 0,
                filterSubcategories: filterMaps?.subcategories.size > 0,
                filterTraits: filterMaps?.traits.size > 0
            });
        }
    }, [isOpen, shopState, filterMaps]);
    
    // Handle checkbox changes
    const handleCheckboxChange = (field) => {
        setPreservedFields(prev => ({
            ...prev,
            [field]: !prev[field]
        }));
    };
    
    // Select all fields in a section
    const selectAllInSection = (section) => {
        const newPreservedFields = { ...preservedFields };
        
        if (section === 'details') {
            newPreservedFields.name = true;
            newPreservedFields.type = true;
            newPreservedFields.keeperName = true;
            newPreservedFields.location = true;
            newPreservedFields.description = true;
            newPreservedFields.keeperDescription = true;
        } else if (section === 'parameters') {
            newPreservedFields.gold = true;
            newPreservedFields.levelRange = true;
            newPreservedFields.itemBias = true;
            newPreservedFields.rarityDistribution = true;
        } else if (section === 'filters') {
            newPreservedFields.filterCategories = true;
            newPreservedFields.filterSubcategories = true;
            newPreservedFields.filterTraits = true;
        }
        
        setPreservedFields(newPreservedFields);
    };
    
    // Deselect all fields in a section
    const deselectAllInSection = (section) => {
        const newPreservedFields = { ...preservedFields };
        
        if (section === 'details') {
            newPreservedFields.name = false;
            newPreservedFields.type = false;
            newPreservedFields.keeperName = false;
            newPreservedFields.location = false;
            newPreservedFields.description = false;
            newPreservedFields.keeperDescription = false;
        } else if (section === 'parameters') {
            newPreservedFields.gold = false;
            newPreservedFields.levelRange = false;
            newPreservedFields.itemBias = false;
            newPreservedFields.rarityDistribution = false;
        } else if (section === 'filters') {
            newPreservedFields.filterCategories = false;
            newPreservedFields.filterSubcategories = false;
            newPreservedFields.filterTraits = false;
        }
        
        setPreservedFields(newPreservedFields);
    };
    
    // Handle dialog confirmation
    const handleConfirm = useCallback(() => {
        onConfirm(preservedFields);
        onClose();
    }, [preservedFields, onConfirm, onClose]);
    
    // Format value display
    const formatValue = (value, defaultValue) => {
        if (value === undefined || value === null) return "Not set";
        if (typeof value === 'object') return JSON.stringify(value);
        if (value === defaultValue) return value.toString();
        return value.toString();
    };
    
    // Format gold with commas and "gp" suffix
    const formatGold = (gold) => {
        const goldValue = gold || 0;
        return `${goldValue.toLocaleString()} gp`;
    };
    
    // Format level range display with spaces
    const formatLevelRange = () => {
        const min = shopState?.levelRange?.min || 0;
        const max = shopState?.levelRange?.max || 0;
        return `${min} - ${max}`;
    };
    
    // Format item bias display as Variety and Cost percentages
    const formatItemBias = () => {
        // Check if itemBias exists in shopState, otherwise use default values
        // Explicitly check for 0 values to avoid treating them as falsey
        const x = (shopState?.itemBias?.x !== undefined && shopState?.itemBias?.x !== null) 
            ? shopState.itemBias.x 
            : defaultShopData.itemBias.x;
            
        const y = (shopState?.itemBias?.y !== undefined && shopState?.itemBias?.y !== null) 
            ? shopState.itemBias.y 
            : defaultShopData.itemBias.y;
        
        // Convert to percentages (assuming x and y are between 0 and 1)
        const varietyPercent = Math.round(x * 100);
        const costPercent = Math.round(y * 100);
        
        return (
            <span style={{ whiteSpace: 'nowrap' }}>
                <span className="bias-label">Variety:</span> <span className="bias-value">{varietyPercent}%</span>
                <span style={{ display: 'inline-block', width: '8px' }}></span>
                <span className="bias-label">Cost:</span> <span className="bias-value">{costPercent}%</span>
            </span>
        );
    };
    
    // Format rarity distribution display with colored percentages
    const formatRarityDistribution = () => {
        const common = shopState?.rarityDistribution?.Common || defaultShopData.rarityDistribution.Common;
        const uncommon = shopState?.rarityDistribution?.Uncommon || defaultShopData.rarityDistribution.Uncommon;
        const rare = shopState?.rarityDistribution?.Rare || defaultShopData.rarityDistribution.Rare;
        const unique = shopState?.rarityDistribution?.Unique || defaultShopData.rarityDistribution.Unique;
        
        return (
            <span>
                <span className="rarity-common">{common}%</span>
                <span className="rarity-separator"></span>
                <span className="rarity-uncommon">{uncommon}%</span>
                <span className="rarity-separator"></span>
                <span className="rarity-rare">{rare}%</span>
                <span className="rarity-separator"></span>
                <span className="rarity-unique">{unique}%</span>
            </span>
        );
    };
    
    // Get filter count
    const getFilterCount = (filterMap) => {
        return filterMap ? filterMap.size : 0;
    };
    
    if (!isOpen) return null;
    
    return (
        <div className="improvement-dialog-overlay" onClick={onClose}>
            <div className="improvement-dialog" onClick={(e) => e.stopPropagation()}>
                <div className="improvement-dialog-header">
                    <h2>Select Fields to Preserve</h2>
                    <button className="improvement-dialog-close" onClick={onClose}>×</button>
                </div>
                
                <div className="improvement-dialog-description">
                    Check the boxes for fields you want to preserve. The AI will treat these as absolute truth and only suggest improvements for unchecked fields.
                </div>
                
                <div className="improvement-dialog-sections">
                    {/* Shop Details Section */}
                    <div className="improvement-dialog-section">
                        <div className="section-header">
                            <h3 className="section-title">Shop Details</h3>
                            <div className="section-actions">
                                <button 
                                    className="section-action-button" 
                                    onClick={() => selectAllInSection('details')}
                                >
                                    Select All
                                </button>
                                <button 
                                    className="section-action-button" 
                                    onClick={() => deselectAllInSection('details')}
                                >
                                    Deselect All
                                </button>
                            </div>
                        </div>
                        
                        <div className="field-list single-column">
                            <div 
                                className="field-item" 
                                onClick={() => handleCheckboxChange('name')}
                            >
                                <input 
                                    type="checkbox" 
                                    id="name" 
                                    className="field-checkbox" 
                                    checked={preservedFields.name} 
                                    onChange={() => {}} // Empty handler since parent div handles the click
                                />
                                <label htmlFor="name" className="field-label">Shop Name</label>
                                <span className="field-value">
                                    {formatValue(shopState?.name, defaultShopData.name)}
                                </span>
                            </div>
                            
                            <div 
                                className="field-item"
                                onClick={() => handleCheckboxChange('type')}
                            >
                                <input 
                                    type="checkbox" 
                                    id="type" 
                                    className="field-checkbox" 
                                    checked={preservedFields.type} 
                                    onChange={() => {}} // Empty handler since parent div handles the click
                                />
                                <label htmlFor="type" className="field-label">Shop Type</label>
                                <span className="field-value">
                                    {formatValue(shopState?.type, defaultShopData.type)}
                                </span>
                            </div>
                            
                            <div 
                                className="field-item"
                                onClick={() => handleCheckboxChange('keeperName')}
                            >
                                <input 
                                    type="checkbox" 
                                    id="keeperName" 
                                    className="field-checkbox" 
                                    checked={preservedFields.keeperName} 
                                    onChange={() => {}} // Empty handler since parent div handles the click
                                />
                                <label htmlFor="keeperName" className="field-label">Keeper Name</label>
                                <span className="field-value">
                                    {formatValue(shopState?.keeperName, defaultShopData.keeperName)}
                                </span>
                            </div>
                            
                            <div 
                                className="field-item"
                                onClick={() => handleCheckboxChange('location')}
                            >
                                <input 
                                    type="checkbox" 
                                    id="location" 
                                    className="field-checkbox" 
                                    checked={preservedFields.location} 
                                    onChange={() => {}} // Empty handler since parent div handles the click
                                />
                                <label htmlFor="location" className="field-label">Location</label>
                                <span className="field-value">
                                    {formatValue(shopState?.location, defaultShopData.location)}
                                </span>
                            </div>
                            
                            <div 
                                className="field-item"
                                onClick={() => handleCheckboxChange('description')}
                            >
                                <input 
                                    type="checkbox" 
                                    id="description" 
                                    className="field-checkbox" 
                                    checked={preservedFields.description} 
                                    onChange={() => {}} // Empty handler since parent div handles the click
                                />
                                <label htmlFor="description" className="field-label">Description</label>
                                <span className="field-value">
                                    {formatValue(shopState?.description?.substring(0, 60) + (shopState?.description?.length > 60 ? '...' : ''), defaultShopData.description)}
                                </span>
                            </div>
                            
                            <div 
                                className="field-item"
                                onClick={() => handleCheckboxChange('keeperDescription')}
                            >
                                <input 
                                    type="checkbox" 
                                    id="keeperDescription" 
                                    className="field-checkbox" 
                                    checked={preservedFields.keeperDescription} 
                                    onChange={() => {}} // Empty handler since parent div handles the click
                                />
                                <label htmlFor="keeperDescription" className="field-label">Keeper Description</label>
                                <span className="field-value">
                                    {formatValue(shopState?.keeperDescription?.substring(0, 60) + (shopState?.keeperDescription?.length > 60 ? '...' : ''), defaultShopData.keeperDescription)}
                                </span>
                            </div>
                        </div>
                    </div>
                    
                    {/* Shop Parameters Section */}
                    <div className="improvement-dialog-section">
                        <div className="section-header">
                            <h3 className="section-title">Shop Parameters</h3>
                            <div className="section-actions">
                                <button 
                                    className="section-action-button" 
                                    onClick={() => selectAllInSection('parameters')}
                                >
                                    Select All
                                </button>
                                <button 
                                    className="section-action-button" 
                                    onClick={() => deselectAllInSection('parameters')}
                                >
                                    Deselect All
                                </button>
                            </div>
                        </div>
                        
                        <div className="field-list single-column">
                            <div 
                                className="field-item"
                                onClick={() => handleCheckboxChange('gold')}
                            >
                                <input 
                                    type="checkbox" 
                                    id="gold" 
                                    className="field-checkbox" 
                                    checked={preservedFields.gold} 
                                    onChange={() => {}} // Empty handler since parent div handles the click
                                />
                                <label htmlFor="gold" className="field-label">Gold</label>
                                <span className="field-value">
                                    {formatGold(shopState?.gold)}
                                </span>
                            </div>
                            
                            <div 
                                className="field-item"
                                onClick={() => handleCheckboxChange('levelRange')}
                            >
                                <input 
                                    type="checkbox" 
                                    id="levelRange" 
                                    className="field-checkbox" 
                                    checked={preservedFields.levelRange} 
                                    onChange={() => {}} // Empty handler since parent div handles the click
                                />
                                <label htmlFor="levelRange" className="field-label">Level Range</label>
                                <span className="field-value">
                                    {formatLevelRange()}
                                </span>
                            </div>
                            
                            <div 
                                className="field-item"
                                onClick={() => handleCheckboxChange('itemBias')}
                            >
                                <input 
                                    type="checkbox" 
                                    id="itemBias" 
                                    className="field-checkbox" 
                                    checked={preservedFields.itemBias} 
                                    onChange={() => {}} // Empty handler since parent div handles the click
                                />
                                <label htmlFor="itemBias" className="field-label">Item Bias</label>
                                <span className="field-value">
                                    {formatItemBias()}
                                </span>
                            </div>
                            
                            <div 
                                className="field-item"
                                onClick={() => handleCheckboxChange('rarityDistribution')}
                            >
                                <input 
                                    type="checkbox" 
                                    id="rarityDistribution" 
                                    className="field-checkbox" 
                                    checked={preservedFields.rarityDistribution} 
                                    onChange={() => {}} // Empty handler since parent div handles the click
                                />
                                <label htmlFor="rarityDistribution" className="field-label">Rarity Distribution</label>
                                <span className="field-value">
                                    {formatRarityDistribution()}
                                </span>
                            </div>
                        </div>
                    </div>
                    
                    {/* Filter Selections Section */}
                    <div className="improvement-dialog-section">
                        <div className="section-header">
                            <h3 className="section-title">Filter Selections</h3>
                            <div className="section-actions">
                                <button 
                                    className="section-action-button" 
                                    onClick={() => selectAllInSection('filters')}
                                >
                                    Select All
                                </button>
                                <button 
                                    className="section-action-button" 
                                    onClick={() => deselectAllInSection('filters')}
                                >
                                    Deselect All
                                </button>
                            </div>
                        </div>
                        
                        <div className="field-list single-column">
                            <div 
                                className="field-item"
                                onClick={() => handleCheckboxChange('filterCategories')}
                            >
                                <input 
                                    type="checkbox" 
                                    id="filterCategories" 
                                    className="field-checkbox" 
                                    checked={preservedFields.filterCategories} 
                                    onChange={() => {}} // Empty handler since parent div handles the click
                                />
                                <label htmlFor="filterCategories" className="field-label">Categories</label>
                                <span className="field-value">
                                    {getFilterCount(filterMaps?.categories)} selected
                                </span>
                            </div>
                            
                            <div 
                                className="field-item"
                                onClick={() => handleCheckboxChange('filterSubcategories')}
                            >
                                <input 
                                    type="checkbox" 
                                    id="filterSubcategories" 
                                    className="field-checkbox" 
                                    checked={preservedFields.filterSubcategories} 
                                    onChange={() => {}} // Empty handler since parent div handles the click
                                />
                                <label htmlFor="filterSubcategories" className="field-label">Subcategories</label>
                                <span className="field-value">
                                    {getFilterCount(filterMaps?.subcategories)} selected
                                </span>
                            </div>
                            
                            <div 
                                className="field-item"
                                onClick={() => handleCheckboxChange('filterTraits')}
                            >
                                <input 
                                    type="checkbox" 
                                    id="filterTraits" 
                                    className="field-checkbox" 
                                    checked={preservedFields.filterTraits} 
                                    onChange={() => {}} // Empty handler since parent div handles the click
                                />
                                <label htmlFor="filterTraits" className="field-label">Traits</label>
                                <span className="field-value">
                                    {getFilterCount(filterMaps?.traits)} selected
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div className="improvement-dialog-actions">
                    <button className="dialog-button cancel-button" onClick={onClose}>
                        Cancel
                    </button>
                    <button className="dialog-button confirm-button" onClick={handleConfirm}>
                        Get Suggestions
                    </button>
                </div>
            </div>
        </div>
    );
};

ImprovementDialog.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    shopState: PropTypes.object,
    filterMaps: PropTypes.object,
    onConfirm: PropTypes.func.isRequired
};

export default ImprovementDialog; 