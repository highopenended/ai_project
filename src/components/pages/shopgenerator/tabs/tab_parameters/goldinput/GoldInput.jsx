// eslint-disable-next-line no-unused-vars
import React from "react";
import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import "./GoldInput.css";
import Section from "../../../shared/section/Section";

function GoldInput({ setCurrentGold, currentGold }) {
    const [displayValue, setDisplayValue] = useState("");

    const formatNumber = (value) => {

        // If the value is not a number or is 0, return an empty string
        if (!value && value !== 0) return "";

        // Convert to string and split into whole and decimal parts
        const parts = value.toString().split(".");
        const whole = parts[0];

        // Remove existing commas and format with new ones
        const formattedWhole = whole.replace(/,/g, "").replace(/\B(?=(\d{3})+(?!\d))/g, ",");

        // Limit decimal to 2 places if it exists
        const formattedDecimal = parts.length > 1 ? "." + parts[1].slice(0, 2) : "";

        return formattedWhole + formattedDecimal;
    };

    // Update display value when currentGold prop changes
    useEffect(() => {
        setDisplayValue(formatNumber(currentGold ?? 5000));
    }, [currentGold]);

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
        if (!isNaN(numericValue)) {
            setCurrentGold(numericValue);
        }
    };

    const handleBlur = () => {
        if (!displayValue) {
            const defaultValue = 5000;
            setDisplayValue(formatNumber(defaultValue));
            setCurrentGold(defaultValue);
            return;
        }

        const numericValue = parseFloat(displayValue.replace(/,/g, ""));
        if (!isNaN(numericValue)) {
            setDisplayValue(formatNumber(numericValue));
            setCurrentGold(numericValue);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter") {
            e.target.blur();
        } else if (
            !["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab", ".", ","].includes(e.key) &&
            !/^\d$/.test(e.key)
        ) {
            e.preventDefault();
        }
    };
    const handleFocus = (e) => {
        e.target.select();
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
