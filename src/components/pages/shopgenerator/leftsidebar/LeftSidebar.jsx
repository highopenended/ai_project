import React from 'react';
import PropTypes from 'prop-types';
import './LeftSidebar.css';
import GenerateButton from './GenerateButton';

function LeftSidebar({ children, onGenerate }) {
    const handleGenerateClick = (e) => {
        if (e) e.preventDefault();
        onGenerate();
    };

    return (
        <div className="shop-generator-sidebar">
            <h2>Shop Generator</h2>
            <GenerateButton onClick={handleGenerateClick} />
            <div className="parameter-sections">
                {React.Children.map(children, (child, index) => (
                    <div className="parameter-section" key={index}>
                        {child}
                    </div>
                ))}
            </div>
        </div>
    );
}

LeftSidebar.propTypes = {
    children: PropTypes.node.isRequired,
    onGenerate: PropTypes.func.isRequired,
};

export default LeftSidebar; 