import React from 'react';
import PropTypes from 'prop-types';
import './UnsavedChangesDialog.css';

const UnsavedChangesDialog = ({ onConfirm, onCancel, changes, currentShopName }) => {
    const formatValue = (value) => {
        if (typeof value === 'object' && value !== null) {
            if ('x' in value && 'y' in value) {
                // Convert x and y coordinates to percentages
                // x represents Variety (from 0 to 1)
                // y represents Cost (from 0 to 1)
                const varietyPercent = Math.round(value.x * 100);
                const costPercent = Math.round(value.y * 100);
                return (
                    <div className="bias-value">
                        <div>Variety: {varietyPercent}%</div>
                        <div>Cost: {costPercent}%</div>
                    </div>
                );
            }
            return Object.entries(value)
                .map(([key, val]) => `${key}: ${val.toFixed(2)}%`)
                .join(', ');
        }
        return value.toString();
    };

    const renderChangeSection = (title, changes) => {
        if (Object.keys(changes).length === 0) return null;

        return (
            <div className="changes-section">
                <h4 className="changes-section-title">{title}</h4>
                <div className="changes-grid">
                    <div className="changes-header">Field</div>
                    <div className="changes-header">Original</div>
                    <div className="changes-header">New</div>
                    {Object.entries(changes).map(([field, values]) => (
                        <React.Fragment key={field}>
                            <div className="changes-field">{field}</div>
                            <div className="changes-value">{formatValue(values.old)}</div>
                            <div className="changes-value changes-value-new">{formatValue(values.new)}</div>
                        </React.Fragment>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="unsaved-changes-overlay">
            <div className="unsaved-changes-dialog">
                <h3 className="unsaved-changes-title">Unsaved Changes</h3>
                <p className="unsaved-changes-description">
                    You have unsaved changes to the current shop <span className="shop-name">&ldquo;{currentShopName}&rdquo;</span>.
                </p>
                <div className="unsaved-changes-content">
                    {renderChangeSection("Basic Information", changes.basic)}
                    {renderChangeSection("Parameters", changes.parameters)}
                    {changes.hasInventoryChanged && (
                        <div className="changes-section">
                            <h4 className="changes-section-title">Inventory</h4>
                            <p className="inventory-change-message">The shop inventory has been refreshed at least once</p>
                        </div>
                    )}
                </div>
                <div className="unsaved-changes-buttons">
                    <button 
                        className="unsaved-changes-button unsaved-changes-proceed"
                        onClick={onConfirm}
                    >
                        Discard all changes and continue
                    </button>
                    <button 
                        className="unsaved-changes-button unsaved-changes-cancel"
                        onClick={onCancel}
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

UnsavedChangesDialog.propTypes = {
    onConfirm: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired,
    changes: PropTypes.shape({
        basic: PropTypes.object.isRequired,
        parameters: PropTypes.object.isRequired,
        hasInventoryChanged: PropTypes.bool.isRequired
    }).isRequired,
    currentShopName: PropTypes.string.isRequired
};

export default UnsavedChangesDialog; 