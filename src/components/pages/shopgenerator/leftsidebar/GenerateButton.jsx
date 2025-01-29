import React from 'react';
import PropTypes from 'prop-types';

function GenerateButton({ onClick }) {
    return (
        <button 
            className="generate-shop-button" 
            onClick={onClick}
            type="button"
        >
            Generate Shop
        </button>
    );
}

GenerateButton.propTypes = {
    onClick: PropTypes.func.isRequired,
};

export default GenerateButton; 
