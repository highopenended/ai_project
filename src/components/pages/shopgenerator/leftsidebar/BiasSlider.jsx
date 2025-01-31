import { useState } from 'react';
import PropTypes from 'prop-types';
import './BiasSlider.css';

function BiasSlider({ onChange }) {
    const [bias, setBias] = useState(50); // Default to middle position

    const handleChange = (e) => {
        const value = parseInt(e.target.value);
        setBias(value);
        onChange(value / 100); // Convert to 0-1 range for the algorithm
    };

    return (
        <div className="bias-slider-container">
            <div className="bias-slider-wrapper">
                <div className="slider-labels">
                    <span>More Items</span>
                    <span>Better Items</span>
                </div>
                <input
                    type="range"
                    min="0"
                    max="100"
                    value={bias}
                    onChange={handleChange}
                    className="bias-slider"
                />
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