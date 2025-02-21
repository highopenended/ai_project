import React from 'react';
import PropTypes from 'prop-types';
import './FilterGroup.css';

// Define selection states to match the constants used elsewhere
const SELECTION_STATES = {
    INCLUDE: 1,
    EXCLUDE: -1,
    IGNORE: 0
};

const FilterGroup = ({ filters, className = '' }) => {
    const formatFilterState = (key, state) => {
        const numericState = parseInt(state);
        let tagClassName = '';

        switch (numericState) {
            case SELECTION_STATES.INCLUDE:
                tagClassName = 'filter-include';
                break;
            case SELECTION_STATES.EXCLUDE:
                tagClassName = 'filter-exclude';
                break;
            case SELECTION_STATES.IGNORE:
                tagClassName = 'filter-ignore';
                break;
            default:
                return null;
        }

        return (
            <div key={key} className="filter-tag-row">
                <span className={`filter-tag ${tagClassName}`}>{key}</span>
            </div>
        );
    };

    const renderFilters = () => {
        if (!filters || Object.keys(filters).length === 0) {
            return 'No filters';
        }

        return (
            <div className="filter-tags-container">
                {Object.entries(filters).map(([key, state]) => formatFilterState(key, state))}
            </div>
        );
    };

    return (
        <div className={`filter-group ${className}`}>
            {renderFilters()}
        </div>
    );
};

FilterGroup.propTypes = {
    filters: PropTypes.object,
    className: PropTypes.string
};

export default FilterGroup; 