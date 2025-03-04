import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import "./ImprovementDialog.css";
import defaultShopData from "../../../utils/shopData";

const FIELD_SECTIONS = {
    BASIC: "basic",
    PARAMETERS: "parameters",
    FILTERS: "filters"
};

const FIELD_DEFINITIONS = {
    // Basic Fields
    name: { label: "Shop Name", defaultValue: defaultShopData.name },
    keeperName: { label: "Keeper Name", defaultValue: defaultShopData.keeperName },
    type: { label: "Shop Type", defaultValue: defaultShopData.type },
    location: { label: "Location", defaultValue: defaultShopData.location },
    description: { label: "Description", defaultValue: defaultShopData.description },
    keeperDescription: { label: "Keeper Description", defaultValue: defaultShopData.keeperDescription },

    // Parameter Fields
    gold: { label: "Gold", defaultValue: defaultShopData.gold },
    levelRange: { label: "Level Range", defaultValue: defaultShopData.levelRange },
    itemBias: { label: "Item Bias", defaultValue: defaultShopData.itemBias },
    rarityDistribution: { label: "Rarity Distribution", defaultValue: defaultShopData.rarityDistribution },

    // Filter Fields
    filterCategories: { label: "Categories", defaultValue: {} }
};

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
    const [selectedFields, setSelectedFields] = useState(new Set());
    
    // Reset selected fields when dialog opens
    useEffect(() => {
        if (isOpen) {
            // Start with empty set - all fields unchecked
            setSelectedFields(new Set());
        }
    }, [isOpen]);
    
    if (!isOpen) return null;
    
    const handleCheckboxChange = (field) => {
        setSelectedFields(prev => {
            const newSet = new Set(prev);
            if (newSet.has(field)) {
                newSet.delete(field);
            } else {
                newSet.add(field);
            }
            return newSet;
        });
    };
    
    const selectAllInSection = (section) => {
        setSelectedFields(prev => {
            const newSet = new Set(prev);
            Object.entries(FIELD_DEFINITIONS).forEach(([field]) => {
                switch (section) {
                    case FIELD_SECTIONS.BASIC:
                        if (["name", "keeperName", "type", "location", "description", "keeperDescription"].includes(field)) {
                            newSet.add(field);
                        }
                        break;
                    case FIELD_SECTIONS.PARAMETERS:
                        if (["gold", "levelRange", "itemBias", "rarityDistribution"].includes(field)) {
                            newSet.add(field);
                        }
                        break;
                    case FIELD_SECTIONS.FILTERS:
                        if (["filterCategories"].includes(field)) {
                            newSet.add(field);
                        }
                        break;
                }
            });
            return newSet;
        });
    };
    
    const deselectAllInSection = (section) => {
        setSelectedFields(prev => {
            const newSet = new Set(prev);
            Object.entries(FIELD_DEFINITIONS).forEach(([field]) => {
                switch (section) {
                    case FIELD_SECTIONS.BASIC:
                        if (["name", "keeperName", "type", "location", "description", "keeperDescription"].includes(field)) {
                            newSet.delete(field);
                        }
                        break;
                    case FIELD_SECTIONS.PARAMETERS:
                        if (["gold", "levelRange", "itemBias", "rarityDistribution"].includes(field)) {
                            newSet.delete(field);
                        }
                        break;
                    case FIELD_SECTIONS.FILTERS:
                        if (["filterCategories"].includes(field)) {
                            newSet.delete(field);
                        }
                        break;
                }
            });
            return newSet;
        });
    };
    
    const formatGold = (gold) => {
        return (
            <span className="field-value">{gold.toLocaleString()} gp</span>
        );
    };
    
    const formatLevelRange = () => {
        return (
            <span className="field-value">
                {shopState.levelRange.min} - {shopState.levelRange.max}
            </span>
        );
    };
    
    const formatItemBias = () => {
        const { x, y } = shopState.itemBias;
        return (
            <span className="field-value">
                <span className="bias-value">
                    <span className="bias-label">Variety:</span> {Math.round(x * 100)}%
                </span>
                <span className="bias-value">
                    <span className="bias-label">Cost:</span> {Math.round(y * 100)}%
                </span>
            </span>
        );
    };
    
    const formatRarityDistribution = () => {
        const { Common, Uncommon, Rare, Unique } = shopState.rarityDistribution;
        return (
            <span className="field-value">
                <span className="rarity-common">{Common}%</span>
                <span className="rarity-separator"></span>
                <span className="rarity-uncommon">{Uncommon}%</span>
                <span className="rarity-separator"></span>
                <span className="rarity-rare">{Rare}%</span>
                <span className="rarity-separator"></span>
                <span className="rarity-unique">{Unique}%</span>
            </span>
        );
    };
    
    const getFilterCount = (filterMap) => {
        let included = 0;
        let excluded = 0;
        filterMap.forEach((value) => {
            if (value === 1) included++;
            else if (value === -1) excluded++;
        });
        return { included, excluded };
    };
    
    return (
        <div className="improvement-dialog-overlay" onClick={onClose}>
            <div className="improvement-dialog" onClick={(e) => e.stopPropagation()}>
                <div className="improvement-dialog-header">
                    <h2>Fields to Improve</h2>
                    <button className="improvement-dialog-close" onClick={onClose}>×</button>
                </div>
                
                <div className="improvement-dialog-description">
                    Select the fields you want the AI to suggest improvements for. Unselected fields will be treated as absolute truth and preserved.
                </div>
                
                <div className="improvement-dialog-sections">
                    {/* Basic Fields Section */}
                    <div className="improvement-dialog-section">
                        <div className="section-header">
                            <h3 className="section-title">Basic Information</h3>
                            <div className="section-actions">
                                <button className="section-action-button" onClick={() => selectAllInSection(FIELD_SECTIONS.BASIC)}>Select All</button>
                                <button className="section-action-button" onClick={() => deselectAllInSection(FIELD_SECTIONS.BASIC)}>Deselect All</button>
                            </div>
                        </div>
                        <div className="field-list single-column">
                            {Object.entries(FIELD_DEFINITIONS)
                                .filter(([field]) => ["name", "keeperName", "type", "location", "description", "keeperDescription"].includes(field))
                                .map(([field, { label }]) => (
                                    <div key={field} className="field-item" onClick={() => handleCheckboxChange(field)}>
                                        <input
                                            type="checkbox"
                                            className="field-checkbox"
                                            checked={selectedFields.has(field)}
                                            onChange={() => {}}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleCheckboxChange(field);
                                            }}
                                        />
                                        <span className="field-label">{label}</span>
                                        <span className="field-value">{shopState[field]}</span>
                                    </div>
                                ))}
                        </div>
                    </div>
                    
                    {/* Parameters Section */}
                    <div className="improvement-dialog-section">
                        <div className="section-header">
                            <h3 className="section-title">Parameters</h3>
                            <div className="section-actions">
                                <button className="section-action-button" onClick={() => selectAllInSection(FIELD_SECTIONS.PARAMETERS)}>Select All</button>
                                <button className="section-action-button" onClick={() => deselectAllInSection(FIELD_SECTIONS.PARAMETERS)}>Deselect All</button>
                            </div>
                        </div>
                        <div className="field-list single-column">
                            <div className="field-item" onClick={() => handleCheckboxChange("gold")}>
                                <input
                                    type="checkbox"
                                    className="field-checkbox"
                                    checked={selectedFields.has("gold")}
                                    onChange={() => {}}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleCheckboxChange("gold");
                                    }}
                                />
                                <span className="field-label">Gold</span>
                                {formatGold(shopState.gold)}
                            </div>
                            <div className="field-item" onClick={() => handleCheckboxChange("levelRange")}>
                                <input
                                    type="checkbox"
                                    className="field-checkbox"
                                    checked={selectedFields.has("levelRange")}
                                    onChange={() => {}}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleCheckboxChange("levelRange");
                                    }}
                                />
                                <span className="field-label">Level Range</span>
                                {formatLevelRange()}
                            </div>
                            <div className="field-item" onClick={() => handleCheckboxChange("itemBias")}>
                                <input
                                    type="checkbox"
                                    className="field-checkbox"
                                    checked={selectedFields.has("itemBias")}
                                    onChange={() => {}}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleCheckboxChange("itemBias");
                                    }}
                                />
                                <span className="field-label">Item Bias</span>
                                {formatItemBias()}
                            </div>
                            <div className="field-item" onClick={() => handleCheckboxChange("rarityDistribution")}>
                                <input
                                    type="checkbox"
                                    className="field-checkbox"
                                    checked={selectedFields.has("rarityDistribution")}
                                    onChange={() => {}}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleCheckboxChange("rarityDistribution");
                                    }}
                                />
                                <span className="field-label">Rarity Distribution</span>
                                {formatRarityDistribution()}
                            </div>
                        </div>
                    </div>
                    
                    {/* Filters Section */}
                    <div className="improvement-dialog-section">
                        <div className="section-header">
                            <h3 className="section-title">Filters</h3>
                            <div className="section-actions">
                                <button className="section-action-button" onClick={() => selectAllInSection(FIELD_SECTIONS.FILTERS)}>Select All</button>
                                <button className="section-action-button" onClick={() => deselectAllInSection(FIELD_SECTIONS.FILTERS)}>Deselect All</button>
                            </div>
                        </div>
                        <div className="field-list single-column">
                            <div className="field-item" onClick={() => handleCheckboxChange("filterCategories")}>
                                <input
                                    type="checkbox"
                                    className="field-checkbox"
                                    checked={selectedFields.has("filterCategories")}
                                    onChange={() => {}}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleCheckboxChange("filterCategories");
                                    }}
                                />
                                <span className="field-label">Categories</span>
                                {(() => {
                                    const { included, excluded } = getFilterCount(filterMaps.categories);
                                    return (
                                        <span className="field-value">
                                            {included} included, {excluded} excluded
                                        </span>
                                    );
                                })()}
                            </div>
                        </div>
                    </div>
                </div>
                
                <div className="improvement-dialog-actions">
                    <button
                        className="dialog-button confirm-button"
                        onClick={() => {
                            const preservedFieldsObj = {};
                            // Invert the logic: fields NOT in selectedFields should be preserved
                            Object.keys(FIELD_DEFINITIONS).forEach(field => {
                                preservedFieldsObj[field] = !selectedFields.has(field);
                            });
                            onConfirm(preservedFieldsObj);
                        }}
                        disabled={selectedFields.size === 0}
                    >
                        Analyze
                    </button>
                    <button className="dialog-button cancel-button" onClick={onClose}>
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

ImprovementDialog.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    shopState: PropTypes.object.isRequired,
    filterMaps: PropTypes.object.isRequired,
    onConfirm: PropTypes.func.isRequired
};

export default ImprovementDialog; 