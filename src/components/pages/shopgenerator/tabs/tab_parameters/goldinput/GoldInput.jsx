import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import './GoldInput.css';
import Section_OneLine from '../../../shopgenerator/shared/Section_OneLine';

function GoldInput({ onChange, value }) {
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

    // Initialize with formatted default value or provided value
    const [goldAmount, setGoldAmount] = useState(() => {
        if (value !== undefined) {
            return formatNumber(value.toString());
        }
        return '5,000';
    });

    // Update when value prop changes
    useEffect(() => {
        if (value !== undefined) {
            setGoldAmount(formatNumber(value.toString()));
        }
    }, [value]);

    // Call onChange with initial value
    useEffect(() => {
        if (value !== undefined) {
            onChange(value);
        } else {
            onChange(5000);
        }
    }, [onChange, value]);

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
            setGoldAmount('5,000'); // Reset to default if empty
            onChange(5000);
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
        
        <Section_OneLine>
            <div>
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
                        autoComplete="off"
                    />
                    <span className="suffix">gp</span>
                </div>
            </div>
        </Section_OneLine>
    );
}

GoldInput.propTypes = {
    onChange: PropTypes.func.isRequired,
    value: PropTypes.number,
};

export default GoldInput; 