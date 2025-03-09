// eslint-disable-next-line no-unused-vars
import React from 'react';
import PropTypes from 'prop-types';
import './RarityDistributions.css';

const RarityDistributions = ({ distributions, className = '' }) => {
    const formatDistributions = () => {
        if (!distributions || Object.keys(distributions).length === 0) {
            return 'N/A';
        }

        return Object.entries(distributions)
            .map(([rarity, value]) => (
                <div key={rarity} className="rarity-row">
                    <span className="rarity-name">{rarity}:</span>
                    <span className="rarity-value">{value.toFixed(2)}%</span>
                </div>
            ));
    };

    return (
        <div className={`rarity-distributions ${className}`}>
            {formatDistributions()}
        </div>
    );
};

RarityDistributions.propTypes = {
    distributions: PropTypes.objectOf(PropTypes.number),
    className: PropTypes.string
};

export default RarityDistributions; 