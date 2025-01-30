import { useState } from 'react';
import PropTypes from 'prop-types';
import './GoldInput.css';

function GoldInput({ onChange }) {
    const [goldAmount, setGoldAmount] = useState('');

    const formatNumber = (value) => {
        if (!value) return '';

        // Split into whole and decimal parts
        const [whole, decimal] = value.split('.');

        // Remove existing commas and format with new ones
        const formattedWhole = whole.replace(/,/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, ',');

        // Limit decimal to 2 places if it exists
        const formattedDecimal = decimal ? '.' + decimal.slice(0, 2) : '';

        return formattedWhole + formattedDecimal;
    };

    const handleChange = (e) => {
        const value = e.target.value;
        
        // Only allow numbers, single decimal point, and commas
        if (!/^[\d,]*\.?\d*$/.test(value)) {
            return;
        }

        setGoldAmount(value);
        
        // Pass the numeric value to parent (without commas)
        const numericValue = parseFloat(value.replace(/,/g, ''));
        if (!isNaN(numericValue)) {
            onChange(numericValue);
        }
    };

    const handleBlur = (e) => {
        const value = e.target.value;
        if (!value) {
            setGoldAmount('');
            onChange(0);
            return;
        }

        const formattedValue = formatNumber(value);
        setGoldAmount(formattedValue);

        // Remove commas before parsing
        const numericValue = parseFloat(formattedValue.replace(/,/g, ''));
        if (!isNaN(numericValue)) {
            onChange(numericValue);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.target.blur();
        }
    };

    return (
        <div className="gold-input-container">
            <div className="gold-input-wrapper">
                <div className="input-with-suffix">
                    <input
                        type="text"
                        id="goldAmount"
                        value={goldAmount}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        onKeyDown={handleKeyDown}
                        placeholder="Enter gold amount"
                        required
                    />
                    <span className="suffix">gp</span>
                </div>
            </div>
        </div>
    );
}

GoldInput.propTypes = {
    onChange: PropTypes.func.isRequired,
};

export default GoldInput; 