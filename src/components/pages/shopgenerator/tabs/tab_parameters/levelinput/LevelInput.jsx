import {React, useState, useEffect } from "react";

import PropTypes from "prop-types";
import "./LevelInput.css";
import Section_OneLine from "../../../shared/Section_OneLine";

function LevelInput({ lowestLevel, highestLevel, setLowestLevel, setHighestLevel }) {
    const [localLowest, setLocalLowest] = useState(lowestLevel.toString());
    const [localHighest, setLocalHighest] = useState(highestLevel.toString());

    // Handle lowest level input changes
    const handleLowestLevelChange = (e) => {
        const rawValue = e.target.value;
        console.log('Raw input value:', rawValue);
        
        // Only allow digits
        if (!/^\d*$/.test(rawValue)) {
            return;
        }

        // Update local state with raw input (but remove leading zeros)
        const cleanValue = rawValue.replace(/^0+/, '') || '0';
        setLocalLowest(cleanValue);
        
        // If empty, don't update parent state
        if (rawValue === '') {
            return;
        }

        const numValue = parseInt(cleanValue, 10);
        console.log('Parsed value:', numValue);
        
        // Clamp between 0-99
        const clampedValue = Math.min(Math.max(numValue, 0), 99);
        
        // Only update local state if the value is different after clamping
        if (clampedValue !== numValue) {
            setLocalLowest(clampedValue.toString());
        }
        
        setLowestLevel(clampedValue);
    };

    // Handle highest level input changes
    const handleHighestLevelChange = (e) => {
        const rawValue = e.target.value;
        console.log('Raw input value:', rawValue);
        
        // Only allow digits
        if (!/^\d*$/.test(rawValue)) {
            return;
        }

        // Update local state with raw input (but remove leading zeros)
        const cleanValue = rawValue.replace(/^0+/, '') || '0';
        setLocalHighest(cleanValue);
        
        // If empty, don't update parent state
        if (rawValue === '') {
            return;
        }

        const numValue = parseInt(cleanValue, 10);
        console.log('Parsed value:', numValue);
        
        // Clamp between 0-99
        const clampedValue = Math.min(Math.max(numValue, 0), 99);
        
        // Only update local state if the value is different after clamping
        if (clampedValue !== numValue) {
            setLocalHighest(clampedValue.toString());
        }
        
        setHighestLevel(clampedValue);
    };

    // Handle blur events to sync values
    const handleLowestBlur = () => {
        const currentLowest = parseInt(localLowest, 10);
        const currentHighest = parseInt(localHighest, 10);

        // If lowest is higher than highest, increase highest to match
        if (currentLowest > currentHighest) {
            console.log('Syncing both to:', currentLowest);
            setHighestLevel(currentLowest);
            setLocalHighest(currentLowest.toString());
        }
    };

    const handleHighestBlur = () => {
        const currentLowest = parseInt(localLowest, 10);
        const currentHighest = parseInt(localHighest, 10);

        // If highest is lower than lowest, decrease lowest to match
        if (currentHighest < currentLowest) {
            console.log('Syncing both to:', currentHighest);
            setLowestLevel(currentHighest);
            setLocalLowest(currentHighest.toString());
        }
    };

    // Handle key press events
    const handleLowestKeyPress = (e) => {
        if (e.key === 'Enter') {
            e.target.blur();
        }
    };

    const handleHighestKeyPress = (e) => {
        if (e.key === 'Enter') {
            e.target.blur();
        }
    };

    // Update local state when props change
    useEffect(() => {
        setLocalLowest(lowestLevel.toString());
        setLocalHighest(highestLevel.toString());
    }, [lowestLevel, highestLevel]);

    return (
        <Section_OneLine title="Level Range">
            <div className="level-input-group">
                <input 
                    type="text"
                    value={localLowest}
                    onChange={handleLowestLevelChange}
                    onBlur={handleLowestBlur}
                    onKeyPress={handleLowestKeyPress}
                    min={0}
                    max={99}
                    autoComplete="off"
                /> 
                <span className="level-input-separator">to</span>
                <input 
                    type="text"
                    value={localHighest}
                    onChange={handleHighestLevelChange}
                    onBlur={handleHighestBlur}
                    onKeyPress={handleHighestKeyPress}
                    min={0}
                    max={99}
                    autoComplete="off"
                />
            </div>
        </Section_OneLine>
    );
}

LevelInput.propTypes = {
    lowestLevel: PropTypes.number.isRequired,
    highestLevel: PropTypes.number.isRequired,
    setLowestLevel: PropTypes.func.isRequired,
    setHighestLevel: PropTypes.func.isRequired,
};

export default LevelInput;