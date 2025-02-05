import React from 'react';
import PropTypes from 'prop-types';
import './GenerateButton.css';

function GenerateButton({ onClick }) {
    return (
        <button 
            className="generate-shop-button" 
            onClick={onClick}
            type="button"
        >
            Generate Inventory
        </button>
    );
}

GenerateButton.propTypes = {
    onClick: PropTypes.func.isRequired,
};

export default GenerateButton; 
