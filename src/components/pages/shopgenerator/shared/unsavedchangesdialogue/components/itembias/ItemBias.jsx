// eslint-disable-next-line no-unused-vars
import React from 'react';
import PropTypes from 'prop-types';
import './ItemBias.css';

const ItemBias = ({ x, y, className = '' }) => {
    const formatBias = () => {
        if ((x === undefined || x === null) && (y === undefined || y === null)) {
            return 'N/A';
        }

        const varietyPercent = Math.round((x || 0) * 100);
        const costPercent = Math.round((y || 0) * 100);

        return (
            <>
                <div>Variety: {varietyPercent}%</div>
                <div>Cost: {costPercent}%</div>
            </>
        );
    };

    return (
        <div className={`item-bias ${className}`}>
            {formatBias()}
        </div>
    );
};

ItemBias.propTypes = {
    x: PropTypes.number,
    y: PropTypes.number,
    className: PropTypes.string
};

export default ItemBias; 