/* eslint-disable no-unused-vars */
import React, { useState } from 'react';
/* eslint-enable no-unused-vars */
import PropTypes from 'prop-types';
import './RaritySliders.css';
import { RARITY_COLORS } from '../../../../../constants/rarityColors';

const RARITIES = ['Common', 'Uncommon', 'Rare', 'Unique'];
const DEFAULT_DISTRIBUTION = {
    Common: 95.00,
    Uncommon: 4.50,
    Rare: 0.49,
    Unique: 0.01
};

function RaritySliders({ onChange }) {
    const [distribution, setDistribution] = useState(DEFAULT_DISTRIBUTION);
    const [editingRarity, setEditingRarity] = useState(null);
    const [editValue, setEditValue] = useState('');
    const [preEditValue, setPreEditValue] = useState(null);
    const [lockedRarities, setLockedRarities] = useState(new Set());

    const adjustDistribution = (newValue, changedRarity) => {
        // Start with current distribution
        const newDistribution = { ...distribution };
        
        // Calculate total of locked values (rounded to 2 decimals)
        const lockedTotal = Number(Array.from(lockedRarities).reduce((sum, rarity) => 
            sum + distribution[rarity], 0
        ).toFixed(2));

        // Get list of unlocked rarities (excluding the one being changed)
        const unlockedRarities = RARITIES.filter(r => 
            r !== changedRarity && !lockedRarities.has(r)
        );

        // Cap new value at available space
        const availableForChange = Number((100 - lockedTotal).toFixed(2));
        const cappedValue = Number(Math.min(newValue, availableForChange).toFixed(2));
        
        // Set the new value
        newDistribution[changedRarity] = cappedValue;

        if (unlockedRarities.length > 0) {
            // Calculate exact remaining space
            const remainingSpace = Number((100 - lockedTotal - cappedValue).toFixed(2));
            
            // Calculate base value (floor to 2 decimals to ensure we don't go over)
            const baseValuePerRarity = Math.floor((remainingSpace / unlockedRarities.length) * 100) / 100;
            
            // Calculate total pennies to distribute
            const totalPennies = Math.round((remainingSpace - (baseValuePerRarity * unlockedRarities.length)) * 100);
            
            // Set base values first
            unlockedRarities.forEach(rarity => {
                newDistribution[rarity] = baseValuePerRarity;
            });

            // Distribute remaining pennies
            let remainingPennies = totalPennies;
            for (let i = 0; remainingPennies > 0 && i < unlockedRarities.length; i++) {
                const penny = 0.01;
                newDistribution[unlockedRarities[i]] = Number((newDistribution[unlockedRarities[i]] + penny).toFixed(2));
                remainingPennies--;
            }
        }

        // Verify total is exactly 100
        const total = Number(Object.values(newDistribution).reduce((sum, val) => sum + val, 0).toFixed(2));
        if (total !== 100) {
            console.warn(`Distribution total is ${total}, adjusting...`);
            const diff = Number((100 - total).toFixed(2));
            // Add or subtract the difference from the first unlocked rarity
            if (unlockedRarities.length > 0) {
                const adjustRarity = unlockedRarities[0];
                newDistribution[adjustRarity] = Number((newDistribution[adjustRarity] + diff).toFixed(2));
            }
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
            // Only adjust if the value actually changed
            if (Math.abs(newValue - distribution[editingRarity]) >= 0.01) {
                const newDistribution = adjustDistribution(newValue, editingRarity);
                setDistribution(newDistribution);
                onChange(newDistribution);
            }
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

    const formatPercentage = (value) => {
        // Convert to number and fix to 2 decimal places
        const num = Number(value);
        if (Number.isInteger(num)) {
            return num.toString();
        }
        // Check if second decimal is 0
        if (num * 10 % 1 === 0) {
            return num.toFixed(1);
        }
        return num.toFixed(2);
    };

    const LockIcon = ({ locked }) => (
        <svg 
            width="20" 
            height="20" 
            viewBox="0 0 20 20" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
        >
            {locked ? (
                // Locked state - simple lock
                <path
                    d="M7 9V6c0-1.65 1.35-3 3-3s3 1.35 3 3v3H7zM6 10h8v6H6v-6z"
                    fill="rgba(255, 255, 255, 0.5)"
                />
            ) : (
                // Unlocked state - simple lock with open shackle
                <path
                    d="M13 6c0-1.65-1.35-3-3-3S7 4.35 7 6h3v3H6v6h8v-6h-1V6z"
                    fill="rgba(255, 255, 255, 0.9)"
                />
            )}
        </svg>
    );

    LockIcon.propTypes = {
        locked: PropTypes.bool.isRequired
    };

    return (
        <div className="rarity-sliders">
            <div className="rarity-header">
                <h3>Rarity Distribution</h3>
                <button 
                    className="reset-button" 
                    onClick={() => {
                        setDistribution(DEFAULT_DISTRIBUTION);
                        setLockedRarities(new Set());
                        onChange(DEFAULT_DISTRIBUTION);
                    }}
                    title="Reset to default values"
                >
                    <svg 
                        width="14" 
                        height="14" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path 
                            d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"
                            fill="currentColor"
                        />
                    </svg>
                </button>
            </div>
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
                                    onFocus={(e) => e.target.select()}
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
                                    {formatPercentage(distribution[rarity])}%
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
                        <LockIcon locked={lockedRarities.has(rarity)} />
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