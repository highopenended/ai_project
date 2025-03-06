import { useState } from 'react';
import PropTypes from 'prop-types';
import './ConfirmSuggestionsDialog.css';

/**
 * Dialog component that displays suggested changes and allows user to confirm or cancel
 * 
 * @param {boolean} isOpen - Whether the dialog is open
 * @param {Function} onClose - Function to close the dialog
 * @param {Function} onConfirm - Function to confirm and apply changes
 * @param {Object} suggestedChanges - The changes suggested by the AI
 */
const ConfirmSuggestionsDialog = ({ isOpen, onClose, onConfirm, suggestedChanges }) => {
    // Define available change types
    const changeTypes = [
        // Shop details
        { key: 'name', label: 'Shop Name', section: 'details' },
        { key: 'keeperName', label: 'Shopkeeper Name', section: 'details' },
        { key: 'type', label: 'Shop Type', section: 'details' },
        { key: 'location', label: 'Location', section: 'details' },
        { key: 'description', label: 'Shop Description', section: 'details' },
        { key: 'keeperDescription', label: 'Keeper Description', section: 'details' },
        
        // Shop parameters
        { key: 'gold', label: 'Gold', section: 'parameters' },
        { key: 'levelRange', label: 'Level Range', section: 'parameters' },
        { key: 'itemBias', label: 'Item Bias', section: 'parameters' },
        { key: 'rarityDistribution', label: 'Rarity Distribution', section: 'parameters' }
    ];

    // Initialize selected changes - all checked by default if they exist in suggestedChanges
    const [selectedChanges, setSelectedChanges] = useState(
        changeTypes.reduce((acc, { key }) => {
            acc[key] = suggestedChanges[key] !== undefined;
            return acc;
        }, {})
    );

    if (!isOpen) return null;

    // Handle checkbox change
    const handleCheckboxChange = (key) => {
        setSelectedChanges(prev => ({
            ...prev,
            [key]: !prev[key]
        }));
    };

    // Handle confirm with only selected changes
    const handleConfirm = () => {
        // Create a new object with only the selected changes
        const filteredChanges = Object.keys(selectedChanges)
            .filter(key => selectedChanges[key])
            .reduce((acc, key) => {
                if (suggestedChanges[key] !== undefined) {
                    acc[key] = suggestedChanges[key];
                }
                return acc;
            }, { suggestionsSummary: suggestedChanges.suggestionsSummary });

        onConfirm(filteredChanges);
    };

    // Format gold display
    const formatGold = (gold) => {
        return gold !== undefined ? `${gold} gold` : 'No change';
    };

    // Format level range display
    const formatLevelRange = (levelRange) => {
        if (!levelRange || typeof levelRange !== 'object') return 'No change';
        
        // Safely access min and max properties
        const min = 'min' in levelRange && typeof levelRange.min === 'number' ? levelRange.min : 0;
        const max = 'max' in levelRange && typeof levelRange.max === 'number' ? levelRange.max : 0;
        
        return `Level ${min} - ${max}`;
    };

    // Format item bias display
    const formatItemBias = (itemBias) => {
        if (!itemBias) return 'No change';
        
        // Log the item bias for debugging
        console.log("Formatting item bias:", itemBias);
        
        // Safely access x and y properties with fallbacks
        let x, y;
        
        if (typeof itemBias === 'object') {
            // Handle direct x/y format
            if ('x' in itemBias && 'y' in itemBias) {
                x = itemBias.x;
                y = itemBias.y;
            } 
            // Handle Variety/Cost format
            else if ('Variety' in itemBias || 'variety' in itemBias ||
                    'Cost' in itemBias || 'cost' in itemBias) {
                x = itemBias.Variety || itemBias.variety || 0.5;
                y = itemBias.Cost || itemBias.cost || 0.5;
            } else {
                x = 0.5;
                y = 0.5;
            }
        } else {
            x = 0.5;
            y = 0.5;
        }
        
        // Item bias is stored as x and y coordinates
        // x represents Variety (0 = Specialized, 1 = Varied)
        // y represents Cost (0 = Expensive, 1 = Cheap)
        const variety = typeof x === 'number' ? x.toFixed(1) : parseFloat(x).toFixed(1);
        const cost = typeof y === 'number' ? y.toFixed(1) : parseFloat(y).toFixed(1);
        
        return `Variety: ${variety}, Cost: ${cost}`;
    };

    // Format rarity distribution display
    const formatRarityDistribution = (rarityDistribution) => {
        if (!rarityDistribution || typeof rarityDistribution !== 'object') {
            return 'No change';
        }
        
        try {
            return Object.entries(rarityDistribution)
                .map(([rarity, percentage]) => `${rarity}: ${percentage}%`)
                .join(', ');
        } catch (error) {
            console.error('Error formatting rarity distribution:', error);
            return 'Invalid format';
        }
    };

    // Format text fields (name, descriptions, etc.)
    const formatTextField = (text) => {
        if (!text) return 'No change';
        return text.length > 50 ? `${text.substring(0, 50)}...` : text;
    };

    // Get formatter function for a specific change type
    const getFormatter = (key) => {
        const formatters = {
            // Shop details
            name: formatTextField,
            keeperName: formatTextField,
            type: formatTextField,
            location: formatTextField,
            description: formatTextField,
            keeperDescription: formatTextField,
            
            // Shop parameters
            gold: formatGold,
            levelRange: formatLevelRange,
            itemBias: formatItemBias,
            rarityDistribution: formatRarityDistribution
        };
        
        // Return the formatter or a safe fallback
        const formatter = formatters[key] || (() => 'Unknown format');
        
        // Wrap in try/catch to prevent crashes
        return (value) => {
            try {
                return formatter(value);
            } catch (error) {
                console.error(`Error formatting ${key}:`, error);
                return 'Error formatting value';
            }
        };
    };

    // Group changes by section
    const detailChanges = changeTypes
        .filter(({ section, key }) => section === 'details' && suggestedChanges[key] !== undefined);
    
    const parameterChanges = changeTypes
        .filter(({ section, key }) => section === 'parameters' && suggestedChanges[key] !== undefined);

    // Check if we have any changes in each section
    const hasDetailChanges = detailChanges.length > 0;
    const hasParameterChanges = parameterChanges.length > 0;

    return (
        <div className="confirm-suggestions-dialog-overlay">
            <div className="confirm-suggestions-dialog">
                <div className="confirm-suggestions-dialog-header">
                    <h2>Apply Suggested Changes</h2>
                    <button className="close-button" onClick={onClose}>×</button>
                </div>
                
                <div className="confirm-suggestions-dialog-content">
                    <div className="changes-summary">
                        <p>{suggestedChanges.suggestionsSummary}</p>
                    </div>
                    
                    <div className="changes-details">
                        {hasDetailChanges && (
                            <div className="changes-section">
                                <h3 className="section-title">Shop Details</h3>
                                {detailChanges.map(({ key, label }) => (
                                    <div 
                                        className={`change-item ${!selectedChanges[key] ? 'disabled' : ''}`} 
                                        key={key}
                                        onClick={() => handleCheckboxChange(key)}
                                    >
                                        <div className="change-row">
                                            <div className="change-checkbox-container">
                                                <input
                                                    type="checkbox"
                                                    id={`checkbox-${key}`}
                                                    checked={selectedChanges[key]}
                                                    onChange={() => handleCheckboxChange(key)}
                                                    onClick={(e) => e.stopPropagation()}
                                                />
                                                <label 
                                                    htmlFor={`checkbox-${key}`} 
                                                    className="change-label"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    {label}:
                                                </label>
                                            </div>
                                            <span className="change-value">
                                                {getFormatter(key)(suggestedChanges[key])}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        
                        {hasParameterChanges && (
                            <div className="changes-section">
                                <h3 className="section-title">Shop Parameters</h3>
                                {parameterChanges.map(({ key, label }) => (
                                    <div 
                                        className={`change-item ${!selectedChanges[key] ? 'disabled' : ''}`} 
                                        key={key}
                                        onClick={() => handleCheckboxChange(key)}
                                    >
                                        <div className="change-row">
                                            <div className="change-checkbox-container">
                                                <input
                                                    type="checkbox"
                                                    id={`checkbox-${key}`}
                                                    checked={selectedChanges[key]}
                                                    onChange={() => handleCheckboxChange(key)}
                                                    onClick={(e) => e.stopPropagation()}
                                                />
                                                <label 
                                                    htmlFor={`checkbox-${key}`} 
                                                    className="change-label"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    {label}:
                                                </label>
                                            </div>
                                            <span className="change-value">
                                                {getFormatter(key)(suggestedChanges[key])}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        
                        {!hasDetailChanges && !hasParameterChanges && (
                            <div className="no-changes">
                                <p>No changes to apply.</p>
                            </div>
                        )}
                    </div>
                </div>
                
                <div className="confirm-suggestions-dialog-actions">
                    <button className="cancel-button" onClick={onClose}>Cancel</button>
                    <button 
                        className="confirm-button" 
                        onClick={handleConfirm}
                        disabled={!hasDetailChanges && !hasParameterChanges}
                    >
                        Apply Selected Changes
                    </button>
                </div>
            </div>
        </div>
    );
};

ConfirmSuggestionsDialog.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    onConfirm: PropTypes.func.isRequired,
    suggestedChanges: PropTypes.shape({
        suggestionsSummary: PropTypes.string,
        // Shop details
        name: PropTypes.string,
        keeperName: PropTypes.string,
        type: PropTypes.string,
        location: PropTypes.string,
        description: PropTypes.string,
        keeperDescription: PropTypes.string,
        // Shop parameters
        gold: PropTypes.number,
        levelRange: PropTypes.shape({
            min: PropTypes.number,
            max: PropTypes.number
        }),
        itemBias: PropTypes.shape({
            x: PropTypes.number,
            y: PropTypes.number
        }),
        rarityDistribution: PropTypes.object
    }).isRequired
};

export default ConfirmSuggestionsDialog; 