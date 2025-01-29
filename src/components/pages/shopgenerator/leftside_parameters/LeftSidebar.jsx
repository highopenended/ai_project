import React from 'react';
import PropTypes from 'prop-types';

function LeftSidebar({ children }) {
    return (
        <div className="shop-generator-sidebar">
            <h2>Shop Parameters</h2>
            <div className="shop-generator-parameters">
                {children}
            </div>
        </div>
    );
}

LeftSidebar.propTypes = {
    children: PropTypes.node.isRequired,
};

export default LeftSidebar; 