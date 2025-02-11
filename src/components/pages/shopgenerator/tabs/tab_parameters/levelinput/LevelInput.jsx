import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import "./LevelInput.css";
import Section_OneLine from "../../../shared/Section_OneLine";

function LevelInput({
    lowestLevel = 0, // Default to 0
    highestLevel = 10, // Default to 10

    onLowestLevelChange,
    onHighestLevelChange,
}) {
    // Track the display value separately from the actual number value
    const [lowestDisplay, setLowestDisplay] = useState(lowestLevel.toString());
    const [highestDisplay, setHighestDisplay] = useState(highestLevel.toString());

    // Update displays when props change
    useEffect(() => {
        setLowestDisplay(lowestLevel.toString());
        setHighestDisplay(highestLevel.toString());
    }, [lowestLevel, highestLevel]);

    // Set initial values
    // useEffect(() => {
    //     onLowestLevelChange(lowestLevel);
    //     onHighestLevelChange(highestLevel);
    // }, [onLowestLevelChange, onHighestLevelChange, lowestLevel, highestLevel]);

    const handleLowestLevelChange = (e) => {
        const value = e.target.value;
        setLowestDisplay(value);
        const newValue = value === "" ? 0 : parseInt(value) || 0;
        onLowestLevelChange(newValue);
    };

    const handleHighestLevelChange = (e) => {
        const value = e.target.value;
        setHighestDisplay(value);
        const newValue = value === "" ? 0 : parseInt(value) || 0;
        onHighestLevelChange(newValue);
    };

    const validateAndAdjustValue = (value) => {
        if (value < 0) return 0;
        if (value > 99) return 99;
        return value;
    };

    const handleLowestLevelBlur = () => {
        const adjustedValue = validateAndAdjustValue(lowestLevel);
        setLowestDisplay(adjustedValue.toString());
        if (adjustedValue !== lowestLevel) {
            onLowestLevelChange(adjustedValue);
        }
        if (adjustedValue > highestLevel) {
            onHighestLevelChange(adjustedValue);
            setHighestDisplay(adjustedValue.toString());
        }
    };

    const handleHighestLevelBlur = () => {
        const adjustedValue = validateAndAdjustValue(highestLevel);
        setHighestDisplay(adjustedValue.toString());
        if (adjustedValue !== highestLevel) {
            onHighestLevelChange(adjustedValue);
        }
        if (adjustedValue < lowestLevel) {
            onHighestLevelChange(lowestLevel);
            setHighestDisplay(lowestLevel.toString());
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter") {
            e.target.blur();
        }
    };

    return (
        <Section_OneLine title="Level Range">
            <div className="level-input-group">
                <input
                    type="number"
                    id="lowest-level"
                    value={lowestDisplay}
                    onChange={handleLowestLevelChange}
                    onBlur={handleLowestLevelBlur}
                    onKeyDown={handleKeyDown}
                    min="0"
                    max="99"
                    required
                />
                <span className="level-input-separator">to</span>
                <input
                    type="number"
                    id="highest-level"
                    value={highestDisplay}
                    onChange={handleHighestLevelChange}
                    onBlur={handleHighestLevelBlur}
                    onKeyDown={handleKeyDown}
                    min="0"
                    max="99"
                    required
                />
            </div>
        </Section_OneLine>
    );
}

LevelInput.propTypes = {
    lowestLevel: PropTypes.number.isRequired,
    highestLevel: PropTypes.number.isRequired,
    onLowestLevelChange: PropTypes.func.isRequired,
    onHighestLevelChange: PropTypes.func.isRequired,
};

export default LevelInput;
