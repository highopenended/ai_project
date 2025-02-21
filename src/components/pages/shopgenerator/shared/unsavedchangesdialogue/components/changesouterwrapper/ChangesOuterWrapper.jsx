import React from 'react';
import PropTypes from 'prop-types';
import './ChangesOuterWrapper.css';
import ChangesInnerWrapper from '../changesinnerwrappers/ChangesInnerWrapper';

const ChangesOuterWrapper = ({
    fieldName,
    beforeChangeElement,
    afterChangeElement,
    changes,
    className = '',
    isFullWidth = false
}) => {
    // If no changes or elements provided, don't render
    if (!changes && !beforeChangeElement && !afterChangeElement) return null;

    return (
        <div className={`changes-outer-wrapper ${className}`}>
            <div className="changes-field-name">{fieldName}</div>
            {isFullWidth ? (
                <div className="changes-full-width-content">
                    {beforeChangeElement || afterChangeElement}
                </div>
            ) : (
                <ChangesInnerWrapper
                    beforeElement={beforeChangeElement}
                    afterElement={afterChangeElement}
                />
            )}
        </div>
    );
};

ChangesOuterWrapper.propTypes = {
    fieldName: PropTypes.string.isRequired,
    beforeChangeElement: PropTypes.element,
    afterChangeElement: PropTypes.element,
    changes: PropTypes.object,
    className: PropTypes.string,
    isFullWidth: PropTypes.bool
};

export default ChangesOuterWrapper; 