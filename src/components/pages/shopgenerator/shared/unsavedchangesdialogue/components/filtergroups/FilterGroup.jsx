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
        if (!filters?.filters) return 'No filters';

        const { old = {}, new: newFilters = {} } = filters.filters;

        // Get all unique keys from both old and new states
        const allKeys = new Set([
            ...Object.keys(old),
            ...Object.keys(newFilters)
        ]);

        const changedFilters = [];

        // Only show tags that changed state
        allKeys.forEach(key => {
            const oldState = parseInt(old[key] || 0);
            const newState = parseInt(newFilters[key] || 0);

            if (oldState !== newState) {
                // For 'before' view, show old state
                // For 'after' view, show new state
                changedFilters.push([key, className.includes('before-change') ? oldState : newState]);
            }
        });

        if (changedFilters.length === 0) {
            return 'No changes';
        }

        return (
            <div className="filter-tags-container">
                {changedFilters.map(([key, state]) => formatFilterState(key, state))}
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
    filters: PropTypes.shape({
        filters: PropTypes.shape({
            old: PropTypes.object,
            new: PropTypes.object
        })
    }),
    className: PropTypes.string
};

export default FilterGroup; 