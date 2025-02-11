/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useCallback, useRef } from 'react';
/* eslint-enable no-unused-vars */
import PropTypes from 'prop-types';
import './RaritySliders.css';
import { RARITY_COLORS } from '../../../../../constants/rarityColors';
import Section from '../../components/Section';
import ButtonGroup from '../../components/ButtonGroup';

const RARITIES = ['Common', 'Uncommon', 'Rare', 'Unique'];

const DEFAULT_DISTRIBUTION = {
    Common: 95.00,
    Uncommon: 4.50,
    Rare: 0.49,
    Unique: 0.01
};

// Debounce helper
const useDebounce = (callback, delay) => {
    const timeoutRef = useRef(null);
    
    return useCallback((...args) => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        
        timeoutRef.current = setTimeout(() => {
            callback(...args);
        }, delay);
    }, [callback, delay]);
};

function RaritySliders({ onChange, value }) {
    const [distribution, setDistribution] = useState(value || DEFAULT_DISTRIBUTION);

    // Update distribution when value prop changes
    useEffect(() => {
        if (value) {
            setDistribution(value);
        }
    }, [value]);

    const [editingRarity, setEditingRarity] = useState(null);
    const [editValue, setEditValue] = useState('');
    const [preEditValue, setPreEditValue] = useState(null);
    const [lockedRarities, setLockedRarities] = useState(new Set());
    const [isCollapsed, setIsCollapsed] = useState(false);
    const isDraggingRef = useRef(false);

    // Debounced onChange to reduce updates during dragging
    const debouncedOnChange = useDebounce(onChange, 100);

    // Set CSS variables for rarity colors
    useEffect(() => {
        const root = document.documentElement;
        Object.entries(RARITY_COLORS).forEach(([rarity, color]) => {
            root.style.setProperty(`--rarity-${rarity.toLowerCase()}-color`, color);
        });
    }, []);

    const adjustDistribution = useCallback((newValue, changedRarity) => {
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

        if (unlockedRarities.length === 0) {
            return distribution; // Return current distribution if all rarities are locked
        }

        // Cap new value at available space
        const availableForChange = Number((100 - lockedTotal).toFixed(2));
        const cappedValue = Number(Math.min(newValue, availableForChange).toFixed(2));
        
        // Set the new value
        newDistribution[changedRarity] = cappedValue;

        // Calculate remaining space and distribute evenly
        const remainingSpace = Number((100 - lockedTotal - cappedValue).toFixed(2));
        const baseValuePerRarity = Number((remainingSpace / unlockedRarities.length).toFixed(2));
        
        // Distribute base values
        unlockedRarities.forEach(rarity => {
            newDistribution[rarity] = baseValuePerRarity;
        });

        // Adjust for rounding errors
        const total = Number(Object.values(newDistribution).reduce((sum, val) => sum + val, 0).toFixed(2));
        if (total !== 100) {
            const diff = Number((100 - total).toFixed(2));
            newDistribution[unlockedRarities[0]] = Number((newDistribution[unlockedRarities[0]] + diff).toFixed(2));
        }

        return newDistribution;
    }, [distribution, lockedRarities]);

    const handleSliderChange = useCallback((rarity, value) => {
        if (lockedRarities.has(rarity)) return;
        
        const newValue = Math.min(100, Math.max(0, value));
        const newDistribution = adjustDistribution(newValue, rarity);
        
        setDistribution(newDistribution);
        
        if (isDraggingRef.current) {
            debouncedOnChange(newDistribution);
        } else {
            onChange(newDistribution);
        }
    }, [lockedRarities, adjustDistribution, onChange, debouncedOnChange]);

    const handleSliderMouseDown = useCallback(() => {
        isDraggingRef.current = true;
    }, []);

    const handleSliderMouseUp = useCallback(() => {
        isDraggingRef.current = false;
        onChange(distribution);
    }, [distribution, onChange]);

    const handleInputChange = useCallback((value) => {
        setEditValue(value);
    }, []);

    const handleInputBlur = useCallback(() => {
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
    }, [editingRarity, editValue, lockedRarities, distribution, adjustDistribution, onChange]);

    const handleInputFocus = useCallback((rarity) => {
        if (lockedRarities.has(rarity)) return;
        setEditingRarity(rarity);
        setPreEditValue(distribution[rarity]);
        setEditValue(distribution[rarity].toFixed(2));
    }, [lockedRarities, distribution]);

    const handleKeyDown = useCallback((e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            e.target.blur();
        } else if (e.key === 'Escape') {
            setEditValue(preEditValue.toFixed(2));
            setEditingRarity(null);
            setPreEditValue(null);
        }
    }, [preEditValue]);

    const handleReset = useCallback(() => {
        setDistribution(DEFAULT_DISTRIBUTION);
        setLockedRarities(new Set());
        setEditingRarity(null);
        setEditValue('');
        setPreEditValue(null);
        onChange(DEFAULT_DISTRIBUTION);
    }, [onChange]);

    const formatPercentage = useCallback((value) => {
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
    }, []);

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
        <Section
            title="Rarity Distribution"
            buttonGroup={
                <ButtonGroup handleReset={handleReset} isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
            }
        >
            {!isCollapsed && (
                <div>
                    {RARITIES.map(rarity => (
                        <div 
                            key={rarity} 
                            className={`rarity-slider-container rarity-${rarity.toLowerCase()}`}
                        >
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
                                    onMouseDown={handleSliderMouseDown}
                                    onMouseUp={handleSliderMouseUp}
                                    onTouchStart={handleSliderMouseDown}
                                    onTouchEnd={handleSliderMouseUp}
                                    className={`rarity-slider rarity-${rarity.toLowerCase()} ${lockedRarities.has(rarity) ? 'locked' : ''}`}
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
                                onClick={() => setLockedRarities(prev => {
                                    const newLockedRarities = new Set(prev);
                                    if (newLockedRarities.has(rarity)) {
                                        newLockedRarities.delete(rarity);
                                    } else {
                                        newLockedRarities.add(rarity);
                                    }
                                    return newLockedRarities;
                                })}
                                aria-label={`${lockedRarities.has(rarity) ? 'Unlock' : 'Lock'} ${rarity} rarity`}
                            >
                                <LockIcon locked={lockedRarities.has(rarity)} />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </Section>
    );
}

RaritySliders.propTypes = {
    onChange: PropTypes.func.isRequired,
    value: PropTypes.object,
};

export default RaritySliders;