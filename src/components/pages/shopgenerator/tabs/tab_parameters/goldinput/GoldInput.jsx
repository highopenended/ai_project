// eslint-disable-next-line no-unused-vars
import React from "react";
import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import "./GoldInput.css";
import Section from "../../../shared/section/Section";

function GoldInput({ setCurrentGold, currentGold }) {
    const [displayValue, setDisplayValue] = useState("");

    // Update display value when currentGold prop changes
    useEffect(() => {
        setDisplayValue(formatNumber(currentGold ?? 0));
    }, [currentGold]);

    // Format the number to have commas and no decimals
    const formatNumber = (value) => {
        // If the value is not a number or is 0, return an empty string
        if (!value && value !== 0) return "";

        const strValue = value.toString();
        const formattedValue = strValue.replace(/,/g, "").replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        return formattedValue;
    };

    // Handle focus event to select the input text
    const handleFocus = (e) => {
        e.target.select();
    };

    // Handle key down event to prevent invalid characters
    const handleKeyDown = (e) => {
        if (e.key === "Enter") {
            e.target.blur();
        } else if (
            !["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab", ","].includes(e.key) &&
            !/^\d$/.test(e.key)
        ) {
            e.preventDefault();
        }
    };

    // Handle change event to update the display value and currentGold
    const handleChange = (e) => {
        const inputVal = e.target.value;

        // Allow empty input, numbers, decimals, and commas
        if (!/^[\d,]*\.?\d*$/.test(inputVal)) return;

        // Count decimal points (including the one being typed)
        const decimalCount = (inputVal.match(/\./g) || []).length;
        if (decimalCount > 1) return;

        setDisplayValue(inputVal);

        // Pass the numeric value to parent (without commas)
        const numericValue = parseFloat(inputVal.replace(/,/g, ""));
        if (!isNaN(numericValue)) setCurrentGold(numericValue);
    };

    // Handle blur event to save the input value
    const handleBlur = () => {
        // If the display value is empty, set it to 0 and currentGold to 0
        if (!displayValue) {
            setDisplayValue(0);
            setCurrentGold(0);
        } else {
            // Parse the numeric value from the display value
            const numericValue = parseFloat(displayValue.replace(/,/g, ""));
            if (!isNaN(numericValue)) {
                setDisplayValue(formatNumber(numericValue));
                setCurrentGold(numericValue);
            } else {
                setDisplayValue(0);
                setCurrentGold(0);
            }
        }
    };


    return (
        <Section>
            <div className="input-with-suffix">
                <input
                    type="text"
                    value={displayValue}
                    onFocus={handleFocus}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    onKeyDown={handleKeyDown}
                    placeholder="Enter gold amount"
                    required
                    autoComplete="off"
                />
                <span className="suffix">gp</span>
            </div>
        </Section>
    );
}

GoldInput.propTypes = {
    setCurrentGold: PropTypes.func.isRequired,
    currentGold: PropTypes.number,
};

export default GoldInput;
