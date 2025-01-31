import React, { useState } from 'react';
import PropTypes from 'prop-types';
import './RaritySliders.css';

const RARITIES = ['Common', 'Uncommon', 'Rare', 'Unique'];
const DEFAULT_DISTRIBUTION = {
    Common: 40.00,
    Uncommon: 30.00,
    Rare: 20.00,
    Unique: 10.00
};

function RaritySliders({ onChange }) {
    const [distribution, setDistribution] = useState(DEFAULT_DISTRIBUTION);
    const [editingRarity, setEditingRarity] = useState(null);
    const [editValue, setEditValue] = useState('');
    const [preEditValue, setPreEditValue] = useState(null);
    const [lockedRarities, setLockedRarities] = useState(new Set());

    const getLockedTotal = () => {
        return Array.from(lockedRarities).reduce((sum, rarity) => 
            sum + distribution[rarity], 0
        );
    };

    const adjustDistribution = (newValue, changedRarity) => {
        // Start with current distribution
        const newDistribution = { ...distribution };
        
        // Calculate total of locked values
        const lockedTotal = Array.from(lockedRarities).reduce((sum, rarity) => 
            sum + distribution[rarity], 0
        );

        // Get list of unlocked rarities (excluding the one being changed)
        const unlockedRarities = RARITIES.filter(r => 
            r !== changedRarity && !lockedRarities.has(r)
        );

        // Cap new value at available space
        const availableForChange = 100 - lockedTotal;
        const cappedValue = Math.min(newValue, availableForChange);
        
        // Set the new value
        newDistribution[changedRarity] = cappedValue;

        // Calculate remaining space for unlocked rarities
        const remainingSpace = 100 - lockedTotal - cappedValue;

        if (unlockedRarities.length > 0) {
            // Distribute remaining space equally
            const valuePerRarity = remainingSpace / unlockedRarities.length;
            unlockedRarities.forEach(rarity => {
                newDistribution[rarity] = valuePerRarity;
            });
        }

        return newDistribution;
    };

    const handleSliderChange = (rarity, value) => {
        if (lockedRarities.has(rarity)) return;
        const newValue = Math.min(100, Math.max(0, value));
        const newDistribution = adjustDistribution(newValue, rarity);
        setDistribution(newDistribution);
        onChange(newDistribution);
    };

    const handleInputChange = (value) => {
        setEditValue(value);
    };

    const handleInputBlur = () => {
        if (editingRarity && !lockedRarities.has(editingRarity)) {
            const value = parseFloat(editValue) || 0;
            const newValue = Math.min(100, Math.max(0, value));
            const newDistribution = adjustDistribution(newValue, editingRarity);
            setDistribution(newDistribution);
            onChange(newDistribution);
        }
        setEditingRarity(null);
        setPreEditValue(null);
    };

    const handleInputFocus = (rarity) => {
        if (lockedRarities.has(rarity)) return;
        setEditingRarity(rarity);
        setPreEditValue(distribution[rarity]);
        setEditValue(distribution[rarity].toFixed(2));
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            e.target.blur();
        } else if (e.key === 'Escape') {
            setEditValue(preEditValue.toFixed(2));
            setEditingRarity(null);
            setPreEditValue(null);
        }
    };

    const toggleLock = (rarity) => {
        const newLockedRarities = new Set(lockedRarities);
        if (lockedRarities.has(rarity)) {
            newLockedRarities.delete(rarity);
        } else {
            newLockedRarities.add(rarity);
        }
        setLockedRarities(newLockedRarities);
    };

    return (
        <div className="rarity-sliders">
            <h3>Rarity Distribution</h3>
            {RARITIES.map(rarity => (
                <div key={rarity} className="rarity-slider-container">
                    <label htmlFor={`rarity-${rarity}`}>{rarity}</label>
                    <div className="slider-input-group">
                        <input
                            type="range"
                            id={`rarity-${rarity}`}
                            min="0"
                            max="100"
                            step="0.01"
                            value={distribution[rarity]}
                            onChange={(e) => handleSliderChange(rarity, parseFloat(e.target.value))}
                            className={`rarity-slider ${lockedRarities.has(rarity) ? 'locked' : ''}`}
                            disabled={lockedRarities.has(rarity)}
                        />
                        <div className="percentage-input-container">
                            {editingRarity === rarity ? (
                                <input
                                    type="number"
                                    value={editValue}
                                    onChange={(e) => handleInputChange(e.target.value)}
                                    onBlur={handleInputBlur}
                                    onKeyDown={handleKeyDown}
                                    step="0.01"
                                    min="0"
                                    max="100"
                                    className="percentage-input"
                                    disabled={lockedRarities.has(rarity)}
                                    autoFocus
                                />
                            ) : (
                                <span 
                                    className={`percentage-display ${lockedRarities.has(rarity) ? 'locked' : ''}`}
                                    onClick={() => handleInputFocus(rarity)}
                                >
                                    {distribution[rarity].toFixed(2)}%
                                </span>
                            )}
                        </div>
                    </div>
                    <button
                        type="button"
                        className={`lock-button ${lockedRarities.has(rarity) ? 'locked' : ''}`}
                        onClick={() => toggleLock(rarity)}
                        aria-label={`${lockedRarities.has(rarity) ? 'Unlock' : 'Lock'} ${rarity} rarity`}
                    >
                        {lockedRarities.has(rarity) ? '🔒' : '🔓'}
                    </button>
                </div>
            ))}
        </div>
    );
}

RaritySliders.propTypes = {
    onChange: PropTypes.func.isRequired,
};

export default RaritySliders;