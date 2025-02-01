/**
 * LeftSidebar Component
 * 
 * STYLING RULES:
 * 1. This component's CSS should ONLY contain:
 *    - Main sidebar container styling (.shop-generator-sidebar)
 *    - Single parameter section wrapper (.parameter-section)
 *    - Parameter sections container (.parameter-sections)
 * 
 * 2. Each child component MUST:
 *    - Have its own CSS file
 *    - Be completely self-contained in styling
 *    - Not rely on parent styles beyond the wrapper
 * 
 * 3. Child components should be easily rearrangeable
 *    within the parameter-sections container
 */
import React from 'react';
import PropTypes from 'prop-types';
import './LeftSidebar.css';
import GenerateButton from './GenerateButton';
import CategoryFilter from './categoryfilter/CategoryFilter';

function LeftSidebar({ children, onGenerate }) {
    const handleGenerateClick = (e) => {
        if (e) e.preventDefault();
        onGenerate();
    };

    return (
        <div className="shop-generator-sidebar">
            <h2>Shop Generator</h2>
            <GenerateButton onClick={handleGenerateClick} />
            {/* This container should only provide basic layout structure */}
            <div className="parameter-sections">
                {/* Each child gets wrapped in a standard section container */}
                {React.Children.map(children, (child, index) => (
                    <div className="parameter-section" key={index}>
                        {child}
                    </div>
                ))}
                <div className="parameter-section">
                    <CategoryFilter />
                </div>
                {/* Add bottom spacer */}
                <div className="parameter-section-spacer"></div>
            </div>
        </div>
    );
}

LeftSidebar.propTypes = {
    children: PropTypes.node.isRequired,
    onGenerate: PropTypes.func.isRequired,
};

export default LeftSidebar; 