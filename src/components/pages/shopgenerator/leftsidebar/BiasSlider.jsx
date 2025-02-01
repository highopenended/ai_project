import { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import './BiasSlider.css';

function BiasSlider({ onChange }) {
    const [bias, setBias] = useState(50); // Default to middle position

    const handleChange = useCallback((e) => {
        const value = parseInt(e.target.value);
        
        // Only make the center point sticky
        const stickyValue = Math.abs(value - 50) <= 2 ? 50 : value;
        
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
                    <span>Quantity</span>
                    <span>Quality</span>
                </div>
                <div className="slider-container">
                    {/* Tick marks */}
                    <div className="tick-mark tick-25"></div>
                    <div className="tick-mark tick-75"></div>
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
                    {bias <= 25 && "A ton of cheap items"}
                    {bias > 25 && bias < 50 && "Favoring cheaper items"}
                    {bias === 50 && "Balanced distribution"}
                    {bias > 50 && bias <= 75 && "Favoring expensive items"}
                    {bias > 75 && "A few expensive items"}
                </div>
            </div>
        </div>
    );
}

BiasSlider.propTypes = {
    onChange: PropTypes.func.isRequired,
};

export default BiasSlider; 