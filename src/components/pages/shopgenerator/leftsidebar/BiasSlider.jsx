import { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import './BiasSlider.css';

function BiasSlider({ onChange }) {
    const [bias, setBias] = useState(50); // Default to middle position

    const handleChange = useCallback((e) => {
        const value = parseInt(e.target.value);
        
        // Smoother sticky effect
        const distance = Math.abs(value - 50);
        const stickyValue = distance <= 2 ? 50 : value;
        
        // Only update if the value actually changed
        if (stickyValue !== bias) {
            setBias(stickyValue);
            onChange(stickyValue / 100); // Convert to 0-1 range for the algorithm
        }
    }, [bias, onChange]);

    return (
        <div className="bias-slider-container">
            <div className="bias-slider-wrapper">
                <div className="slider-labels">
                    <span>More Items</span>
                    <span>Better Items</span>
                </div>
                <div className="slider-container">
                    <input
                        type="range"
                        min="0"
                        max="100"
                        value={bias}
                        onChange={handleChange}
                        className="bias-slider"
                        step="1"
                    />
                </div>
                <div className="slider-description">
                    {bias < 40 && "Favoring more, cheaper items"}
                    {bias >= 40 && bias <= 60 && "Balanced distribution"}
                    {bias > 60 && "Favoring fewer, expensive items"}
                </div>
            </div>
        </div>
    );
}

BiasSlider.propTypes = {
    onChange: PropTypes.func.isRequired,
};

export default BiasSlider; 