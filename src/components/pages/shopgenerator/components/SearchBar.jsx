import React from 'react';
import PropTypes from 'prop-types';
import './SearchBar.css';

function SearchBar({ placeholder, value, onChange, className }) {
    return (
        <input
            type="text"
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            className={className}
        />
    );
}

SearchBar.propTypes = {
    placeholder: PropTypes.string.isRequired,
    value: PropTypes.string.isRequired,
    onChange: PropTypes.func.isRequired,
    className: PropTypes.string
};

export default SearchBar; 