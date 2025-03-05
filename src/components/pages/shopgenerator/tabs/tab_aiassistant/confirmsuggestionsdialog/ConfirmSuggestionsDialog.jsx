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
        { key: 'gold', label: 'Gold' },
        { key: 'levelRange', label: 'Level Range' },
        { key: 'itemBias', label: 'Item Bias' },
        { key: 'rarityDistribution', label: 'Rarity Distribution' }
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
        if (!levelRange) return 'No change';
        return `Level ${levelRange.min} - ${levelRange.max}`;
    };

    // Format item bias display
    const formatItemBias = (itemBias) => {
        if (!itemBias) return 'No change';
        
        return Object.entries(itemBias)
            .map(([key, value]) => `${key}: ${value}`)
            .join(', ');
    };

    // Format rarity distribution display
    const formatRarityDistribution = (rarityDistribution) => {
        if (!rarityDistribution) return 'No change';
        
        return Object.entries(rarityDistribution)
            .map(([rarity, percentage]) => `${rarity}: ${percentage}%`)
            .join(', ');
    };

    // Get formatter function for a specific change type
    const getFormatter = (key) => {
        const formatters = {
            gold: formatGold,
            levelRange: formatLevelRange,
            itemBias: formatItemBias,
            rarityDistribution: formatRarityDistribution
        };
        return formatters[key] || (() => 'Unknown format');
    };

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
                        {changeTypes.map(({ key, label }) => (
                            suggestedChanges[key] !== undefined && (
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
                            )
                        ))}
                    </div>
                </div>
                
                <div className="confirm-suggestions-dialog-actions">
                    <button className="cancel-button" onClick={onClose}>Cancel</button>
                    <button className="confirm-button" onClick={handleConfirm}>Apply Selected Changes</button>
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
        gold: PropTypes.number,
        levelRange: PropTypes.shape({
            min: PropTypes.number,
            max: PropTypes.number
        }),
        itemBias: PropTypes.object,
        rarityDistribution: PropTypes.object
    }).isRequired
};

export default ConfirmSuggestionsDialog; 